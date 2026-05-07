import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { GetPaymentDetailUseCase } from '../../application/payment/get-payment-detail.usecase.js';
import { ListPaymentsUseCase } from '../../application/payment/list-payments.usecase.js';
import { API_ROUTES } from '../routes.js';
import {
  paymentDetailParamsSchema,
  paymentsQuerySchema,
} from './payment.schema.js';

@Controller()
export class PaymentsController {
  constructor(
    @Inject(ListPaymentsUseCase) private readonly listPaymentsUseCase: ListPaymentsUseCase,
    @Inject(GetPaymentDetailUseCase)
    private readonly getPaymentDetailUseCase: GetPaymentDetailUseCase,
  ) {}

  @Get(API_ROUTES.payments.list)
  public async list(@Query() query: Record<string, unknown>): Promise<{ data: unknown[] }> {
    return { data: await this.listPaymentsUseCase.execute(paymentsQuerySchema.parse(query)) };
  }

  @Get(API_ROUTES.payments.detail)
  public async detail(@Param() params: Record<string, unknown>): Promise<{ data: unknown }> {
    return { data: await this.getPaymentDetailUseCase.execute(paymentDetailParamsSchema.parse(params)) };
  }
}
