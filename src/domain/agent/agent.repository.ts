import type { PaginationInput } from '../common/pagination.js';

export interface AgentRepository {
  listAgents(pagination: PaginationInput): Promise<unknown[]>;
  getAgent(address: string): Promise<unknown | null>;
  getAgentDailyStats(address: string): Promise<unknown[]>;
}
