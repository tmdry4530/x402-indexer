import { describe, expect, it } from 'vitest';
import { deriveDomain } from '../../src/pipeline/steps/deriveDomain.js';
import { createTestPipelineContext } from '../helpers/test-context.js';

const payer = '0x3333333333333333333333333333333333333333';
const payTo = '0x4444444444444444444444444444444444444444';
const asset = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

describe('deriveDomain', () => {
  it('keeps the earliest first_seen_block when older history is backfilled later', async () => {
    const ctx = await createTestPipelineContext({
      knownAssets: [asset],
      rpc: {
        getBytecode: async () => '0x',
      },
    });

    await ctx.db.query(
      `INSERT INTO blocks (number, hash, parent_hash, timestamp, is_orphaned)
       VALUES
       (10, '0x10', '0x9', NOW(), false),
       (5, '0x05', '0x4', NOW(), false)`,
    );
    await ctx.db.query(
      `INSERT INTO transactions (hash, block_number, from_address, to_address, input, value, status, gas_used, effective_gas_price)
       VALUES
       ('0xtx10', 10, $1, $2, '0xe3ee160e', 0, 1, 21000, 1),
       ('0xtx05', 5, $1, $2, '0xe3ee160e', 0, 1, 21000, 1)`,
      [payer, asset],
    );
    await ctx.db.query(
      `INSERT INTO x402_evidence (id, transaction_hash, log_index, block_number, detection_method, confidence, payer, pay_to, asset, amount)
       VALUES
       (1, '0xtx10', 0, 10, 'eip3009_direct', 80, $1, $2, $3, 1000),
       (2, '0xtx05', 0, 5, 'eip3009_direct', 80, $1, $2, $3, 1000)`,
      [payer, payTo, asset],
    );

    await deriveDomain([
      {
        txHash: '0xtx10' as never,
        logIndex: 0,
        blockNumber: 10n,
        detectionMethod: 'eip3009_direct',
        confidence: 80,
        payer: payer as never,
        payTo: payTo as never,
        asset: asset as never,
        amount: 1000n,
      },
    ], ctx);

    await deriveDomain([
      {
        txHash: '0xtx05' as never,
        logIndex: 0,
        blockNumber: 5n,
        detectionMethod: 'eip3009_direct',
        confidence: 80,
        payer: payer as never,
        payTo: payTo as never,
        asset: asset as never,
        amount: 1000n,
      },
    ], ctx);

    await expect(ctx.db.query(`SELECT first_seen_block, last_seen_block FROM agents WHERE address = $1`, [payer]))
      .resolves.toMatchObject({
        rows: [{ first_seen_block: 5, last_seen_block: 10 }],
      });
  });
});
