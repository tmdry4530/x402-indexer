import { Inject, Injectable } from '@nestjs/common';
import type { StatsRepository } from '../../domain/stats/stats.repository.js';
import type { CachePort } from '../ports/cache.port.js';
import { DASHBOARD_CACHE, STATS_REPOSITORY } from '../ports/tokens.js';

export interface ListDailyStatsInput {
  limit: number;
  offset: number;
  agentAddress?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class ListDailyStatsUseCase {
  constructor(
    @Inject(STATS_REPOSITORY) private readonly stats: StatsRepository,
    @Inject(DASHBOARD_CACHE) private readonly cache: CachePort,
  ) {}

  public execute(input: ListDailyStatsInput): Promise<unknown[]> {
    return this.cache.readThrough(`dashboard:daily-stats:${JSON.stringify(input)}`, () =>
      this.stats.listDailyStats(input, {
        agentAddress: input.agentAddress,
        from: input.from,
        to: input.to,
      }),
    );
  }
}
