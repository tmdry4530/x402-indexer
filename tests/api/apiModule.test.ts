import type { Pool } from 'pg';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgentsController } from '../../src/api/agents/agents.controller.js';
import { BackfillController } from '../../src/api/backfill/backfill.controller.js';
import { EvidenceController } from '../../src/api/evidence/evidence.controller.js';
import { HealthController } from '../../src/api/health/health.controller.js';
import { InteractionsController } from '../../src/api/interactions/interactions.controller.js';
import { OperationsController } from '../../src/api/operations/operations.controller.js';
import { OverviewController } from '../../src/api/overview/overview.controller.js';
import { PaymentsController } from '../../src/api/payments/payments.controller.js';
import { ServiceCatalogController } from '../../src/api/service-catalog/service-catalog.controller.js';
import { StatsController } from '../../src/api/stats/stats.controller.js';
import { UiController } from '../../src/api/ui/ui.controller.js';
import { createApp, type ApiModuleDependencies } from '../../src/api/app.js';
import { GetAgentUseCase } from '../../src/application/agent/get-agent.usecase.js';
import { ListAgentStatsUseCase } from '../../src/application/agent/list-agent-stats.usecase.js';
import { ListAgentsUseCase } from '../../src/application/agent/list-agents.usecase.js';
import { EnqueueBackfillUseCase } from '../../src/application/backfill/enqueue-backfill.usecase.js';
import { ListEvidenceUseCase } from '../../src/application/evidence/list-evidence.usecase.js';
import { ListInteractionsUseCase } from '../../src/application/interaction/list-interactions.usecase.js';
import { GetOperationsStatusUseCase } from '../../src/application/operations/get-operations-status.usecase.js';
import { ListAddressRegistryUseCase } from '../../src/application/operations/list-address-registry.usecase.js';
import { ListBackfillJobsUseCase } from '../../src/application/operations/list-backfill-jobs.usecase.js';
import { ListCheckpointsUseCase } from '../../src/application/operations/list-checkpoints.usecase.js';
import { GetOverviewUseCase } from '../../src/application/overview/get-overview.usecase.js';
import { GetPaymentDetailUseCase } from '../../src/application/payment/get-payment-detail.usecase.js';
import { ListPaymentsUseCase } from '../../src/application/payment/list-payments.usecase.js';
import {
  AGENT_REPOSITORY,
  BACKFILL_QUEUE,
  DASHBOARD_CACHE,
  EVIDENCE_REPOSITORY,
  INTERACTION_REPOSITORY,
  OPERATIONS_REPOSITORY,
  OVERVIEW_REPOSITORY,
  PAYMENT_REPOSITORY,
  SERVICE_CATALOG_REPOSITORY,
  STATS_REPOSITORY,
} from '../../src/application/ports/tokens.js';
import { GetServiceUseCase } from '../../src/application/service-catalog/get-service.usecase.js';
import { ListServicesUseCase } from '../../src/application/service-catalog/list-services.usecase.js';
import { ListDailyStatsUseCase } from '../../src/application/stats/list-daily-stats.usecase.js';
import { RedisDashboardCacheAdapter } from '../../src/infrastructure/cache/redis-dashboard-cache.adapter.js';
import { PostgresAgentRepository } from '../../src/infrastructure/db/postgres/postgres-agent.repository.js';
import { PostgresEvidenceRepository } from '../../src/infrastructure/db/postgres/postgres-evidence.repository.js';
import { PostgresInteractionRepository } from '../../src/infrastructure/db/postgres/postgres-interaction.repository.js';
import { PostgresOperationsRepository } from '../../src/infrastructure/db/postgres/postgres-operations.repository.js';
import { PostgresOverviewRepository } from '../../src/infrastructure/db/postgres/postgres-overview.repository.js';
import { PostgresPaymentRepository } from '../../src/infrastructure/db/postgres/postgres-payment.repository.js';
import { PostgresServiceCatalogRepository } from '../../src/infrastructure/db/postgres/postgres-service-catalog.repository.js';
import { PostgresStatsRepository } from '../../src/infrastructure/db/postgres/postgres-stats.repository.js';
import { BackfillQueueAdapter } from '../../src/infrastructure/queue/backfill-queue.adapter.js';

