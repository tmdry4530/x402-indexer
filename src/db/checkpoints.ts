import type {
    WorkerName,
    BlockHeader,
    PipelineContext,
} from '../pipeline/types.js';
import type { Hash } from 'viem';
import type { PoolClient } from 'pg';
import { queryOne } from './helpers.js';

// cursor lock과 checkpoint 갱신을 한 클래스에 묶음
// sync_checkpoints 테이블이 두 책임의 공통 데이터 소스이므로 응집도 높음
export class CheckpointManager {
    private lockClient: PoolClient | null = null;
    private lockKey: string | null = null;

    constructor(private ctx: PipelineContext) {
    }

    // 워커가 블록 처리 시작 전 호출 — 같은 worker_name에 대한 동시 처리 방지
    // 구현: PostgreSQL advisory lock 또는 sync_checkpoints SELECT FOR UPDATE
    // 학습 프로젝트에서는 후자가 단순 (트랜잭션 종료 시 자동 해제)
    public async acquireLock(lockKey: string): Promise<boolean> {
        // shared cursor row를 NOWAIT로 잠가 worker 간 동시 진행을 직렬화한다.
        // 여기서의 lockKey는 checkpoint row 이름과 분리된 "락 대상" 개념이다.
        if (this.lockClient) {
            return true;
        }

        const client = await this.ctx.db.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                `INSERT INTO sync_checkpoints (worker_name, last_processed_block, last_processed_hash, status, updated_at)
                 VALUES ($1, 0, '0x0', 'idle', NOW())
                 ON CONFLICT (worker_name) DO NOTHING`,
                [lockKey],
            );
            await client.query(
                `SELECT worker_name
                 FROM sync_checkpoints
                 WHERE worker_name = $1
                 FOR UPDATE NOWAIT`,
                [lockKey],
            );
            this.lockClient = client;
            this.lockKey = lockKey;
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            client.release();
            const maybePg = error as { code?: string };
            if (maybePg.code === '55P03') {
                return false;
            }
            throw error;
        }
    }

    // 처리 완료 후 lock 해제 — 트랜잭션 커밋과 함께 자동 해제됨
    // 명시적 호출은 트랜잭션 관리를 직접 하는 경우에 사용
    public async releaseLock(workerName: WorkerName): Promise<void> {
        void workerName;
        // withCursorLock의 finally에서 호출되어 어떤 실패 경로든 lock이 남지 않게 한다.
        if (!this.lockClient) {
            return;
        }

        try {
            await this.lockClient.query('COMMIT');
        } finally {
            this.lockClient.release();
            this.lockClient = null;
            this.lockKey = null;
        }
    }

    // 워커별 마지막 처리 블록의 hash 조회 — detectReorg에서 parentHash 비교용
    public async getLastProcessedHash(workerName: WorkerName): Promise<Hash | null> {
        // reorg 검사 기준이 되는 마지막 canonical hash 조회
        const row = await queryOne<{ last_processed_hash: string; last_processed_block: string }>(
            this.ctx.db,
            `SELECT last_processed_hash, last_processed_block
             FROM sync_checkpoints
             WHERE worker_name = $1`,
            [workerName],
        );

        if (!row) {
            return null;
        }

        if (row.last_processed_block === '0') {
            return null;
        }

        return row.last_processed_hash as Hash;
    }

    // 워커별 마지막 처리 블록 번호 조회.
    // reorg replay 범위를 current block뿐 아니라 기존 처리 head까지 확장할 때 사용한다.
    public async getLastProcessedBlock(workerName: WorkerName): Promise<bigint | null> {
        // checkpoint가 없거나 0이면 아직 유효한 처리 head가 없다는 뜻
        const row = await queryOne<{ last_processed_block: string }>(
            this.ctx.db,
            `SELECT last_processed_block
             FROM sync_checkpoints
             WHERE worker_name = $1`,
            [workerName],
        );

        if (!row || row.last_processed_block === '0') {
            return null;
        }

        return BigInt(row.last_processed_block);
    }

    // 블록 처리 성공 시 호출 — 체크포인트 전진
    // raw/domain/aggregate가 모두 성공한 뒤에만 호출되어야 함 (orchestrator 마지막 단계)
    public async advance(
        workerName: WorkerName,
        header: BlockHeader,
    ): Promise<void> {
        // 해당 worker의 체크포인트를 현재 블록으로 전진.
        // 백필 워커는 이미 앞선 커서보다 오래된 누락 블록을 처리할 수 있으므로,
        // 성공한 historical backfill이 checkpoint를 과거로 되돌리지 않게 방어한다.
        await this.ctx.db.query(
            `INSERT INTO sync_checkpoints (worker_name, last_processed_block, last_processed_hash, status, updated_at)
             VALUES ($1, $2, $3, 'running', NOW())
             ON CONFLICT (worker_name) DO UPDATE SET
               last_processed_block = CASE
                 WHEN sync_checkpoints.last_processed_block <= EXCLUDED.last_processed_block
                   THEN EXCLUDED.last_processed_block
                 ELSE sync_checkpoints.last_processed_block
               END,
               last_processed_hash = CASE
                 WHEN sync_checkpoints.last_processed_block <= EXCLUDED.last_processed_block
                   THEN EXCLUDED.last_processed_hash
                 ELSE sync_checkpoints.last_processed_hash
               END,
               status = EXCLUDED.status,
               updated_at = NOW()`,
            [workerName, header.number.toString(), header.hash],
        );
    }

    // reorg 복구 시 호출 — 체크포인트를 공통 조상 블록으로 되돌림
    public async rewindTo(
        workerName: WorkerName,
        blockNumber: bigint,
        blockHash: Hash,
    ): Promise<void> {
        // reorg 복구 시 공통 조상으로 checkpoint를 되돌린다.
        await this.ctx.db.query(
            `UPDATE sync_checkpoints
             SET last_processed_block = $2,
                 last_processed_hash = $3,
                 status = 'reorged',
                 updated_at = NOW()
             WHERE worker_name = $1`,
            [workerName, blockNumber.toString(), blockHash],
        );
    }
}

// 편의 함수 — try-finally 패턴을 헬퍼로 추출
// 워커 handle()에서 사용: await withCursorLock(workerName, ctx, async () => { ... })
export async function withCursorLock<T>(
    workerName: WorkerName,
    ctx: PipelineContext,
    fn: () => Promise<T>,
    options?: { lockKey?: string },
): Promise<T | null> {
    // worker 처리 단위를 shared cursor lock으로 감싸는 공통 래퍼
    const manager = new CheckpointManager(ctx);
    const acquired = await manager.acquireLock(options?.lockKey ?? '__cursor__');

    // lock 획득 실패 = 다른 워커가 같은 블록 처리 중 → 스킵 (null 반환)
    if (!acquired) {
        return null;
    }

    try {
        return await fn();
    } finally {
        // 정상/예외 모든 경로에서 반드시 해제
        await manager.releaseLock(workerName);
    }
}
