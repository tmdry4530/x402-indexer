import { Body, Controller, Inject, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { EnqueueBackfillUseCase } from '../../application/backfill/enqueue-backfill.usecase.js';
import { API_ROUTES } from '../routes.js';
import { backfillBodySchema } from './backfill.schema.js';

@Controller()
export class BackfillController {
  constructor(@Inject(EnqueueBackfillUseCase) private readonly enqueueBackfillUseCase: EnqueueBackfillUseCase) {}

  @Post(API_ROUTES.backfill.enqueue)
  @HttpCode(HttpStatus.ACCEPTED)
  public async enqueue(@Body() body: unknown): Promise<{
    data: { startBlock: string; endBlock: string; status: 'queued' };
  }> {
    return { data: await this.enqueueBackfillUseCase.execute(backfillBodySchema.parse(body)) };
  }
}
