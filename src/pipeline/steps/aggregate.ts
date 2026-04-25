import type {
    PipelineContext,
    X402Evidence,
} from '../types.js';
import type { Address } from 'viem';
import { buildInClause, buildPairClause, queryMany } from '../../db/helpers.js';
import { collectAffectedAgentDates, recomputeAgentDailyStats } from './dailyStats.js';
import { loadHourlyPrices } from './priceCache.js';

const BASE_WETH_ADDRESS = '0x4200000000000000000000000000000000000006';

// payments에 USD 환산값 채우고 agent_daily_stats 증분 업데이트
// 핫패스에서 외부 API 의존 — DeFiLlama 장애 시 격리되도록 try-catch로 감싸 evidence 처리는 보장
export async function updateAggregates(
    evidence: X402Evidence[],
    ctx: PipelineContext,
): Promise<void> {
    // domain row가 생긴 뒤 USD 환산, daily stats, selector enrichment를 수행한다.
    if (evidence.length === 0) return;

    // 1. 가격 조회 — payment 시점 (block_timestamp) 기준
    //    price_snapshots 캐시 확인 → 없으면 DeFiLlama API 호출 → 결과 캐시
    //    동일 (asset, hour) 쌍은 1회만 조회 (블록 시간 분 단위 묶음)
    const prices = await fetchPrices(evidence, ctx);

    // 2. payments.amount_usd 백필
    //    UPDATE payments SET amount_usd = amount * price / 10^decimals
    //    WHERE (transaction_hash, log_index) IN (...)
    await backfillPaymentUsd(evidence, prices, ctx);

    // 3. agent_daily_stats 재계산
    const affectedKeys = await collectAffectedAgentDates(
        ctx,
        evidence.map((item) => ({ txHash: item.txHash, logIndex: item.logIndex })),
    );
    await upsertDailyStats(affectedKeys, ctx);

    // 4. function_signatures 캐시 lazy 보강
    //    interactions에 새 selector가 있으면 openchain.xyz 조회 후 저장
    //    실패해도 무시 — selector 자체는 raw로 보존됨
    await enrichFunctionSignatures(evidence, ctx);

    // 5. total_revenue_usd, unique_services는 별도 일배치로 계산 권장
    //    (실시간 갱신은 비용 큼, 학습 프로젝트는 야간 배치로 충분)
}

// (asset, timestamp) 단위 가격 조회
// 캐시 우선 — DeFiLlama 호출 최소화
async function fetchPrices(
    evidence: X402Evidence[],
    ctx: PipelineContext,
): Promise<Map<string, number>> {
    // payment 자산과 가스 계산용 WETH의 hour-bucket 가격을 캐시 우선으로 가져온다.
    if (evidence.length === 0) {
        return new Map();
    }
    const pairClause = buildPairClause(
        'transaction_hash',
        'log_index',
        evidence.map((item) => [item.txHash, item.logIndex] as const),
    );

    const paymentRows = await queryMany<{
        asset: Address;
        block_timestamp: Date;
    }>(
        ctx.db,
        `SELECT asset, block_timestamp
         FROM payments
         WHERE ${pairClause.clause}`,
        pairClause.params,
    );

    const buckets = new Map<string, { asset: string; timestamp: Date }>();
    for (const row of paymentRows) {
        const hour = new Date(row.block_timestamp);
        hour.setUTCMinutes(0, 0, 0);
        buckets.set(`${row.asset}:${hour.toISOString()}`, {
            asset: row.asset,
            timestamp: hour,
        });
        buckets.set(`${BASE_WETH_ADDRESS}:${hour.toISOString()}`, {
            asset: BASE_WETH_ADDRESS,
            timestamp: hour,
        });
    }

    return loadHourlyPrices([...buckets.values()], ctx);
}

// payments.amount_usd를 저장된 amount와 hour-bucket price로 채운다.
// USDC 6 decimals 기준으로 환산하며 가격이 없으면 해당 row는 다음 재집계 기회에 남긴다.
async function backfillPaymentUsd(
    evidence: X402Evidence[],
    prices: Map<string, number>,
    ctx: PipelineContext,
): Promise<void> {
    // 저장된 payment amount에 hour-bucket USD 가격을 반영한다.
    const pairClause = buildPairClause(
        'transaction_hash',
        'log_index',
        evidence.map((item) => [item.txHash, item.logIndex] as const),
    );
    const rows = await queryMany<{
        transaction_hash: string;
        log_index: number;
        amount: string;
        asset: string;
        block_timestamp: Date;
    }>(
        ctx.db,
        `SELECT transaction_hash, log_index, amount, asset, block_timestamp
         FROM payments
         WHERE ${pairClause.clause}`,
        pairClause.params,
    );

    for (const row of rows) {
        const hour = new Date(row.block_timestamp);
        hour.setUTCMinutes(0, 0, 0);
        const price = prices.get(`${row.asset}:${hour.toISOString()}`);
        if (price === undefined) continue;

        const amountUsd = Number(row.amount) / 1_000_000 * price;
        await ctx.db.query(
            `UPDATE payments
             SET amount_usd = $3
             WHERE transaction_hash = $1 AND log_index = $2`,
            [row.transaction_hash, row.log_index, amountUsd],
        );
    }
}

// 영향받은 agent/date 집계 upsert 진입점.
// aggregate step은 key 수집까지만 하고 실제 재계산 로직은 dailyStats.ts에 집중시킨다.
async function upsertDailyStats(
    affectedKeys: Array<{ agentAddress: string; date: string }>,
    ctx: PipelineContext,
): Promise<void> {
    // 실제 계산은 dailyStats helper에 위임해 aggregate 파일의 책임을 얇게 유지한다.
    await recomputeAgentDailyStats(ctx, affectedKeys);
}

// interaction selector를 OpenChain signature DB로 보강한다.
// 외부 API 실패가 payment 집계를 막지 않도록 성공한 selector만 function_signatures에 캐시한다.
async function enrichFunctionSignatures(
    evidence: X402Evidence[],
    ctx: PipelineContext,
): Promise<void> {
    // interactions의 새로운 selector를 openchain으로 해석해 캐시에 저장한다.
    const txHashes = [...new Set(evidence.map((item) => item.txHash))];
    if (txHashes.length === 0) {
        return;
    }

    const interactions = await queryMany<{ function_selector: string | null }>(
        ctx.db,
        `SELECT DISTINCT function_selector
         FROM interactions
         WHERE transaction_hash IN (${buildInClause(1, txHashes.length)})`,
        txHashes,
    );
    const selectors = interactions
        .map((row) => row.function_selector)
        .filter((value): value is string => Boolean(value));
    if (selectors.length === 0) {
        return;
    }

    const cached = await queryMany<{ selector: string }>(
        ctx.db,
        `SELECT selector FROM function_signatures WHERE selector IN (${buildInClause(1, selectors.length)})`,
        selectors,
    );
    const cachedSet = new Set(cached.map((row) => row.selector));

    for (const selector of selectors) {
        if (cachedSet.has(selector)) continue;

        const response = await fetch(
            `${ctx.integrations.openChainBaseUrl}/signature-database/v1/lookup?function=${selector}`,
        );
        if (!response.ok) continue;
        const payload = await response.json() as {
            result?: {
                function?: Record<string, Array<{ name?: string }>>;
            };
        };
        const name = payload.result?.function?.[selector]?.[0]?.name ?? 'unknown';
        await ctx.db.query(
            `INSERT INTO function_signatures (selector, name, source)
             VALUES ($1, $2, 'openchain')
             ON CONFLICT (selector) DO NOTHING`,
            [selector, name],
        );
    }
}
