import type { Pool } from 'pg';
import type { PipelineContext } from '../pipeline/types.js';

// 백필 큐/DB 양쪽에서 공통으로 사용하는 블록 범위 입력.
// bigint는 BullMQ 직렬화 전에 string으로 바뀌므로 DB 기록 직전까지 bigint로 유지한다.
export interface BackfillRangeInput {
  startBlock: bigint;
  endBlock: bigint;
}

// backfill_jobs 테이블에 백필 요청 상태를 영속화한다.
// Queue enqueue 실패/비활성 상태에서도 운영자가 수동 재처리할 범위를 잃지 않게 한다.
export async function recordQueuedBackfillJob(
  db: Pool,
  input: BackfillRangeInput,
  errorMessage: string | null = null,
  status: 'queued' | 'pending_manual' = 'queued',
): Promise<void> {
  await db.query(
    `INSERT INTO backfill_jobs (start_block, end_block, status, retry_count, error_message)
     VALUES ($1, $2, $4, 0, $3)
     ON CONFLICT (start_block, end_block) DO UPDATE SET
       status = EXCLUDED.status,
       retry_count = 0,
       error_message = EXCLUDED.error_message`,
    [input.startBlock.toString(), input.endBlock.toString(), errorMessage, status],
  );
}

// 백필 범위를 가능한 경우 BullMQ로 enqueue하고, 불가능하면 pending_manual로 DB에 남긴다.
// realtime/reorg 복구 경로가 queue availability에 직접 의존하지 않도록 하는 안전망이다.
export async function enqueueBackfillRange(
  ctx: Pick<PipelineContext, 'db' | 'jobs'>,
  input: BackfillRangeInput,
  errorMessage: string | null = null,
): Promise<boolean> {
  if (ctx.jobs.enqueueBackfill) {
    await ctx.jobs.enqueueBackfill(input);
    return true;
  }

  await recordQueuedBackfillJob(ctx.db, input, errorMessage, 'pending_manual');
  return false;
}
