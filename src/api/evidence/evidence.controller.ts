import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ListEvidenceUseCase } from '../../application/evidence/list-evidence.usecase.js';
import { API_ROUTES } from '../routes.js';
import { evidenceQuerySchema } from './evidence.schema.js';

@Controller()
export class EvidenceController {
  constructor(@Inject(ListEvidenceUseCase) private readonly listEvidenceUseCase: ListEvidenceUseCase) {}

  @Get(API_ROUTES.evidence)
  public async list(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return { data: await this.listEvidenceUseCase.execute(evidenceQuerySchema.parse(query)) };
  }
}
