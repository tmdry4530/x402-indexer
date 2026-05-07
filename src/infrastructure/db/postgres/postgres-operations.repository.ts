import type { Pool } from 'pg';
import {
  listAddressRegistry,
  listBackfillJobs,
  listCheckpoints,
} from './dashboard-queries.js';
import type { PaginationInput } from '../../../domain/common/pagination.js';
import type { OperationsRepository } from '../../../domain/operations/operations.repository.js';

export class PostgresOperationsRepository implements OperationsRepository {
  constructor(private readonly db: Pool) {}

  public listCheckpoints(): Promise<unknown[]> {
    return listCheckpoints(this.db);
  }

  public listBackfillJobs(pagination: PaginationInput): Promise<unknown[]> {
    return listBackfillJobs(this.db, pagination);
  }

  public listAddressRegistry(pagination: PaginationInput): Promise<unknown[]> {
    return listAddressRegistry(this.db, pagination);
  }
}
