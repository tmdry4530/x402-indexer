import type { Pool } from 'pg';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/api/app.js';
import { HealthController } from '../../src/api/health/health.controller.js';

describe('HealthController module wiring', () => {
  let app: NestExpressApplication | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
    vi.restoreAllMocks();
  });

  it('resolves from the Nest container and preserves the health response contract', async () => {
    app = await createApp(
      { db: { query: vi.fn() } as unknown as Pool },
      { logger: false, staticAssets: false },
    );

    const controller = app.get(HealthController);

    expect(controller).toBeInstanceOf(HealthController);
    expect(controller.health()).toEqual({ ok: true });
  });
});
