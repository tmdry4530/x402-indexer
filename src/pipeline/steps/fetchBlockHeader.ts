import type { BlockHeader, PipelineContext } from '../types.js';
import type { Hash } from 'viem';

// RPC에서 블록 헤더 조회
// includeTransactions: false로 가볍게 가져옴 — tx 상세는 후속 step에서 필요 시만
// 후보가 없는 블록도 헤더는 저장해야 하므로 (체크포인트 연속성) 항상 호출됨
export async function fetchBlockHeader(
    blockNumber: bigint,
    ctx: PipelineContext,
): Promise<BlockHeader> {
    // viem Block 전체 대신 파이프라인에 필요한 헤더 정보만 추려 경량화한다.
    const block = await ctx.rpc.getBlock({
        blockNumber,
        includeTransactions: false,
    });

    if (!block.number || !block.hash) {
        throw new Error(`Block ${blockNumber.toString()} is missing canonical fields`);
    }

    return {
        number: block.number,
        hash: block.hash as Hash,
        parentHash: block.parentHash as Hash,
        timestamp: block.timestamp,
    };
}
