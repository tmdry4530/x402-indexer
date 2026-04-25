import { buildInClause, buildPairClause, queryMany } from '../../db/helpers.js';
import type { PipelineContext } from '../types.js';
import { loadHourlyPrices } from './priceCache.js';

const BASE_WETH_ADDRESS = '0x4200000000000000000000000000000000000006';

// agent_daily_stats를 재계산할 최소 단위.
// reorg/재처리에서 전체 테이블이 아니라 영향받은 agent/date만 다시 계산하기 위한 키다.
export interface AgentDateKey {
  agentAddress: string;
  date: string;
}

// agent/date 키 중복 제거 헬퍼.
// 같은 날짜에 여러 payment/evidence가 들어와도 재계산 작업은 한 번만 수행한다.
function dedupeKeys(keys: AgentDateKey[]): AgentDateKey[] {
  // 같은 agent/date가 중복으로 들어와도 재계산은 한 번만 하게 정규화
  return [...new Map(keys.map((item) => [`${item.agentAddress}:${item.date}`, item])).values()];
}

// 새로 생성/수정된 payment들이 영향을 준 agent/date 목록을 찾는다.
// 소비자(payer)뿐 아니라 revenue recipient(pay_to가 agent인 경우)도 포함한다.
export async function collectAffectedAgentDates(
  ctx: PipelineContext,
  paymentKeys: Array<{ txHash: string; logIndex: number }>,
): Promise<AgentDateKey[]> {
  // 특정 payment 묶음이 영향을 준 agent/date 목록만 뽑아
  // 이후 aggregate 재계산 범위를 최소화한다.
  if (paymentKeys.length === 0) {
    return [];
  }

  const pairClause = buildPairClause(
    'transaction_hash',
    'log_index',
    paymentKeys.map((item) => [item.txHash, item.logIndex] as const),
  );
  const rows = await queryMany<{ payer: string; block_timestamp: Date }>(
    ctx.db,
    `SELECT DISTINCT payer, block_timestamp
     FROM payments
     WHERE ${pairClause.clause}`,
    pairClause.params,
  );

  const keys = rows.map((row) => ({
    agentAddress: row.payer,
    date: row.block_timestamp.toISOString().slice(0, 10),
  }));

  if (paymentKeys.length > 0) {
    const revenueRows = await queryMany<{ pay_to: string; block_timestamp: Date }>(
      ctx.db,
      `SELECT e.pay_to, b.timestamp AS block_timestamp
       FROM x402_evidence e
       JOIN blocks b ON b.number = e.block_number
       WHERE ${pairClause.clause}`,
      pairClause.params,
    );

    const agents = await queryMany<{ address: string }>(
      ctx.db,
      `SELECT address FROM agents`,
    );
    const agentSet = new Set(agents.map((row) => row.address.toLowerCase()));
    for (const row of revenueRows) {
      const recipient = row.pay_to.toLowerCase();
      if (!agentSet.has(recipient)) {
        continue;
      }
      keys.push({
        agentAddress: recipient,
        date: row.block_timestamp.toISOString().slice(0, 10),
      });
    }
  }

  return dedupeKeys(keys);
}

