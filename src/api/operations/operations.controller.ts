import { Controller, Get, Inject, Query } from '@nestjs/common';
import { GetOperationsStatusUseCase } from '../../application/operations/get-operations-status.usecase.js';
import { ListAddressRegistryUseCase } from '../../application/operations/list-address-registry.usecase.js';
import { ListBackfillJobsUseCase } from '../../application/operations/list-backfill-jobs.usecase.js';
import { ListCheckpointsUseCase } from '../../application/operations/list-checkpoints.usecase.js';
import { API_ROUTES } from '../routes.js';
import { operationsQuerySchema } from './operation.schema.js';

@Controller()
export class OperationsController {
  constructor(
    @Inject(GetOperationsStatusUseCase)
    private readonly getOperationsStatusUseCase: GetOperationsStatusUseCase,
    @Inject(ListCheckpointsUseCase)
    private readonly listCheckpointsUseCase: ListCheckpointsUseCase,
    @Inject(ListBackfillJobsUseCase)
    private readonly listBackfillJobsUseCase: ListBackfillJobsUseCase,
    @Inject(ListAddressRegistryUseCase)
    private readonly listAddressRegistryUseCase: ListAddressRegistryUseCase,
  ) {}

  @Get(API_ROUTES.operations.status)
  public async status(): Promise<{ data: unknown }> {
    return { data: await this.getOperationsStatusUseCase.execute() };
  }

  @Get(API_ROUTES.operations.checkpoints)
  public async checkpoints(): Promise<{ data: unknown[] }> {
    return { data: await this.listCheckpointsUseCase.execute() };
  }

  @Get(API_ROUTES.operations.backfillJobs)
  public async backfillJobs(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return { data: await this.listBackfillJobsUseCase.execute(operationsQuerySchema.parse(query)) };
  }

  @Get(API_ROUTES.operations.addressRegistry)
  public async addressRegistry(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return { data: await this.listAddressRegistryUseCase.execute(operationsQuerySchema.parse(query)) };
  }
}
