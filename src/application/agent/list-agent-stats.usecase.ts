import { Inject, Injectable } from '@nestjs/common';
import type { AgentRepository } from '../../domain/agent/agent.repository.js';
import type { CachePort } from '../ports/cache.port.js';
import { AGENT_REPOSITORY, DASHBOARD_CACHE } from '../ports/tokens.js';

@Injectable()
export class ListAgentStatsUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agents: AgentRepository,
    @Inject(DASHBOARD_CACHE) private readonly cache: CachePort,
  ) {}

  public execute(address: string): Promise<unknown[]> {
    return this.cache.readThrough(`dashboard:agent-stats:${address}`, () =>
      this.agents.getAgentDailyStats(address),
    );
  }
}
