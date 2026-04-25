import type {
    BlockHeader,
    PipelineContext,
    X402Candidate,
} from '../types.js';
import { asSmallInt, toDateTime, toPgBigInt, toPgNumeric, withTransaction } from '../../db/helpers.js';

// 후보가 있는 블록의 raw 데이터 저장
// blocks → transactions → logs 순서로 FK 무결성 보장
// 단일 DB 트랜잭션으로 묶어 원자성 확보 — 부분 실패 시 전체 롤백
export async function storeRaw(
    header: BlockHeader,
    candidates: X402Candidate[],
    ctx: PipelineContext,
): Promise<void> {
    // 후보가 확인된 블록의 raw layer(blocks/transactions/logs)를 하나의 트랜잭션으로 저장한다.
    await withTransaction(ctx.db, async (db) => {
        await db.query(
            `INSERT INTO blocks (number, hash, parent_hash, timestamp, is_orphaned)
             VALUES ($1, $2, $3, $4, false)
             ON CONFLICT (number) DO UPDATE SET
               hash = EXCLUDED.hash,
               parent_hash = EXCLUDED.parent_hash,
               timestamp = EXCLUDED.timestamp,
               is_orphaned = false`,
            [toPgBigInt(header.number), header.hash, header.parentHash, toDateTime(header.timestamp)],
        );

        const uniqueCandidates = new Map(candidates.map((candidate) => [candidate.txHash, candidate]));
        for (const candidate of uniqueCandidates.values()) {
            await db.query(
                `INSERT INTO transactions (
                   hash, block_number, from_address, to_address, input, value, status, gas_used, effective_gas_price
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (hash) DO UPDATE SET
                   block_number = EXCLUDED.block_number,
                   from_address = EXCLUDED.from_address,
                   to_address = EXCLUDED.to_address,
                   input = EXCLUDED.input,
                   value = EXCLUDED.value,
                   status = EXCLUDED.status,
                   gas_used = EXCLUDED.gas_used,
                   effective_gas_price = EXCLUDED.effective_gas_price`,
                [
                    candidate.txHash,
                    toPgBigInt(candidate.blockNumber),
                    candidate.tx.from,
                    candidate.tx.to ?? null,
                    candidate.tx.input,
                    toPgNumeric(candidate.tx.value),
                    asSmallInt(candidate.receipt.status === 'success'),
                    toPgBigInt(candidate.receipt.gasUsed),
                    toPgNumeric(candidate.receipt.effectiveGasPrice ?? 0n),
                ],
            );

            for (const log of candidate.receipt.logs) {
                await db.query(
                    `INSERT INTO logs (
                       transaction_hash, log_index, block_number, address, topic0, topic1, topic2, topic3, data
                     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     ON CONFLICT (transaction_hash, log_index) DO NOTHING`,
                    [
                        candidate.txHash,
                        Number(log.logIndex),
                        toPgBigInt(candidate.blockNumber),
                        log.address,
                        log.topics[0] ?? null,
                        log.topics[1] ?? null,
                        log.topics[2] ?? null,
                        log.topics[3] ?? null,
                        log.data,
                    ],
                );
            }
        }
    });
}

// 후보가 없는 블록은 헤더만 저장
// 체크포인트 연속성을 위해 빈 블록도 기록되어야 함 — 안 그러면 다음 reorg 검사 시 hash 비교 불가
export async function storeBlockOnly(
    header: BlockHeader,
    ctx: PipelineContext,
): Promise<void> {
    // 후보가 없어도 reorg/checkpoint 연속성을 위해 블록 헤더는 반드시 남긴다.
    await ctx.db.query(
        `INSERT INTO blocks (number, hash, parent_hash, timestamp, is_orphaned)
         VALUES ($1, $2, $3, $4, false)
         ON CONFLICT (number) DO UPDATE SET
           hash = EXCLUDED.hash,
           parent_hash = EXCLUDED.parent_hash,
           timestamp = EXCLUDED.timestamp,
           is_orphaned = false`,
        [toPgBigInt(header.number), header.hash, header.parentHash, toDateTime(header.timestamp)],
    );
}
