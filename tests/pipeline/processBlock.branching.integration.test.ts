import { afterEach, describe, expect, it, vi } from 'vitest';
import { processBlock } from '../../src/pipeline/orchestrator.js';
import { createTestPipelineContext } from '../helpers/test-context.js';

const asset = '0x1111111111111111111111111111111111111111';
const proxy = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const payer = '0x3333333333333333333333333333333333333333';
const payTo = '0x4444444444444444444444444444444444444444';
const txHash = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const txHash2 = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
const blockHash = '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
const parentHash = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const authTopic = '0x98de503528ee59b575ef0c0a2576a82497bfc029a5685b209e9ec333479b10a5';
const weth = '0x4200000000000000000000000000000000000006';

function stubExternalLookups(): void {
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
}

describe('processBlock branching integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores only the block and advances the checkpoint when no transfer logs are found', async () => {
    const ctx = await createTestPipelineContext({
      knownAssets: [asset],
      rpc: {
        getBlock: async () =>
          ({
            number: 1n,
            hash: blockHash,
            parentHash,
            timestamp: 1_700_000_000n,
          }) as never,
        getLogs: async () => [] as never,
      },
    });

    await processBlock({ blockNumber: 1n, source: 'realtime', workerName: 'realtime' }, ctx);

    await expect(ctx.db.query(`SELECT * FROM blocks WHERE number = 1`)).resolves.toMatchObject({
      rows: [{ number: 1 }],
    });
    await expect(ctx.db.query(`SELECT * FROM transactions`)).resolves.toMatchObject({ rows: [] });
    await expect(ctx.db.query(`SELECT * FROM x402_evidence`)).resolves.toMatchObject({ rows: [] });
    await expect(
      ctx.db.query(`SELECT last_processed_block FROM sync_checkpoints WHERE worker_name = 'realtime'`),
    ).resolves.toMatchObject({
      rows: [{ last_processed_block: 1 }],
    });
  }, 30000);

  it('quarantines low-confidence evidence without promoting it into payments or daily stats', async () => {
    const ctx = await createTestPipelineContext({
      facilitatorFilterMode: 'soft',
      knownAssets: [asset],
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
              args: { from: payer, to: payTo, value: 1_000_000n },
              transactionHash: txHash,
              logIndex: 0n,
              data: '0x',
              topics: ['0xddf252ad'],
            },
          ] as never,
        getTransaction: async () =>
          ({
            hash: txHash,
            from: '0xffffffffffffffffffffffffffffffffffffffff',
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
            ],
          }) as never,
        getBytecode: async () => '0x',
      },
    });

    await processBlock({ blockNumber: 1n, source: 'realtime', workerName: 'realtime' }, ctx);

    await expect(ctx.db.query(`SELECT confidence FROM x402_evidence`)).resolves.toMatchObject({
      rows: [{ confidence: 30 }],
    });
    await expect(ctx.db.query(`SELECT * FROM payments`)).resolves.toMatchObject({ rows: [] });
    await expect(ctx.db.query(`SELECT * FROM agent_daily_stats`)).resolves.toMatchObject({ rows: [] });
    await expect(
      ctx.db.query(`SELECT last_processed_block FROM sync_checkpoints WHERE worker_name = 'realtime'`),
    ).resolves.toMatchObject({
      rows: [{ last_processed_block: 1 }],
    });
  }, 30000);

  it('stores only the block when transfer logs exist but none pass candidate validation', async () => {
    const ctx = await createTestPipelineContext({
      facilitatorFilterMode: 'soft',
      knownAssets: [asset],
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
              args: { from: payer, to: payTo, value: 1_000_000n },
              transactionHash: txHash,
              logIndex: 0n,
              data: '0x',
              topics: ['0xddf252ad'],
            },
          ] as never,
        getTransaction: async () =>
          ({
            hash: txHash,
            from: payer,
            to: asset,
            input: '0xdeadbeef00000000',
            value: 0n,
          }) as never,
        getTransactionReceipt: async () =>
          ({
            transactionHash: txHash,
            status: 'success',
            gasUsed: 21_000n,
            effectiveGasPrice: 1_000_000_000n,
            logs: [],
          }) as never,
      },
    });

    await processBlock({ blockNumber: 1n, source: 'realtime', workerName: 'realtime' }, ctx);

    await expect(ctx.db.query(`SELECT * FROM blocks WHERE number = 1`)).resolves.toMatchObject({
      rows: [{ number: 1 }],
    });
    await expect(ctx.db.query(`SELECT * FROM x402_evidence`)).resolves.toMatchObject({ rows: [] });
    await expect(ctx.db.query(`SELECT * FROM payments`)).resolves.toMatchObject({ rows: [] });
  }, 30000);

  it('keeps multiple payment evidence rows from a single transaction and aggregates both', async () => {
    stubExternalLookups();
    const ctx = await createTestPipelineContext({
      facilitatorFilterMode: 'soft',
      knownAssets: [asset],
      knownFacilitators: [payer],
      knownProxies: [proxy],
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
              args: { from: payer, to: payTo, value: 1_000_000n },
              transactionHash: txHash2,
              logIndex: 0n,
              data: '0x',
              topics: ['0xddf252ad'],
            },
            {
              address: asset,
              args: { from: payer, to: payTo, value: 2_000_000n },
              transactionHash: txHash2,
              logIndex: 1n,
              data: '0x',
              topics: ['0xddf252ad'],
            },
          ] as never,
        getTransaction: async () =>
          ({
            hash: txHash2,
            from: payer,
            to: proxy,
            input: '0xe3ee160e00000000',
            value: 0n,
          }) as never,
        getTransactionReceipt: async () =>
          ({
            transactionHash: txHash2,
            status: 'success',
            gasUsed: 21_000n,
            effectiveGasPrice: 1_000_000_000n,
            logs: [
              { address: asset, topics: ['0xddf252ad'], data: '0x', logIndex: 0n },
              { address: asset, topics: ['0xddf252ad'], data: '0x', logIndex: 1n },
              { address: asset, topics: [authTopic], data: '0x', logIndex: 2n },
            ],
          }) as never,
        getBytecode: async () => '0x',
      },
    });

    await processBlock({ blockNumber: 1n, source: 'realtime', workerName: 'realtime' }, ctx);

    await expect(
      ctx.db.query(`SELECT transaction_hash, log_index, amount_usd FROM payments ORDER BY log_index ASC`),
    ).resolves.toMatchObject({
      rows: [
        { transaction_hash: txHash2, log_index: 0, amount_usd: 1 },
        { transaction_hash: txHash2, log_index: 1, amount_usd: 2 },
      ],
    });
    await expect(ctx.db.query(`SELECT payment_count, total_spent_usd FROM agent_daily_stats`)).resolves.toMatchObject({
      rows: [{ payment_count: 2, total_spent_usd: 3 }],
    });
    await expect(ctx.db.query(`SELECT * FROM interactions`)).resolves.toMatchObject({
      rows: [
        {
          transaction_hash: txHash2,
          function_selector: '0xe3ee160e',
        },
      ],
    });
  }, 30000);

  it('promotes a real-world-shaped direct EIP-3009 payment even when facilitator matching is absent', async () => {
    stubExternalLookups();
    const ctx = await createTestPipelineContext({
      facilitatorFilterMode: 'soft',
      knownAssets: ['0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'],
      rpc: {
        getBlock: async () =>
          ({
            number: 44996677n,
            hash: blockHash,
            parentHash,
            timestamp: 1_700_000_000n,
          }) as never,
        getLogs: async () =>
          [
            {
              address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
              args: {
                from: '0xB6Be9b4F56FB7786F2e0A7e3f648f4F619Ba51Cc',
                to: '0x325bdF6F7efAB24a2210c48c1b64cAb2eAe1d430',
                value: 10000n,
              },
              transactionHash: '0x833e9ae8920e3bfc363f7045c7d2f25b76715bfbea75274c16fce54ac077c9cf',
              logIndex: 1437n,
              data: '0x',
              topics: ['0xddf252ad'],
            },
          ] as never,
        getTransaction: async () =>
          ({
            hash: '0x833e9ae8920e3bfc363f7045c7d2f25b76715bfbea75274c16fce54ac077c9cf',
            from: '0x8f5cb67b49555e614892b7233cfddebfb746e531',
            to: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            input: '0xe3ee160e000000000000000000000000b6be9b4f56fb7786f2e0a7e3f648f4f619ba51cc000000000000000000000000325bdf6f7efab24a2210c48c1b64cab2eae1d43000000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000069e78b120000000000000000000000000000000000000000000000000000000069e78e96a739cb6bab17f7a5614f60b7b4b4e91d94c591ed9ba2f608591f734bf68b0ef5000000000000000000000000000000000000000000000000000000000000001c9849da19ad5d1ce09bfe7f004f0bee441d35a16db5e7e93fff3ec3d18e9d0bc61ae220af2d720d93a43c87a3f9de7f198b659d8888ad1a816d52e557322b4727',
            value: 0n,
          }) as never,
        getTransactionReceipt: async () =>
          ({
            transactionHash: '0x833e9ae8920e3bfc363f7045c7d2f25b76715bfbea75274c16fce54ac077c9cf',
            status: 'success',
            gasUsed: 109517n,
            effectiveGasPrice: 1_000_000_000n,
            logs: [
              {
                address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
                topics: [authTopic],
                data: '0x',
                logIndex: 1436n,
              },
              {
                address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
                topics: ['0xddf252ad'],
                data: '0x',
                logIndex: 1437n,
              },
            ],
          }) as never,
        getBytecode: async () => '0x',
      },
    });

    await processBlock({ blockNumber: 44996677n, source: 'backfill', workerName: 'backfill_test' }, ctx);

    await expect(ctx.db.query(`SELECT confidence FROM x402_evidence`)).resolves.toMatchObject({
      rows: [{ confidence: 80 }],
    });
    await expect(ctx.db.query(`SELECT payer, pay_to FROM payments`)).resolves.toMatchObject({
      rows: [
        {
          payer: '0xB6Be9b4F56FB7786F2e0A7e3f648f4F619Ba51Cc',
          pay_to: '0x325bdF6F7efAB24a2210c48c1b64cAb2eAe1d430',
        },
      ],
    });
  }, 30000);
});
