import { buildPairClause, queryMany } from '../../db/helpers.js';
import type { PipelineContext } from '../types.js';

// 특정 자산의 특정 시점 가격 요청.
// 실제 조회/저장은 hour bucket으로 정규화해 중복 외부 API 호출을 줄인다.
export interface HourlyPriceRequest {
  asset: string;
  timestamp: Date;
}

// timestamp를 UTC hour bucket으로 정규화한다.
// price_snapshots의 unique key와 DeFiLlama historical lookup 단위를 맞춘다.
function normalizeHour(timestamp: Date): Date {
  const hour = new Date(timestamp);
  hour.setUTCMinutes(0, 0, 0);
  return hour;
}

// 요청된 자산/시간의 USD 가격을 캐시 우선으로 로드한다.
// price_snapshots에 없으면 DeFiLlama historical API를 호출하고 성공한 값만 캐시에 저장한다.
export async function loadHourlyPrices(
  requests: HourlyPriceRequest[],
  ctx: PipelineContext,
): Promise<Map<string, number>> {
  // 같은 asset/hour 요청은 Map으로 합쳐 외부 API와 DB query 비용을 줄인다.
  const buckets = new Map<string, HourlyPriceRequest>();
  for (const request of requests) {
    const hour = normalizeHour(request.timestamp);
    buckets.set(`${request.asset}:${hour.toISOString()}`, {
      asset: request.asset,
      timestamp: hour,
    });
  }

  const result = new Map<string, number>();
  const bucketEntries = [...buckets.values()];
  if (bucketEntries.length === 0) {
    return result;
  }

  const pairClause = buildPairClause(
    'token_address',
    'timestamp',
    bucketEntries.map((entry) => [entry.asset, entry.timestamp] as const),
  );
  const cached = await queryMany<{
    token_address: string;
    timestamp: Date;
    price_usd: string;
  }>(
    ctx.db,
    `SELECT token_address, timestamp, price_usd
     FROM price_snapshots
     WHERE ${pairClause.clause}`,
    pairClause.params,
  );

  for (const row of cached) {
    result.set(`${row.token_address}:${row.timestamp.toISOString()}`, Number(row.price_usd));
  }

  // 캐시 miss bucket만 외부 API로 조회한다.
  // 실패/누락 가격은 조용히 skip해서 결제 저장 자체를 막지 않는다.
  for (const entry of bucketEntries) {
    const key = `${entry.asset}:${entry.timestamp.toISOString()}`;
    if (result.has(key)) {
      continue;
    }

    const timestamp = Math.floor(entry.timestamp.getTime() / 1000);
    const response = await fetch(
      `${ctx.integrations.defiLlamaBaseUrl}/prices/historical/${timestamp}/base:${entry.asset}`,
    );
    if (!response.ok) {
      continue;
    }

    const payload = await response.json() as {
      coins?: Record<string, { price?: number }>;
    };
    const price = payload.coins?.[`base:${entry.asset}`]?.price;
    if (typeof price !== 'number') {
      continue;
    }

    result.set(key, price);
    await ctx.db.query(
      `INSERT INTO price_snapshots (token_address, timestamp, price_usd, source)
       VALUES ($1, $2, $3, 'defillama')
       ON CONFLICT (token_address, timestamp) DO UPDATE SET price_usd = EXCLUDED.price_usd`,
      [entry.asset, entry.timestamp, price],
    );
  }

  return result;
}
