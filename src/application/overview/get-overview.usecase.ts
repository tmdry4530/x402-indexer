import { Inject, Injectable } from '@nestjs/common';
import type { OverviewRepository } from '../../domain/overview/overview.repository.js';
import type { CachePort } from '../ports/cache.port.js';
import { DASHBOARD_CACHE, OVERVIEW_REPOSITORY } from '../ports/tokens.js';

@Injectable()
export class GetOverviewUseCase {
  constructor(
    @Inject(OVERVIEW_REPOSITORY) private readonly overview: OverviewRepository,
    @Inject(DASHBOARD_CACHE) private readonly cache: CachePort,
  ) {}

  public execute(): Promise<unknown> {
    return this.cache.readThrough('dashboard:overview', () => this.overview.getOverview());
  }
}
