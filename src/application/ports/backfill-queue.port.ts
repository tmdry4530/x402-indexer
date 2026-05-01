export interface BackfillQueuePort {
  enqueue(input: { startBlock: bigint; endBlock: bigint }): Promise<void>;
}
