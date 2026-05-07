import { Inject, Injectable } from '@nestjs/common';
import type { OperationsRepository } from '../../domain/operations/operations.repository.js';
import { OPERATIONS_REPOSITORY } from '../ports/tokens.js';

@Injectable()
export class ListCheckpointsUseCase {
  constructor(@Inject(OPERATIONS_REPOSITORY) private readonly operations: OperationsRepository) {}

  public execute(): Promise<unknown[]> {
    return this.operations.listCheckpoints();
  }
}
