import type { PaginationInput } from '../common/pagination.js';

export interface StatsRepository {
  listDailyStats(
    pagination: PaginationInput,
    filters: { agentAddress?: string; from?: string; to?: string },
  ): Promise<unknown[]>;
}
