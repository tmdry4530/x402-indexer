import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { GetAgentUseCase } from '../../application/agent/get-agent.usecase.js';
import { ListAgentStatsUseCase } from '../../application/agent/list-agent-stats.usecase.js';
import { ListAgentsUseCase } from '../../application/agent/list-agents.usecase.js';
import { API_ROUTES } from '../routes.js';
import { agentsQuerySchema } from './agent.schema.js';

@Controller()
export class AgentsController {
  constructor(
    @Inject(ListAgentsUseCase) private readonly listAgentsUseCase: ListAgentsUseCase,
    @Inject(GetAgentUseCase) private readonly getAgentUseCase: GetAgentUseCase,
    @Inject(ListAgentStatsUseCase) private readonly listAgentStatsUseCase: ListAgentStatsUseCase,
  ) {}

  @Get(API_ROUTES.agents.list)
  public async list(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return { data: await this.listAgentsUseCase.execute(agentsQuerySchema.parse(query)) };
  }

  @Get(API_ROUTES.agents.detail)
  public async detail(@Param('address') address: string): Promise<{ data: unknown }> {
    return { data: await this.getAgentUseCase.execute(address) };
  }

  @Get(API_ROUTES.agents.stats)
  public async stats(@Param('address') address: string): Promise<{ data: unknown[] }> {
    return { data: await this.listAgentStatsUseCase.execute(address) };
  }
}
