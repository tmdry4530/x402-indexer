export const API_ROUTES = {
  health: 'health',
  overview: 'overview',
  payments: {
    list: 'payments',
    detail: 'payments/:txHash/:logIndex',
  },
  agents: {
    list: 'agents',
    detail: 'agents/:address',
    stats: 'agents/:address/stats',
  },
  services: {
    list: 'services',
    detail: 'services/:address',
  },
  evidence: 'evidence',
  interactions: 'interactions',
  dailyStats: 'stats/daily',
  operations: {
    status: 'operations/status',
    checkpoints: 'operations/checkpoints',
    backfillJobs: 'operations/backfill-jobs',
    addressRegistry: 'operations/address-registry',
  },
  backfill: {
    enqueue: 'jobs/backfill',
  },
  ui: {
    root: '',
    redirect: 'ui',
    target: '/ui/',
  },
} as const;
