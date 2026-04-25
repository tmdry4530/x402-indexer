import type {
    PipelineContext,
    X402Evidence,
} from '../types.js';
import type { Address } from 'viem';
import { buildInClause, buildPairClause, queryMany, toPgBigInt, toPgNumeric } from '../../db/helpers.js';

// confidence 임계값 통과한 evidence를 domain 테이블로 승격
// agents (upsert) → payments (insert) 순서로 FK 무결성 보장
// payer의 EOA/CA 구분은 getCode로 1회 조회
export async function deriveDomain(
    evidence: X402Evidence[],
    ctx: PipelineContext,
): Promise<void> {
    // 승격된 evidence를 agents/services/payments/interactions 도메인 테이블로 파생한다.
    if (evidence.length === 0) return;

    // 1. unique payer 주소에 대해 getCode 일괄 조회
    //    이미 agents 테이블에 있으면 skip — 신규 주소만 RPC 호출
    const newPayers = await findNewPayers(evidence, ctx);
    const codeResults = await fetchCodeBatch(newPayers, ctx);

    // 2. agents 테이블 upsert
    //    is_contract: getCode 결과가 '0x'면 EOA(false), 그 외 CA(true)
    //    first_seen_block / last_seen_block 갱신
    await upsertAgents(evidence, codeResults, ctx);

    // 3. services 테이블 upsert (payTo 주소)
    //    name/category는 unknown으로 시작, 운영자가 나중에 채워넣음
    await upsertServices(evidence, ctx);

    // 4. payments 테이블에 batch insert
    //    PK는 (transaction_hash, log_index) 복합키 — 멱등성 보장
    //    block_timestamp는 비정규화 (시계열 쿼리 속도 위함)
    //    amount_usd는 여기서 채우지 않음 (aggregate step에서 환산)
    await insertPayments(evidence, ctx);

    // 5. interactions 테이블 — function_selector 기반
    //    payments와 별개 — 결제 없는 호출도 추적 가능
    //    학습 프로젝트 1주차에서는 payments에 종속된 interaction만 기록
    await insertInteractions(evidence, ctx);
}

// agents 테이블에 없는 payer 주소만 추출
async function findNewPayers(
    evidence: X402Evidence[],
    ctx: PipelineContext,
): Promise<Address[]> {
    // 이미 agents에 있는 payer는 제외하고 신규 주소만 getBytecode 대상으로 남긴다.
    const uniquePayers = Array.from(new Set(evidence.map((item) => item.payer)));
    if (uniquePayers.length === 0) {
        return [];
    }

    const existing = await queryMany<{ address: Address }>(
        ctx.db,
        `SELECT address FROM agents WHERE address IN (${buildInClause(1, uniquePayers.length)})`,
        uniquePayers,
    );
    const existingSet = new Set(existing.map((row) => row.address));
    return uniquePayers.filter((payer) => !existingSet.has(payer));
}

// 신규 payer 주소들에 getCode 병렬 호출
// 결과: address → '0x' (EOA) | '0x...' (CA) 매핑
async function fetchCodeBatch(
    addresses: Address[],
    ctx: PipelineContext,
): Promise<Map<Address, string>> {
    // 신규 payer들의 on-chain code 유무를 병렬 조회해 EOA/CA를 판단한다.
    const results = await Promise.all(
        addresses.map(async (addr) => {
            const code = await ctx.rpc.getBytecode({ address: addr });
            return [addr, code ?? '0x'] as const;
        }),
    );
    return new Map(results);
}

// payer 주소를 agents 테이블에 upsert한다.
// backfill이 과거 블록을 나중에 처리해도 first_seen_block은 LEAST로 보존한다.
async function upsertAgents(
    evidence: X402Evidence[],
    codeResults: Map<Address, string>,
    ctx: PipelineContext,
): Promise<void> {
    // payer 주소별 first/last seen block과 contract 여부를 agents에 upsert
    const payerStats = new Map<Address, { first: bigint; last: bigint; isContract: boolean }>();
    for (const item of evidence) {
        const current = payerStats.get(item.payer);
        const isContract = (codeResults.get(item.payer) ?? '0x') !== '0x';
        if (!current) {
            payerStats.set(item.payer, {
                first: item.blockNumber,
                last: item.blockNumber,
                isContract,
            });
            continue;
        }
        current.first = current.first < item.blockNumber ? current.first : item.blockNumber;
        current.last = current.last > item.blockNumber ? current.last : item.blockNumber;
    }

    for (const [address, stats] of payerStats) {
        await ctx.db.query(
            `INSERT INTO agents (address, is_contract, first_seen_block, last_seen_block)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (address) DO UPDATE SET
               first_seen_block = LEAST(agents.first_seen_block, EXCLUDED.first_seen_block),
               last_seen_block = GREATEST(agents.last_seen_block, EXCLUDED.last_seen_block)`,
            [
                address,
                stats.isContract,
                toPgBigInt(stats.first),
                toPgBigInt(stats.last),
            ],
        );
    }
}

