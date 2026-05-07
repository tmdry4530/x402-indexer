import { Inject, Injectable } from '@nestjs/common';
import type { AgentRepository } from '../../domain/agent/agent.repository.js';
import { NotFoundError } from '../errors/application-error.js';
import type { CachePort } from '../ports/cache.port.js';
import { AGENT_REPOSITORY, DASHBOARD_CACHE } from '../ports/tokens.js';

@Injectable()
export class GetAgentUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agents: AgentRepository,
    @Inject(DASHBOARD_CACHE) private readonly cache: CachePort,
  ) {}

  public async execute(address: string): Promise<unknown> {
    const agent = await this.cache.readThrough(`dashboard:agents:${address}`, () =>
      this.agents.getAgent(address),
    );
    if (!agent) {
      throw new NotFoundError('에이전트를 찾을 수 없습니다');
    }
    return agent;
  }
}
