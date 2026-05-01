import type { PaginationInput } from '../common/pagination.js';

export interface InteractionRepository {
  listInteractions(
    pagination: PaginationInput,
    filters: { agentAddress?: string },
  ): Promise<unknown[]>;
}
