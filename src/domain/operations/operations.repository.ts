import type { PaginationInput } from '../common/pagination.js';

export interface OperationsRepository {
  listCheckpoints(): Promise<unknown[]>;
  listBackfillJobs(pagination: PaginationInput): Promise<unknown[]>;
  listAddressRegistry(pagination: PaginationInput): Promise<unknown[]>;
}
