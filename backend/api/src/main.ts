import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Tenant-ID',
      'X-Store-ID',
      'X-Correlation-ID',
      'x-tenant-id',
      'x-store-id',
      'x-correlation-id',
    ],
    exposedHeaders: ['X-Correlation-ID', 'x-correlation-id'],
  });

  app.setGlobalPrefix('api/v1');

  const port = configService.port;
  await app.listen(port);
  logger.log(`Super Optical V2 API running on http://localhost:${port}/api/v1`);
}

bootstrap();
