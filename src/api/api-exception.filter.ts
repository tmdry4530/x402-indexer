import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import {
  DependencyUnavailableError,
  isApplicationError,
  NotFoundError,
  ValidationError,
} from '../application/errors/application-error.js';
import { z } from 'zod';

// 이전 HTTP 레이어의 error 응답 contract를 Nest 전역 필터로 유지한다.
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();

    if (exception instanceof z.ZodError) {
      response.status(400).json({
        error: '요청 파라미터가 올바르지 않습니다',
        issues: exception.issues,
      });
      return;
    }

    if (isApplicationError(exception)) {
      const status = exception instanceof NotFoundError
        ? 404
        : exception instanceof ValidationError
          ? 400
          : exception instanceof DependencyUnavailableError
            ? 503
            : 500;
      response.status(status).json({ error: exception.message });
      return;
    }

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      response.status(exception.getStatus()).json(
        typeof body === 'string'
          ? {
              error: body,
            }
          : body,
      );
      return;
    }

    console.error(exception);
    response.status(500).send('Internal Server Error');
  }
}
