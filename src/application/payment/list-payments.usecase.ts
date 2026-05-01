import { Inject, Injectable } from '@nestjs/common';
import type { PaymentRepository } from '../../domain/payment/payment.repository.js';
import type { CachePort } from '../ports/cache.port.js';
import { DASHBOARD_CACHE, PAYMENT_REPOSITORY } from '../ports/tokens.js';

export interface ListPaymentsInput {
  limit: number;
  offset: number;
  payer?: string;
  payTo?: string;
}

@Injectable()
export class ListPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    @Inject(DASHBOARD_CACHE) private readonly cache: CachePort,
  ) {}

  public execute(input: ListPaymentsInput): Promise<unknown[]> {
    return this.cache.readThrough(`dashboard:payments:${JSON.stringify(input)}`, () =>
      this.payments.listPayments(input, {
        payer: input.payer,
        payTo: input.payTo,
      }),
    );
  }
}
