import { Inject, Injectable } from '@nestjs/common';
import type { ServiceCatalogRepository } from '../../domain/service-catalog/service-catalog.repository.js';
import type { CachePort } from '../ports/cache.port.js';
import { DASHBOARD_CACHE, SERVICE_CATALOG_REPOSITORY } from '../ports/tokens.js';

export interface ListServicesInput {
  limit: number;
  offset: number;
}

@Injectable()
export class ListServicesUseCase {
  constructor(
    @Inject(SERVICE_CATALOG_REPOSITORY) private readonly services: ServiceCatalogRepository,
    @Inject(DASHBOARD_CACHE) private readonly cache: CachePort,
  ) {}

  public execute(input: ListServicesInput): Promise<unknown[]> {
    return this.cache.readThrough(`dashboard:services-list:${JSON.stringify(input)}`, () =>
      this.services.listServices(input),
    );
  }
}
