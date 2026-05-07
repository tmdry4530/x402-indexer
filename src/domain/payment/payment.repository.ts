import type { PaginationInput } from '../common/pagination.js';

export interface PaymentRepository {
  listPayments(
    pagination: PaginationInput,
    filters: { payer?: string; payTo?: string },
  ): Promise<unknown[]>;
  getPaymentDetail(txHash: string, logIndex: number): Promise<unknown | null>;
}
