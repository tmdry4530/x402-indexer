import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Pool } from 'pg';
import {
  getAgent,
  getAgentDailyStats,
  getOverview,
  getPaymentDetail,
  getService,
  listAddressRegistry,
  listAgents,
  listBackfillJobs,
  listCheckpoints,
  listDailyStats,
  listEvidence,
  listInteractions,
  listPayments,
  listServices,
} from '../db/api-queries.js';

const paginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const paymentsQuerySchema = paginationSchema.extend({
  payer: z.string().optional(),
  payTo: z.string().optional(),
});

const paymentDetailParamsSchema = z.object({
  txHash: z.string().min(1),
  logIndex: z.coerce.number().int().min(0),
});

const interactionsQuerySchema = paginationSchema.extend({
  agentAddress: z.string().optional(),
});

const statsQuerySchema = paginationSchema.extend({
  agentAddress: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const backfillBodySchema = z.object({
  startBlock: z.coerce.bigint(),
  endBlock: z.coerce.bigint(),
});

// HTTP 레이어가 의존하는 외부 서비스 모음.
// 테스트에서는 이 인터페이스를 mock으로 주입하고, 런타임에서는 index.ts가 실제 DB/Redis/Queue를 연결한다.
export interface AppServices {
  db: Pool;
  redis?: {
    get(key: string): Promise<string | null>;
    setex(key: string, seconds: number, value: string): Promise<unknown>;
  };
  enqueueBackfill?: (input: { startBlock: bigint; endBlock: bigint }) => Promise<void>;
}

const DASHBOARD_CACHE_TTL_SECONDS = 30;

// dashboard API용 read-through cache 헬퍼.
// Redis 장애는 사용자 조회 실패로 전파하지 않고 DB fallback으로 처리한다.
async function readThroughCache<T>(
  services: AppServices,
  key: string,
  loader: () => Promise<T>,
): Promise<T> {
  if (!services.redis) {
    return loader();
  }

  try {
    const cached = await services.redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    console.error('[cache] read failed, falling back to db', key, error);
  }

  const fresh = await loader();
  try {
    await services.redis.setex(key, DASHBOARD_CACHE_TTL_SECONDS, JSON.stringify(fresh));
  } catch (error) {
    console.error('[cache] write failed, continuing without cache', key, error);
  }
  return fresh;
}

// Hono 라우터를 생성하고 read API, backfill trigger, static docs route를 연결한다.
// 각 handler는 validation/cache만 담당하고 실제 DB query는 db/api-queries.ts로 위임한다.
export function createApp(services: AppServices): Hono {
  // Hono 앱 조립.
  // 이 레이어는 쓰기 로직을 직접 구현하지 않고, DB 조회/백필 enqueue를 thin handler로 연결한다.
  const app = new Hono();

  app.onError((error, c) => {
    if (error instanceof z.ZodError) {
      return c.json({ error: '요청 파라미터가 올바르지 않습니다', issues: error.issues }, 400);
    }
    console.error(error);
    return c.text('Internal Server Error', 500);
  });

  app.get('/health', (c) => c.json({ ok: true }));

  app.get('/overview', async (c) => {
    const overview = await readThroughCache(
      services,
      'dashboard:overview',
      () => getOverview(services.db),
    );
    return c.json({ data: overview });
  });

  app.get('/payments', async (c) => {
    // payments 목록 — 기본적인 필터/페이징만 제공
    const query = paymentsQuerySchema.parse(c.req.query());
    const payments = await readThroughCache(
      services,
      `dashboard:payments:${JSON.stringify(query)}`,
      () => listPayments(services.db, query, {
        payer: query.payer,
        payTo: query.payTo,
      }),
    );
    return c.json({ data: payments });
  });

  app.get('/payments/:txHash/:logIndex', async (c) => {
    const params = paymentDetailParamsSchema.parse(c.req.param());
    const payment = await readThroughCache(
      services,
      `dashboard:payment-detail:${params.txHash}:${params.logIndex}`,
      () => getPaymentDetail(services.db, params.txHash, params.logIndex),
    );
    if (!payment) {
      return c.json({ error: '결제를 찾을 수 없습니다' }, 404);
    }
    return c.json({ data: payment });
  });

  app.get('/agents', async (c) => {
    const query = paginationSchema.parse(c.req.query());
    const agents = await readThroughCache(
      services,
      `dashboard:agents-list:${JSON.stringify(query)}`,
      () => listAgents(services.db, query),
    );
    return c.json({ data: agents });
  });

  app.get('/agents/:address', async (c) => {
    // agent 상세 — 없으면 404
    const address = c.req.param('address');
    const agent = await readThroughCache(
      services,
      `dashboard:agents:${address}`,
      () => getAgent(services.db, address),
    );
    if (!agent) {
      return c.json({ error: '에이전트를 찾을 수 없습니다' }, 404);
    }
    return c.json({ data: agent });
  });

  app.get('/agents/:address/stats', async (c) => {
    // agent별 일자 집계 시계열
    const address = c.req.param('address');
    const stats = await readThroughCache(
      services,
      `dashboard:agent-stats:${address}`,
      () => getAgentDailyStats(services.db, address),
    );
    return c.json({ data: stats });
  });

  app.get('/services', async (c) => {
    const query = paginationSchema.parse(c.req.query());
    const serviceRows = await readThroughCache(
      services,
      `dashboard:services-list:${JSON.stringify(query)}`,
      () => listServices(services.db, query),
    );
    return c.json({ data: serviceRows });
  });

  app.get('/services/:address', async (c) => {
    // 서비스 상세 — 결제 요약 포함
    const address = c.req.param('address');
    const service = await readThroughCache(
      services,
      `dashboard:services:${address}`,
      () => getService(services.db, address),
    );
    if (!service) {
      return c.json({ error: '서비스를 찾을 수 없습니다' }, 404);
    }
    return c.json({ data: service });
  });

  app.get('/evidence', async (c) => {
    const query = paginationSchema.parse(c.req.query());
    const evidence = await readThroughCache(
      services,
      `dashboard:evidence:${JSON.stringify(query)}`,
      () => listEvidence(services.db, query),
    );
    return c.json({ data: evidence });
  });

  app.get('/interactions', async (c) => {
    // interaction 목록 조회
    const query = interactionsQuerySchema.parse(c.req.query());
    const interactions = await readThroughCache(
      services,
      `dashboard:interactions:${JSON.stringify(query)}`,
      () => listInteractions(services.db, query, {
        agentAddress: query.agentAddress,
      }),
    );
    return c.json({ data: interactions });
  });

  app.get('/stats/daily', async (c) => {
    // 일별 집계 목록 조회
    const query = statsQuerySchema.parse(c.req.query());
    const stats = await readThroughCache(
      services,
      `dashboard:daily-stats:${JSON.stringify(query)}`,
      () => listDailyStats(services.db, query, {
        agentAddress: query.agentAddress,
        from: query.from,
        to: query.to,
      }),
    );
    return c.json({ data: stats });
  });

  app.get('/operations/status', async (c) => {
    const [overview, checkpoints, jobs] = await Promise.all([
      getOverview(services.db),
      listCheckpoints(services.db),
      listBackfillJobs(services.db, { limit: 5, offset: 0 }),
    ]);
    return c.json({
      data: {
        api_ok: true,
        overview,
        checkpoints,
        recent_backfill_jobs: jobs,
      },
    });
  });

  app.get('/operations/checkpoints', async (c) => {
    // 운영 화면은 큐 등록/워커 진행 상황 확인용이므로 캐시보다 최신성을 우선한다.
    const checkpoints = await listCheckpoints(services.db);
    return c.json({ data: checkpoints });
  });

  app.get('/operations/backfill-jobs', async (c) => {
    // 백필 폼 submit 직후 새 작업이 바로 보여야 하므로 Redis read-through cache를 사용하지 않는다.
    const query = paginationSchema.parse(c.req.query());
    const jobs = await listBackfillJobs(services.db, query);
    return c.json({ data: jobs });
  });

  app.get('/operations/address-registry', async (c) => {
    const query = paginationSchema.parse(c.req.query());
    const rows = await readThroughCache(
      services,
      `dashboard:operations:address-registry:${JSON.stringify(query)}`,
      () => listAddressRegistry(services.db, query),
    );
    return c.json({ data: rows });
  });

  app.post('/jobs/backfill', async (c) => {
    // 백필 실행 트리거 — body validation 후 queue enqueue로 위임
    const body = backfillBodySchema.parse(await c.req.json());
    if (body.startBlock > body.endBlock) {
      return c.json({ error: 'startBlock은 endBlock보다 작거나 같아야 합니다' }, 400);
    }

    if (!services.enqueueBackfill) {
      return c.json({ error: '백필 워커가 비활성화되어 있습니다' }, 503);
    }

    await services.enqueueBackfill(body);
    return c.json(
      {
        data: {
          startBlock: body.startBlock.toString(),
          endBlock: body.endBlock.toString(),
          status: 'queued',
        },
      },
      202,
    );
  });

  app.get('/docs/*', serveStatic({ root: './' }));
  // 정적 문서 접근용 간단 라우트 — README/diagram 파일 확인용

  app.get('/', (c) => c.redirect('/ui/'));
  app.get('/ui', (c) => c.redirect('/ui/'));
  app.get('/ui/', serveStatic({ path: './web/index.html' }));
  app.get(
    '/ui/*',
    serveStatic({
      root: './web',
      rewriteRequestPath: (path) => path.replace(/^\/ui\/?/, '/'),
    }),
  );
  // 디자인 프로토타입(x402 Indexer 콘솔) 정적 호스팅.
  // React/Babel CDN 기반이라 빌드 없이 web/ 디렉토리의 파일을 그대로 서빙한다.

  return app;
}
