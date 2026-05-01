import type { Pool } from 'pg';
import { listDailyStats } from './dashboard-queries.js';
import type { PaginationInput } from '../../../domain/common/pagination.js';
import type { StatsRepository } from '../../../domain/stats/stats.repository.js';

export class PostgresStatsRepository implements StatsRepository {
  constructor(private readonly db: Pool) {}

  public listDailyStats(
    pagination: PaginationInput,
    filters: { agentAddress?: string; from?: string; to?: string },
  ): Promise<unknown[]> {
    return listDailyStats(this.db, pagination, filters);
  }
}
