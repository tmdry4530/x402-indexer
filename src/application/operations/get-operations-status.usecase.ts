import { Inject, Injectable } from '@nestjs/common';
import type { OperationsRepository } from '../../domain/operations/operations.repository.js';
import type { OverviewRepository } from '../../domain/overview/overview.repository.js';
import { OPERATIONS_REPOSITORY, OVERVIEW_REPOSITORY } from '../ports/tokens.js';

@Injectable()
export class GetOperationsStatusUseCase {
  constructor(
    @Inject(OVERVIEW_REPOSITORY) private readonly overview: OverviewRepository,
    @Inject(OPERATIONS_REPOSITORY) private readonly operations: OperationsRepository,
  ) {}

  public async execute(): Promise<unknown> {
    const [overview, checkpoints, jobs] = await Promise.all([
      this.overview.getOverview(),
      this.operations.listCheckpoints(),
      this.operations.listBackfillJobs({ limit: 5, offset: 0 }),
    ]);
    return {
      api_ok: true,
      overview,
      checkpoints,
      recent_backfill_jobs: jobs,
    };
  }
}
