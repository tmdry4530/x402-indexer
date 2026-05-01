import { Inject, Injectable } from '@nestjs/common';
import type { EvidenceRepository } from '../../domain/evidence/evidence.repository.js';
import type { CachePort } from '../ports/cache.port.js';
import { DASHBOARD_CACHE, EVIDENCE_REPOSITORY } from '../ports/tokens.js';

export interface ListEvidenceInput {
  limit: number;
  offset: number;
}

@Injectable()
export class ListEvidenceUseCase {
  constructor(
    @Inject(EVIDENCE_REPOSITORY) private readonly evidence: EvidenceRepository,
    @Inject(DASHBOARD_CACHE) private readonly cache: CachePort,
  ) {}

  public execute(input: ListEvidenceInput): Promise<unknown[]> {
    return this.cache.readThrough(`dashboard:evidence:${JSON.stringify(input)}`, () =>
      this.evidence.listEvidence(input),
    );
  }
}
