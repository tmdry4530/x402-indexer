// 실제 API 데이터를 UI가 쓰는 화면 모델로 정규화한다.
// API가 일시적으로 실패해도 가짜 결제 데이터를 보여주지 않고 빈 상태 + 오류 배너를 표시한다.

const EMPTY_DATA = {
  chain: { name: 'Base 메인넷', chainId: 8453 },
  sync: {
    latestBlock: 0,
    rpcLatest: 0,
    lag: 0,
    realtimeOn: false,
    backfillOn: false,
    realtimeStatus: 'missing',
    backfillStatus: 'missing',
    lastCheckpointAgo: null,
    lastCheckpointAgeSeconds: null,
  },
  overview: {
    payments_count: 0,
    evidence_count: 0,
    promotion_rate: 0,
    total_volume_usd: 0,
    total_gas_usd: 0,
    total_revenue_usd: 0,
    net_roi_usd: 0,
    agents_count: 0,
    services_count: 0,
    latest_indexed_block: 0,
  },
  daily: [],
  assets: {
    '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
      symbol: 'USDC',
      name: 'Base USDC',
      decimals: 6,
      type: 'asset',
    },
  },
  facilitators: [],
  agents: [],
  services: [],
  payments: [],
  evidence: [],
  interactions: [],
  checkpoints: [],
  backfillJobs: [],
  addressRegistry: [],
  settings: {
    chain: 'Base 메인넷',
    chainId: 8453,
    confidenceThreshold: 70,
    facilitatorFilterMode: 'soft',
    finalityLag: 10,
    maxReorgDepth: 20,
    knownAssetsCount: 0,
    knownFacilitatorsCount: 0,
    knownProxiesCount: 0,
    facilitatorSourceUrl: 'https://facilitators.x402.watch/',
    facilitatorSourceEnabled: true,
    rpcHost: 'mainnet.base.org',
    rpcKeyMasked: true,
    fallbackRpcCount: 0,
    dbUrlMasked: 'postgres://****@localhost/x402_indexer',
    redisUrlMasked: 'redis://****@localhost:6379',
  },
  meta: {
    source: 'empty',
    loadedAt: null,
    error: null,
    opsHealth: 'worker_attention',
    opsMessage: '체크포인트 데이터가 아직 없습니다.',
  },
};

function num(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function int(value, fallback = 0) {
  return Math.trunc(num(value, fallback));
}

function iso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value) {
  const d = iso(value);
  if (!d) return '시간 없음';
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(d) + ' UTC';
}

function formatDay(value) {
  const d = iso(value) || new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return String(value ?? '날짜 없음');
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(d);
}

function secondsSince(value) {
  const d = iso(value);
  if (!d) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
}