// agent_daily_stats를 지정된 agent/date 단위로 완전 재계산한다.
// 증분 업데이트 대신 재계산 방식을 써서 reorg, 중복 처리, 가격 재조회에도 정합성을 유지한다.
export async function recomputeAgentDailyStats(
  ctx: PipelineContext,
  keys: AgentDateKey[],
): Promise<void> {
  // agent_daily_stats를 "증분 덧셈" 대신 "영향받은 날짜 전체 재계산"으로 유지한다.
  // 이렇게 해야 reorg/재처리/같은 날짜 다회 배치에도 정합성이 깨지지 않는다.
  const uniqueKeys = dedupeKeys(keys);
  if (uniqueKeys.length === 0) {
    return;
  }

  const agentAddresses = [...new Set(uniqueKeys.map((item) => item.agentAddress))];
  const requestedKeys = new Set(uniqueKeys.map((item) => `${item.agentAddress}:${item.date}`));
  const rows = await queryMany<{
    payer: string;
    pay_to: string;
    amount_usd: string | null;
    block_timestamp: Date;
    transaction_hash: string;
    gas_used: string;
    effective_gas_price: string;
    }>(
    ctx.db,
    `SELECT p.payer, p.pay_to, p.amount_usd, p.block_timestamp, p.transaction_hash,
            t.gas_used, t.effective_gas_price
     FROM payments p
     JOIN transactions t ON t.hash = p.transaction_hash
     WHERE p.payer IN (${buildInClause(1, agentAddresses.length)})`,
    agentAddresses,
  );

  const revenueRows = await queryMany<{
    asset: string;
    pay_to: string;
    amount: string;
    block_timestamp: Date;
  }>(
    ctx.db,
    `SELECT e.asset, e.pay_to, e.amount, b.timestamp AS block_timestamp
     FROM x402_evidence e
     JOIN blocks b ON b.number = e.block_number
     WHERE b.is_orphaned = false
       AND e.pay_to IN (${buildInClause(1, agentAddresses.length)})`,
    agentAddresses,
  );

  const prices = await loadHourlyPrices(
    [
      ...rows.map((row) => ({
        asset: BASE_WETH_ADDRESS,
        timestamp: row.block_timestamp,
      })),
      ...revenueRows.map((row) => ({
        asset: row.asset,
        timestamp: row.block_timestamp,
      })),
    ],
    ctx,
  );

  const aggregates = new Map<string, {
    agentAddress: string;
    date: string;
    txHashes: Set<string>;
    paymentCount: number;
    totalSpentUsd: number;
    totalGasUsd: number;
    totalRevenueUsd: number;
    services: Set<string>;
  }>();

  for (const row of rows) {
    const date = row.block_timestamp.toISOString().slice(0, 10);
    const key = `${row.payer}:${date}`;
    if (!requestedKeys.has(key)) {
      continue;
    }
    const hour = new Date(row.block_timestamp);
    hour.setUTCMinutes(0, 0, 0);
    const ethPrice = prices.get(`${BASE_WETH_ADDRESS}:${hour.toISOString()}`) ?? 0;
    const gasUsd =
      (Number(row.gas_used) * Number(row.effective_gas_price)) / 1e18 * ethPrice;

    const entry = aggregates.get(key) ?? {
      agentAddress: row.payer,
      date,
      txHashes: new Set<string>(),
      paymentCount: 0,
      totalSpentUsd: 0,
      totalGasUsd: 0,
      totalRevenueUsd: 0,
      services: new Set<string>(),
    };

    entry.txHashes.add(row.transaction_hash);
    entry.paymentCount += 1;
    entry.totalSpentUsd += Number(row.amount_usd ?? 0);
    entry.totalGasUsd += gasUsd;
    entry.services.add(row.pay_to);
    aggregates.set(key, entry);
  }

  for (const row of revenueRows) {
    const recipient = row.pay_to;
    const date = row.block_timestamp.toISOString().slice(0, 10);
    const key = `${recipient}:${date}`;
    if (!requestedKeys.has(key)) {
      continue;
    }
    const hour = new Date(row.block_timestamp);
    hour.setUTCMinutes(0, 0, 0);
    const assetPrice = prices.get(`${row.asset}:${hour.toISOString()}`);
    if (assetPrice === undefined) {
      continue;
    }

    const entry = aggregates.get(key) ?? {
      agentAddress: recipient,
      date,
      txHashes: new Set<string>(),
      paymentCount: 0,
      totalSpentUsd: 0,
      totalGasUsd: 0,
      totalRevenueUsd: 0,
      services: new Set<string>(),
    };
    entry.totalRevenueUsd += Number(row.amount) / 1_000_000 * assetPrice;
    aggregates.set(key, entry);
  }

  const existingKeys = new Set(uniqueKeys.map((item) => `${item.agentAddress}:${item.date}`));
  for (const key of existingKeys) {
    if (aggregates.has(key)) continue;
    const [agentAddress, date] = key.split(':');
    await ctx.db.query(
      `DELETE FROM agent_daily_stats
       WHERE agent_address = $1 AND date = $2`,
      [agentAddress, date],
    );
  }

  for (const aggregate of aggregates.values()) {
    await ctx.db.query(
      `INSERT INTO agent_daily_stats (
         agent_address, date, tx_count, payment_count, total_spent_usd, total_gas_usd, total_revenue_usd, unique_services
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (agent_address, date) DO UPDATE SET
         tx_count = EXCLUDED.tx_count,
         payment_count = EXCLUDED.payment_count,
         total_spent_usd = EXCLUDED.total_spent_usd,
         total_gas_usd = EXCLUDED.total_gas_usd,
         total_revenue_usd = EXCLUDED.total_revenue_usd,
         unique_services = EXCLUDED.unique_services`,
      [
        aggregate.agentAddress,
        aggregate.date,
        aggregate.txHashes.size,
        aggregate.paymentCount,
        aggregate.totalSpentUsd,
        aggregate.totalGasUsd,
        aggregate.totalRevenueUsd,
        aggregate.services.size,
      ],
    );
  }
}
