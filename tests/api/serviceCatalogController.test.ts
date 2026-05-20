import type { Pool } from 'pg';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/api/app.js';
import { ServiceCatalogController } from '../../src/api/service-catalog/service-catalog.controller.js';

const serviceList = [
  {
    address: '0xservice',
    name: 'test service',
    payment_count: 2,
  },
];

const serviceDetail = {
  address: '0xservice',
  name: 'test service',
  payment_count: 2,
  total_revenue_usd: 5,
};

describe('ServiceCatalogController module wiring', () => {
  let app: NestExpressApplication | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
    vi.restoreAllMocks();
  });

  it('resolves from the Nest container and returns services through the wired use cases', async () => {
    const dbQuery = vi.fn(async () => {
      throw new Error('service repository should not be queried when cache has data');
    });
    const redis = {
      get: vi.fn(async (key: string) => {
        if (key === 'dashboard:services-list:{"limit":20,"offset":0}') {
          return JSON.stringify(serviceList);
        }
        if (key === 'dashboard:services:0xservice') {
          return JSON.stringify(serviceDetail);
        }
        return null;
      }),
      setex: vi.fn(async () => 'OK'),
    };

    app = await createApp(
      {
        db: { query: dbQuery } as unknown as Pool,
        redis,
      },
      { logger: false, staticAssets: false },
    );

    const controller = app.get(ServiceCatalogController);

    await expect(controller.list({})).resolves.toEqual({ data: serviceList });
    await expect(controller.detail('0xservice')).resolves.toEqual({ data: serviceDetail });
    expect(controller).toBeInstanceOf(ServiceCatalogController);
    expect(redis.setex).not.toHaveBeenCalled();
    expect(dbQuery).not.toHaveBeenCalled();
  });
});
