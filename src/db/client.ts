import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { createPublicClient, fallback, http, type PublicClient } from 'viem';
import { base } from 'viem/chains';
import type { Address } from 'viem';
import type { AppConfig } from '../config.js';
import type { AddressRegistry, PipelineContext, RedisClient } from '../pipeline/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const RedisCtor = require('ioredis') as new (
  connectionString: string,
  options?: Record<string, unknown>,
) => RedisClient;

// PostgreSQL Pool factory.
// 호출부가 connection string만 넘기면 되게 해 DB wiring을 index.ts에서 단순화한다.
export function createDbPool(connectionString: string): Pool {
  // PostgreSQL connection pool 생성 — 모든 DB 쿼리의 공통 진입점
  return new Pool({ connectionString });
}

// Redis/ioredis client factory.
// BullMQ가 요구하는 maxRetriesPerRequest=null 옵션을 한 곳에 고정한다.
export function createRedisClient(redisUrl: string): RedisClient {
  // BullMQ와 캐시 invalidation에서 함께 사용할 Redis 클라이언트 생성
  return new RedisCtor(redisUrl, { maxRetriesPerRequest: null });
}

// env/DB seed로 들어온 known address들을 파이프라인이 빠르게 조회할 Set으로 변환한다.
function createRegistry(config: AppConfig): AddressRegistry {
  // env에서 받은 주소 목록을 Set으로 바꿔 O(1) membership 체크가 가능하게 한다.
  return {
    knownAssets: new Set(config.registry.knownAssets as Address[]),
    knownFacilitators: new Set(config.registry.knownFacilitators as Address[]),
    knownProxies: new Set(config.registry.knownProxies as Address[]),
  };
}

// SQL migration 실행 진입점.
// 별도 migration tool 없이도 dev/test 환경에서 schema bootstrap이 가능하게 한다.
export async function applyMigrations(db: Pool): Promise<void> {
  // 프로젝트 부팅 시 기본 스키마를 보장하기 위해 SQL migration을 적용한다.
  const migrationPath = path.join(__dirname, 'migrations', '0001_init.sql');
  const sql = await readFile(migrationPath, 'utf8');
  await db.query(sql);
}

// 파이프라인 실행 컨텍스트를 만든다.
// RPC transport, DB/Redis, registry Set, pipeline 설정을 하나의 객체로 묶어 step/worker에 주입한다.
export function createPipelineContext(
  config: AppConfig,
  db: Pool,
  redis: RedisClient,
): PipelineContext {
  // worker / pipeline / API가 공유하는 의존성 컨테이너를 조립한다.
  // 새 의존성이 생겨도 이 함수만 보면 런타임 wiring을 파악할 수 있게 한다.
  const transportOptions = {
      timeout: config.rpc.timeoutMs,
      retryCount: config.rpc.retryCount,
      retryDelay: config.rpc.retryDelayMs,
  };
  const primaryTransport = http(config.baseRpcUrl, transportOptions);
  const fallbackUrls = config.rpc.fallbackUrls.filter((url) => url !== config.baseRpcUrl);
  const rpc = createPublicClient({
    chain: base,
    transport: fallbackUrls.length > 0
      ? fallback([
          primaryTransport,
          ...fallbackUrls.map((url) => http(url, transportOptions)),
        ])
      : primaryTransport,
  }) as unknown as PublicClient;

  return {
    rpc,
    db,
    redis,
    jobs: {},
    registry: createRegistry(config),
    config: {
      confidenceThreshold: config.pipeline.confidenceThreshold,
      finalityLag: config.pipeline.finalityLag,
      maxReorgDepth: config.pipeline.maxReorgDepth,
      backfillChunkSize: config.pipeline.backfillChunkSize,
      facilitatorFilterMode: config.pipeline.facilitatorFilterMode,
    },
    integrations: {
      defiLlamaBaseUrl: config.integrations.defiLlamaBaseUrl,
      openChainBaseUrl: config.integrations.openChainBaseUrl,
    },
  };
}
