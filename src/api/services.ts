import type { Pool } from 'pg';

// Nest API 레이어에 주입되는 외부 런타임 의존성.
// index.ts는 실제 DB/Redis/worker enqueue를 넣고, 테스트는 mock을 넣는다.
export interface AppServices {
  db: Pool;
  redis?: {
    get(key: string): Promise<string | null>;
    setex(key: string, seconds: number, value: string): Promise<unknown>;
  };
  enqueueBackfill?: (input: { startBlock: bigint; endBlock: bigint }) => Promise<void>;
}

export const API_SERVICES = Symbol('API_SERVICES');
