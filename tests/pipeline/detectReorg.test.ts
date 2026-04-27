import { describe, expect, it } from 'vitest';
import { detectReorg } from '../../src/pipeline/steps/detectReorg.js';
import { createTestPipelineContext } from '../helpers/test-context.js';

const block1Hash = '0x1111111111111111111111111111111111111111111111111111111111111111';
const block2Hash = '0x2222222222222222222222222222222222222222222222222222222222222222';
const block3Hash = '0x3333333333333333333333333333333333333333333333333333333333333333';
const block4Hash = '0x4444444444444444444444444444444444444444444444444444444444444444';
const altParentHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

describe('detectReorg', () => {
  it('treats the first processed block as canonical when no checkpoint exists', async () => {
    const ctx = await createTestPipelineContext();

    await expect(
      detectReorg(
        {
          number: 1n,
          hash: block1Hash as never,
          parentHash: '0x0' as never,
          timestamp: 1n,
        },
        'realtime',
        ctx,
      ),
    ).resolves.toEqual({ valid: true });
  }, 15000);

  it('accepts a block when parentHash matches the worker checkpoint hash', async () => {
    const ctx = await createTestPipelineContext();
    await ctx.db.query(
      `INSERT INTO sync_checkpoints (worker_name, last_processed_block, last_processed_hash, status, updated_at)
       VALUES ('realtime', 2, $1, 'running', NOW())`,
      [block2Hash],
    );

    await expect(
      detectReorg(
        {
          number: 3n,
          hash: block3Hash as never,
          parentHash: block2Hash as never,
          timestamp: 3n,
        },
        'realtime',
        ctx,
      ),
    ).resolves.toEqual({ valid: true });
  }, 15000);

  it('returns the common ancestor when parentHash diverges from the checkpoint hash', async () => {
    const ctx = await createTestPipelineContext({
      rpc: {
        getBlock: async (args?: { blockNumber?: bigint }) => {
          const blockNumber = args?.blockNumber;
          if (blockNumber === 3n) {
            return { hash: altParentHash } as never;
          }
          if (blockNumber === 2n) {
            return { hash: block2Hash } as never;
          }
          throw new Error(`unexpected block lookup ${(blockNumber ?? -1n).toString()}`);
        },
      },
    });

    await ctx.db.query(
      `INSERT INTO blocks (number, hash, parent_hash, timestamp, is_orphaned)
       VALUES
       (1, $1, '0x0', NOW(), false),
       (2, $2, $1, NOW(), false),
       (3, $3, $2, NOW(), false)`,
      [block1Hash, block2Hash, block3Hash],
    );
    await ctx.db.query(
      `INSERT INTO sync_checkpoints (worker_name, last_processed_block, last_processed_hash, status, updated_at)
       VALUES ('realtime', 3, $1, 'running', NOW())`,
      [block3Hash],
    );

    await expect(
      detectReorg(
        {
          number: 4n,
          hash: block4Hash as never,
          parentHash: altParentHash as never,
          timestamp: 4n,
        },
        'realtime',
        ctx,
      ),
    ).resolves.toEqual({
      valid: false,
      currentBlockNumber: 4n,
      localHash: block3Hash,
      canonicalHash: altParentHash,
      commonAncestorBlock: 2n,
    });
  }, 15000);

  it('throws when the reorg depth exceeds the configured limit', async () => {
    const ctx = await createTestPipelineContext({
      rpc: {
        getBlock: async (args?: { blockNumber?: bigint }) =>
          ({ hash: `0x${String(args?.blockNumber ?? 0n).padStart(64, '9')}` }) as never,
      },
    });

    await ctx.db.query(
      `INSERT INTO blocks (number, hash, parent_hash, timestamp, is_orphaned)
       VALUES
       (1, $1, '0x0', NOW(), false),
       (2, $2, $1, NOW(), false),
       (3, $3, $2, NOW(), false)`,
      [block1Hash, block2Hash, block3Hash],
    );
    await ctx.db.query(
      `INSERT INTO sync_checkpoints (worker_name, last_processed_block, last_processed_hash, status, updated_at)
       VALUES ('realtime', 3, $1, 'running', NOW())`,
      [block3Hash],
    );

    await expect(
      detectReorg(
        {
          number: 4n,
          hash: block4Hash as never,
          parentHash: altParentHash as never,
          timestamp: 4n,
        },
        'realtime',
        {
          ...ctx,
          config: {
            ...ctx.config,
            maxReorgDepth: 1,
          },
        },
      ),
    ).rejects.toThrow('reorg too deep');
  }, 15000);

  it('allows non-sequential historical backfill without treating the latest cursor as the parent', async () => {
    const ctx = await createTestPipelineContext();
    await ctx.db.query(
      `INSERT INTO sync_checkpoints (worker_name, last_processed_block, last_processed_hash, status, updated_at)
       VALUES ('backfill_test', 100, $1, 'running', NOW())`,
      [block3Hash],
    );

    await expect(
      detectReorg(
        {
          number: 10n,
          hash: block1Hash as never,
          parentHash: altParentHash as never,
          timestamp: 10n,
        },
        'backfill_test',
        ctx,
        { allowNonSequentialBackfill: true },
      ),
    ).resolves.toEqual({ valid: true });
  }, 15000);
});
