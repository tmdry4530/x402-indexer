import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
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
import { API_SERVICES, type AppServices } from './services.js';

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

const DASHBOARD_CACHE_TTL_SECONDS = 30;

// 이전 HTTP handler에 있던 validation/cache/read orchestration을 Nest provider로 옮긴다.
// Controller는 HTTP binding만 담당하고, 이 서비스가 기존 DB query/queue 연결을 보존한다.
@Injectable()
export class ApiService {
  constructor(@Inject(API_SERVICES) private readonly services: AppServices) {}

  public health(): { ok: true } {
    return { ok: true };
  }

  public async overview(): Promise<{ data: unknown }> {
    const overview = await this.readThroughCache('dashboard:overview', () =>
      getOverview(this.services.db),
    );
    return { data: overview };
  }

  public async payments(queryInput: unknown): Promise<{ data: unknown[] }> {
    const query = paymentsQuerySchema.parse(queryInput);
    const payments = await this.readThroughCache(
      `dashboard:payments:${JSON.stringify(query)}`,
      () =>
        listPayments(this.services.db, query, {
          payer: query.payer,
          payTo: query.payTo,
        }),
    );
    return { data: payments };
  }

  public async paymentDetail(paramsInput: unknown): Promise<{ data: unknown }> {
    const params = paymentDetailParamsSchema.parse(paramsInput);
    const payment = await this.readThroughCache(
      `dashboard:payment-detail:${params.txHash}:${params.logIndex}`,
      () => getPaymentDetail(this.services.db, params.txHash, params.logIndex),
    );
    if (!payment) {
      throw new HttpException({ error: '결제를 찾을 수 없습니다' }, HttpStatus.NOT_FOUND);
    }
    return { data: payment };
  }

  public async agents(queryInput: unknown): Promise<{ data: unknown[] }> {
    const query = paginationSchema.parse(queryInput);
    const agents = await this.readThroughCache(
      `dashboard:agents-list:${JSON.stringify(query)}`,
      () => listAgents(this.services.db, query),
    );
    return { data: agents };
  }

  public async agent(address: string): Promise<{ data: unknown }> {
    const agent = await this.readThroughCache(`dashboard:agents:${address}`, () =>
      getAgent(this.services.db, address),
    );
    if (!agent) {
      throw new HttpException({ error: '에이전트를 찾을 수 없습니다' }, HttpStatus.NOT_FOUND);
    }
    return { data: agent };
  }

  public async agentStats(address: string): Promise<{ data: unknown[] }> {
    const stats = await this.readThroughCache(`dashboard:agent-stats:${address}`, () =>
      getAgentDailyStats(this.services.db, address),
    );
    return { data: stats };
  }

  public async servicesList(queryInput: unknown): Promise<{ data: unknown[] }> {
    const query = paginationSchema.parse(queryInput);
    const serviceRows = await this.readThroughCache(
      `dashboard:services-list:${JSON.stringify(query)}`,
      () => listServices(this.services.db, query),
    );
    return { data: serviceRows };
  }

  public async service(address: string): Promise<{ data: unknown }> {
    const service = await this.readThroughCache(`dashboard:services:${address}`, () =>
      getService(this.services.db, address),
    );
    if (!service) {
      throw new HttpException({ error: '서비스를 찾을 수 없습니다' }, HttpStatus.NOT_FOUND);
    }
    return { data: service };
  }

  public async evidence(queryInput: unknown): Promise<{ data: unknown[] }> {
    const query = paginationSchema.parse(queryInput);
    const evidence = await this.readThroughCache(
      `dashboard:evidence:${JSON.stringify(query)}`,
      () => listEvidence(this.services.db, query),
    );
    return { data: evidence };
  }

  public async interactions(queryInput: unknown): Promise<{ data: unknown[] }> {
    const query = interactionsQuerySchema.parse(queryInput);
    const interactions = await this.readThroughCache(
      `dashboard:interactions:${JSON.stringify(query)}`,
      () =>
        listInteractions(this.services.db, query, {
          agentAddress: query.agentAddress,
        }),
    );
    return { data: interactions };
  }

  public async dailyStats(queryInput: unknown): Promise<{ data: unknown[] }> {
    const query = statsQuerySchema.parse(queryInput);
    const stats = await this.readThroughCache(
      `dashboard:daily-stats:${JSON.stringify(query)}`,
      () =>
        listDailyStats(this.services.db, query, {
          agentAddress: query.agentAddress,
          from: query.from,
          to: query.to,
        }),
    );
    return { data: stats };
  }

  public async operationsStatus(): Promise<{ data: unknown }> {
    const [overview, checkpoints, jobs] = await Promise.all([
      getOverview(this.services.db),
      listCheckpoints(this.services.db),
      listBackfillJobs(this.services.db, { limit: 5, offset: 0 }),
    ]);
    return {
      data: {
        api_ok: true,
        overview,
        checkpoints,
        recent_backfill_jobs: jobs,
      },
    };
  }

  public async checkpoints(): Promise<{ data: unknown[] }> {
    const checkpoints = await listCheckpoints(this.services.db);
    return { data: checkpoints };
  }

  public async backfillJobs(queryInput: unknown): Promise<{ data: unknown[] }> {
    const query = paginationSchema.parse(queryInput);
    const jobs = await listBackfillJobs(this.services.db, query);
    return { data: jobs };
  }

  public async addressRegistry(queryInput: unknown): Promise<{ data: unknown[] }> {
    const query = paginationSchema.parse(queryInput);
    const rows = await this.readThroughCache(
      `dashboard:operations:address-registry:${JSON.stringify(query)}`,
      () => listAddressRegistry(this.services.db, query),
    );
    return { data: rows };
  }

  public async enqueueBackfill(bodyInput: unknown): Promise<{
    data: { startBlock: string; endBlock: string; status: 'queued' };
  }> {
    const body = backfillBodySchema.parse(bodyInput);
    if (body.startBlock > body.endBlock) {
      throw new HttpException(
        { error: 'startBlock은 endBlock보다 작거나 같아야 합니다' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!this.services.enqueueBackfill) {
      throw new HttpException(
        { error: '백필 워커가 비활성화되어 있습니다' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    await this.services.enqueueBackfill(body);
    return {
      data: {
        startBlock: body.startBlock.toString(),
        endBlock: body.endBlock.toString(),
        status: 'queued',
      },
    };
  }

  // dashboard API용 read-through cache 헬퍼.
  // Redis 장애는 사용자 조회 실패로 전파하지 않고 DB fallback으로 처리한다.
  private async readThroughCache<T>(key: string, loader: () => Promise<T>): Promise<T> {
    if (!this.services.redis) {
      return loader();
    }

    try {
      const cached = await this.services.redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (error) {
      console.error('[cache] read failed, falling back to db', key, error);
    }

    const fresh = await loader();
    try {
      await this.services.redis.setex(
        key,
        DASHBOARD_CACHE_TTL_SECONDS,
        JSON.stringify(fresh),
      );
    } catch (error) {
      console.error('[cache] write failed, continuing without cache', key, error);
    }
    return fresh;
  }
}
