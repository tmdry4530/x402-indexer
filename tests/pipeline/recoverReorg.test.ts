import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { recoverReorg } from '../../src/pipeline/steps/recoverReorg.js';
import { createTestPipelineContext } from '../helpers/test-context.js';

const block1Hash = '0x1111111111111111111111111111111111111111111111111111111111111111';
const block2Hash = '0x2222222222222222222222222222222222222222222222222222222222222222';
const payer = '0x3333333333333333333333333333333333333333';
const revenueAgent = '0x6666666666666666666666666666666666666666';
const service = '0x4444444444444444444444444444444444444444';
const asset = '0x5555555555555555555555555555555555555555';

describe('recoverReorg', () => {
  it('marks orphan blocks, invalidates domain rows, clears dashboard cache, and rewinds the checkpoint', async () => {
    const ctx = await createTestPipelineContext({
      knownAssets: [asset],
      rpc: {
        getBlock: async (args?: { blockNumber?: bigint }) => {
          const blockNumber = args?.blockNumber;
          if (blockNumber === 1n) {
            return { hash: block1Hash } as never;
          }
          throw new Error(`unexpected canonical lookup ${(blockNumber ?? -1n).toString()}`);
        },
      },
    });
    const del = vi.fn(async () => 2);
    ctx.redis = {
      ...ctx.redis,
      scanStream: () => {
        const emitter = new EventEmitter();
        queueMicrotask(() => {
          emitter.emit('data', ['dashboard:payments', 'dashboard:stats']);
          emitter.emit('end');
        });
        return emitter;
      },
      del,
    };

    await ctx.db.query(
      `INSERT INTO blocks (number, hash, parent_hash, timestamp, is_orphaned)
       VALUES
       (1, $1, '0x0', NOW(), false),
       (2, $2, $1, NOW(), false)`,
      [block1Hash, block2Hash],
    );
    await ctx.db.query(
      `INSERT INTO sync_checkpoints (worker_name, last_processed_block, last_processed_hash, status, updated_at)
       VALUES ('realtime', 2, $1, 'running', NOW())`,
      [block2Hash],
    );
    await ctx.db.query(
      `INSERT INTO agents (address, is_contract, first_seen_block, last_seen_block)
       VALUES ($1, false, 1, 2), ($2, false, 1, 2)`,
      [payer, revenueAgent],
    );
    await ctx.db.query(
      `INSERT INTO services (address, name, category)
       VALUES ($1, 'svc', 'tool')`,
      [service],
    );
    await ctx.db.query(
      `INSERT INTO transactions (hash, block_number, from_address, to_address, input, value, status, gas_used, effective_gas_price)
       VALUES ('0xtx', 2, $1, $2, '0xe3ee160e', 0, 1, 21000, 1)`,
      [payer, asset],
    );
    await ctx.db.query(
      `INSERT INTO x402_evidence (id, transaction_hash, log_index, block_number, detection_method, confidence, payer, pay_to, asset, amount)
       VALUES (1, '0xtx', 0, 2, 'eip3009_direct', 90, $1, $2, $3, 1000000)`,
      [payer, service, asset],
    );
    await ctx.db.query(
      `INSERT INTO payments (transaction_hash, log_index, evidence_id, block_number, block_timestamp, payer, pay_to, asset, amount, amount_usd)
       VALUES ('0xtx', 0, 1, 2, NOW(), $1, $2, $3, 1000000, 1.0)`,
      [payer, service, asset],
    );
    await ctx.db.query(
      `INSERT INTO interactions (transaction_hash, block_number, block_timestamp, agent_address, target_contract, function_selector)
       VALUES ('0xtx', 2, NOW(), $1, $2, '0xe3ee160e')`,
      [payer, asset],
    );
    await ctx.db.query(
      `INSERT INTO transactions (hash, block_number, from_address, to_address, input, value, status, gas_used, effective_gas_price)
       VALUES ('0xrevenue', 2, $1, $2, '0xe3ee160e', 0, 1, 21000, 1)`,
      [service, asset],
    );
    await ctx.db.query(
      `INSERT INTO x402_evidence (id, transaction_hash, log_index, block_number, detection_method, confidence, payer, pay_to, asset, amount)
       VALUES (2, '0xrevenue', 1, 2, 'eip3009_direct', 80, $1, $2, $3, 1000000)`,
      [payer, revenueAgent, asset],
    );
    await ctx.db.query(
      `INSERT INTO logs (transaction_hash, log_index, block_number, address, topic0, topic1, topic2, topic3, data)
       VALUES (
         '0xrevenue',
         1,
         2,
         $1,
         '0xddf252ad',
         '0x0000000000000000000000004444444444444444444444444444444444444444',
         '0x0000000000000000000000006666666666666666666666666666666666666666',
         NULL,
         '0x00000000000000000000000000000000000000000000000000000000000f4240'
       )`,
      [asset],
    );
    await ctx.db.query(
      `INSERT INTO agent_daily_stats (agent_address, date, tx_count, payment_count, total_spent_usd, total_gas_usd, total_revenue_usd, unique_services)
       VALUES ($1, CURRENT_DATE, 1, 1, 1, 0.1, 0, 1)`,
      [payer],
    );
    await ctx.db.query(
      `INSERT INTO agent_daily_stats (agent_address, date, tx_count, payment_count, total_spent_usd, total_gas_usd, total_revenue_usd, unique_services)
       VALUES ($1, CURRENT_DATE - INTERVAL '1 day', 3, 2, 5, 0.3, 0, 2)`,
      [payer],
    );
    await ctx.db.query(
      `INSERT INTO agent_daily_stats (agent_address, date, tx_count, payment_count, total_spent_usd, total_gas_usd, total_revenue_usd, unique_services)
       VALUES ($1, CURRENT_DATE, 0, 0, 0, 0, 1, 0)`,
      [revenueAgent],
    );

    await recoverReorg(
      {
        valid: false,
        currentBlockNumber: 3n,
        localHash: block2Hash as never,
        canonicalHash: block1Hash as never,
        commonAncestorBlock: 1n,
      },
      'realtime',
      ctx,
    );

    await expect(
      ctx.db.query(`SELECT number, is_orphaned FROM blocks WHERE number = 2`),
    ).resolves.toMatchObject({
      rows: [{ number: 2, is_orphaned: true }],
    });
    await expect(ctx.db.query(`SELECT * FROM x402_evidence WHERE block_number > 1`)).resolves.toMatchObject({
      rows: [],
    });
    await expect(ctx.db.query(`SELECT * FROM payments WHERE block_number > 1`)).resolves.toMatchObject({
      rows: [],
    });
    await expect(ctx.db.query(`SELECT * FROM interactions WHERE block_number > 1`)).resolves.toMatchObject({
      rows: [],
    });
    await expect(ctx.db.query(`SELECT * FROM agent_daily_stats WHERE agent_address = $1`, [payer])).resolves.toMatchObject({
      rows: [
        {
          agent_address: payer,
          payment_count: 2,
        },
      ],
    });
    await expect(ctx.db.query(`SELECT * FROM agent_daily_stats WHERE agent_address = $1`, [revenueAgent])).resolves.toMatchObject({
      rows: [],
    });
    await expect(
      ctx.db.query(
        `SELECT last_processed_block, last_processed_hash, status
         FROM sync_checkpoints
         WHERE worker_name = 'realtime'`,
      ),
    ).resolves.toMatchObject({
      rows: [{ last_processed_block: 1, last_processed_hash: block1Hash, status: 'reorged' }],
    });
    await expect(
      ctx.db.query(`SELECT start_block, end_block, status FROM backfill_jobs ORDER BY id ASC`),
    ).resolves.toMatchObject({
      rows: [{ start_block: 2, end_block: 3, status: 'pending_manual' }],
    });
    expect(del).toHaveBeenCalledWith('dashboard:payments', 'dashboard:stats');
  }, 60000);
});
