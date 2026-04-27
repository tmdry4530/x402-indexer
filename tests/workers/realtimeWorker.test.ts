import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestPipelineContext } from '../helpers/test-context.js';

const processBlockMock = vi.fn();
const withCursorLockMock = vi.fn(async (_workerName, _ctx, fn: () => Promise<unknown>) => fn());

vi.mock('../../src/pipeline/orchestrator.js', () => ({
  processBlock: (input: unknown, ctx: unknown) => processBlockMock(input, ctx),
}));

vi.mock('../../src/db/checkpoints.js', () => ({
  withCursorLock: (workerName: unknown, ctx: unknown, fn: () => Promise<unknown>) =>
    withCursorLockMock(workerName, ctx, fn),
}));

describe('RealtimeWorker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits for finality before queueing a new block', async () => {
    vi.useRealTimers();
    const { RealtimeWorker } = await import('../../src/workers/realtimeWorker.js');
    const ctx = await createTestPipelineContext();
    ctx.config.finalityLag = 2;
    const latestHeights = [11n, 15n];
    ctx.rpc.getBlockNumber = vi.fn(async () => latestHeights.shift() ?? 15n);
    let releaseSleep: (() => void) | undefined;
    const sleeper = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          releaseSleep = resolve;
        }),
    );

    const worker = new RealtimeWorker(ctx, sleeper) as any;
    worker.running = true;

    const pending = worker.onNewBlock(13n);
    await Promise.resolve();
    expect(worker.queue).toEqual([]);
    expect(sleeper).toHaveBeenCalledTimes(1);
    expect(ctx.rpc.getBlockNumber).toHaveBeenCalledTimes(1);

    if (releaseSleep) {
      releaseSleep();
    }
    await pending;
    expect(worker.queue).toEqual([13n]);
    expect(ctx.rpc.getBlockNumber).toHaveBeenCalledTimes(2);
  }, 10000);

  it('records finality polling failures for backfill without crashing the worker', async () => {
    vi.useRealTimers();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { RealtimeWorker } = await import('../../src/workers/realtimeWorker.js');
    const ctx = await createTestPipelineContext();
    const enqueueBackfill = vi.fn(async (_input: { startBlock: bigint; endBlock: bigint }) => undefined);
    ctx.jobs.enqueueBackfill = enqueueBackfill;
    ctx.rpc.getBlockNumber = vi.fn(async () => {
      throw new Error('over rate limit');
    });

    const worker = new RealtimeWorker(ctx, async () => undefined) as any;
    worker.running = true;

    await expect(worker.onNewBlock(42n)).resolves.toBeUndefined();

    expect(worker.queue).toEqual([]);
    expect(enqueueBackfill).toHaveBeenCalledWith({ startBlock: 42n, endBlock: 42n });
    expect(errorSpy).toHaveBeenCalledWith(
      '[realtime] finality wait failed',
      42n,
      expect.any(Error),
    );
    errorSpy.mockRestore();
  }, 10000);

  it('requeues failed realtime blocks into backfill recovery', async () => {
    vi.useRealTimers();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { RealtimeWorker } = await import('../../src/workers/realtimeWorker.js');
    const ctx = await createTestPipelineContext();
    const enqueueBackfill = vi.fn(async (_input: { startBlock: bigint; endBlock: bigint }) => undefined);
    ctx.jobs.enqueueBackfill = async (input) => {
      await enqueueBackfill(input);
      (worker as any).running = false;
    };
    processBlockMock.mockRejectedValueOnce(new Error('boom'));

    const worker = new RealtimeWorker(ctx, async () => undefined) as any;
    worker.running = true;
    worker.queue.push(7n);

    await worker.consumeLoop();

    expect(enqueueBackfill).toHaveBeenCalledWith({ startBlock: 7n, endBlock: 7n });
    expect(processBlockMock).toHaveBeenCalledWith(
      {
        blockNumber: 7n,
        source: 'realtime',
        workerName: 'realtime',
      },
      ctx,
    );
    errorSpy.mockRestore();
  }, 10000);

  it('delegates missed realtime gaps to backfill instead of treating them as reorgs', async () => {
    vi.useRealTimers();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { RealtimeWorker } = await import('../../src/workers/realtimeWorker.js');
    const ctx = await createTestPipelineContext();
    const enqueueBackfill = vi.fn(async (_input: { startBlock: bigint; endBlock: bigint }) => undefined);
    ctx.jobs.enqueueBackfill = enqueueBackfill;
    await ctx.db.query(
      `INSERT INTO sync_checkpoints (worker_name, last_processed_block, last_processed_hash, status, updated_at)
       VALUES ('realtime', 10, '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'running', NOW())`,
    );

    const worker = new RealtimeWorker(ctx, async () => undefined) as any;
    await worker.handle(13n);
    await worker.handle(14n);

    expect(enqueueBackfill).toHaveBeenNthCalledWith(1, { startBlock: 11n, endBlock: 13n });
    expect(enqueueBackfill).toHaveBeenNthCalledWith(2, { startBlock: 14n, endBlock: 14n });
    expect(processBlockMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      '[realtime] gap detected, delegated to backfill',
      {
        lastProcessedBlock: 10n,
        blockNumber: 13n,
      },
    );
    errorSpy.mockRestore();
  }, 10000);

  it('continues from the backfill checkpoint after backfill catches up a realtime gap', async () => {
    vi.useRealTimers();
    const { RealtimeWorker } = await import('../../src/workers/realtimeWorker.js');
    const ctx = await createTestPipelineContext();
    const backfillHash = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    await ctx.db.query(
      `INSERT INTO sync_checkpoints (worker_name, last_processed_block, last_processed_hash, status, updated_at)
       VALUES
         ('realtime', 10, '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'reorged', NOW()),
         ('backfill_default', 12, $1, 'running', NOW())`,
      [backfillHash],
    );

    const worker = new RealtimeWorker(ctx, async () => undefined) as any;
    await worker.handle(13n);

    expect(processBlockMock).toHaveBeenCalledWith(
      {
        blockNumber: 13n,
        source: 'realtime',
        workerName: 'realtime',
      },
      ctx,
    );

    const checkpoint = await ctx.db.query<{ last_processed_block: string | number; last_processed_hash: string; status: string }>(
      `SELECT last_processed_block, last_processed_hash, status
       FROM sync_checkpoints
       WHERE worker_name = 'realtime'`,
    );
    expect({
      ...checkpoint.rows[0],
      last_processed_block: String(checkpoint.rows[0]?.last_processed_block),
    }).toEqual({
      last_processed_block: '12',
      last_processed_hash: backfillHash,
      status: 'running',
    });
  }, 10000);
});
