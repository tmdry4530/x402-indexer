import type { Pool } from 'pg';
import { getAgent, getAgentDailyStats, listAgents } from './dashboard-queries.js';
import type { PaginationInput } from '../../../domain/common/pagination.js';
import type { AgentRepository } from '../../../domain/agent/agent.repository.js';

export class PostgresAgentRepository implements AgentRepository {
  constructor(private readonly db: Pool) {}

  public listAgents(pagination: PaginationInput): Promise<unknown[]> {
    return listAgents(this.db, pagination);
  }

  public getAgent(address: string): Promise<unknown | null> {
    return getAgent(this.db, address);
  }

  public getAgentDailyStats(address: string): Promise<unknown[]> {
    return getAgentDailyStats(this.db, address);
  }
}