// 결제 수신처를 services 테이블에 등록한다.
// 이름/카테고리는 후속 enrichment 대상이므로 초기값은 NULL로 둔다.
async function upsertServices(
    evidence: X402Evidence[],
    ctx: PipelineContext,
): Promise<void> {
    // 결제 수신처(payTo)를 services registry에 최소 정보로 등록
    for (const service of new Set(evidence.map((item) => item.payTo))) {
        await ctx.db.query(
            `INSERT INTO services (address, name, category)
             VALUES ($1, NULL, NULL)
             ON CONFLICT (address) DO NOTHING`,
            [service],
        );
    }
}

// x402_evidence에서 확정 payment row를 만든다.
// evidence_id를 FK로 보존해 나중에 confidence/정책 근거를 역추적할 수 있게 한다.
async function insertPayments(
    evidence: X402Evidence[],
    ctx: PipelineContext,
): Promise<void> {
    // x402_evidence와 blocks를 조합해 payments row를 만든다.
    const pairClause = buildPairClause(
        'e.transaction_hash',
        'e.log_index',
        evidence.map((item) => [item.txHash, item.logIndex] as const),
    );
    const evidenceRows = await queryMany<{
        id: string;
        transaction_hash: string;
        log_index: number;
        block_number: string;
        timestamp: Date;
    }>(
        ctx.db,
        `SELECT e.id, e.transaction_hash, e.log_index, e.block_number, b.timestamp
         FROM x402_evidence e
         JOIN blocks b ON b.number = e.block_number
         WHERE ${pairClause.clause}`,
        pairClause.params,
    );

    const evidenceMap = new Map(
        evidenceRows.map((row) => [`${row.transaction_hash}:${row.log_index}`, row]),
    );

    for (const item of evidence) {
        const stored = evidenceMap.get(`${item.txHash}:${item.logIndex}`);
        if (!stored) continue;

        await ctx.db.query(
            `INSERT INTO payments (
               transaction_hash, log_index, evidence_id, block_number, block_timestamp, payer, pay_to, asset, amount, amount_usd
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL)
             ON CONFLICT (transaction_hash, log_index) DO UPDATE SET
               evidence_id = EXCLUDED.evidence_id,
               block_number = EXCLUDED.block_number,
               block_timestamp = EXCLUDED.block_timestamp,
               payer = EXCLUDED.payer,
               pay_to = EXCLUDED.pay_to,
               asset = EXCLUDED.asset,
               amount = EXCLUDED.amount`,
            [
                item.txHash,
                item.logIndex,
                stored.id,
                toPgBigInt(item.blockNumber),
                stored.timestamp,
                item.payer,
                item.payTo,
                item.asset,
                toPgNumeric(item.amount),
            ],
        );
    }
}

// payment tx를 interaction 관점으로도 저장한다.
// function_selector 기반 분석/서비스 분류를 가능하게 하는 보조 도메인 테이블이다.
async function insertInteractions(
    evidence: X402Evidence[],
    ctx: PipelineContext,
): Promise<void> {
    // payment에 연결된 tx input selector를 interaction 관점 데이터로 복제한다.
    if (evidence.length === 0) return;

    const rows = await queryMany<{
        hash: string;
        input: string | null;
        to_address: string | null;
        timestamp: Date;
    }>(
        ctx.db,
        `SELECT t.hash, t.input, t.to_address, b.timestamp
         FROM transactions t
         JOIN blocks b ON b.number = t.block_number
         WHERE t.hash IN (${buildInClause(1, evidence.length)})`,
        evidence.map((item) => item.txHash),
    );
    const txMap = new Map(rows.map((row) => [row.hash, row]));

    for (const item of evidence) {
        const tx = txMap.get(item.txHash);
        if (!tx) continue;
        const selector = tx.input?.slice(0, 10) ?? null;
        await ctx.db.query(
            `INSERT INTO interactions (
               transaction_hash, block_number, block_timestamp, agent_address, target_contract, function_selector
             ) VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (transaction_hash, agent_address, target_contract, function_selector) DO NOTHING`,
            [
                item.txHash,
                toPgBigInt(item.blockNumber),
                tx.timestamp,
                item.payer,
                tx.to_address,
                selector,
            ],
        );
    }
}
