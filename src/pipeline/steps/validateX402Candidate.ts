import type { Hash } from 'viem';
import type {
    PipelineContext,
    TransferLog,
    X402Candidate,
} from '../types.js';
import type { Transaction, TransactionReceipt } from 'viem';

// EIP-3009 함수 selector — input[0:10] (0x + 4byte hex)
const EIP3009_SELECTORS = new Set<string>([
    '0xe3ee160e', // transferWithAuthorization
    '0xef55bec6', // receiveWithAuthorization
]);

// Transfer 로그가 있는 tx에 3중 필터 적용해 x402 후보 확정
// 1차 필터: tx.to ∈ known_assets (Transfer 단계에서 이미 만족)
// 2차 필터: input[0:4] ∈ EIP3009_SELECTORS
// 3차 필터: tx.from ∈ known_facilitators (confidence 가중, 필수 아님)
//
// 3차가 미통과여도 2차까지 만족하면 candidate로 둠 — confidence는 낮게 책정
export async function validateX402Candidates(
    logs: TransferLog[],
    ctx: PipelineContext,
): Promise<X402Candidate[]> {
    // Transfer 로그가 달린 tx 중에서 x402 결제일 가능성이 있는 tx만 candidate로 승격한다.
    if (logs.length === 0) {
        return [];
    }

    // 1. 같은 tx에 여러 Transfer가 있을 수 있어 unique tx hash 추출
    const uniqueTxHashes = Array.from(
        new Set(logs.map((log) => log.transactionHash)),
    );

    // 2. 각 tx에 대해 getTransaction + getTransactionReceipt 병렬 호출
    //    Promise.all로 묶어 RPC round-trip 최소화
    //    Receipt까지 한 번에 가져오는 이유: 통과 시 어차피 다음 step에서 필요
    const txDetails = await fetchTxAndReceipts(uniqueTxHashes, ctx);

    // 3. 각 Transfer log에 대해 3중 필터 적용
    const candidates: X402Candidate[] = [];

    for (const log of logs) {
        const detail = txDetails.get(log.transactionHash);
        if (!detail) continue;

        const { tx, receipt } = detail;

        // 2차 필터: EIP-3009 selector 검사
        // tx.input의 앞 10글자(0x + 8 hex chars = 4 byte)를 추출
        const selector = tx.input.slice(0, 10).toLowerCase();
        if (!EIP3009_SELECTORS.has(selector)) {
            continue;
        }

        // 1차 필터 재확인: tx.to가 known_assets 또는 known_proxies에 있는지
        // (Transfer log의 address와 tx.to가 다를 수 있음 — 예: proxy 호출)
        if (
            !tx.to ||
            (!ctx.registry.knownAssets.has(tx.to) &&
                !ctx.registry.knownProxies.has(tx.to))
        ) {
            continue;
        }

        if (
            ctx.config.facilitatorFilterMode === 'hard' &&
            !ctx.registry.knownFacilitators.has(tx.from)
        ) {
            continue;
        }

        // 3차 필터는 confidence 계산에서 적용 — 여기선 통과/탈락만 결정
        candidates.push({
            txHash: log.transactionHash,
            logIndex: log.logIndex,
            blockNumber: log.blockNumber,
            transferLog: log,
            tx,
            receipt,
        });
    }

    return candidates;
}

// tx hash 목록에 대해 tx + receipt 병렬 조회
async function fetchTxAndReceipts(
    hashes: Hash[],
    ctx: PipelineContext,
): Promise<Map<Hash, { tx: Transaction; receipt: TransactionReceipt }>> {
    // unique tx hash 목록에 대해 tx/receipt를 병렬 수집해 RPC round-trip을 줄인다.
    const results = await Promise.all(
        hashes.map(async (hash) => {
            const [tx, receipt] = await Promise.all([
                ctx.rpc.getTransaction({ hash }),
                ctx.rpc.getTransactionReceipt({ hash }),
            ]);
            return [hash, { tx, receipt }] as const;
        }),
    );
    return new Map(results);
}
