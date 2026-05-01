import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ListDailyStatsUseCase } from '../../application/stats/list-daily-stats.usecase.js';
import { API_ROUTES } from '../routes.js';
import { statsQuerySchema } from './stats.schema.js';

@Controller()
export class StatsController {
  constructor(@Inject(ListDailyStatsUseCase) private readonly listDailyStatsUseCase: ListDailyStatsUseCase) {}

  @Get(API_ROUTES.dailyStats)
  public async daily(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return { data: await this.listDailyStatsUseCase.execute(statsQuerySchema.parse(query)) };
  }
}
