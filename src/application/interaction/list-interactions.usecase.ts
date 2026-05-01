import { Inject, Injectable } from '@nestjs/common';
import type { InteractionRepository } from '../../domain/interaction/interaction.repository.js';
import type { CachePort } from '../ports/cache.port.js';
import { DASHBOARD_CACHE, INTERACTION_REPOSITORY } from '../ports/tokens.js';

export interface ListInteractionsInput {
  limit: number;
  offset: number;
  agentAddress?: string;
}

@Injectable()
export class ListInteractionsUseCase {
  constructor(
    @Inject(INTERACTION_REPOSITORY) private readonly interactions: InteractionRepository,
    @Inject(DASHBOARD_CACHE) private readonly cache: CachePort,
  ) {}

  public execute(input: ListInteractionsInput): Promise<unknown[]> {
    return this.cache.readThrough(`dashboard:interactions:${JSON.stringify(input)}`, () =>
      this.interactions.listInteractions(input, {
        agentAddress: input.agentAddress,
      }),
    );
  }
}
