import type { Pool } from 'pg';
import { listInteractions } from './dashboard-queries.js';
import type { PaginationInput } from '../../../domain/common/pagination.js';
import type { InteractionRepository } from '../../../domain/interaction/interaction.repository.js';

export class PostgresInteractionRepository implements InteractionRepository {
  constructor(private readonly db: Pool) {}

  public listInteractions(
    pagination: PaginationInput,
    filters: { agentAddress?: string },
  ): Promise<unknown[]> {
    return listInteractions(this.db, pagination, filters);
  }
}
