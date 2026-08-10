import type { Pool } from 'pg';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/api/app.js';
import { OverviewController } from '../../src/api/overview/overview.controller.js';

const cachedOverview = {
  payments_count: 2,
  evidence_count: 3,
  agents_count: 1,
  services_count: 1,
};

describe('OverviewController module wiring', () => {
  let app: NestExpressApplication | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
    vi.restoreAllMocks();
  });

  it('resolves from the Nest container and returns overview data through the wired use case', async () => {
    const dbQuery = vi.fn(async () => {
      throw new Error('overview repository should not be queried when cache has data');
    });
    const redis = {
      get: vi.fn(async () => JSON.stringify(cachedOverview)),
      setex: vi.fn(async () => 'OK'),
    };

    app = await createApp(
      {
        db: { query: dbQuery } as unknown as Pool,
        redis,
      },
      { logger: false, staticAssets: false },
    );

    const controller = app.get(OverviewController);

    await expect(controller.getOverview()).resolves.toEqual({ data: cachedOverview });
    expect(controller).toBeInstanceOf(OverviewController);
    expect(redis.get).toHaveBeenCalledWith('dashboard:overview');
    expect(redis.setex).not.toHaveBeenCalled();
    expect(dbQuery).not.toHaveBeenCalled();
  });
});
