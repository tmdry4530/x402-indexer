import request from 'supertest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, type AppServices } from '../../src/api/app.js';
import { createTestDb, createTestRedis } from '../helpers/test-context.js';

async function createHttpApp(services: AppServices): Promise<NestExpressApplication> {
  return createApp(services, { logger: false, staticAssets: false });
}

describe('createApp', () => {
  let app: NestExpressApplication | null = null;

  async function seedReadModel(): Promise<Awaited<ReturnType<typeof createTestDb>>> {
    const db = await createTestDb();
    await db.query(
      `INSERT INTO blocks (number, hash, parent_hash, timestamp, is_orphaned)
       VALUES (1, '0x1', '0x0', NOW(), false)`,
    );
    await db.query(
      `INSERT INTO agents (address, is_contract, first_seen_block, last_seen_block)
       VALUES ('0xagent', false, 1, 1)`,
    );
    await db.query(
      `INSERT INTO services (address, name, category)
       VALUES ('0xservice', 'svc', 'test')`,
    );
    await db.query(
      `INSERT INTO transactions (hash, block_number, from_address, to_address, input, value, status, gas_used, effective_gas_price)
       VALUES ('0xtx', 1, '0xagent', '0xasset', '0xe3ee160e', 0, 1, 21000, 1)`,
    );
    await db.query(
      `INSERT INTO x402_evidence (id, transaction_hash, log_index, block_number, detection_method, confidence, payer, pay_to, asset, amount)
       VALUES (1, '0xtx', 0, 1, 'eip3009_direct', 90, '0xagent', '0xservice', '0xasset', 1000000)`,
    );
    await db.query(
      `INSERT INTO payments (transaction_hash, log_index, evidence_id, block_number, block_timestamp, payer, pay_to, asset, amount, amount_usd)
       VALUES ('0xtx', 0, 1, 1, NOW(), '0xagent', '0xservice', '0xasset', 1000000, 1.0)`,
    );
    await db.query(
      `INSERT INTO interactions (transaction_hash, block_number, block_timestamp, agent_address, target_contract, function_selector)
       VALUES ('0xtx', 1, NOW(), '0xagent', '0xasset', '0xe3ee160e')`,
    );
    await db.query(
      `INSERT INTO agent_daily_stats (agent_address, date, tx_count, payment_count, total_spent_usd, total_gas_usd, total_revenue_usd, unique_services)
       VALUES ('0xagent', CURRENT_DATE, 1, 1, 1, 0.1, 2, 1)`,
    );

    return db;
  }

  afterEach(async () => {
    vi.restoreAllMocks();
    if (app) {
      await app.close();
      app = null;
    }
  });

  it('returns health and payments data', async () => {
    const db = await seedReadModel();

    app = await createHttpApp({
      db,
      enqueueBackfill: vi.fn(async () => {}),
    });
    const api = request(app.getHttpServer());

    const health = await api.get('/health');
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ ok: true });

    const payments = await api.get('/payments');
    expect(payments.status).toBe(200);
    expect(payments.body.data).toHaveLength(1);

    const overview = await api.get('/overview');
    expect(overview.status).toBe(200);
    expect(overview.body).toMatchObject({
      data: {
        payments_count: 1,
        evidence_count: 1,
        agents_count: 1,
        services_count: 1,
      },
    });

    const backfill = await api
      .post('/jobs/backfill')
      .send({ startBlock: '1', endBlock: '10' });
    expect(backfill.status).toBe(202);
  }, 15000);

  it('serves the remaining read endpoints and not-found responses', async () => {
    const db = await seedReadModel();
    app = await createHttpApp({ db });
    const api = request(app.getHttpServer());

    const agent = await api.get('/agents/0xagent');
    expect(agent.status).toBe(200);
    expect(agent.body).toMatchObject({
      data: {
        address: '0xagent',
        payment_count: 1,
        total_revenue_usd: 2,
        net_roi_usd: 0.9,
      },
    });

    const agentStats = await api.get('/agents/0xagent/stats');
    expect(agentStats.status).toBe(200);
    expect(agentStats.body).toMatchObject({
      data: [
        {
          agent_address: '0xagent',
          payment_count: 1,
        },
      ],
    });

    const service = await api.get('/services/0xservice');
    expect(service.status).toBe(200);
    expect(service.body).toMatchObject({
      data: {
        address: '0xservice',
        payment_count: 1,
      },
    });

    const interactions = await api.get('/interactions?agentAddress=0xagent');
    expect(interactions.status).toBe(200);
    expect(interactions.body).toMatchObject({
      data: [
        {
          agent_address: '0xagent',
          function_selector: '0xe3ee160e',
        },
      ],
    });

    const daily = await api.get('/stats/daily?agentAddress=0xagent');
    expect(daily.status).toBe(200);
    expect(daily.body).toMatchObject({
      data: [
        {
          agent_address: '0xagent',
          payment_count: 1,
        },
      ],
    });

    expect((await api.get('/agents/0xmissing')).status).toBe(404);
    expect((await api.get('/services/0xmissing')).status).toBe(404);
  }, 15000);

  it('serves UI-supporting list, detail, and operations endpoints', async () => {
    const db = await seedReadModel();
    await db.query(
      `INSERT INTO sync_checkpoints (worker_name, last_processed_block, last_processed_hash, status)
       VALUES ('backfill_default', 1, '0x1', 'running')`,
    );
    await db.query(
      `INSERT INTO backfill_jobs (start_block, end_block, status, retry_count, error_message)
       VALUES (1, 1, 'completed', 0, NULL)`,
    );
    await db.query(
      `INSERT INTO address_registry (address, type, name)
       VALUES ('0xasset', 'asset', 'test asset')`,
    );
    app = await createHttpApp({ db });
    const api = request(app.getHttpServer());

    expect((await api.get('/agents')).body).toMatchObject({
      data: [{ address: '0xagent', payment_count: 1 }],
    });
    expect((await api.get('/services')).body).toMatchObject({
      data: [{ address: '0xservice', payment_count: 1 }],
    });
    expect((await api.get('/evidence')).body).toMatchObject({
      data: [{ transaction_hash: '0xtx', confidence: 90, promoted: true }],
    });
    expect((await api.get('/payments/0xtx/0')).body).toMatchObject({
      data: {
        transaction_hash: '0xtx',
        log_index: 0,
        confidence: 90,
        submitter: '0xagent',
      },
    });
    expect((await api.get('/operations/checkpoints')).body).toMatchObject({
      data: [{ worker_name: 'backfill_default', status: 'running' }],
    });
    expect((await api.get('/operations/backfill-jobs')).body).toMatchObject({
      data: [{ status: 'completed' }],
    });
    expect((await api.get('/operations/address-registry')).body).toMatchObject({
      data: [{ address: '0xasset', type: 'asset' }],
    });
    expect((await api.get('/operations/status')).body).toMatchObject({
      data: {
        api_ok: true,
      },
    });
  }, 15000);

  it('validates backfill requests and reports worker availability', async () => {
    const db = await createTestDb();
    app = await createHttpApp({ db });
    const api = request(app.getHttpServer());

    expect(
      (
        await api
          .post('/jobs/backfill')
          .send({ startBlock: '10', endBlock: '1' })
      ).status,
    ).toBe(400);

    expect(
      (
        await api
          .post('/jobs/backfill')
          .send({ startBlock: '1', endBlock: '10' })
      ).status,
    ).toBe(503);
  });

  it('serves cached dashboard responses from Redis on repeated reads', async () => {
    const db = await seedReadModel();
    const redis = createTestRedis();
    app = await createHttpApp({ db, redis });
    const api = request(app.getHttpServer());

    const first = await api.get('/payments?payer=0xagent');
    expect(first.status).toBe(200);
    await db.query(`DELETE FROM payments`);

    const second = await api.get('/payments?payer=0xagent');
    expect(second.status).toBe(200);
    expect(second.body).toMatchObject({
      data: [
        {
          payer: '0xagent',
        },
      ],
    });
  });

  it('falls back to the database when Redis read/write operations fail', async () => {
    const db = await seedReadModel();
    app = await createHttpApp({
      db,
      redis: {
        get: async () => {
          throw new Error('redis unavailable');
        },
        setex: async () => {
          throw new Error('redis unavailable');
        },
      },
    });
    const api = request(app.getHttpServer());

    const response = await api.get('/payments?payer=0xagent');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: [
        {
          payer: '0xagent',
        },
      ],
    });
  });

  it('preserves dashboard root redirects and static UI serving', async () => {
    const db = await createTestDb();
    app = await createApp({ db }, { logger: false });
    const api = request(app.getHttpServer());

    const root = await api.get('/');
    expect(root.status).toBe(302);
    expect(root.headers.location).toBe('/ui/');

    const ui = await api.get('/ui/');
    expect(ui.status).toBe(200);
    expect(ui.text).toContain('x402 인덱서');
  });

  it('accepts backfill requests through the shared enqueue path even when no worker-specific runtime is present', async () => {
    const db = await createTestDb();
    const enqueueBackfill = vi.fn(async () => undefined);
    app = await createHttpApp({ db, enqueueBackfill });
    const api = request(app.getHttpServer());

    const response = await api
      .post('/jobs/backfill')
      .send({ startBlock: '1', endBlock: '10' });

    expect(response.status).toBe(202);
    expect(enqueueBackfill).toHaveBeenCalledWith({ startBlock: 1n, endBlock: 10n });
  });
});
