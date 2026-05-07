import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { ApiService } from './api.service.js';

// Nest Controller는 기존 HTTP route contract를 그대로 노출한다.
// business/query 로직은 ApiService에 위임해 HTTP 경계를 얇게 유지한다.
@Controller()
export class ApiController {
  constructor(@Inject(ApiService) private readonly api: ApiService) {}

  @Get('health')
  public health(): { ok: true } {
    return this.api.health();
  }

  @Get('overview')
  public overview(): Promise<{ data: unknown }> {
    return this.api.overview();
  }

  @Get('payments')
  public payments(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return this.api.payments(query);
  }

  @Get('payments/:txHash/:logIndex')
  public paymentDetail(@Param() params: Record<string, unknown>): Promise<{ data: unknown }> {
    return this.api.paymentDetail(params);
  }

  @Get('agents')
  public agents(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return this.api.agents(query);
  }

  @Get('agents/:address')
  public agent(@Param('address') address: string): Promise<{ data: unknown }> {
    return this.api.agent(address);
  }

  @Get('agents/:address/stats')
  public agentStats(@Param('address') address: string): Promise<{ data: unknown[] }> {
    return this.api.agentStats(address);
  }

  @Get('services')
  public services(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return this.api.servicesList(query);
  }

  @Get('services/:address')
  public service(@Param('address') address: string): Promise<{ data: unknown }> {
    return this.api.service(address);
  }

  @Get('evidence')
  public evidence(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return this.api.evidence(query);
  }

  @Get('interactions')
  public interactions(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return this.api.interactions(query);
  }

  @Get('stats/daily')
  public dailyStats(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return this.api.dailyStats(query);
  }

  @Get('operations/status')
  public operationsStatus(): Promise<{ data: unknown }> {
    return this.api.operationsStatus();
  }

  @Get('operations/checkpoints')
  public checkpoints(): Promise<{ data: unknown[] }> {
    return this.api.checkpoints();
  }

  @Get('operations/backfill-jobs')
  public backfillJobs(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return this.api.backfillJobs(query);
  }

  @Get('operations/address-registry')
  public addressRegistry(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return this.api.addressRegistry(query);
  }

  @Post('jobs/backfill')
  @HttpCode(HttpStatus.ACCEPTED)
  public enqueueBackfill(@Body() body: unknown): Promise<{
    data: { startBlock: string; endBlock: string; status: 'queued' };
  }> {
    return this.api.enqueueBackfill(body);
  }

  @Get()
  @Redirect('/ui/')
  public root(): void {}

  @Get('ui')
  @Redirect('/ui/')
  public ui(): void {}
}
