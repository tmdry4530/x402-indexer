import { z } from 'zod';

export const backfillBodySchema = z.object({
  startBlock: z.coerce.bigint(),
  endBlock: z.coerce.bigint(),
});
