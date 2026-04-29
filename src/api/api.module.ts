import { DynamicModule, Module } from '@nestjs/common';
import { ApiController } from './api.controller.js';
import { ApiService } from './api.service.js';
import { API_SERVICES, type AppServices } from './services.js';

// 런타임에서 이미 조립된 DB/Redis/Queue를 Nest DI에 연결하는 동적 모듈.
// 기존 index.ts의 wiring ownership을 유지하면서 HTTP framework만 Nest로 교체한다.
@Module({})
export class ApiModule {
  public static register(services: AppServices): DynamicModule {
    return {
      module: ApiModule,
      controllers: [ApiController],
      providers: [
        ApiService,
        {
          provide: API_SERVICES,
          useValue: services,
        },
      ],
    };
  }
}
