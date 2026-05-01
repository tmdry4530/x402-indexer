import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ListInteractionsUseCase } from '../../application/interaction/list-interactions.usecase.js';
import { API_ROUTES } from '../routes.js';
import { interactionsQuerySchema } from './interaction.schema.js';

@Controller()
export class InteractionsController {
  constructor(
    @Inject(ListInteractionsUseCase)
    private readonly listInteractionsUseCase: ListInteractionsUseCase,
  ) {}

  @Get(API_ROUTES.interactions)
  public async list(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return { data: await this.listInteractionsUseCase.execute(interactionsQuerySchema.parse(query)) };
  }
}
