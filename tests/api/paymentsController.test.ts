import type { Pool } from 'pg';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/api/app.js';
import { PaymentsController } from '../../src/api/payments/payments.controller.js';

const paymentList = [
  {
    transaction_hash: '0xtx',
    log_index: 0,
    payer: '0xpayer',
    pay_to: '0xservice',
  },
];

const paymentDetail = {
  transaction_hash: '0xtx',
  log_index: 0,
  payer: '0xpayer',
  pay_to: '0xservice',
  confidence: 90,
};

describe('PaymentsController module wiring', () => {
  let app: NestExpressApplication | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
    vi.restoreAllMocks();
  });

  it('resolves from the Nest container and returns payments through the wired use cases', async () => {
    const dbQuery = vi.fn(async () => {
      throw new Error('payment repository should not be queried when cache has data');
    });
    const redis = {
      get: vi.fn(async (key: string) => {
        if (key === 'dashboard:payments:{"limit":20,"offset":0,"payer":"0xpayer"}') {
          return JSON.stringify(paymentList);
        }
        if (key === 'dashboard:payment-detail:0xtx:0') {
          return JSON.stringify(paymentDetail);
        }
        return null;
      }),
      setex: vi.fn(async () => 'OK'),
    };

    app = await createApp(
      {
        db: { query: dbQuery } as unknown as Pool,
        redis,
      },
      { logger: false, staticAssets: false },
    );

    const controller = app.get(PaymentsController);

    await expect(controller.list({ payer: '0xpayer' })).resolves.toEqual({ data: paymentList });
    await expect(controller.detail({ txHash: '0xtx', logIndex: '0' })).resolves.toEqual({
      data: paymentDetail,
    });
    expect(controller).toBeInstanceOf(PaymentsController);
    expect(redis.setex).not.toHaveBeenCalled();
    expect(dbQuery).not.toHaveBeenCalled();
  });
});
