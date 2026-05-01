import type { Pool } from 'pg';
import { listEvidence } from './dashboard-queries.js';
import type { PaginationInput } from '../../../domain/common/pagination.js';
import type { EvidenceRepository } from '../../../domain/evidence/evidence.repository.js';

export class PostgresEvidenceRepository implements EvidenceRepository {
  constructor(private readonly db: Pool) {}

  public listEvidence(pagination: PaginationInput): Promise<unknown[]> {
    return listEvidence(this.db, pagination);
  }
}
