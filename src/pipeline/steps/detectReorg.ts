import type {
    BlockHeader,
    PipelineContext,
    ReorgCheckResult,
    WorkerName,
} from '../types.js';
import { CheckpointManager } from '../../db/checkpoints.js';
import { queryOne } from '../../db/helpers.js';
import type { Hash } from 'viem';

// 새 블록의 parentHash와 로컬 마지막 처리 블록의 hash를 비교
// 불일치 시 reorg — 공통 조상 블록 번호까지 계산해서 반환
// 백필 워커는 finalized 영역만 다루므로 거의 통과, 실시간 워커가 주 분기 주체
export async function detectReorg(
    header: BlockHeader,
    workerName: WorkerName,
    ctx: PipelineContext,
    options: { allowNonSequentialBackfill?: boolean } = {},
): Promise<ReorgCheckResult> {
    // 새 블록의 parentHash와 로컬 checkpoint hash를 비교해 canonical 체인 여부를 판단한다.
    const manager = new CheckpointManager(ctx);
    const lastProcessedBlock = await manager.getLastProcessedBlock(workerName);
    const lastHash = await manager.getLastProcessedHash(workerName);

    // 첫 실행 — 비교 대상 없음, 무조건 정상 처리
    if (lastProcessedBlock === null || lastHash === null) {
        return { valid: true };
    }

    // 백필은 "이미 앞까지 진행된 커서보다 오래된 누락 블록"을 다시 읽을 수 있다.
    // 이 경우 새 블록의 parentHash를 최신 checkpoint hash와 비교하면 항상 불일치하므로
    // reorg가 아니라 비연속 백필로 보고 통과시킨다.
    if (
        options.allowNonSequentialBackfill &&
        header.number !== lastProcessedBlock + 1n
    ) {
        return { valid: true };
    }

    // parentHash 일치 — 정상 canonical 체인
    if (header.parentHash === lastHash) {
        return { valid: true };
    }

    // 불일치 — 공통 조상 역추적
    const ancestor = await findCommonAncestor(header.number - 1n, ctx);

    return {
        valid: false,
        currentBlockNumber: header.number,
        localHash: lastHash,
        canonicalHash: header.parentHash,
        commonAncestorBlock: ancestor,
    };
}

// 공통 조상 블록 번호 탐색 — recoverReorg가 어디까지 롤백할지 결정
// 로컬 DB의 hash와 RPC의 canonical hash를 위로 거슬러 비교
async function findCommonAncestor(
    startBlock: bigint,
    ctx: PipelineContext,
): Promise<bigint> {
    // 로컬 저장된 hash와 RPC canonical hash를 위로 거슬러 비교해 공통 조상을 찾는다.
    let depth = 0n;
    const maxDepth = BigInt(ctx.config.maxReorgDepth);

    while (startBlock - depth >= 0n) {
        const blockNumber = startBlock - depth;
        const local = await queryOne<{ hash: string }>(
            ctx.db,
            `SELECT hash
             FROM blocks
             WHERE number = $1 AND is_orphaned = false`,
            [blockNumber.toString()],
        );

        const canonical = await ctx.rpc.getBlock({
            blockNumber,
            includeTransactions: false,
        });

        if (local && canonical.hash && local.hash === (canonical.hash as Hash)) {
            return blockNumber;
        }

        depth += 1n;
        if (depth > maxDepth) {
            throw new Error('reorg too deep — manual intervention required');
        }
    }

    return 0n;
}
