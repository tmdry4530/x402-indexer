import { loadConfig } from './config.js';
import { createApp } from './api/app.js';
import { refreshAddressRegistry, seedAddressRegistry } from './db/addressRegistry.js';
import { recordQueuedBackfillJob } from './db/backfillJobs.js';
import { applyMigrations, createDbPool, createPipelineContext, createRedisClient } from './db/client.js';
import { loadFacilitatorAddresses, seedFacilitatorAddresses } from './db/facilitatorSource.js';
import { BackfillWorker } from './workers/backfillWorker.js';
import { RealtimeWorker } from './workers/realtimeWorker.js';

// 프로세스 진입점.
// 설정/인프라/마이그레이션/레지스트리/워커/API 서버를 순서대로 조립한다.
async function main(): Promise<void> {
  // 앱 전체 부팅 순서:
  // config 로드 -> DB/Redis 생성 -> migration -> context 조립 -> worker 선택 실행 -> Nest 서버 시작
  const config = loadConfig();
  const db = createDbPool(config.databaseUrl);
  const redis = createRedisClient(config.redisUrl);

  db.on('error', (error) => {
    console.error('[postgres] pool error', error);
  });
  redis.on('error', (error) => {
    console.error('[redis] client error', error);
  });

  console.log('[boot] starting x402-indexer', {
    port: config.port,
    autoMigrate: config.runtime.autoMigrate,
    enableRealtimeWorker: config.runtime.enableRealtimeWorker,
    enableBackfillWorker: config.runtime.enableBackfillWorker,
  });

  if (config.runtime.autoMigrate) {
    await applyMigrations(db);
    console.log('[boot] migrations applied');
  }

  const ctx = createPipelineContext(config, db, redis);
  await seedAddressRegistry(db, [
    ...config.registry.knownAssets.map((address) => ({ address, type: 'asset', name: null })),
    ...config.registry.knownFacilitators.map((address) => ({
      address,
      type: 'facilitator',
      name: null,
    })),
    ...config.registry.knownProxies.map((address) => ({ address, type: 'proxy', name: null })),
  ]);
  if (config.integrations.facilitatorSourceEnabled) {
    try {
      const facilitatorRows = await loadFacilitatorAddresses(
        config.integrations.facilitatorSourceUrl,
        config.integrations.facilitatorSourceNetwork,
      );
      await seedFacilitatorAddresses(db, facilitatorRows);
      console.log('[boot] facilitator source synced', {
        network: config.integrations.facilitatorSourceNetwork,
        count: facilitatorRows.length,
      });
    } catch (error) {
      console.error('[boot] facilitator source sync failed, continuing with env/db seed only', error);
    }
  }
  await refreshAddressRegistry(ctx);
  console.log('[boot] address registry seeded', {
    assets: config.registry.knownAssets.length,
    facilitators: config.registry.knownFacilitators.length,
    proxies: config.registry.knownProxies.length,
  });

  const backfillWorker = new BackfillWorker(ctx, 'backfill_default');
  if (config.runtime.enableBackfillWorker) {
    ctx.jobs.enqueueBackfill = async (input) => {
      await backfillWorker.enqueue(input);
    };
    await backfillWorker.start();
    console.log('[boot] backfill worker started');
  }

  const realtimeWorker = new RealtimeWorker(ctx);
  if (config.runtime.enableRealtimeWorker) {
    await realtimeWorker.start();
    console.log('[boot] realtime worker started');
  }

  const app = await createApp({
    db,
    redis,
    enqueueBackfill: config.runtime.enableBackfillWorker ? ctx.jobs.enqueueBackfill : undefined,
  });

  await app.listen(config.port);
  console.log(`[boot] server listening on http://localhost:${config.port}`);

  const shutdown = async (signal: string) => {
    // 개발/운영 종료 시 worker와 connection을 순서대로 정리한다.
    console.log(`[shutdown] received ${signal}`);
    await Promise.allSettled([
      app.close(),
      realtimeWorker.stop(),
      backfillWorker.stop(),
      db.end(),
      redis.quit(),
    ]);
    console.log('[shutdown] resources closed');
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

void main().catch((error) => {
  console.error('[boot] fatal startup error', error);
  process.exitCode = 1;
});
