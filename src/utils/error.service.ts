// all-exceptions.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { TracerLogger } from 'src/logger/logger.service';

@Catch() // catch ANY error
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: TracerLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Avoid leaking internals in prod
    const isProd = process.env.NODE_ENV === 'production';
    const message = isHttp
      ? (exception as HttpException).message
      : isProd
        ? 'Internal server error'
        : ((exception as any)?.message ?? 'Internal error');

    const body = {
      statusCode: status,
      message,
      path: httpAdapter.getRequestUrl(req as any),
      method: (req as any)?.method,
      timestamp: new Date().toISOString(),
      requestId: (req as any)?.headers?.['x-request-id'],
    };

    // Structured log with stack only in non-prod
    this.logger.error('http_error', {
      status,
      path: body.path,
      method: body.method,
      requestId: body.requestId,
      error:
        exception instanceof Error
          ? {
              name: exception.name,
              message: exception.message,
              stack: isProd ? undefined : exception.stack,
            }
          : exception,
    });

    httpAdapter.reply(res as any, body, status);
  }
}
