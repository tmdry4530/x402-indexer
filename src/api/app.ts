import 'reflect-metadata';
import path from 'node:path';
import type { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ApiExceptionFilter } from './api-exception.filter.js';
import { ApiModule } from './api.module.js';
import type { ApiModuleDependencies } from '../runtime/api-dependencies.js';

export type { ApiModuleDependencies } from '../runtime/api-dependencies.js';

export interface CreateAppOptions {
  logger?: NestApplicationOptions['logger'];
  staticAssets?: boolean;
}

// Nest 애플리케이션 factory.
// 기존 createApp 진입점은 유지하되 Nest INestApplication을 반환한다.
export async function createApp(
  deps: ApiModuleDependencies,
  options: CreateAppOptions = {},
): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(ApiModule.register(deps), {
    logger: options.logger ?? ['error', 'warn', 'log'],
  });

  app.useGlobalFilters(new ApiExceptionFilter());

  if (options.staticAssets !== false) {
    configureStaticAssets(app);
  }

  await app.init();
  return app;
}

function configureStaticAssets(app: NestExpressApplication): void {
  // 기존 static route contract 보존:
  // - /docs/* -> ./docs/*
  // - /ui/ 및 /ui/* -> ./web/index.html 및 web assets
  app.useStaticAssets(path.resolve('docs'), { prefix: '/docs/' });
  app.useStaticAssets(path.resolve('web'), { prefix: '/ui/' });
}
