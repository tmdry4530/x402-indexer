import type { Pool } from 'pg';
import { queryMany, queryOne } from '../../../db/helpers.js';

// API 목록 조회에서 공통으로 쓰는 offset pagination 입력.
// DB helper들은 limit/offset을 호출부에서 검증했다는 전제로 단순 쿼리만 수행한다.
export interface PaginationInput {
  limit: number;
  offset: number;
}

export async function getOverview(db: Pool): Promise<unknown> {
  // pg-mem은 SELECT 절의 scalar subquery/CROSS JOIN 일부를 실제 Postgres와 다르게 처리한다.
  // 대시보드 요약은 독립 집계이므로 작은 쿼리 여러 개로 나눠 테스트/운영 양쪽 호환성을 확보한다.
  const [payments, evidence, agents, services, stats, blocks] = await Promise.all([
    db.query('SELECT COUNT(*) AS count, COALESCE(SUM(amount_usd), 0) AS total_volume_usd FROM payments'),
    db.query('SELECT COUNT(*) AS count FROM x402_evidence'),
    db.query('SELECT COUNT(*) AS count FROM agents'),
    db.query('SELECT COUNT(*) AS count FROM services'),
    db.query(`SELECT COALESCE(SUM(total_gas_usd), 0) AS total_gas_usd,
                     COALESCE(SUM(total_revenue_usd), 0) AS total_revenue_usd,
                     COALESCE(SUM(total_revenue_usd) - SUM(total_spent_usd) - SUM(total_gas_usd), 0) AS net_roi_usd
              FROM agent_daily_stats`),
    db.query('SELECT COALESCE(MAX(number), 0) AS latest_indexed_block FROM blocks WHERE is_orphaned = false'),
  ]);

  const statsRow = stats.rows[0] ?? {};
  return {
    payments_count: Number(payments.rows[0]?.count ?? 0),
    evidence_count: Number(evidence.rows[0]?.count ?? 0),
    agents_count: Number(agents.rows[0]?.count ?? 0),
    services_count: Number(services.rows[0]?.count ?? 0),
    total_volume_usd: Number(payments.rows[0]?.total_volume_usd ?? 0),
    total_gas_usd: Number(statsRow.total_gas_usd ?? 0),
    total_revenue_usd: Number(statsRow.total_revenue_usd ?? 0),
    net_roi_usd: Number(statsRow.net_roi_usd ?? 0),
    latest_indexed_block: Number(blocks.rows[0]?.latest_indexed_block ?? 0),
  };
}

// payments 목록 조회.
// payer/payTo 필터를 동적으로 붙이고 최신 결제부터 페이징해 대시보드 리스트에 사용한다.
export async function listPayments(
  db: Pool,
  pagination: PaginationInput,
  filters: { payer?: string; payTo?: string },
): Promise<unknown[]> {
  // payments 목록 API용 조회.
  // payer/payTo 필터 + limit/offset 페이징을 단일 쿼리로 처리한다.
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters.payer) {
    params.push(filters.payer);
    clauses.push(`payer = $${params.length}`);
  }
  if (filters.payTo) {
    params.push(filters.payTo);
    clauses.push(`pay_to = $${params.length}`);
  }

  params.push(pagination.limit, pagination.offset);
  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  return queryMany(
    db,
    `SELECT transaction_hash, log_index, block_number, block_timestamp, payer, pay_to, asset, amount, amount_usd
     FROM payments
     ${where}
     ORDER BY block_timestamp DESC, transaction_hash DESC
     LIMIT $${params.length - 1}
     OFFSET $${params.length}`,
    params,
  );
}

export async function getPaymentDetail(
  db: Pool,
  txHash: string,
  logIndex: number,
): Promise<unknown | null> {
  return queryOne(
    db,
    `SELECT p.transaction_hash, p.log_index, p.block_number, p.block_timestamp,
            p.payer, p.pay_to, p.asset, p.amount, p.amount_usd,
            e.id AS evidence_id, e.detection_method, e.confidence,
            t.from_address AS submitter, t.to_address AS target_contract,
            t.input, t.status, t.gas_used, t.effective_gas_price
     FROM payments p
     JOIN x402_evidence e
       ON e.transaction_hash = p.transaction_hash AND e.log_index = p.log_index
     JOIN transactions t ON t.hash = p.transaction_hash
     WHERE p.transaction_hash = $1 AND p.log_index = $2`,
    [txHash, logIndex],
  );
}

