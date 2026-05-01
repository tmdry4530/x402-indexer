import type { PaginationInput } from '../common/pagination.js';

export interface EvidenceRepository {
  listEvidence(pagination: PaginationInput): Promise<unknown[]>;
}
