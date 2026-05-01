import { Inject, Injectable } from '@nestjs/common';
import type { OperationsRepository } from '../../domain/operations/operations.repository.js';
import type { PaginationInput } from '../../domain/common/pagination.js';
import type { CachePort } from '../ports/cache.port.js';
import { DASHBOARD_CACHE, OPERATIONS_REPOSITORY } from '../ports/tokens.js';

@Injectable()
export class ListAddressRegistryUseCase {
  constructor(
    @Inject(OPERATIONS_REPOSITORY) private readonly operations: OperationsRepository,
    @Inject(DASHBOARD_CACHE) private readonly cache: CachePort,
  ) {}

  public execute(input: PaginationInput): Promise<unknown[]> {
    return this.cache.readThrough(
      `dashboard:operations:address-registry:${JSON.stringify(input)}`,
      () => this.operations.listAddressRegistry(input),
    );
  }
}
