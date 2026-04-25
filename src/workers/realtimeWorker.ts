import type { PipelineContext } from '../pipeline/types.js';
import { processBlock } from '../pipeline/orchestrator.js';
import { withCursorLock } from '../db/checkpoints.js';
import { enqueueBackfillRange } from '../db/backfillJobs.js';

// viem watchBlocks 기반 실시간 워커.
// 신규 블록을 finalityLag만큼 기다린 뒤 순차 큐로 넘기고, 실패 블록은 backfill 복구 경로에 맡긴다.
export class RealtimeWorker {
    // 처리 대기 블록 큐 — 단일 인스턴스 전제이므로 in-memory FIFO
    private queue: bigint[] = [];

    // watchBlocks 구독 해제 핸들러 — stop()에서 호출
    private unwatch: (() => void) | null = null;

    // 큐 소비 루프 중단 플래그
    private running = false;

    // 현재 handle 진행 중 여부 — graceful shutdown 시 대기용
    private processing = false;

    // 실시간 워커가 checkpoint gap을 발견해 백필에 넘긴 마지막 블록.
    // checkpoint가 아직 따라오지 않은 상태에서 새 head가 계속 도착할 때
    // 같은 누락 범위를 반복 enqueue하지 않도록 한다.
    private delegatedGapEnd: bigint | null = null;

    constructor(
        private ctx: PipelineContext,
        private sleeper: (ms: number) => Promise<void> = sleep,
    ) {
    }

    public async start(): Promise<void> {
        // watchBlocks 구독을 열고, 별도의 consume loop를 동시에 시작한다.
        if (this.running) return;
        this.running = true;

        // watchBlocks 구독 시작 — 신규 블록 헤더 수신마다 onNewBlock 호출
        this.unwatch = this.ctx.rpc.watchBlocks({
            emitOnBegin: false,           // 과거 블록은 backfill 영역
            includeTransactions: false,   // tx 상세는 파이프라인에서 별도 조회
            onBlock: (block) => {
                if (typeof block.number !== 'bigint') {
                    return;
                }
                void this.onNewBlock(block.number);
            },
            onError: (error) => {
                // RPC polling 자체가 실패해도 프로세스를 죽이지 않고 다음 polling을 기다린다.
                console.error('[realtime] watchBlocks polling failed', error);
            },
        });

        // 큐 소비 루프 시작 — handle을 순차 실행
        void this.consumeLoop();
    }

    public async stop(): Promise<void> {
        // 구독 종료 후 현재 처리 중인 블록이 끝날 때까지 대기
        this.running = false;

        if (this.unwatch) {
            this.unwatch();
            this.unwatch = null;
        }

        // 진행 중인 handle 완료까지 대기 (graceful shutdown)
        while (this.processing) {
            await sleep(100);
        }
    }

    // watchBlocks 콜백 — finality 대기 후 큐에 푸시
    // 이 함수는 빨리 리턴해야 함 (다음 블록 수신 지연 방지)
    private async onNewBlock(blockNumber: bigint): Promise<void> {
        // 신규 블록은 finality 조건을 만족한 뒤에만 내부 queue로 넘긴다.
        try {
            await this.waitForFinality(blockNumber);
            if (this.running) {
                this.queue.push(blockNumber);
            }
        } catch (err) {
            // public RPC rate limit/network 오류가 여기서 터질 수 있다.
            // unhandled rejection으로 앱을 종료하지 말고 backfill 복구 경로에 기록한다.
            const enqueued = await enqueueBackfillRange(
                this.ctx,
                { startBlock: blockNumber, endBlock: blockNumber },
                err instanceof Error ? err.message : String(err),
            );
            if (!enqueued) {
                console.error('[realtime] finality failure recorded for manual replay', blockNumber);
            }
            console.error('[realtime] finality wait failed', blockNumber, err);
        }
    }

    // latest - finalityLag 조건 충족까지 polling 대기
    // Base L2 블록 시간 2초 기준 2~3초 간격
    private async waitForFinality(blockNumber: bigint): Promise<void> {
        // latest - finalityLag 이상이 될 때까지 polling
        while (this.running) {
            const latest = await this.ctx.rpc.getBlockNumber();
            if (blockNumber + BigInt(this.ctx.config.finalityLag) <= latest) {
                return;
            }
            await this.sleeper(2500);
        }
    }

    // 큐에서 블록 꺼내 handle 호출 — 순차 실행 보장
    private async consumeLoop(): Promise<void> {
        // queue에서 블록을 하나씩 꺼내 순차 처리한다.
        while (this.running) {
            const blockNumber = this.queue.shift();
            if (blockNumber === undefined) {
                await this.sleeper(100);
                continue;
            }

            this.processing = true;
            try {
                await this.handle(blockNumber);
            } catch (err) {
                // 실시간은 재시도 안 함 — 실패 블록은 backfill로 복구
                const enqueued = await enqueueBackfillRange(
                    this.ctx,
                    { startBlock: blockNumber, endBlock: blockNumber },
                    err instanceof Error ? err.message : String(err),
                );
                if (!enqueued) {
                    console.error('[realtime] recovery recorded for manual replay', blockNumber);
                }
                console.error('[realtime] block failed', blockNumber, err);
            } finally {
                this.processing = false;
            }
        }
    }

