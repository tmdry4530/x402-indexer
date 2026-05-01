import { z } from 'zod';
import { paginationSchema } from '../schemas/common.schema.js';

export const statsQuerySchema = paginationSchema.extend({
  agentAddress: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
