import { z } from 'zod';
import { paginationSchema } from '../schemas/common.schema.js';

export const interactionsQuerySchema = paginationSchema.extend({
  agentAddress: z.string().optional(),
});
