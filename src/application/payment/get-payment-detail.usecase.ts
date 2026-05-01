import { Inject, Injectable } from '@nestjs/common';
import type { PaymentRepository } from '../../domain/payment/payment.repository.js';
import { NotFoundError } from '../errors/application-error.js';
import type { CachePort } from '../ports/cache.port.js';
import { DASHBOARD_CACHE, PAYMENT_REPOSITORY } from '../ports/tokens.js';

export interface GetPaymentDetailInput {
  txHash: string;
  logIndex: number;
}

@Injectable()
export class GetPaymentDetailUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    @Inject(DASHBOARD_CACHE) private readonly cache: CachePort,
  ) {}

  public async execute(input: GetPaymentDetailInput): Promise<unknown> {
    const payment = await this.cache.readThrough(
      `dashboard:payment-detail:${input.txHash}:${input.logIndex}`,
      () => this.payments.getPaymentDetail(input.txHash, input.logIndex),
    );
    if (!payment) {
      throw new NotFoundError('결제를 찾을 수 없습니다');
    }
    return payment;
  }
}
