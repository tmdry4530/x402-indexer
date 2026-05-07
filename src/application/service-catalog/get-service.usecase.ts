import { Inject, Injectable } from '@nestjs/common';
import type { ServiceCatalogRepository } from '../../domain/service-catalog/service-catalog.repository.js';
import { NotFoundError } from '../errors/application-error.js';
import type { CachePort } from '../ports/cache.port.js';
import { DASHBOARD_CACHE, SERVICE_CATALOG_REPOSITORY } from '../ports/tokens.js';

@Injectable()
export class GetServiceUseCase {
  constructor(
    @Inject(SERVICE_CATALOG_REPOSITORY) private readonly services: ServiceCatalogRepository,
    @Inject(DASHBOARD_CACHE) private readonly cache: CachePort,
  ) {}

  public async execute(address: string): Promise<unknown> {
    const service = await this.cache.readThrough(`dashboard:services:${address}`, () =>
      this.services.getService(address),
    );
    if (!service) {
      throw new NotFoundError('서비스를 찾을 수 없습니다');
    }
    return service;
  }
}
