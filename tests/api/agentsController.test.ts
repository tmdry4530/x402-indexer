import type { Pool } from 'pg';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/api/app.js';
import { AgentsController } from '../../src/api/agents/agents.controller.js';

const agentList = [
  {
    address: '0xagent',
    payment_count: 2,
  },
];

const agentDetail = {
  address: '0xagent',
  payment_count: 2,
  total_revenue_usd: 5,
};

const agentStats = [
  {
    agent_address: '0xagent',
    payment_count: 2,
  },
];

describe('AgentsController module wiring', () => {
  let app: NestExpressApplication | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
    vi.restoreAllMocks();
  });

  it('resolves from the Nest container and returns agents through the wired use cases', async () => {
    const dbQuery = vi.fn(async () => {
      throw new Error('agent repository should not be queried when cache has data');
    });
    const redis = {
      get: vi.fn(async (key: string) => {
        if (key === 'dashboard:agents-list:{"limit":20,"offset":0}') {
          return JSON.stringify(agentList);
        }
        if (key === 'dashboard:agents:0xagent') {
          return JSON.stringify(agentDetail);
        }
        if (key === 'dashboard:agent-stats:0xagent') {
          return JSON.stringify(agentStats);
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

    const controller = app.get(AgentsController);

    await expect(controller.list({})).resolves.toEqual({ data: agentList });
    await expect(controller.detail('0xagent')).resolves.toEqual({ data: agentDetail });
    await expect(controller.stats('0xagent')).resolves.toEqual({ data: agentStats });
    expect(controller).toBeInstanceOf(AgentsController);
    expect(redis.setex).not.toHaveBeenCalled();
    expect(dbQuery).not.toHaveBeenCalled();
  });
});
