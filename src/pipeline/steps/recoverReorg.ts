import type {
    PipelineContext,
    ReorgCheckResult,
    WorkerName,
} from '../types.js';
import { CheckpointManager } from '../../db/checkpoints.js';
import { enqueueBackfillRange } from '../../db/backfillJobs.js';
import { queryMany } from '../../db/helpers.js';
import { recomputeAgentDailyStats } from './dailyStats.js';

const ERC20_TRANSFER_TOPIC_PREFIX = '0xddf252ad';

// reorg 감지 시 호출 — 영향받은 데이터를 무효화하고 체크포인트 되돌림
// 복구 후 현재 블록은 다음 워커 사이클에서 재처리됨 (이 함수는 재처리하지 않음)
export async function recoverReorg(
    result: Extract<ReorgCheckResult, { valid: false }>,
    workerName: WorkerName,
    ctx: PipelineContext,
): Promise<void> {
    // reorg 발생 시 orphan 마킹 -> domain 무효화 -> 캐시 정리 -> checkpoint rewind 순서로 복구한다.
    const manager = new CheckpointManager(ctx);
    const lastProcessedBlock = await manager.getLastProcessedBlock(workerName);

    // 1. 공통 조상 이후 블록을 orphan으로 표시 (soft delete)
    await markOrphanBlocks(result.commonAncestorBlock, ctx);

    // 2. 영향받은 도메인 데이터 무효화
    //    payments, interactions, agent_daily_stats에서 orphan 블록의 row 삭제
    //    block_number FK가 redundantly 박혀있어 단일 WHERE로 가능
    await invalidateDomainData(result.commonAncestorBlock, ctx);

    // 3. Redis 캐시 무효화
    //    대시보드 응답 캐시에 stale 데이터가 남아있으면 안 됨
    await invalidateCache(result.commonAncestorBlock, ctx);

    // 4. 체크포인트를 공통 조상으로 되돌림
    //    다음 워커 사이클이 공통 조상 + 1 블록부터 다시 처리
    const ancestorHash = await fetchAncestorHash(result.commonAncestorBlock, ctx);
    await manager.rewindTo(workerName, result.commonAncestorBlock, ancestorHash);

    const replayEnd =
        lastProcessedBlock && lastProcessedBlock > result.currentBlockNumber
            ? lastProcessedBlock
            : result.currentBlockNumber;
    if (replayEnd > result.commonAncestorBlock) {
        const enqueued = await enqueueBackfillRange(
            ctx,
            {
                startBlock: result.commonAncestorBlock + 1n,
                endBlock: replayEnd,
            },
            `reorg replay from ${result.commonAncestorBlock.toString()} to ${replayEnd.toString()}`,
        );
        if (!enqueued) {
            console.error('[reorg] replay range recorded for manual backfill', {
                startBlock: (result.commonAncestorBlock + 1n).toString(),
                endBlock: replayEnd.toString(),
            });
        }
    }
}

// 공통 조상 이후 블록을 is_orphaned = true로 마킹
// 물리 삭제하지 않는 이유: 재처리 시 비교/디버깅 목적으로 원본 보존
async function markOrphanBlocks(
    commonAncestor: bigint,
    ctx: PipelineContext,
): Promise<void> {
    // 공통 조상 이후 블록을 soft-delete 성격으로 orphan 처리
    await ctx.db.query(
        `UPDATE blocks
         SET is_orphaned = true
         WHERE number > $1 AND is_orphaned = false`,
        [commonAncestor.toString()],
    );
}

// orphan 블록에 속한 도메인 row 삭제
// raw layer (logs, transactions)는 유지 — 재처리 시 재사용
async function invalidateDomainData(
    commonAncestor: bigint,
    ctx: PipelineContext,
): Promise<void> {
    // raw는 남기고 파생된 domain/aggregate만 지운 뒤 다시 계산 가능하게 만든다.
    const impactedStatsRows = await queryMany<{ payer: string; block_timestamp: Date }>(
        ctx.db,
        `SELECT DISTINCT payer, block_timestamp
         FROM payments
         WHERE block_number > $1`,
        [commonAncestor.toString()],
    );
    const impactedStats = impactedStatsRows.map((row) => ({
        payer: row.payer,
        date: row.block_timestamp.toISOString().slice(0, 10),
    }));
    const impactedRevenueRows = await queryMany<{ pay_to: string; block_timestamp: Date }>(
        ctx.db,
        `SELECT e.pay_to, b.timestamp AS block_timestamp
         FROM x402_evidence e
         JOIN blocks b ON b.number = e.block_number
         WHERE e.block_number > $1`,
        [commonAncestor.toString()],
    );
    if (impactedRevenueRows.length > 0) {
        const agents = await queryMany<{ address: string }>(ctx.db, `SELECT address FROM agents`);
        const agentSet = new Set(agents.map((row) => row.address.toLowerCase()));
        for (const row of impactedRevenueRows) {
            const recipient = row.pay_to.toLowerCase();
            if (!agentSet.has(recipient)) {
                continue;
            }
            impactedStats.push({
                payer: recipient,
                date: row.block_timestamp.toISOString().slice(0, 10),
            });
        }
    }
    const dedupedImpactedStats = [...new Map(
        impactedStats.map((row) => [`${row.payer}:${row.date}`, row]),
    ).values()];

    await ctx.db.query(`DELETE FROM interactions WHERE block_number > $1`, [
        commonAncestor.toString(),
    ]);
    await ctx.db.query(`DELETE FROM payments WHERE block_number > $1`, [
        commonAncestor.toString(),
    ]);
    await ctx.db.query(`DELETE FROM x402_evidence WHERE block_number > $1`, [
        commonAncestor.toString(),
    ]);

    if (dedupedImpactedStats.length > 0) {
        for (const row of dedupedImpactedStats) {
            const dayStart = new Date(`${row.date}T00:00:00.000Z`);
            const nextDayStart = new Date(`${row.date}T00:00:00.000Z`);
            nextDayStart.setUTCDate(nextDayStart.getUTCDate() + 1);
            await ctx.db.query(
                `DELETE FROM agent_daily_stats
                 WHERE agent_address = $1
                   AND date >= $2
                   AND date < $3`,
                [row.payer, dayStart, nextDayStart],
            );
        }
    }

    await recomputeAgentDailyStats(
        ctx,
        dedupedImpactedStats.map((row) => ({
            agentAddress: row.payer,
            date: row.date,
        })),
    );
}

// Redis에서 영향받은 캐시 키 제거
async function invalidateCache(
    commonAncestor: bigint,
    ctx: PipelineContext,
): Promise<void> {
    // stale dashboard 응답을 피하기 위해 dashboard:* 키만 정리
    void commonAncestor;
    const stream = ctx.redis.scanStream({
        match: 'dashboard:*',
        count: 100,
    });

    const keys: string[] = [];
    await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk: string[]) => {
            keys.push(...chunk);
        });
        stream.on('end', () => resolve());
        stream.on('error', (error: Error) => reject(error));
    });

    if (keys.length > 0) {
        await ctx.redis.del(...keys);
    }
}

// 공통 조상 블록의 canonical hash 조회 — rewindTo에 전달
async function fetchAncestorHash(
    blockNumber: bigint,
    ctx: PipelineContext,
): Promise<`0x${string}`> {
    // rewind checkpoint에 넣을 canonical ancestor hash 조회
    const block = await ctx.rpc.getBlock({
        blockNumber,
        includeTransactions: false,
    });

    if (!block.hash) {
        throw new Error(`Missing canonical hash for ancestor block ${blockNumber.toString()}`);
    }

    return block.hash;
}
