import { Inject, Injectable } from '@nestjs/common';
import type { AgentRepository } from '../../domain/agent/agent.repository.js';
import type { CachePort } from '../ports/cache.port.js';
import { AGENT_REPOSITORY, DASHBOARD_CACHE } from '../ports/tokens.js';

export interface ListAgentsInput {
  limit: number;
  offset: number;
}

@Injectable()
export class ListAgentsUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agents: AgentRepository,
    @Inject(DASHBOARD_CACHE) private readonly cache: CachePort,
  ) {}

  public execute(input: ListAgentsInput): Promise<unknown[]> {
    return this.cache.readThrough(`dashboard:agents-list:${JSON.stringify(input)}`, () =>
      this.agents.listAgents(input),
    );
  }
}
