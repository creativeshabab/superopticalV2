import {
  Controller,
  Get,
  Query,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { CurrentUser, CurrentTenant, RequirePermissions } from '../common/decorators';
import { SafeUser, TenantContext } from '@super-optical/types';

@Controller('audit')
export class AuditController {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}

  @Get('logs')
  @RequirePermissions('audit:read')
  async getAuditLogs(
    @CurrentUser() user: SafeUser,
    @CurrentTenant() tenant: TenantContext | undefined,
    @Query('tenantId') queryTenantId?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    // Platform admin can view logs for any tenant or across all tenants
    if (user.isPlatformAdmin) {
      const logs = await this.auditService.findLogs({
        tenantId: queryTenantId || tenant?.id,
        limit,
        offset,
      });
      return { success: true, data: logs };
    }

    // Tenant admin can only view their own tenant's audit logs
    const effectiveTenantId = tenant?.id;
    if (!effectiveTenantId) {
      throw new ForbiddenException('Tenant context is required to view audit logs');
    }

    if (queryTenantId && queryTenantId !== effectiveTenantId) {
      throw new ForbiddenException('Cannot view audit logs for a different tenant');
    }

    const logs = await this.auditService.findLogs({
      tenantId: effectiveTenantId,
      limit,
      offset,
    });
    return { success: true, data: logs };
  }
}
