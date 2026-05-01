import type { PaginationInput } from '../common/pagination.js';

export interface ServiceCatalogRepository {
  listServices(pagination: PaginationInput): Promise<unknown[]>;
  getService(address: string): Promise<unknown | null>;
}