export async function listAgents(
  db: Pool,
  pagination: PaginationInput,
): Promise<unknown[]> {
  return queryMany(
    db,
    `SELECT a.address, a.is_contract, a.first_seen_block, a.last_seen_block,
            COALESCE(SUM(s.total_spent_usd), 0) AS total_spent_usd,
            COALESCE(SUM(s.total_gas_usd), 0) AS total_gas_usd,
            COALESCE(SUM(s.total_revenue_usd), 0) AS total_revenue_usd,
            COALESCE(SUM(s.payment_count), 0) AS payment_count,
            COALESCE(MAX(s.unique_services), 0) AS unique_services,
            COALESCE(SUM(s.total_revenue_usd), 0) - COALESCE(SUM(s.total_spent_usd), 0) - COALESCE(SUM(s.total_gas_usd), 0) AS net_roi_usd
     FROM agents a
     LEFT JOIN agent_daily_stats s ON s.agent_address = a.address
     GROUP BY a.address, a.is_contract, a.first_seen_block, a.last_seen_block
     ORDER BY total_spent_usd DESC, payment_count DESC, a.address ASC
     LIMIT $1 OFFSET $2`,
    [pagination.limit, pagination.offset],
  );
}

// agent 상세 조회.
// agents 기본 정보와 일별 집계 누적값을 합쳐 total spent/gas/revenue/net ROI를 반환한다.
export async function getAgent(db: Pool, address: string): Promise<unknown | null> {
  // agent 단건 조회 + 누적 소비 지표를 함께 반환해 상세 화면에서 바로 쓸 수 있게 한다.
  return queryOne(
    db,
    `SELECT a.address, a.is_contract, a.first_seen_block, a.last_seen_block,
            COALESCE(SUM(s.total_spent_usd), 0) AS total_spent_usd,
            COALESCE(SUM(s.total_gas_usd), 0) AS total_gas_usd,
            COALESCE(SUM(s.total_revenue_usd), 0) AS total_revenue_usd,
            COALESCE(SUM(s.payment_count), 0) AS payment_count,
            COALESCE(SUM(s.total_revenue_usd), 0) - COALESCE(SUM(s.total_spent_usd), 0) - COALESCE(SUM(s.total_gas_usd), 0) AS net_roi_usd
     FROM agents a
     LEFT JOIN agent_daily_stats s ON s.agent_address = a.address
     WHERE a.address = $1
     GROUP BY a.address, a.is_contract, a.first_seen_block, a.last_seen_block`,
    [address],
  );
}

// 특정 agent의 일별 집계 시계열 조회.
// 상세 화면/차트에서 바로 사용할 수 있도록 최신 날짜부터 정렬한다.
export async function getAgentDailyStats(
  db: Pool,
  address: string,
): Promise<unknown[]> {
  // 특정 agent의 일별 집계 시계열 조회
  return queryMany(
    db,
    `SELECT *
     FROM agent_daily_stats
     WHERE agent_address = $1
     ORDER BY date DESC`,
    [address],
  );
}

export async function listServices(
  db: Pool,
  pagination: PaginationInput,
): Promise<unknown[]> {
  return queryMany(
    db,
    `SELECT s.address, s.name, s.category,
            COUNT(p.transaction_hash) AS payment_count,
            COALESCE(SUM(p.amount_usd), 0) AS total_amount_usd,
            COUNT(DISTINCT p.payer) AS unique_payers,
            MIN(p.block_number) AS first_seen_block,
            MAX(p.block_number) AS last_seen_block
     FROM services s
     LEFT JOIN payments p ON p.pay_to = s.address
     GROUP BY s.address, s.name, s.category
     ORDER BY total_amount_usd DESC, payment_count DESC, s.address ASC
     LIMIT $1 OFFSET $2`,
    [pagination.limit, pagination.offset],
  );
}

