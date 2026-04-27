import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/api/app.js';
import { createTestDb, createTestRedis } from '../helpers/test-context.js';

describe('createApp', () => {
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns health and payments data', async () => {
    const db = await seedReadModel();

    const app = createApp({
      db,
      enqueueBackfill: vi.fn(async () => {}),
    });

    const health = await app.request('/health');
    expect(health.status).toBe(200);
    await expect(health.json()).resolves.toEqual({ ok: true });

    const payments = await app.request('/payments');
    expect(payments.status).toBe(200);
    const paymentsBody = await payments.json();
    expect(paymentsBody.data).toHaveLength(1);

    const overview = await app.request('/overview');
    expect(overview.status).toBe(200);
    await expect(overview.json()).resolves.toMatchObject({
      data: {
        payments_count: 1,
        evidence_count: 1,
        agents_count: 1,
        services_count: 1,
      },
    });

    const backfill = await app.request('/jobs/backfill', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ startBlock: '1', endBlock: '10' }),
    });
    expect(backfill.status).toBe(202);
  }, 15000);

  it('serves the remaining read endpoints and not-found responses', async () => {
    const db = await seedReadModel();
    const app = createApp({ db });

    const agent = await app.request('/agents/0xagent');
    expect(agent.status).toBe(200);
    await expect(agent.json()).resolves.toMatchObject({
      data: {
        address: '0xagent',
        payment_count: 1,
        total_revenue_usd: 2,
        net_roi_usd: 0.9,
      },
    });

    const agentStats = await app.request('/agents/0xagent/stats');
    expect(agentStats.status).toBe(200);
    await expect(agentStats.json()).resolves.toMatchObject({
      data: [
        {
          agent_address: '0xagent',
          payment_count: 1,
        },
      ],
    });

    const service = await app.request('/services/0xservice');
    expect(service.status).toBe(200);
    await expect(service.json()).resolves.toMatchObject({
      data: {
        address: '0xservice',
        payment_count: 1,
      },
    });

    const interactions = await app.request('/interactions?agentAddress=0xagent');
    expect(interactions.status).toBe(200);
    await expect(interactions.json()).resolves.toMatchObject({
      data: [
        {
          agent_address: '0xagent',
          function_selector: '0xe3ee160e',
        },
      ],
    });

    const daily = await app.request('/stats/daily?agentAddress=0xagent');
    expect(daily.status).toBe(200);
    await expect(daily.json()).resolves.toMatchObject({
      data: [
        {
          agent_address: '0xagent',
          payment_count: 1,
        },
      ],
    });

    expect((await app.request('/agents/0xmissing')).status).toBe(404);
    expect((await app.request('/services/0xmissing')).status).toBe(404);
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
    const app = createApp({ db });

    await expect((await app.request('/agents')).json()).resolves.toMatchObject({
      data: [{ address: '0xagent', payment_count: 1 }],
    });
    await expect((await app.request('/services')).json()).resolves.toMatchObject({
      data: [{ address: '0xservice', payment_count: 1 }],
    });
    await expect((await app.request('/evidence')).json()).resolves.toMatchObject({
      data: [{ transaction_hash: '0xtx', confidence: 90, promoted: true }],
    });
    await expect((await app.request('/payments/0xtx/0')).json()).resolves.toMatchObject({
      data: {
        transaction_hash: '0xtx',
        log_index: 0,
        confidence: 90,
        submitter: '0xagent',
      },
    });
    await expect((await app.request('/operations/checkpoints')).json()).resolves.toMatchObject({
      data: [{ worker_name: 'backfill_default', status: 'running' }],
    });
    await expect((await app.request('/operations/backfill-jobs')).json()).resolves.toMatchObject({
      data: [{ status: 'completed' }],
    });
    await expect((await app.request('/operations/address-registry')).json()).resolves.toMatchObject({
      data: [{ address: '0xasset', type: 'asset' }],
    });
    await expect((await app.request('/operations/status')).json()).resolves.toMatchObject({
      data: {
        api_ok: true,
      },
    });
  }, 15000);

  it('validates backfill requests and reports worker availability', async () => {
    const db = await createTestDb();
    const app = createApp({ db });

    expect(
      (
        await app.request('/jobs/backfill', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ startBlock: '10', endBlock: '1' }),
        })
      ).status,
    ).toBe(400);

    expect(
      (
        await app.request('/jobs/backfill', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ startBlock: '1', endBlock: '10' }),
        })
    ).status,
    ).toBe(503);
  });

  it('serves cached dashboard responses from Redis on repeated reads', async () => {
    const db = await seedReadModel();
    const redis = createTestRedis();
    const app = createApp({ db, redis });

    const first = await app.request('/payments?payer=0xagent');
    expect(first.status).toBe(200);
    await db.query(`DELETE FROM payments`);

    const second = await app.request('/payments?payer=0xagent');
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toMatchObject({
      data: [
        {
          payer: '0xagent',
        },
      ],
    });
  });

  it('falls back to the database when Redis read/write operations fail', async () => {
    const db = await seedReadModel();
    const app = createApp({
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

    const response = await app.request('/payments?payer=0xagent');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: [
        {
          payer: '0xagent',
        },
      ],
    });
  }, 15000);

  it('accepts backfill requests through the shared enqueue path even when no worker-specific runtime is present', async () => {
    const db = await createTestDb();
    const enqueueBackfill = vi.fn(async () => undefined);
    const app = createApp({ db, enqueueBackfill });

    const response = await app.request('/jobs/backfill', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ startBlock: '1', endBlock: '10' }),
    });

    expect(response.status).toBe(202);
    expect(enqueueBackfill).toHaveBeenCalledWith({ startBlock: 1n, endBlock: 10n });
  });
});
