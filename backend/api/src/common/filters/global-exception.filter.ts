import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { randomUUID } from 'crypto';
import { ZodError } from 'zod';
import { ApiErrorResponse } from '@super-optical/types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId =
      (request.headers['x-correlation-id'] as string) || randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected internal server error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, any>;
        message = obj.message || obj.error || exception.message;
        details = obj.details || (Array.isArray(obj.message) ? obj.message : undefined);
      }
      code = exception.name.replace('Exception', '').toUpperCase() || 'HTTP_ERROR';
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      message = 'Request validation failed';
      details = exception.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));
    } else if ((exception as any)?.code === '23505') {
      // Postgres unique_violation
      status = HttpStatus.CONFLICT;
      code = 'CONFLICT_UNIQUE_VIOLATION';
      message = 'A resource with these unique attributes already exists';
      details = (exception as any).detail;
    } else if ((exception as any)?.code === '23503') {
      // Postgres foreign_key_violation
      status = HttpStatus.BAD_REQUEST;
      code = 'FOREIGN_KEY_VIOLATION';
      message = 'Referenced related resource does not exist';
      details = (exception as any).detail;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `[${correlationId}] ${request.method} ${request.url} ${status} - ${message}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception)
    );

    const errorPayload: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        correlationId,
        path: request.url,
      },
    };

    response.setHeader('x-correlation-id', correlationId);
    response.status(status).json(errorPayload);
  }
}
