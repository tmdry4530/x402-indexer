import { describe, expect, it } from 'vitest';
import { refreshAddressRegistry } from '../../src/db/addressRegistry.js';
import { createTestPipelineContext } from '../helpers/test-context.js';

describe('refreshAddressRegistry', () => {
  it('rebuilds registry membership for the requested block window', async () => {
    const ctx = await createTestPipelineContext();
    await ctx.db.query(
      `INSERT INTO address_registry (address, type, name, valid_from_block, valid_to_block)
       VALUES
       ('0x1111111111111111111111111111111111111111', 'asset', 'asset-a', NULL, 5),
       ('0x2222222222222222222222222222222222222222', 'asset', 'asset-b', 5, NULL),
       ('0x3333333333333333333333333333333333333333', 'facilitator', 'fac-a', NULL, NULL)`,
    );

    await refreshAddressRegistry(ctx, 4n);
    expect([...ctx.registry.knownAssets]).toEqual(['0x1111111111111111111111111111111111111111']);
    expect([...ctx.registry.knownFacilitators]).toEqual(['0x3333333333333333333333333333333333333333']);

    await refreshAddressRegistry(ctx, 5n);
    expect([...ctx.registry.knownAssets]).toEqual(['0x2222222222222222222222222222222222222222']);
    expect([...ctx.registry.knownFacilitators]).toEqual(['0x3333333333333333333333333333333333333333']);
  });
});
