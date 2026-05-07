import type { Pool } from 'pg';
import { getOverview } from './dashboard-queries.js';
import type { OverviewRepository } from '../../../domain/overview/overview.repository.js';

export class PostgresOverviewRepository implements OverviewRepository {
  constructor(private readonly db: Pool) {}

  public getOverview(): Promise<unknown> {
    return getOverview(this.db);
  }
}
