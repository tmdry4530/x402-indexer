import type { Pool } from 'pg';
import { getService, listServices } from './dashboard-queries.js';
import type { PaginationInput } from '../../../domain/common/pagination.js';
import type { ServiceCatalogRepository } from '../../../domain/service-catalog/service-catalog.repository.js';

export class PostgresServiceCatalogRepository implements ServiceCatalogRepository {
  constructor(private readonly db: Pool) {}

  public listServices(pagination: PaginationInput): Promise<unknown[]> {
    return listServices(this.db, pagination);
  }

  public getService(address: string): Promise<unknown | null> {
    return getService(this.db, address);
  }
}
