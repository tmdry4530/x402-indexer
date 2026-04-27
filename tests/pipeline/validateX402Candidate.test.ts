import { describe, expect, it } from 'vitest';
import { validateX402Candidates } from '../../src/pipeline/steps/validateX402Candidate.js';
import { createTestPipelineContext } from '../helpers/test-context.js';

const asset = '0x1111111111111111111111111111111111111111';
const facilitator = '0x2222222222222222222222222222222222222222';
const payer = '0x3333333333333333333333333333333333333333';
const payTo = '0x4444444444444444444444444444444444444444';
const txHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

describe('validateX402Candidates', () => {
  it('keeps a candidate in soft mode when facilitator is unknown', async () => {
    const ctx = await createTestPipelineContext({
      facilitatorFilterMode: 'soft',
      knownAssets: [asset],
      rpc: {
        getTransaction: async () =>
          ({
            hash: txHash,
            from: payer,
            to: asset,
            input: '0xe3ee160e00000000',
            value: 0n,
          }) as never,
        getTransactionReceipt: async () =>
          ({
            transactionHash: txHash,
            status: 'success',
            gasUsed: 1n,
            effectiveGasPrice: 1n,
            logs: [],
          }) as never,
      },
    });

    const candidates = await validateX402Candidates(
      [
        {
          address: asset as never,
          blockNumber: 1n,
          transactionHash: txHash as never,
          logIndex: 0,
          from: payer as never,
          to: payTo as never,
          value: 1_000_000n,
          raw: {} as never,
        },
      ],
      ctx,
    );

    expect(candidates).toHaveLength(1);
  });

  it('rejects a candidate in hard mode when facilitator is unknown', async () => {
    const ctx = await createTestPipelineContext({
      facilitatorFilterMode: 'hard',
      knownAssets: [asset],
      knownFacilitators: [facilitator],
      rpc: {
        getTransaction: async () =>
          ({
            hash: txHash,
            from: payer,
            to: asset,
            input: '0xe3ee160e00000000',
            value: 0n,
          }) as never,
        getTransactionReceipt: async () =>
          ({
            transactionHash: txHash,
            status: 'success',
            gasUsed: 1n,
            effectiveGasPrice: 1n,
            logs: [],
          }) as never,
      },
    });

    const candidates = await validateX402Candidates(
      [
        {
          address: asset as never,
          blockNumber: 1n,
          transactionHash: txHash as never,
          logIndex: 0,
          from: payer as never,
          to: payTo as never,
          value: 1_000_000n,
          raw: {} as never,
        },
      ],
      ctx,
    );

    expect(candidates).toHaveLength(0);
  });
});
