import { describe, expect, it } from 'vitest';
import { BackfillWorker, splitBlockRangeIntoChunks } from '../../src/workers/backfillWorker.js';
import { processBlock } from '../../src/pipeline/orchestrator.js';
import { createTestPipelineContext } from '../helpers/test-context.js';

describe('splitBlockRangeIntoChunks', () => {
  it('splits an inclusive range into chunk-sized slices', () => {
    expect(splitBlockRangeIntoChunks(1n, 10n, 4n)).toEqual([
      { start: 1n, end: 4n },
      { start: 5n, end: 8n },
      { start: 9n, end: 10n },
    ]);
  });

  it('returns empty when the range is invalid', () => {
    expect(splitBlockRangeIntoChunks(10n, 1n, 4n)).toEqual([]);
  });

  it('does not treat a canonical block as complete when no worker checkpoint advanced past it', async () => {
    const ctx = await createTestPipelineContext();
    await ctx.db.query(
      `INSERT INTO blocks (number, hash, parent_hash, timestamp, is_orphaned)
       VALUES (5, '0x5', '0x4', NOW(), false)`,
    );

    const worker = new BackfillWorker(ctx, 'backfill_test');
    await expect((worker as any).isAlreadyProcessed(5n)).resolves.toBe(false);
  });

  it('treats a canonical block as already processed only after a checkpoint advanced past it', async () => {
    const ctx = await createTestPipelineContext();
    await ctx.db.query(
      `INSERT INTO blocks (number, hash, parent_hash, timestamp, is_orphaned)
       VALUES (5, '0x5', '0x4', NOW(), false)`,
    );
    await ctx.db.query(
      `INSERT INTO sync_checkpoints (worker_name, last_processed_block, last_processed_hash, status, updated_at)
       VALUES ('backfill_test', 5, '0x5', 'running', NOW())`,
    );

    const worker = new BackfillWorker(ctx, 'backfill_test');
    await expect((worker as any).isAlreadyProcessed(5n)).resolves.toBe(true);
  });

  it('processes an older missing backfill block without regressing the worker checkpoint', async () => {
    const historicalHash = '0x5555555555555555555555555555555555555555555555555555555555555555';
    const historicalParentHash = '0x4444444444444444444444444444444444444444444444444444444444444444';
    const latestHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const ctx = await createTestPipelineContext({
      rpc: {
        getBlock: async (args?: { blockNumber?: bigint }) => {
          expect(args?.blockNumber).toBe(5n);
          return {
            number: 5n,
            hash: historicalHash,
            parentHash: historicalParentHash,
            timestamp: 5n,
          } as never;
        },
        getLogs: async () => [],
      },
    });

    await ctx.db.query(
      `INSERT INTO sync_checkpoints (worker_name, last_processed_block, last_processed_hash, status, updated_at)
       VALUES ('backfill_test', 10, $1, 'running', NOW())`,
      [latestHash],
    );

    await processBlock(
      {
        blockNumber: 5n,
        source: 'backfill',
        workerName: 'backfill_test',
      },
      ctx,
    );

    const block = await ctx.db.query<{ hash: string; parent_hash: string; is_orphaned: boolean }>(
      `SELECT hash, parent_hash, is_orphaned FROM blocks WHERE number = 5`,
    );
    expect(block.rows[0]).toEqual({
      hash: historicalHash,
      parent_hash: historicalParentHash,
      is_orphaned: false,
    });

    const checkpoint = await ctx.db.query<{ last_processed_block: string; last_processed_hash: string }>(
      `SELECT last_processed_block, last_processed_hash
       FROM sync_checkpoints
       WHERE worker_name = 'backfill_test'`,
    );
    expect({
      ...checkpoint.rows[0],
      last_processed_block: String(checkpoint.rows[0]?.last_processed_block),
    }).toEqual({
      last_processed_block: '10',
      last_processed_hash: latestHash,
    });
  });
});
