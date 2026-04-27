import { describe, expect, it } from 'vitest';
import { parseFacilitatorAddresses } from '../../src/db/facilitatorSource.js';

describe('parseFacilitatorAddresses', () => {
  it('extracts and deduplicates facilitator addresses for the requested network', () => {
    const html = `
      <div class="card" id="card-coinbase">
        <span class="network-label base">base</span>
        <div class="address-text">0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6</div>
        <span class="network-label solana">solana</span>
        <div class="address-text">L54zkaPQFeTn1UsEqieEXBqWrPShiaZEPD7mS5WXfQg</div>
        <span class="network-label base">base</span>
        <div class="address-text">0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6</div>
      </div>
      <div class="card" id="card-questflow">
        <span class="network-label base">base</span>
        <div class="address-text">0x724efafb051f17ae824afcdf3c0368ae312da264</div>
      </div>
    `;

    expect(parseFacilitatorAddresses(html, 'base')).toEqual([
      {
        address: '0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6',
        name: 'facilitators.x402.watch:coinbase',
      },
      {
        address: '0x724efafb051f17ae824afcdf3c0368ae312da264',
        name: 'facilitators.x402.watch:questflow',
      },
    ]);
  });
});