    // 단일 블록 처리 — cursor lock으로 백필 워커와의 충돌 차단
    private async handle(blockNumber: bigint): Promise<void> {
        // 실시간 블록도 orchestrator 공통 경로로 흘려보낸다.
        await withCursorLock('realtime', this.ctx, async () => {
            const checkpoint = await this.getEffectiveCheckpoint();
            if (checkpoint !== null) {
                if (this.delegatedGapEnd !== null && checkpoint.block >= this.delegatedGapEnd) {
                    this.delegatedGapEnd = null;
                }

                if (blockNumber <= checkpoint.block) {
                    return;
                }

                if (blockNumber > checkpoint.block + 1n) {
                    const startBlock =
                        this.delegatedGapEnd !== null &&
                        this.delegatedGapEnd >= checkpoint.block + 1n
                            ? this.delegatedGapEnd + 1n
                            : checkpoint.block + 1n;
                    if (startBlock > blockNumber) {
                        return;
                    }

                    const enqueued = await enqueueBackfillRange(
                        this.ctx,
                        {
                            startBlock,
                            endBlock: blockNumber,
                        },
                        `realtime gap from ${startBlock.toString()} to ${blockNumber.toString()}`,
                    );
                    this.delegatedGapEnd = blockNumber;
                    if (!enqueued) {
                        console.error('[realtime] gap recorded for manual replay', {
                            startBlock,
                            endBlock: blockNumber,
                        });
                    }
                    console.error('[realtime] gap detected, delegated to backfill', {
                        lastProcessedBlock: checkpoint.block,
                        blockNumber,
                    });
                    return;
                }

                if (checkpoint.workerName !== 'realtime') {
                    await this.syncRealtimeCheckpoint(checkpoint);
                }
            }

            await processBlock(
                {
                    blockNumber,
                    source: 'realtime',
                    workerName: 'realtime',
                },
                this.ctx,
            );
        });
    }

    // realtime과 backfill_default 중 더 앞선 canonical checkpoint를 사용한다.
    // 백필이 실시간 gap을 메웠다면 실시간 워커는 그 지점부터 이어 달릴 수 있어야 한다.
    private async getEffectiveCheckpoint(): Promise<{
        workerName: string;
        block: bigint;
        hash: string;
    } | null> {
        const result = await this.ctx.db.query<{
            worker_name: string;
            last_processed_block: string;
            last_processed_hash: string;
        }>(
            `SELECT worker_name, last_processed_block, last_processed_hash
             FROM sync_checkpoints
             WHERE worker_name IN ('realtime', 'backfill_default')
               AND last_processed_block > 0
             ORDER BY last_processed_block DESC,
                      CASE WHEN worker_name = 'realtime' THEN 0 ELSE 1 END
             LIMIT 1`,
        );

        const row = result.rows[0];
        if (!row) {
            return null;
        }

        return {
            workerName: row.worker_name,
            block: BigInt(row.last_processed_block),
            hash: row.last_processed_hash,
        };
    }

    // 백필이 실시간보다 앞서 gap을 복구한 경우 realtime checkpoint를 handoff 지점으로 맞춘다.
    // 이렇게 해야 다음 processBlock의 parentHash 검사가 stale realtime hash가 아닌 최신 canonical hash를 본다.
    private async syncRealtimeCheckpoint(checkpoint: { block: bigint; hash: string }): Promise<void> {
        await this.ctx.db.query(
            `INSERT INTO sync_checkpoints (worker_name, last_processed_block, last_processed_hash, status, updated_at)
             VALUES ('realtime', $1, $2, 'running', NOW())
             ON CONFLICT (worker_name) DO UPDATE SET
               last_processed_block = EXCLUDED.last_processed_block,
               last_processed_hash = EXCLUDED.last_processed_hash,
               status = EXCLUDED.status,
               updated_at = NOW()
             WHERE sync_checkpoints.last_processed_block <= EXCLUDED.last_processed_block`,
            [checkpoint.block.toString(), checkpoint.hash],
        );
    }
}

// worker polling/finality wait에서 쓰는 Promise 기반 sleep helper.
// 테스트에서는 RealtimeWorker constructor로 sleeper를 주입해 실제 대기를 피한다.
function sleep(ms: number): Promise<void> {
    // worker polling/backoff용 간단 sleep 헬퍼
    return new Promise((resolve) => setTimeout(resolve, ms));
}
