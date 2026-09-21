import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '../config/config.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatabaseModule, ConfigModule, AuditModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
