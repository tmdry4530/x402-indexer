import type {
    PipelineContext,
    X402Candidate,
    X402Evidence,
    DetectionMethod,
} from '../types.js';
import { decodeFunctionData, parseAbi, type Address } from 'viem';
import { toPgBigInt, toPgNumeric } from '../../db/helpers.js';

const EIP3009_ABI = parseAbi([
    'function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)',
    'function receiveWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)',
]);

// 3중 필터를 통과한 candidate에서 evidence 레코드 생성
// confidence 점수 계산 후 임계값 분기는 orchestrator에서 처리 (여기선 evidence만 반환)
export async function extractEvidence(
    candidates: X402Candidate[],
    ctx: PipelineContext,
): Promise<X402Evidence[]> {
    // candidate를 evidence 레코드로 변환하고 confidence를 계산해 저장한다.
    const evidence: X402Evidence[] = [];

    for (const candidate of candidates) {
        const { transferLog, tx, receipt } = candidate;

        // 감지 방법 결정 — 향후 Permit2/custom 케이스 추가 시 분기 확장
        const detectionMethod = decideDetectionMethod(candidate, ctx);

        // confidence 점수 계산 — 0~100
        const confidence = calculateConfidence(candidate, detectionMethod, ctx);

        // payer는 Transfer log의 from (tx.from = facilitator이므로 사용 불가)
        evidence.push({
            txHash: candidate.txHash,
            logIndex: candidate.logIndex,
            blockNumber: candidate.blockNumber,
            detectionMethod,
            confidence,
            payer: transferLog.from,
            payTo: transferLog.to,
            asset: transferLog.address,
            amount: transferLog.value,
        });
    }

    // x402_evidence 테이블에 일괄 저장 (confidence 미달 evidence도 보존)
    await persistEvidence(evidence, ctx);

    return evidence;
}

// 감지 방법 분류 — input selector + tx.to 패턴으로 판단
function decideDetectionMethod(
    candidate: X402Candidate,
    ctx: PipelineContext,
): DetectionMethod {
    // tx.to 패턴을 보고 direct / proxy / custom 경로를 분류
    const txTo = candidate.tx.to;

    // tx.to가 known proxy면 Permit2 경로
    if (txTo && ctx.registry.knownProxies.has(txTo)) {
        return 'permit2_proxy';
    }

    // tx.to가 known asset이면 EIP-3009 직접 호출
    if (txTo && ctx.registry.knownAssets.has(txTo)) {
        return 'eip3009_direct';
    }

    // 그 외는 custom contract 경유
    return 'custom_event';
}

// confidence 점수 산정 휴리스틱
// 점수 구성:
//   - facilitator 매칭: +40
//   - AuthorizationUsed 이벤트 동반: +30
//   - detectionMethod가 명확 (eip3009_direct/permit2_proxy): +20
//   - calldata의 from/to/value가 실제 Transfer 로그와 일치: +20
//   - tx.status === success: +10
function calculateConfidence(
    candidate: X402Candidate,
    method: DetectionMethod,
    ctx: PipelineContext,
): number {
    // 신뢰도는 facilitator/AuthorizationUsed/경로 명확성/성공 여부를 합산해 계산한다.
    let score = 0;

    // tx.from이 known_facilitators에 있으면 가중치 크게
    if (ctx.registry.knownFacilitators.has(candidate.tx.from)) {
        score += 40;
    }

    // AuthorizationUsed 이벤트가 같은 tx receipt에 있으면 EIP-3009 흐름 강하게 시사
    const hasAuthUsed = candidate.receipt.logs.some(
        (log) =>
            log.topics[0] ===
            '0x98de503528ee59b575ef0c0a2576a82497bfc029a5685b209e9ec333479b10a5',
    );
    if (hasAuthUsed) {
        score += 30;
    }

    if (method === 'eip3009_direct' || method === 'permit2_proxy') {
        score += 20;
    }

    if (matchesAuthorizationTransfer(candidate)) {
        score += 20;
    }

    if (candidate.receipt.status === 'success') {
        score += 10;
    }

    return Math.min(score, 100);
}

// EIP-3009 calldata의 from/to/value가 실제 Transfer 로그와 같은지 확인한다.
// facilitator 주소가 누락된 실제 tx도 이 검증을 통과하면 높은 confidence로 승격 가능하다.
function matchesAuthorizationTransfer(candidate: X402Candidate): boolean {
    try {
        const decoded = decodeFunctionData({
            abi: EIP3009_ABI,
            data: candidate.tx.input,
        });
        const [from, to, value] = decoded.args as readonly [Address, Address, bigint, ...unknown[]];
        return (
            from.toLowerCase() === candidate.transferLog.from.toLowerCase()
            && to.toLowerCase() === candidate.transferLog.to.toLowerCase()
            && value === candidate.transferLog.value
        );
    } catch {
        return false;
    }
}

// x402_evidence 테이블에 batch insert — confidence 미달도 격리 보관용으로 저장
async function persistEvidence(
    evidence: X402Evidence[],
    ctx: PipelineContext,
): Promise<void> {
    // confidence 미달 건도 x402_evidence에 남겨 정책 변경 시 재평가할 수 있게 한다.
    for (const item of evidence) {
        await ctx.db.query(
            `INSERT INTO x402_evidence (
               transaction_hash, log_index, block_number, detection_method, confidence, payer, pay_to, asset, amount
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (transaction_hash, log_index) DO UPDATE SET
               detection_method = EXCLUDED.detection_method,
               confidence = EXCLUDED.confidence,
               payer = EXCLUDED.payer,
               pay_to = EXCLUDED.pay_to,
               asset = EXCLUDED.asset,
               amount = EXCLUDED.amount`,
            [
                item.txHash,
                item.logIndex,
                toPgBigInt(item.blockNumber),
                item.detectionMethod,
                item.confidence,
                item.payer,
                item.payTo,
                item.asset,
                toPgNumeric(item.amount),
            ],
        );
    }
}
