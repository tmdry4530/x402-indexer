import { z } from 'zod';
import { paginationSchema } from '../schemas/common.schema.js';

export const paymentsQuerySchema = paginationSchema.extend({
  payer: z.string().optional(),
  payTo: z.string().optional(),
});

export const paymentDetailParamsSchema = z.object({
  txHash: z.string().min(1),
  logIndex: z.coerce.number().int().min(0),
});
