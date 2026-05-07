import type { Pool } from 'pg';
import { getPaymentDetail, listPayments } from './dashboard-queries.js';
import type { PaginationInput } from '../../../domain/common/pagination.js';
import type { PaymentRepository } from '../../../domain/payment/payment.repository.js';

export class PostgresPaymentRepository implements PaymentRepository {
  constructor(private readonly db: Pool) {}

  public listPayments(
    pagination: PaginationInput,
    filters: { payer?: string; payTo?: string },
  ): Promise<unknown[]> {
    return listPayments(this.db, pagination, filters);
  }

  public getPaymentDetail(txHash: string, logIndex: number): Promise<unknown | null> {
    return getPaymentDetail(this.db, txHash, logIndex);
  }
}
