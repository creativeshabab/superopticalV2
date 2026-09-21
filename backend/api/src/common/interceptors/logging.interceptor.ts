import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const correlationId =
      (req.headers['x-correlation-id'] as string) || randomUUID();
    res.setHeader('x-correlation-id', correlationId);

    const startTime = Date.now();
    const { method, originalUrl } = req;
    const ip = req.ip || req.socket.remoteAddress;

    return next.handle().pipe(
      tap({
        next: () => {
          const latencyMs = Date.now() - startTime;
          const user = (req as any).user;
          const tenant = (req as any).tenantContext;
          const store = (req as any).storeContext;

          this.logger.log(
            JSON.stringify({
              type: 'HTTP_REQUEST_SUCCESS',
              correlationId,
              method,
              path: originalUrl,
              statusCode: res.statusCode,
              latencyMs,
              userId: user?.id ?? null,
              tenantId: tenant?.id ?? null,
              storeId: store?.id ?? null,
              ip,
            })
          );
        },
        error: (err) => {
          const latencyMs = Date.now() - startTime;
          this.logger.warn(
            JSON.stringify({
              type: 'HTTP_REQUEST_ERROR',
              correlationId,
              method,
              path: originalUrl,
              statusCode: err.status || 500,
              latencyMs,
              error: err.message,
              ip,
            })
          );
        },
      })
    );
  }
}
