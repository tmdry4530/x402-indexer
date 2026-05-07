import { DynamicModule, Module } from '@nestjs/common';
import { GetAgentUseCase } from '../application/agent/get-agent.usecase.js';
import { ListAgentStatsUseCase } from '../application/agent/list-agent-stats.usecase.js';
import { ListAgentsUseCase } from '../application/agent/list-agents.usecase.js';
import { EnqueueBackfillUseCase } from '../application/backfill/enqueue-backfill.usecase.js';
import { ListEvidenceUseCase } from '../application/evidence/list-evidence.usecase.js';
import { ListInteractionsUseCase } from '../application/interaction/list-interactions.usecase.js';
import { GetOperationsStatusUseCase } from '../application/operations/get-operations-status.usecase.js';
import { ListAddressRegistryUseCase } from '../application/operations/list-address-registry.usecase.js';
import { ListBackfillJobsUseCase } from '../application/operations/list-backfill-jobs.usecase.js';
import { ListCheckpointsUseCase } from '../application/operations/list-checkpoints.usecase.js';
import { GetOverviewUseCase } from '../application/overview/get-overview.usecase.js';
import { GetPaymentDetailUseCase } from '../application/payment/get-payment-detail.usecase.js';
import { ListPaymentsUseCase } from '../application/payment/list-payments.usecase.js';
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
} from '../application/ports/tokens.js';
import { GetServiceUseCase } from '../application/service-catalog/get-service.usecase.js';
import { ListServicesUseCase } from '../application/service-catalog/list-services.usecase.js';
import { ListDailyStatsUseCase } from '../application/stats/list-daily-stats.usecase.js';
import { RedisDashboardCacheAdapter } from '../infrastructure/cache/redis-dashboard-cache.adapter.js';
import { PostgresAgentRepository } from '../infrastructure/db/postgres/postgres-agent.repository.js';
import { PostgresEvidenceRepository } from '../infrastructure/db/postgres/postgres-evidence.repository.js';
import { PostgresInteractionRepository } from '../infrastructure/db/postgres/postgres-interaction.repository.js';
import { PostgresOperationsRepository } from '../infrastructure/db/postgres/postgres-operations.repository.js';
import { PostgresOverviewRepository } from '../infrastructure/db/postgres/postgres-overview.repository.js';
import { PostgresPaymentRepository } from '../infrastructure/db/postgres/postgres-payment.repository.js';
import { PostgresServiceCatalogRepository } from '../infrastructure/db/postgres/postgres-service-catalog.repository.js';
import { PostgresStatsRepository } from '../infrastructure/db/postgres/postgres-stats.repository.js';
import { BackfillQueueAdapter } from '../infrastructure/queue/backfill-queue.adapter.js';
import { AgentsController } from './agents/agents.controller.js';
import { BackfillController } from './backfill/backfill.controller.js';
import type { ApiModuleDependencies } from '../runtime/api-dependencies.js';
import { EvidenceController } from './evidence/evidence.controller.js';
import { HealthController } from './health/health.controller.js';
import { InteractionsController } from './interactions/interactions.controller.js';
import { OperationsController } from './operations/operations.controller.js';
import { OverviewController } from './overview/overview.controller.js';
import { PaymentsController } from './payments/payments.controller.js';
import { ServiceCatalogController } from './service-catalog/service-catalog.controller.js';
import { StatsController } from './stats/stats.controller.js';
import { UiController } from './ui/ui.controller.js';

// Nest module is now composition root only: interface controllers depend on
// application use cases, while infrastructure adapters satisfy domain ports.
@Module({})
export class ApiModule {
  public static register(deps: ApiModuleDependencies): DynamicModule {
    return {
      module: ApiModule,
      controllers: [
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
      ],
      providers: [
        {
          provide: DASHBOARD_CACHE,
          useFactory: () => new RedisDashboardCacheAdapter(deps.redis),
        },
        {
          provide: BACKFILL_QUEUE,
          useFactory: () => new BackfillQueueAdapter(deps.enqueueBackfill),
        },
        {
          provide: OVERVIEW_REPOSITORY,
          useFactory: () => new PostgresOverviewRepository(deps.db),
        },
        {
          provide: PAYMENT_REPOSITORY,
          useFactory: () => new PostgresPaymentRepository(deps.db),
        },
        {
          provide: AGENT_REPOSITORY,
          useFactory: () => new PostgresAgentRepository(deps.db),
        },
        {
          provide: SERVICE_CATALOG_REPOSITORY,
          useFactory: () => new PostgresServiceCatalogRepository(deps.db),
        },
        {
          provide: EVIDENCE_REPOSITORY,
          useFactory: () => new PostgresEvidenceRepository(deps.db),
        },
        {
          provide: INTERACTION_REPOSITORY,
          useFactory: () => new PostgresInteractionRepository(deps.db),
        },
        {
          provide: STATS_REPOSITORY,
          useFactory: () => new PostgresStatsRepository(deps.db),
        },
        {
          provide: OPERATIONS_REPOSITORY,
          useFactory: () => new PostgresOperationsRepository(deps.db),
        },
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
      ],
    };
  }
}
