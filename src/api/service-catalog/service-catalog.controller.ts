import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { GetServiceUseCase } from '../../application/service-catalog/get-service.usecase.js';
import { ListServicesUseCase } from '../../application/service-catalog/list-services.usecase.js';
import { API_ROUTES } from '../routes.js';
import { servicesQuerySchema } from './service.schema.js';

@Controller()
export class ServiceCatalogController {
  constructor(
    @Inject(ListServicesUseCase) private readonly listServicesUseCase: ListServicesUseCase,
    @Inject(GetServiceUseCase) private readonly getServiceUseCase: GetServiceUseCase,
  ) {}

  @Get(API_ROUTES.services.list)
  public async list(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return { data: await this.listServicesUseCase.execute(servicesQuerySchema.parse(query)) };
  }

  @Get(API_ROUTES.services.detail)
  public async detail(@Param('address') address: string): Promise<{ data: unknown }> {
    return { data: await this.getServiceUseCase.execute(address) };
  }
}
