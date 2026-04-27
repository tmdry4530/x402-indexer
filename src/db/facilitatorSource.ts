import type { Pool } from 'pg';

// facilitators.x402.watch에서 추출한 facilitator 주소와 source label.
// name에는 provider/card id를 포함해 DB에서 출처 추적이 가능하게 한다.
export interface FacilitatorAddressRow {
  address: string;
  name: string;
}

// facilitator registry HTML에서 특정 network의 주소만 추출한다.
// 외부 사이트가 JSON API를 제공하지 않으므로 card block + network label 패턴을 보수적으로 파싱한다.
export function parseFacilitatorAddresses(html: string, network: string): FacilitatorAddressRow[] {
  // class label과 표시 label 둘 중 하나가 network와 맞으면 해당 주소를 채택한다.
  const networkClass = network.trim().toLowerCase();
  const rows: FacilitatorAddressRow[] = [];
  const cardBlocks = html.split('<div class="card"');

  for (const block of cardBlocks) {
    const cardId = block.match(/id=\"card-([^\"]+)\"/)?.[1];
    if (!cardId) {
      continue;
    }

    const matches = block.matchAll(
      /<span class=\"network-label ([^\"]+)\">([^<]+)<\/span>\s*<div class=\"address-text\">(0x[a-fA-F0-9]{40})<\/div>/g,
    );
    for (const match of matches) {
      const classNetwork = match[1]?.trim().toLowerCase();
      const labelNetwork = match[2]?.trim().toLowerCase();
      const address = match[3];
      if (!address) {
        continue;
      }
      if (classNetwork !== networkClass && labelNetwork !== networkClass) {
        continue;
      }
      rows.push({
        address: address.toLowerCase(),
        name: `facilitators.x402.watch:${cardId}`,
      });
    }
  }

  return [...new Map(rows.map((row) => [row.address, row])).values()];
}

// facilitator source URL을 fetch해서 network별 주소 목록으로 변환한다.
// 부팅 실패를 막기 위해 호출부(index.ts)가 예외를 잡고 env/db seed fallback으로 진행한다.
export async function loadFacilitatorAddresses(
  sourceUrl: string,
  network: string,
): Promise<FacilitatorAddressRow[]> {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`facilitator source request failed: ${response.status}`);
  }
  const html = await response.text();
  return parseFacilitatorAddresses(html, network);
}

// 파싱된 facilitator 주소를 address_registry에 반영한다.
// 이전 source sync 주소 중 현재 목록에서 사라진 주소는 제거해 DB를 source-authoritative하게 유지한다.
export async function seedFacilitatorAddresses(
  db: Pool,
  rows: FacilitatorAddressRow[],
): Promise<void> {
  // source 이름 prefix로 env 수동 등록 facilitator와 자동 sync facilitator를 분리한다.
  const sourceNames = [...new Set(rows.map((row) => row.name))];
  if (sourceNames.length > 0) {
    await db.query(
      `DELETE FROM address_registry
       WHERE type = 'facilitator'
         AND name LIKE 'facilitators.x402.watch:%'
         AND address NOT IN (${rows.map((_, index) => `$${index + 1}`).join(', ')})`,
      rows.map((row) => row.address),
    );
  } else {
    await db.query(
      `DELETE FROM address_registry
       WHERE type = 'facilitator'
         AND name LIKE 'facilitators.x402.watch:%'`,
    );
  }

  for (const row of rows) {
    await db.query(
      `INSERT INTO address_registry (address, type, name, valid_from_block, valid_to_block)
       VALUES ($1, 'facilitator', $2, NULL, NULL)
       ON CONFLICT (address) DO UPDATE SET
         type = EXCLUDED.type,
         name = EXCLUDED.name`,
      [row.address, row.name],
    );
  }
}
