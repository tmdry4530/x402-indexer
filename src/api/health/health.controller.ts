import { Controller, Get } from '@nestjs/common';
import { API_ROUTES } from '../routes.js';

@Controller()
export class HealthController {
  @Get(API_ROUTES.health)
  public health(): { ok: true } {
    return { ok: true };
  }
}
