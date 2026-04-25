import type {
    BlockInput,
    BlockHeader,
    PipelineContext,
    X402Candidate,
    X402Evidence,
    ReorgCheckResult,
    TransferLog,
} from './types.js';

import { fetchBlockHeader } from './steps/fetchBlockHeader.js';
import { detectReorg } from './steps/detectReorg.js';
import { recoverReorg } from './steps/recoverReorg.js';
import { filterTransferLogs } from './steps/filterTransferLogs.js';
import { validateX402Candidates } from './steps/validateX402Candidate.js';
import { storeRaw, storeBlockOnly } from './steps/storeRaw.js';
import { extractEvidence } from './steps/extractEvidence.js';
import { deriveDomain } from './steps/deriveDomain.js';
import { updateAggregates } from './steps/aggregate.js';
import { CheckpointManager } from '../db/checkpoints.js';
import { refreshAddressRegistry } from '../db/addressRegistry.js';

// 단일 블록 처리의 진입점
// 워커 종류와 무관하게 동일하게 호출 — workerName으로 cursor 분리
// 성공/실패 모두 throw 정책 (cursor lock 해제는 호출자 책임)
export async function processBlock(
    input: BlockInput,
    ctx: PipelineContext,
): Promise<void> {
    // 블록 하나를 raw -> evidence -> domain -> aggregate 순으로 끝까지 처리하는 메인 파이프라인
    const checkpoint = new CheckpointManager(ctx);
    await refreshAddressRegistry(ctx, input.blockNumber);

    // [C] 블록 헤더 조회
    const header: BlockHeader = await fetchBlockHeader(input.blockNumber, ctx);

    // [D] parentHash 검증
    const reorgCheck: ReorgCheckResult = await detectReorg(
        header,
        input.workerName,
        ctx,
        { allowNonSequentialBackfill: input.source === 'backfill' },
    );

    // [R] reorg 감지 시 복구 후 종료 — 현재 블록은 다음 사이클에서 재처리됨
    if (!reorgCheck.valid) {
        await recoverReorg(reorgCheck, input.workerName, ctx);
        return;
    }

    // [E] Transfer 로그 필터 — known_assets만
    const transferLogs: TransferLog[] = await filterTransferLogs(header, ctx);

    // Transfer 자체가 없으면 블록만 저장하고 종료
    if (transferLogs.length === 0) {
        await storeBlockOnly(header, ctx);
        await checkpoint.advance(input.workerName, header);
        return;
    }

    // [F] 3중 필터 검증 — Transfer 있는 tx만 getTransaction
    const candidates: X402Candidate[] = await validateX402Candidates(
        transferLogs,
        ctx,
    );

    // 3중 필터 미통과 — 일반 USDC 송금 등, 블록만 저장하고 종료
    if (candidates.length === 0) {
        await storeBlockOnly(header, ctx);
        await checkpoint.advance(input.workerName, header);
        return;
    }

    // [G] Receipt + Raw 저장 (blocks/transactions/logs)
    await storeRaw(header, candidates, ctx);

    // [H] Evidence 추출 + confidence 계산 (x402_evidence 저장은 step 내부에서)
    const evidence: X402Evidence[] = await extractEvidence(candidates, ctx);

    // [H2] confidence 임계값 분기
    const promoted = evidence.filter(
        (e) => e.confidence >= ctx.config.confidenceThreshold,
    );

    // 임계값 통과한 evidence가 있을 때만 domain 파생 + 집계
    // 미달 evidence는 x402_evidence에 격리 보관됨 (extractEvidence에서 저장)
    if (promoted.length > 0) {
        // [I] Domain 파생 — agents/payments/interactions
        await deriveDomain(promoted, ctx);

        // [J] 가격 보강 + daily_stats 집계
        await updateAggregates(promoted, ctx);
    }

    // 체크포인트 갱신 — raw/domain/aggregate 모두 성공한 뒤에만
    await checkpoint.advance(input.workerName, header);
}
