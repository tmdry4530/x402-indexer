import { Inject, Injectable } from '@nestjs/common';
import { ValidationError } from '../errors/application-error.js';
import type { BackfillQueuePort } from '../ports/backfill-queue.port.js';
import { BACKFILL_QUEUE } from '../ports/tokens.js';

export interface EnqueueBackfillInput {
  startBlock: bigint;
  endBlock: bigint;
}

export interface EnqueueBackfillResult {
  startBlock: string;
  endBlock: string;
  status: 'queued';
}

@Injectable()
export class EnqueueBackfillUseCase {
  constructor(@Inject(BACKFILL_QUEUE) private readonly queue: BackfillQueuePort) {}

  public async execute(input: EnqueueBackfillInput): Promise<EnqueueBackfillResult> {
    if (input.startBlock > input.endBlock) {
      throw new ValidationError('startBlock은 endBlock보다 작거나 같아야 합니다');
    }

    await this.queue.enqueue(input);
    return {
      startBlock: input.startBlock.toString(),
      endBlock: input.endBlock.toString(),
      status: 'queued',
    };
  }
}
