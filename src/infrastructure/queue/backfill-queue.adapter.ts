import { DependencyUnavailableError } from '../../application/errors/application-error.js';
import type { BackfillQueuePort } from '../../application/ports/backfill-queue.port.js';

type EnqueueBackfill = (input: { startBlock: bigint; endBlock: bigint }) => Promise<void>;

export class BackfillQueueAdapter implements BackfillQueuePort {
  constructor(private readonly enqueueBackfill?: EnqueueBackfill) {}

  public async enqueue(input: { startBlock: bigint; endBlock: bigint }): Promise<void> {
    if (!this.enqueueBackfill) {
      throw new DependencyUnavailableError('백필 워커가 비활성화되어 있습니다');
    }

    await this.enqueueBackfill(input);
  }
}
