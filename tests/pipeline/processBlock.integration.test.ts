import { afterEach, describe, expect, it, vi } from 'vitest';
import { processBlock } from '../../src/pipeline/orchestrator.js';
import { createTestPipelineContext } from '../helpers/test-context.js';

const asset = '0x1111111111111111111111111111111111111111';
const facilitator = '0x2222222222222222222222222222222222222222';
const payer = '0x3333333333333333333333333333333333333333';
const payTo = '0x4444444444444444444444444444444444444444';
const txHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const blockHash = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const parentHash = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
const authTopic = '0x98de503528ee59b575ef0c0a2576a82497bfc029a5685b209e9ec333479b10a5';
const weth = '0x4200000000000000000000000000000000000006';

describe('processBlock integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists a promoted payment flow end-to-end', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('coins.llama.fi')) {
        const address = url.split('base:')[1];
        const price = address?.toLowerCase() === weth ? 2000 : 1;
        return {
          ok: true,
          json: async () => ({
            coins: {
              [`base:${address}`]: { price },
            },
          }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({
          result: {
            function: {
              '0xe3ee160e': [{ name: 'transferWithAuthorization' }],
            },
          },
        }),
      } as Response;
    }));

    const ctx = await createTestPipelineContext({
      facilitatorFilterMode: 'soft',
      knownAssets: [asset],
      knownFacilitators: [facilitator],
      rpc: {
        getBlock: async () =>
          ({
            number: 1n,
            hash: blockHash,
            parentHash,
            timestamp: 1_700_000_000n,
          }) as never,
        getLogs: async () =>
          [
            {
              address: asset,
              args: {
                from: payer,
                to: payTo,
                value: 1_000_000n,
              },
              transactionHash: txHash,
              logIndex: 0n,
              data: '0x',
              topics: ['0xddf252ad'],
            },
          ] as never,
        getTransaction: async () =>
          ({
            hash: txHash,
            from: facilitator,
            to: asset,
            input: '0xe3ee160e00000000',
            value: 0n,
          }) as never,
        getTransactionReceipt: async () =>
          ({
            transactionHash: txHash,
            status: 'success',
            gasUsed: 21_000n,
            effectiveGasPrice: 1_000_000_000n,
            logs: [
              {
                address: asset,
                topics: ['0xddf252ad'],
                data: '0x',
                logIndex: 0n,
              },
              {
                address: asset,
                topics: [authTopic],
                data: '0x',
                logIndex: 1n,
              },
            ],
          }) as never,
        getBytecode: async () => '0x',
      },
    });

    await processBlock(
      {
        blockNumber: 1n,
        source: 'realtime',
        workerName: 'realtime',
      },
      ctx,
    );

    const payments = await ctx.db.query(`SELECT * FROM payments`);
    const stats = await ctx.db.query(`SELECT * FROM agent_daily_stats`);
    const checkpoints = await ctx.db.query(
      `SELECT last_processed_block FROM sync_checkpoints WHERE worker_name = 'realtime'`,
    );
    const signatures = await ctx.db.query(`SELECT * FROM function_signatures`);

    expect(payments.rows).toHaveLength(1);
    expect(stats.rows).toHaveLength(1);
    expect(Number(stats.rows[0].total_spent_usd)).toBe(1);
    expect(Number(stats.rows[0].total_gas_usd)).toBeGreaterThan(0);
    expect(BigInt(checkpoints.rows[0].last_processed_block)).toBe(1n);
    expect(signatures.rows).toHaveLength(1);
  }, 30000);
});
