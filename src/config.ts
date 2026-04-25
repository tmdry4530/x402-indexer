import { config as loadDotEnv } from 'dotenv';
import { z } from 'zod';

loadDotEnv();

// 모든 환경변수를 앱 시작 시 한 번에 검증/기본값 적용한다.
// zod coercion을 사용해 문자열 env를 number/boolean 형태의 런타임 설정으로 정규화한다.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).default('postgres://postgres:postgres@localhost:5432/x402_indexer'),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  BASE_RPC_URL: z.string().url().default('http://127.0.0.1:8545'),
  BASE_RPC_FALLBACK_URLS: z.string().default(''),
  BASE_RPC_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  BASE_RPC_RETRY_COUNT: z.coerce.number().int().min(0).default(5),
  BASE_RPC_RETRY_DELAY_MS: z.coerce.number().int().min(0).default(500),
  FINALITY_LAG: z.coerce.number().int().min(0).default(10),
  MAX_REORG_DEPTH: z.coerce.number().int().positive().default(20),
  BACKFILL_CHUNK_SIZE: z.coerce.number().int().positive().default(100),
  CONFIDENCE_THRESHOLD: z.coerce.number().int().min(0).max(100).default(70),
  FACILITATOR_FILTER_MODE: z.enum(['hard', 'soft']).default('soft'),
  KNOWN_ASSETS: z.string().default(''),
  KNOWN_FACILITATORS: z.string().default(''),
  KNOWN_PROXIES: z.string().default(''),
  FACILITATOR_SOURCE_ENABLED: z
    .string()
    .optional()
    .transform((value) => value !== 'false'),
  FACILITATOR_SOURCE_URL: z.string().url().default('https://facilitators.x402.watch/'),
  FACILITATOR_SOURCE_NETWORK: z.string().default('base'),
  DEFI_LLAMA_BASE_URL: z.string().url().default('https://coins.llama.fi'),
  OPENCHAIN_BASE_URL: z.string().url().default('https://api.openchain.xyz'),
  ENABLE_REALTIME_WORKER: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  ENABLE_BACKFILL_WORKER: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  AUTO_MIGRATE: z
    .string()
    .optional()
    .transform((value) => value !== 'false'),
});

// 런타임 전체에서 공유하는 정규화된 설정 객체.
// process.env 직접 접근을 이 타입 뒤로 숨겨 테스트와 운영 wiring을 단순화한다.
export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  redisUrl: string;
  baseRpcUrl: string;
  pipeline: {
    confidenceThreshold: number;
    finalityLag: number;
    maxReorgDepth: number;
    backfillChunkSize: number;
    facilitatorFilterMode: 'hard' | 'soft';
  };
  rpc: {
    fallbackUrls: string[];
    timeoutMs: number;
    retryCount: number;
    retryDelayMs: number;
  };
  registry: {
    knownAssets: string[];
    knownFacilitators: string[];
    knownProxies: string[];
  };
  integrations: {
    defiLlamaBaseUrl: string;
    openChainBaseUrl: string;
    facilitatorSourceEnabled: boolean;
    facilitatorSourceUrl: string;
    facilitatorSourceNetwork: string;
  };
  runtime: {
    enableRealtimeWorker: boolean;
    enableBackfillWorker: boolean;
    autoMigrate: boolean;
  };
}

// comma-separated env 문자열을 빈 값 제거된 주소/URL 배열로 변환한다.
// 주소 checksum 정규화는 DB/viem 경계에서 처리하고 여기서는 문자열 split만 담당한다.
function parseAddressList(value: string): string[] {
  // env의 comma-separated 주소 문자열을 런타임 registry 배열로 변환
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

// 환경변수를 검증한 뒤 앱 내부 구조에 맞는 AppConfig로 매핑한다.
// 기능별 하위 객체(pipeline/rpc/registry/runtime)로 나눠 호출부의 설정 접근을 명확히 한다.
export function loadConfig(): AppConfig {
  // process.env를 한 번에 검증/정규화해서 앱 전역 설정 객체로 만든다.
  // 런타임 곳곳에서 개별 env를 읽지 않게 하려는 목적이다.
  const env = envSchema.parse(process.env);

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    baseRpcUrl: env.BASE_RPC_URL,
    pipeline: {
      confidenceThreshold: env.CONFIDENCE_THRESHOLD,
      finalityLag: env.FINALITY_LAG,
      maxReorgDepth: env.MAX_REORG_DEPTH,
      backfillChunkSize: env.BACKFILL_CHUNK_SIZE,
      facilitatorFilterMode: env.FACILITATOR_FILTER_MODE,
    },
    rpc: {
      fallbackUrls: parseAddressList(env.BASE_RPC_FALLBACK_URLS),
      timeoutMs: env.BASE_RPC_TIMEOUT_MS,
      retryCount: env.BASE_RPC_RETRY_COUNT,
      retryDelayMs: env.BASE_RPC_RETRY_DELAY_MS,
    },
    registry: {
      knownAssets: parseAddressList(env.KNOWN_ASSETS),
      knownFacilitators: parseAddressList(env.KNOWN_FACILITATORS),
      knownProxies: parseAddressList(env.KNOWN_PROXIES),
    },
    integrations: {
      defiLlamaBaseUrl: env.DEFI_LLAMA_BASE_URL,
      openChainBaseUrl: env.OPENCHAIN_BASE_URL,
      facilitatorSourceEnabled: env.FACILITATOR_SOURCE_ENABLED ?? true,
      facilitatorSourceUrl: env.FACILITATOR_SOURCE_URL,
      facilitatorSourceNetwork: env.FACILITATOR_SOURCE_NETWORK,
    },
    runtime: {
      enableRealtimeWorker: env.ENABLE_REALTIME_WORKER ?? false,
      enableBackfillWorker: env.ENABLE_BACKFILL_WORKER ?? false,
      autoMigrate: env.AUTO_MIGRATE ?? true,
    },
  };
}