// service 상세 조회.
// services registry row에 해당 수신처로 들어온 payment 수/금액 요약을 결합한다.
export async function getService(db: Pool, address: string): Promise<unknown | null> {
  // 서비스 단건 조회 + 누적 결제 수/금액 요약
  return queryOne(
    db,
    `SELECT s.address, s.name, s.category,
            COUNT(p.transaction_hash) AS payment_count,
            COALESCE(SUM(p.amount_usd), 0) AS total_amount_usd
     FROM services s
     LEFT JOIN payments p ON p.pay_to = s.address
     WHERE s.address = $1
     GROUP BY s.address, s.name, s.category`,
    [address],
  );
}

export async function listEvidence(
  db: Pool,
  pagination: PaginationInput,
): Promise<unknown[]> {
  return queryMany(
    db,
    `SELECT e.id, e.transaction_hash, e.log_index, e.block_number,
            b.timestamp AS block_timestamp,
            e.detection_method, e.confidence, e.payer, e.pay_to, e.asset, e.amount,
            (p.transaction_hash IS NOT NULL) AS promoted
     FROM x402_evidence e
     JOIN blocks b ON b.number = e.block_number
     LEFT JOIN payments p
       ON p.transaction_hash = e.transaction_hash AND p.log_index = e.log_index
     ORDER BY e.block_number DESC, e.transaction_hash DESC, e.log_index DESC
     LIMIT $1 OFFSET $2`,
    [pagination.limit, pagination.offset],
  );
}

// interaction 목록 조회.
// agentAddress 필터를 선택적으로 적용해 agent별 호출 기록을 추적한다.
export async function listInteractions(
  db: Pool,
  pagination: PaginationInput,
  filters: { agentAddress?: string },
): Promise<unknown[]> {
  // interaction 목록 API용 조회. 필요시 agent 기준으로 범위를 좁힌다.
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filters.agentAddress) {
    params.push(filters.agentAddress);
    clauses.push(`agent_address = $${params.length}`);
  }
  params.push(pagination.limit, pagination.offset);
  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  return queryMany(
    db,
    `SELECT *
     FROM interactions
     ${where}
     ORDER BY block_timestamp DESC, id DESC
     LIMIT $${params.length - 1}
     OFFSET $${params.length}`,
    params,
  );
}

export async function listCheckpoints(db: Pool): Promise<unknown[]> {
  return queryMany(
    db,
    `SELECT worker_name, last_processed_block, last_processed_hash, status, updated_at
     FROM sync_checkpoints
     ORDER BY worker_name ASC`,
  );
}

export async function listBackfillJobs(
  db: Pool,
  pagination: PaginationInput,
): Promise<unknown[]> {
  return queryMany(
    db,
    `SELECT id, start_block, end_block, status, retry_count, error_message
     FROM backfill_jobs
     ORDER BY id DESC
     LIMIT $1 OFFSET $2`,
    [pagination.limit, pagination.offset],
  );
}

export async function listAddressRegistry(
  db: Pool,
  pagination: PaginationInput,
): Promise<unknown[]> {
  return queryMany(
    db,
    `SELECT address, type, name, valid_from_block, valid_to_block
     FROM address_registry
     ORDER BY type ASC, name ASC, address ASC
     LIMIT $1 OFFSET $2`,
    [pagination.limit, pagination.offset],
  );
}

// agent_daily_stats 목록 조회.
// agent/date range 필터와 pagination을 조합해 대시보드 테이블/차트를 지원한다.
export async function listDailyStats(
  db: Pool,
  pagination: PaginationInput,
  filters: { agentAddress?: string; from?: string; to?: string },
): Promise<unknown[]> {
  // daily stats 목록 API용 조회. agent + 날짜 범위 필터를 지원한다.
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filters.agentAddress) {
    params.push(filters.agentAddress);
    clauses.push(`agent_address = $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    clauses.push(`date >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    clauses.push(`date <= $${params.length}`);
  }

  params.push(pagination.limit, pagination.offset);
  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  return queryMany(
    db,
    `SELECT *
     FROM agent_daily_stats
     ${where}
     ORDER BY date DESC, agent_address ASC
     LIMIT $${params.length - 1}
     OFFSET $${params.length}`,
    params,
  );
}
