import { EventEmitter } from 'node:events';
import { newDb } from 'pg-mem';
import type { Pool } from 'pg';
import type { PipelineContext } from '../../src/pipeline/types.js';
import { applyMigrations } from '../../src/db/client.js';

export interface TestContextOptions {
  facilitatorFilterMode?: 'hard' | 'soft';
  knownAssets?: string[];
  knownFacilitators?: string[];
  knownProxies?: string[];
  rpc?: Partial<PipelineContext['rpc']>;
}

export async function createTestDb(): Promise<Pool> {
  const mem = newDb({
    autoCreateForeignKeyIndices: true,
  });
  const adapter = mem.adapters.createPg();
  const pool = new adapter.Pool();
  await applyMigrations(pool);
  return pool;
}

export function createTestRedis(): PipelineContext['redis'] {
  const clientEmitter = new EventEmitter();
  const store = new Map<string, string>();

  return {
    on: (event, listener) => clientEmitter.on(event, listener),
    get: async (key) => store.get(key) ?? null,
    setex: async (key, _seconds, value) => {
      store.set(key, value);
      return 'OK';
    },
    scanStream: () => {
      const emitter = new EventEmitter();
      queueMicrotask(() => {
        emitter.emit('end');
      });
      return emitter;
    },
    del: async () => 0,
    quit: async () => 'OK',
  };
}

export async function createTestPipelineContext(
  options: TestContextOptions = {},
): Promise<PipelineContext> {
  const db = await createTestDb();
  const knownAssets = options.knownAssets ?? [];
  const knownFacilitators = options.knownFacilitators ?? [];
  const knownProxies = options.knownProxies ?? [];

  for (const address of knownAssets) {
    await db.query(
      `INSERT INTO address_registry (address, type, name, valid_from_block, valid_to_block)
       VALUES ($1, 'asset', NULL, NULL, NULL)`,
      [address],
    );
  }
  for (const address of knownFacilitators) {
    await db.query(
      `INSERT INTO address_registry (address, type, name, valid_from_block, valid_to_block)
       VALUES ($1, 'facilitator', NULL, NULL, NULL)`,
      [address],
    );
  }
  for (const address of knownProxies) {
    await db.query(
      `INSERT INTO address_registry (address, type, name, valid_from_block, valid_to_block)
       VALUES ($1, 'proxy', NULL, NULL, NULL)`,
      [address],
    );
  }

  return {
    db,
    redis: createTestRedis(),
    jobs: {},
    rpc: {
      getBlock: async () => {
        throw new Error('rpc.getBlock mock not provided');
      },
      getLogs: async () => [],
      getTransaction: async () => {
        throw new Error('rpc.getTransaction mock not provided');
      },
      getTransactionReceipt: async () => {
        throw new Error('rpc.getTransactionReceipt mock not provided');
      },
      getBlockNumber: async () => 0n,
      getBytecode: async () => '0x',
      watchBlocks: () => () => {},
      ...options.rpc,
    } as PipelineContext['rpc'],
    registry: {
      knownAssets: new Set(knownAssets as never[]),
      knownFacilitators: new Set(knownFacilitators as never[]),
      knownProxies: new Set(knownProxies as never[]),
    },
    config: {
      confidenceThreshold: 70,
      finalityLag: 10,
      maxReorgDepth: 20,
      backfillChunkSize: 100,
      facilitatorFilterMode: options.facilitatorFilterMode ?? 'soft',
    },
    integrations: {
      defiLlamaBaseUrl: 'https://coins.llama.fi',
      openChainBaseUrl: 'https://api.openchain.xyz',
    },
  };
}
