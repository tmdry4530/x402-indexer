import { Inject, Injectable } from '@nestjs/common';
import type { OperationsRepository } from '../../domain/operations/operations.repository.js';
import type { PaginationInput } from '../../domain/common/pagination.js';
import { OPERATIONS_REPOSITORY } from '../ports/tokens.js';

@Injectable()
export class ListBackfillJobsUseCase {
  constructor(@Inject(OPERATIONS_REPOSITORY) private readonly operations: OperationsRepository) {}

  public execute(input: PaginationInput): Promise<unknown[]> {
    return this.operations.listBackfillJobs(input);
  }
}
