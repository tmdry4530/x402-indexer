import type { Pool } from 'pg';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/api/app.js';
import { EvidenceController } from '../../src/api/evidence/evidence.controller.js';

const evidenceList = [
  {
    transaction_hash: '0xtx',
    log_index: 0,
    confidence: 90,
    promoted: true,
  },
];

describe('EvidenceController module wiring', () => {
  let app: NestExpressApplication | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
    vi.restoreAllMocks();
  });

  it('resolves from the Nest container and returns evidence through the wired use case', async () => {
    const dbQuery = vi.fn(async () => {
      throw new Error('evidence repository should not be queried when cache has data');
    });
    const redis = {
      get: vi.fn(async (key: string) => {
        if (key === 'dashboard:evidence:{"limit":20,"offset":0}') {
          return JSON.stringify(evidenceList);
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

    const controller = app.get(EvidenceController);

    await expect(controller.list({})).resolves.toEqual({ data: evidenceList });
    expect(controller).toBeInstanceOf(EvidenceController);
    expect(redis.setex).not.toHaveBeenCalled();
    expect(dbQuery).not.toHaveBeenCalled();
  });
});
