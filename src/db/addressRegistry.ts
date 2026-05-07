import type { Address } from 'viem';
import type { PipelineContext } from '../pipeline/types.js';
import { queryMany } from './helpers.js';

interface AddressRegistryRow {
  address: Address;
  type: string;
}

// DB의 address_registry를 in-memory Set 레지스트리에 반영한다.
// blockNumber가 있으면 valid_from/to window를 적용해 백필 시점 기준의 주소 세트를 만든다.
export async function refreshAddressRegistry(
  ctx: Pick<PipelineContext, 'db' | 'registry'>,
  blockNumber?: bigint,
): Promise<void> {
  // blocks를 과거부터 다시 처리할 수 있으므로 "현재 최신 레지스트리"가 아니라
  // 해당 블록 높이에서 유효한 주소만 읽어 candidate 필터의 시간 정합성을 유지한다.
  const params: string[] = [];
  const clauses: string[] = [];

  if (blockNumber !== undefined) {
    params.push(blockNumber.toString(), blockNumber.toString());
    clauses.push(`(valid_from_block IS NULL OR valid_from_block <= $1)`);
    clauses.push(`(valid_to_block IS NULL OR valid_to_block > $2)`);
  }

  const rows = await queryMany<AddressRegistryRow>(
    ctx.db,
    `SELECT address, type
     FROM address_registry
     ${clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''}`,
    params,
  );

  // 기존 Set을 authoritative하게 비운 뒤 DB 결과로 다시 채운다.
  // append-only merge로 두면 만료된 facilitator/proxy가 계속 candidate에 남을 수 있다.
  ctx.registry.knownAssets.clear();
  ctx.registry.knownFacilitators.clear();
  ctx.registry.knownProxies.clear();

  for (const row of rows) {
    if (row.type === 'asset') {
      ctx.registry.knownAssets.add(row.address);
    } else if (row.type === 'facilitator') {
      ctx.registry.knownFacilitators.add(row.address);
    } else if (row.type === 'proxy') {
      ctx.registry.knownProxies.add(row.address);
    }
  }
}

// env 또는 외부 source에서 얻은 known address를 address_registry에 seed한다.
// address를 기준으로 upsert해 운영자가 나중에 name/type을 확인할 수 있게 한다.
export async function seedAddressRegistry(
  db: { query: (sql: string, params?: unknown[]) => Promise<unknown> },
  rows: Array<{ address: string; type: string; name: string | null }>,
): Promise<void> {
  for (const row of rows) {
    await db.query(
      `INSERT INTO address_registry (address, type, name, valid_from_block, valid_to_block)
       VALUES ($1, $2, $3, NULL, NULL)
       ON CONFLICT (address) DO UPDATE SET type = EXCLUDED.type, name = EXCLUDED.name`,
      [row.address, row.type, row.name],
    );
  }
}
