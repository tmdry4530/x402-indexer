import { Controller, Get, Inject } from '@nestjs/common';
import { GetOverviewUseCase } from '../../application/overview/get-overview.usecase.js';
import { API_ROUTES } from '../routes.js';

@Controller()
export class OverviewController {
  constructor(@Inject(GetOverviewUseCase) private readonly getOverviewUseCase: GetOverviewUseCase) {}

  @Get(API_ROUTES.overview)
  public async getOverview(): Promise<{ data: unknown }> {
    return { data: await this.getOverviewUseCase.execute() };
  }
}