function durationFromNow(value) {
  const sec = secondsSince(value);
  if (sec === null) return '알 수 없음';
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

function normalizeAddressRegistry(rows) {
  return rows.map((row) => ({
    address: row.address,
    type: row.type,
    name: row.name,
    validFromBlock: row.valid_from_block ? int(row.valid_from_block) : null,
    validToBlock: row.valid_to_block ? int(row.valid_to_block) : null,
  }));
}

function normalizeOverview(row) {
  const payments = int(row?.payments_count);
  const evidence = int(row?.evidence_count);
  return {
    payments_count: payments,
    evidence_count: evidence,
    promotion_rate: evidence > 0 ? payments / evidence : 0,
    total_volume_usd: num(row?.total_volume_usd),
    total_gas_usd: num(row?.total_gas_usd),
    total_revenue_usd: num(row?.total_revenue_usd),
    net_roi_usd: num(row?.net_roi_usd),
    agents_count: int(row?.agents_count),
    services_count: int(row?.services_count),
    latest_indexed_block: int(row?.latest_indexed_block),
  };
}

function methodDisplayName(method, selector) {
  if (method === 'eip3009_direct' || selector === '0xe3ee160e') return 'transferWithAuthorization';
  if (method === 'permit2' || selector === '0x30f28b7a') return 'permitTransferFrom';
  return method || selector || 'unknown';
}

function normalizeEvidence(rows) {
  return rows.map((row) => ({
    id: String(row.id ?? `${row.transaction_hash}:${row.log_index}`),
    ts: row.block_timestamp,
    date: formatDate(row.block_timestamp),
    tx: row.transaction_hash,
    logIndex: int(row.log_index),
    block: int(row.block_number),
    method: row.detection_method,
    confidence: int(row.confidence),
    promoted: Boolean(row.promoted),
    payer: row.payer,
    payTo: row.pay_to,
    amount: num(row.amount),
    amountUsd: null,
    asset: row.asset,
    facilitatorMatched: false,
    authorizationUsed: int(row.confidence) >= 30,
    calldataMatches: int(row.confidence) >= 70,
    txSuccess: true,
    selector: row.detection_method === 'eip3009_direct' ? '0xe3ee160e' : null,
    functionName: methodDisplayName(row.detection_method, row.detection_method === 'eip3009_direct' ? '0xe3ee160e' : null),
  }));
}

function normalizePayments(rows, evidenceRows) {
  const evidenceByKey = new Map(evidenceRows.map((e) => [`${e.tx}:${e.logIndex}`, e]));
  return rows.map((row) => {
    const key = `${row.transaction_hash}:${row.log_index}`;
    const ev = evidenceByKey.get(key);
    return {
      id: key,
      ts: row.block_timestamp,
      date: formatDate(row.block_timestamp),
      relative: durationFromNow(row.block_timestamp),
      tx: row.transaction_hash,
      block: int(row.block_number),
      logIndex: int(row.log_index),
      payer: row.payer,
      payTo: row.pay_to,
      asset: row.asset,
      amount: num(row.amount),
      amountUsd: num(row.amount_usd),
      gasUsed: 0,
      gasPriceGwei: 0,
      gasUsd: 0,
      confidence: ev?.confidence ?? 0,
      method: ev?.method ?? 'unknown',
      facilitatorMatched: ev?.facilitatorMatched ?? false,
      authorizationUsed: ev?.authorizationUsed ?? false,
      calldataMatches: ev?.calldataMatches ?? false,
      txSuccess: ev?.txSuccess ?? true,
      submitter: row.payer,
      selector: ev?.selector ?? '0xe3ee160e',
      functionName: ev?.functionName ?? methodDisplayName(ev?.method, ev?.selector),
    };
  });
}

function normalizeAgents(rows) {
  return rows.map((row) => ({
    address: row.address,
    kind: row.is_contract ? '컨트랙트' : 'EOA',
    payments: int(row.payment_count),
    spent: num(row.total_spent_usd),
    gas: num(row.total_gas_usd),
    revenue: num(row.total_revenue_usd),
    services: int(row.unique_services),
    firstSeen: int(row.first_seen_block),
    lastSeen: int(row.last_seen_block),
    netRoi: num(row.net_roi_usd),
  }));
}

function normalizeServices(rows) {
  return rows.map((row) => ({
    address: row.address,
    name: row.name,
    category: row.category,
    payments: int(row.payment_count),
    received: num(row.total_amount_usd),
    payers: int(row.unique_payers),
    firstSeen: int(row.first_seen_block),
    lastSeen: int(row.last_seen_block),
  }));
}

function normalizeInteractions(rows) {
  return rows.map((row) => ({
    ts: formatDate(row.block_timestamp),
    tx: row.transaction_hash,
    agent: row.agent_address,
    target: row.target_contract,
    selector: row.function_selector,
    fn: methodDisplayName(null, row.function_selector),
    block: int(row.block_number),
  }));
}

function normalizeDaily(rows) {
  const byDate = new Map();
  for (const row of rows) {
    const key = formatDay(row.date);
    const current = byDate.get(key) ?? { date: key, volume: 0, gas: 0, revenue: 0, payments: 0 };
    current.volume += num(row.total_spent_usd);
    current.gas += num(row.total_gas_usd);
    current.revenue += num(row.total_revenue_usd);
    current.payments += int(row.payment_count);
    byDate.set(key, current);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function normalizeCheckpoints(rows) {
  return rows.map((row) => ({
    worker: row.worker_name,
    lastBlock: int(row.last_processed_block),
    lastHash: row.last_processed_hash,
    status: row.status,
    updatedAt: durationFromNow(row.updated_at),
    updatedAtRaw: row.updated_at,
    ageSeconds: secondsSince(row.updated_at),
  }));
}

function normalizeBackfillJobs(rows) {
  return rows.map((row) => ({
    id: int(row.id),
    range: [int(row.start_block), int(row.end_block)],
    status: row.status,
    retry: int(row.retry_count),
    error: row.error_message,
    startedAt: '기록됨',
    duration: row.status === 'running' ? '진행 중' : '—',
  }));
}

function deriveOpsHealth({ checkpoints, backfillJobs, lag, finalityLag }) {
  const blockingStatuses = new Set(['failed', 'pending_manual', 'reorged']);
  const blockingJob = backfillJobs.find((job) => blockingStatuses.has(job.status));
  if (blockingJob) {
    return {
      opsHealth: 'backfill_stuck',
      opsMessage: `백필 작업 #${blockingJob.id}이 ${blockingJob.status} 상태입니다.`,
    };
  }

  const blockingCheckpoint = checkpoints.find((row) => blockingStatuses.has(row.status));
  if (blockingCheckpoint) {
    return {
      opsHealth: 'worker_attention',
      opsMessage: `${blockingCheckpoint.worker} 체크포인트가 ${blockingCheckpoint.status} 상태입니다.`,
    };
  }

  if (lag > finalityLag) {
    return {
      opsHealth: 'rpc_lag',
      opsMessage: `인덱싱 지연이 finality 기준보다 큽니다: ${fmt.num(lag)} 블록.`,
    };
  }

  const ages = checkpoints.map((row) => row.ageSeconds).filter((age) => age !== null && age !== undefined);
  const newestAge = ages.length > 0 ? Math.min(...ages) : null;
  const realtime = checkpoints.find((row) => row.worker.includes('realtime'));
  const backfill = checkpoints.find((row) => row.worker.includes('backfill'));

  if (checkpoints.length === 0 || !realtime) {
    return {
      opsHealth: 'worker_attention',
      opsMessage: '실시간 워커 체크포인트가 없습니다. ENABLE_REALTIME_WORKER 상태를 확인하세요.',
    };
  }

  if (newestAge !== null && newestAge > 60 * 60) {
    return {
      opsHealth: 'worker_attention',
      opsMessage: `가장 최근 체크포인트가 ${durationFromNow(checkpoints.find((row) => row.ageSeconds === newestAge)?.updatedAtRaw)}에 멈춰 있습니다.`,
    };
  }

  return {
    opsHealth: 'healthy',
    opsMessage: backfill
      ? '체크포인트와 백필 작업 상태가 정상 범위입니다.'
      : '실시간 체크포인트는 정상이며 백필 체크포인트는 아직 없습니다.',
  };
}

async function api(path, fallback = null) {
  const response = await fetch(path, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`${path} 요청 실패 (${response.status})`);
  }
  const payload = await response.json();
  return payload.data ?? fallback;
}

async function loadLiveData() {
  const [
    overviewRaw,
    paymentsRaw,
    agentsRaw,
    servicesRaw,
    interactionsRaw,
    evidenceRaw,
    dailyRaw,
    checkpointsRaw,
    jobsRaw,
    registryRaw,
  ] = await Promise.all([
    api('/overview', {}),
    api('/payments?limit=100', []),
    api('/agents?limit=100', []),
    api('/services?limit=100', []),
    api('/interactions?limit=100', []),
    api('/evidence?limit=100', []),
    api('/stats/daily?limit=100', []),
    api('/operations/checkpoints', []),
    api('/operations/backfill-jobs?limit=100', []),
    api('/operations/address-registry?limit=100', []),
  ]);

  const overview = normalizeOverview(overviewRaw);
  const evidence = normalizeEvidence(evidenceRaw);
  const payments = normalizePayments(paymentsRaw, evidence);
  const agents = normalizeAgents(agentsRaw);
  const services = normalizeServices(servicesRaw);
  const interactions = normalizeInteractions(interactionsRaw);
  const checkpoints = normalizeCheckpoints(checkpointsRaw);
  const backfillJobs = normalizeBackfillJobs(jobsRaw);
  const addressRegistry = normalizeAddressRegistry(registryRaw);
  const assets = addressRegistry.filter((row) => row.type === 'asset');
  const facilitators = addressRegistry.filter((row) => row.type === 'facilitator').map((row) => row.address);
  const proxies = addressRegistry.filter((row) => row.type === 'proxy');
  const latestIndexed = overview.latest_indexed_block || Math.max(0, ...checkpoints.map((row) => row.lastBlock));
  const lag = 0;
  const realtimeCheckpoint = checkpoints.find((row) => row.worker.includes('realtime'));
  const backfillCheckpoint = checkpoints.find((row) => row.worker.includes('backfill'));
  const ages = checkpoints.map((row) => row.ageSeconds).filter((age) => age !== null && age !== undefined);
  const newestAge = ages.length > 0 ? Math.min(...ages) : null;
  const ops = deriveOpsHealth({ checkpoints, backfillJobs, lag, finalityLag: EMPTY_DATA.settings.finalityLag });

  return {
    ...EMPTY_DATA,
    overview,
    payments,
    agents,
    services,
    evidence,
    interactions,
    daily: normalizeDaily(dailyRaw),
    checkpoints,
    backfillJobs,
    addressRegistry,
    facilitators,
    sync: {
      latestBlock: latestIndexed,
      rpcLatest: latestIndexed,
      lag,
      realtimeOn: Boolean(realtimeCheckpoint),
      backfillOn: Boolean(backfillCheckpoint),
      realtimeStatus: realtimeCheckpoint?.status ?? 'missing',
      backfillStatus: backfillCheckpoint?.status ?? 'missing',
      lastCheckpointAgo: newestAge === null ? null : durationFromNow(checkpoints.find((row) => row.ageSeconds === newestAge)?.updatedAtRaw),
      lastCheckpointAgeSeconds: newestAge,
    },
    settings: {
      ...EMPTY_DATA.settings,
      knownAssetsCount: assets.length,
      knownFacilitatorsCount: facilitators.length,
      knownProxiesCount: proxies.length,
    },
    meta: {
      source: 'api',
      loadedAt: new Date().toISOString(),
      error: null,
      opsHealth: ops.opsHealth,
      opsMessage: ops.opsMessage,
    },
  };
}

async function loadPaymentDetail(payment) {
  if (!payment?.tx || payment.logIndex === undefined || payment.logIndex === null) return payment;
  const raw = await api(`/payments/${payment.tx}/${payment.logIndex}`, null);
  if (!raw) return payment;
  const selector = typeof raw.input === 'string' && raw.input.length >= 10 ? raw.input.slice(0, 10) : payment.selector;
  const gasUsed = int(raw.gas_used, payment.gasUsed);
  const gasPriceWei = num(raw.effective_gas_price, 0);
  const facilitatorMatched = Boolean(raw.submitter && window.MOCK?.facilitators?.some((address) => address?.toLowerCase?.() === raw.submitter.toLowerCase?.()));
  return {
    ...payment,
    ts: raw.block_timestamp ?? payment.ts,
    date: formatDate(raw.block_timestamp ?? payment.ts),
    block: int(raw.block_number, payment.block),
    payer: raw.payer ?? payment.payer,
    payTo: raw.pay_to ?? payment.payTo,
    asset: raw.asset ?? payment.asset,
    amount: num(raw.amount, payment.amount),
    amountUsd: num(raw.amount_usd, payment.amountUsd),
    confidence: int(raw.confidence, payment.confidence),
    method: raw.detection_method ?? payment.method,
    submitter: raw.submitter ?? payment.submitter,
    targetContract: raw.target_contract,
    selector,
    functionName: methodDisplayName(raw.detection_method ?? payment.method, selector),
    gasUsed,
    gasPriceGwei: gasPriceWei / 1_000_000_000,
    gasUsd: payment.gasUsd ?? 0,
    txSuccess: raw.status === undefined || raw.status === null ? payment.txSuccess : Number(raw.status) === 1,
    authorizationUsed: int(raw.confidence, payment.confidence) >= 90 || payment.authorizationUsed,
    calldataMatches: int(raw.confidence, payment.confidence) >= 70 || payment.calldataMatches,
    facilitatorMatched,
  };
}

function translateApiError(message) {
  if (!message) return null;
  if (message.includes('Backfill worker is not available') || message.includes('백필 워커가 비활성화')) return '백필 워커가 비활성화되어 있습니다. ENABLE_BACKFILL_WORKER=true로 실행해야 큐에 넣을 수 있습니다.';
  if (message.includes('startBlock must be <= endBlock') || message.includes('startBlock은 endBlock')) return '시작 블록은 종료 블록보다 작거나 같아야 합니다.';
  return message;
}

async function postBackfill(startBlock, endBlock) {
  const response = await fetch('/jobs/backfill', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ startBlock: String(startBlock), endBlock: String(endBlock) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(translateApiError(payload.error) || `백필 요청 실패 (${response.status})`);
  }
  return payload.data;
}

window.EMPTY_DATA = EMPTY_DATA;
window.MOCK = EMPTY_DATA;
window.loadLiveData = loadLiveData;
window.loadPaymentDetail = loadPaymentDetail;
window.postBackfill = postBackfill;

window.fmt = {
  addr: (a, len = 6) => a ? `${a.slice(0, len)}…${a.slice(-4)}` : '',
  hash: (h, len = 6) => h ? `${h.slice(0, len)}…${h.slice(-6)}` : '',
  usdc: (raw, decimals = 6) => (num(raw) / Math.pow(10, decimals)).toFixed(6) + ' USDC',
  usd: (v) => {
    const value = num(v);
    if (value === 0) return '$0.000000';
    if (Math.abs(value) < 0.000001) return '< $0.000001';
    if (Math.abs(value) < 0.01) return '$' + value.toFixed(6);
    return '$' + value.toFixed(2);
  },
  num: (n) => num(n).toLocaleString('ko-KR'),
  block: (n) => '#' + num(n).toLocaleString('ko-KR'),
  date: formatDate,
};
