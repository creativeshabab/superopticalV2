import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '../config/config.module';

@Global()
@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
