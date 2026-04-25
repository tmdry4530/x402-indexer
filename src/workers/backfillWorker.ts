import { Worker, Queue, type Job } from 'bullmq';
import type { PipelineContext, WorkerName } from '../pipeline/types.js';
import { processBlock } from '../pipeline/orchestrator.js';
import { withCursorLock } from '../db/checkpoints.js';
import { recordQueuedBackfillJob } from '../db/backfillJobs.js';

// BullMQ에 직렬화되는 백필 job payload.
// bigint는 JSON 직렬화가 안 되므로 queue 내부에서는 string으로 보관한다.
export interface BackfillJobData {
    startBlock: string; // bigint를 BullMQ로 직렬화 시 string 변환
    endBlock: string;
}

const QUEUE_NAME = 'x402-backfill';

// 긴 백필 범위를 worker 설정 chunk size에 맞게 분할한다.
// chunk 단위 progress/update를 남겨 실패 시 재시도 범위와 진행 상황을 좁힌다.
export function splitBlockRangeIntoChunks(
    startBlock: bigint,
    endBlock: bigint,
    chunkSize: bigint,
): Array<{ start: bigint; end: bigint }> {
    // 백필 범위를 chunk 크기 기준으로 잘라서 부분 재시도/진행률 추적이 가능하게 한다.
    if (startBlock > endBlock) return [];

    const chunks: Array<{ start: bigint; end: bigint }> = [];
    let cursor = startBlock;
    while (cursor <= endBlock) {
        const chunkEnd =
            cursor + chunkSize - 1n > endBlock ? endBlock : cursor + chunkSize - 1n;
        chunks.push({ start: cursor, end: chunkEnd });
        cursor = chunkEnd + 1n;
    }

    return chunks;
}

// BullMQ 기반 백필 워커.
// API/복구 경로에서 enqueue된 블록 범위를 chunk/block 순서로 처리하고 공통 orchestrator에 위임한다.
export class BackfillWorker {
    private worker: Worker<BackfillJobData> | null = null;
    private queue: Queue<BackfillJobData> | null = null;

    constructor(
        private ctx: PipelineContext,
        private workerName: WorkerName,
    ) {
    }

    public async start(): Promise<void> {
        // BullMQ Queue/Worker를 만들고 실패 이벤트 훅을 붙인다.
        // Queue: enqueue 측 인터페이스
        this.queue = new Queue<BackfillJobData>(QUEUE_NAME, {
            connection: this.ctx.redis as any,
        });

        // Worker: job 수신 측
        this.worker = new Worker<BackfillJobData>(
            QUEUE_NAME,
            async (job: any) => this.processJob(job),
            {
                connection: this.ctx.redis as any,
                concurrency: 1,           // cursor lock과 충돌 방지를 위해 단일 처리
                name: this.workerName,    // 로그/메트릭 구분용
            },
        );

        this.worker.on('failed', (job, err) => {
            console.error('[backfill] job failed', job?.id, err);
            if (job?.data) {
                void this.ctx.db.query(
                    `UPDATE backfill_jobs
                     SET status = 'failed', retry_count = $3, error_message = $4
                     WHERE start_block = $1 AND end_block = $2`,
                    [
                        job.data.startBlock,
                        job.data.endBlock,
                        job.attemptsMade,
                        err.message,
                    ],
                );
            }
        });
    }

    public async stop(): Promise<void> {
        // BullMQ graceful shutdown
        // graceful shutdown — 진행 중인 job 완료까지 대기
        if (this.worker) {
            await this.worker.close();
            this.worker = null;
        }
        if (this.queue) {
            await this.queue.close();
            this.queue = null;
        }
    }

    // 외부 진입점 (CLI/API)에서 호출 — job 추가
    public async enqueue(data: { startBlock: bigint; endBlock: bigint }): Promise<void> {
        // 외부 요청을 backfill_jobs + BullMQ 둘 다에 기록해서 운영 추적성을 남긴다.
        if (!this.queue) {
            throw new Error('BackfillWorker not started');
        }

        await recordQueuedBackfillJob(this.ctx.db, data);

        await this.queue.add(
            'backfill-range',
            {
                startBlock: data.startBlock.toString(),
                endBlock: data.endBlock.toString(),
            },
            {
                jobId: `backfill-${data.startBlock}-${data.endBlock}`,
                attempts: 5,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: true,
                removeOnFail: false,
            },
        );
    }

    // BullMQ가 job을 꺼낼 때 자동 호출
    private async processJob(job: Job<BackfillJobData>): Promise<void> {
        // 하나의 백필 job을 chunk -> block 순으로 소비한다.
        const startBlock = BigInt(job.data.startBlock);
        const endBlock = BigInt(job.data.endBlock);

        await this.ctx.db.query(
            `UPDATE backfill_jobs
             SET status = 'running', retry_count = $3, error_message = NULL
             WHERE start_block = $1 AND end_block = $2`,
            [startBlock.toString(), endBlock.toString(), job.attemptsMade],
        );

        // chunk 단위 분할 — 실패 시 chunk 단위로만 재시도되도록
        const chunks = this.splitIntoChunks(startBlock, endBlock);

        for (const chunk of chunks) {
            // chunk 내 블록 순회
            for (let bn = chunk.start; bn <= chunk.end; bn++) {
                // 이미 처리된 블록 스킵
                if (await this.isAlreadyProcessed(bn)) {
                    continue;
                }

                // handle 실패 시 throw → BullMQ가 backoff로 재시도
                await this.handle(bn);
            }

            // chunk 단위 진행 상황 로그
            await job.updateProgress({
                processedTo: chunk.end.toString(),
            });
        }

        await this.ctx.db.query(
            `UPDATE backfill_jobs
             SET status = 'completed', retry_count = $3, error_message = NULL
             WHERE start_block = $1 AND end_block = $2`,
            [startBlock.toString(), endBlock.toString(), job.attemptsMade],
        );
    }

    // start ~ end를 chunkSize 단위로 분할
    // 마지막 chunk는 chunkSize보다 작을 수 있음
    private splitIntoChunks(
        startBlock: bigint,
        endBlock: bigint,
    ): Array<{ start: bigint; end: bigint }> {
        // 인스턴스 config를 반영한 class용 thin wrapper
        return splitBlockRangeIntoChunks(
            startBlock,
            endBlock,
            BigInt(this.ctx.config.backfillChunkSize),
        );
    }

    // blocks 테이블 조회로 이미 처리된 블록 판별
    // is_orphaned = false 조건 추가 — orphan 처리된 블록은 재처리 필요
    private async isAlreadyProcessed(blockNumber: bigint): Promise<boolean> {
        // 이미 canonical blocks에 저장된 블록은 백필에서 건너뛴다.
        const result = await this.ctx.db.query(
            `SELECT 1
             FROM blocks b
             WHERE b.number = $1
               AND b.is_orphaned = false
               AND EXISTS (
                 SELECT 1
                 FROM sync_checkpoints c
                 WHERE c.worker_name = $2
                   AND c.last_processed_block >= $1
               )
             LIMIT 1`,
            [blockNumber.toString(), this.workerName],
        );
        return (result.rowCount ?? 0) > 0;
    }

    // 단일 블록 처리 — realtimeWorker.handle과 동형
    private async handle(blockNumber: bigint): Promise<void> {
        // 공통 orchestrator를 백필 컨텍스트로 호출
        await withCursorLock(this.workerName, this.ctx, async () => {
            await processBlock(
                {
                    blockNumber,
                    source: 'backfill',
                    workerName: this.workerName,
                },
                this.ctx,
            );
        });
    }
}