const controllers = [
  HealthController,
  OverviewController,
  PaymentsController,
  AgentsController,
  ServiceCatalogController,
  EvidenceController,
  InteractionsController,
  StatsController,
  OperationsController,
  BackfillController,
  UiController,
];

const useCases = [
  GetOverviewUseCase,
  ListPaymentsUseCase,
  GetPaymentDetailUseCase,
  ListAgentsUseCase,
  GetAgentUseCase,
  ListAgentStatsUseCase,
  ListServicesUseCase,
  GetServiceUseCase,
  ListEvidenceUseCase,
  ListInteractionsUseCase,
  ListDailyStatsUseCase,
  GetOperationsStatusUseCase,
  ListCheckpointsUseCase,
  ListBackfillJobsUseCase,
  ListAddressRegistryUseCase,
  EnqueueBackfillUseCase,
];

const repositoryProviders = [
  [OVERVIEW_REPOSITORY, PostgresOverviewRepository],
  [PAYMENT_REPOSITORY, PostgresPaymentRepository],
  [AGENT_REPOSITORY, PostgresAgentRepository],
  [SERVICE_CATALOG_REPOSITORY, PostgresServiceCatalogRepository],
  [EVIDENCE_REPOSITORY, PostgresEvidenceRepository],
  [INTERACTION_REPOSITORY, PostgresInteractionRepository],
  [STATS_REPOSITORY, PostgresStatsRepository],
  [OPERATIONS_REPOSITORY, PostgresOperationsRepository],
] as const;

function createDependencies(
  overrides: Partial<ApiModuleDependencies> = {},
): ApiModuleDependencies {
  return {
    db: { query: vi.fn() } as unknown as Pool,
    ...overrides,
  };
}

async function createModuleApp(
  deps: ApiModuleDependencies = createDependencies(),
): Promise<NestExpressApplication> {
  return createApp(deps, { logger: false, staticAssets: false });
}

describe('ApiModule wiring', () => {
  let app: NestExpressApplication | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
    vi.restoreAllMocks();
  });

  it('resolves every API controller and application use case from the Nest container', async () => {
    app = await createModuleApp();

    for (const controller of controllers) {
      expect(app.get(controller)).toBeInstanceOf(controller);
    }

    for (const useCase of useCases) {
      expect(app.get(useCase)).toBeInstanceOf(useCase);
    }
  });

  it('binds domain repository tokens to Postgres adapters', async () => {
    app = await createModuleApp();

    for (const [token, adapter] of repositoryProviders) {
      expect(app.get(token)).toBeInstanceOf(adapter);
    }
  });

  it('binds runtime dependency tokens to cache and backfill queue adapters', async () => {
    const redis = {
      get: vi.fn(async () => null),
      setex: vi.fn(async () => 'OK'),
    };
    const enqueueBackfill = vi.fn(async () => undefined);
    app = await createModuleApp(createDependencies({ redis, enqueueBackfill }));

    expect(app.get(DASHBOARD_CACHE)).toBeInstanceOf(RedisDashboardCacheAdapter);
    expect(app.get(BACKFILL_QUEUE)).toBeInstanceOf(BackfillQueueAdapter);

    await app.get(DASHBOARD_CACHE).readThrough('module-test', async () => ({ ok: true }));
    expect(redis.get).toHaveBeenCalledWith('module-test');
    expect(redis.setex).toHaveBeenCalledWith('module-test', 30, JSON.stringify({ ok: true }));

    await app.get(EnqueueBackfillUseCase).execute({ startBlock: 1n, endBlock: 2n });
    expect(enqueueBackfill).toHaveBeenCalledWith({ startBlock: 1n, endBlock: 2n });
  });
});
