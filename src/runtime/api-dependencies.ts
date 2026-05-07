import type { Pool } from 'pg';

export interface RedisCacheClient {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
}

export interface ApiModuleDependencies {
  db: Pool;
  redis?: RedisCacheClient;
  enqueueBackfill?: (input: { startBlock: bigint; endBlock: bigint }) => Promise<void>;
}
