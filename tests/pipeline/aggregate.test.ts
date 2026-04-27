import { describe, expect, it } from 'vitest';
import { updateAggregates } from '../../src/pipeline/steps/aggregate.js';
import { createTestPipelineContext } from '../helpers/test-context.js';

const asset = '0x1111111111111111111111111111111111111111';
const payer = '0x3333333333333333333333333333333333333333';
const payTo = '0x4444444444444444444444444444444444444444';
const revenueAgent = '0x5555555555555555555555555555555555555555';
const weth = '0x4200000000000000000000000000000000000006';

describe('updateAggregates', () => {
  it('recomputes full-day stats across multiple batches and uses WETH price for gas', async () => {
    const ctx = await createTestPipelineContext({
      knownAssets: [asset],
    });
    const timestamp = new Date('2024-01-01T00:10:00.000Z');
    const hour = new Date('2024-01-01T00:00:00.000Z');

    await ctx.db.query(
      `INSERT INTO blocks (number, hash, parent_hash, timestamp, is_orphaned)
       VALUES (1, '0x1', '0x0', $1, false), (2, '0x2', '0x1', $1, false)`,
      [timestamp],
    );
    await ctx.db.query(
      `INSERT INTO agents (address, is_contract, first_seen_block, last_seen_block)
       VALUES ($1, false, 1, 2), ($2, false, 1, 2)`,
      [payer, revenueAgent],
    );
    await ctx.db.query(
      `INSERT INTO services (address, name, category) VALUES ($1, NULL, NULL), ($2, NULL, NULL)`,
      [payTo, revenueAgent],
    );
    await ctx.db.query(
      `INSERT INTO transactions (hash, block_number, from_address, to_address, input, value, status, gas_used, effective_gas_price)
       VALUES
       ('0xtx1', 1, $1, $2, '0xe3ee160e', 0, 1, 21000, 1000000000),
       ('0xtx2', 2, $1, $2, '0xe3ee160e', 0, 1, 21000, 1000000000),
       ('0xtx3', 2, $1, $2, '0xe3ee160e', 0, 1, 21000, 1000000000)`,
      [payer, asset],
    );
    await ctx.db.query(
      `INSERT INTO x402_evidence (id, transaction_hash, log_index, block_number, detection_method, confidence, payer, pay_to, asset, amount)
       VALUES
       (1, '0xtx1', 0, 1, 'eip3009_direct', 90, $1, $2, $3, 1000000),
       (2, '0xtx2', 0, 2, 'eip3009_direct', 90, $1, $2, $3, 2000000),
       (3, '0xtx3', 0, 2, 'eip3009_direct', 90, $1, $4, $3, 3000000)`,
      [payer, payTo, asset, revenueAgent],
    );
    await ctx.db.query(
      `INSERT INTO payments (transaction_hash, log_index, evidence_id, block_number, block_timestamp, payer, pay_to, asset, amount, amount_usd)
       VALUES
       ('0xtx1', 0, 1, 1, $1, $2, $3, $4, 1000000, NULL),
       ('0xtx2', 0, 2, 2, $1, $2, $3, $4, 2000000, NULL),
       ('0xtx3', 0, 3, 2, $1, $2, $5, $4, 3000000, NULL)`,
      [timestamp, payer, payTo, asset, revenueAgent],
    );
    await ctx.db.query(
      `INSERT INTO price_snapshots (token_address, timestamp, price_usd, source)
       VALUES ($1, $3, 1, 'seed'), ($2, $3, 2000, 'seed')`,
      [asset, weth, hour],
    );
    await ctx.db.query(
      `INSERT INTO logs (transaction_hash, log_index, block_number, address, topic0, topic1, topic2, topic3, data)
       VALUES (
         '0xtx3',
         0,
         2,
         $1,
         '0xddf252ad',
         '0x0000000000000000000000004444444444444444444444444444444444444444',
         '0x0000000000000000000000003333333333333333333333333333333333333333',
         NULL,
         '0x0000000000000000000000000000000000000000000000000000000000989680'
       )`,
      [asset],
    );

    await updateAggregates(
      [
        {
          txHash: '0xtx1' as never,
          logIndex: 0,
          blockNumber: 1n,
          detectionMethod: 'eip3009_direct',
          confidence: 90,
          payer: payer as never,
          payTo: payTo as never,
          asset: asset as never,
          amount: 1_000_000n,
        },
      ],
      ctx,
    );

    await updateAggregates(
      [
        {
          txHash: '0xtx2' as never,
          logIndex: 0,
          blockNumber: 2n,
          detectionMethod: 'eip3009_direct',
          confidence: 90,
          payer: payer as never,
          payTo: payTo as never,
          asset: asset as never,
          amount: 2_000_000n,
        },
        {
          txHash: '0xtx3' as never,
          logIndex: 0,
          blockNumber: 2n,
          detectionMethod: 'eip3009_direct',
          confidence: 90,
          payer: payer as never,
          payTo: revenueAgent as never,
          asset: asset as never,
          amount: 3_000_000n,
        },
      ],
      ctx,
    );

    const payerStats = await ctx.db.query(`SELECT * FROM agent_daily_stats WHERE agent_address = $1`, [payer]);
    const revenueStats = await ctx.db.query(`SELECT * FROM agent_daily_stats WHERE agent_address = $1`, [revenueAgent]);
    expect(payerStats.rows).toHaveLength(1);
    expect(payerStats.rows[0].tx_count).toBe(3);
    expect(payerStats.rows[0].payment_count).toBe(3);
    expect(Number(payerStats.rows[0].total_spent_usd)).toBe(6);
    expect(Number(payerStats.rows[0].total_gas_usd)).toBeGreaterThan(0);
    expect(Number(payerStats.rows[0].total_revenue_usd)).toBe(0);
    expect(revenueStats.rows).toHaveLength(1);
    expect(Number(revenueStats.rows[0].total_revenue_usd)).toBe(3);
  }, 60000);
});
