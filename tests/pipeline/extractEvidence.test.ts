import { describe, expect, it } from 'vitest';
import { extractEvidence } from '../../src/pipeline/steps/extractEvidence.js';
import { createTestPipelineContext } from '../helpers/test-context.js';

const asset = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const payer = '0xB6Be9b4F56FB7786F2e0A7e3f648f4F619Ba51Cc';
const payTo = '0x325bdF6F7efAB24a2210c48c1b64cAb2eAe1d430';
const txHash = '0x833e9ae8920e3bfc363f7045c7d2f25b76715bfbea75274c16fce54ac077c9cf';
const authTopic = '0x98de503528ee59b575ef0c0a2576a82497bfc029a5685b209e9ec333479b10a5';

describe('extractEvidence', () => {
  it('promotes direct EIP-3009 evidence when calldata matches the transfer log', async () => {
    const ctx = await createTestPipelineContext({
      knownAssets: [asset],
    });
    await ctx.db.query(
      `INSERT INTO blocks (number, hash, parent_hash, timestamp, is_orphaned)
       VALUES (44996677, '0xblock', '0xparent', NOW(), false)`,
    );
    await ctx.db.query(
      `INSERT INTO transactions (hash, block_number, from_address, to_address, input, value, status, gas_used, effective_gas_price)
       VALUES ($1, 44996677, $2, $3, $4, 0, 1, 109517, 1000000000)`,
      [
        txHash,
        '0x8f5cb67b49555e614892b7233cfddebfb746e531',
        asset,
        '0xe3ee160e000000000000000000000000b6be9b4f56fb7786f2e0a7e3f648f4f619ba51cc000000000000000000000000325bdf6f7efab24a2210c48c1b64cab2eae1d43000000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000069e78b120000000000000000000000000000000000000000000000000000000069e78e96a739cb6bab17f7a5614f60b7b4b4e91d94c591ed9ba2f608591f734bf68b0ef5000000000000000000000000000000000000000000000000000000000000001c9849da19ad5d1ce09bfe7f004f0bee441d35a16db5e7e93fff3ec3d18e9d0bc61ae220af2d720d93a43c87a3f9de7f198b659d8888ad1a816d52e557322b4727',
      ],
    );

    const evidence = await extractEvidence(
      [
        {
          txHash: txHash as never,
          logIndex: 1437,
          blockNumber: 44996677n,
          transferLog: {
            address: asset as never,
            blockNumber: 44996677n,
            transactionHash: txHash as never,
            logIndex: 1437,
            from: payer as never,
            to: payTo as never,
            value: 10000n,
            raw: {} as never,
          },
          tx: {
            hash: txHash,
            from: '0x8f5cb67b49555e614892b7233cfddebfb746e531',
            to: asset,
            input: '0xe3ee160e000000000000000000000000b6be9b4f56fb7786f2e0a7e3f648f4f619ba51cc000000000000000000000000325bdf6f7efab24a2210c48c1b64cab2eae1d43000000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000069e78b120000000000000000000000000000000000000000000000000000000069e78e96a739cb6bab17f7a5614f60b7b4b4e91d94c591ed9ba2f608591f734bf68b0ef5000000000000000000000000000000000000000000000000000000000000001c9849da19ad5d1ce09bfe7f004f0bee441d35a16db5e7e93fff3ec3d18e9d0bc61ae220af2d720d93a43c87a3f9de7f198b659d8888ad1a816d52e557322b4727',
            value: 0n,
          } as never,
          receipt: {
            status: 'success',
            logs: [
              {
                topics: [authTopic],
              },
            ],
          } as never,
        },
      ],
      ctx,
    );

    expect(evidence[0]?.confidence).toBe(80);
    await expect(ctx.db.query(`SELECT confidence FROM x402_evidence`)).resolves.toMatchObject({
      rows: [{ confidence: 80 }],
    });
  });
});
