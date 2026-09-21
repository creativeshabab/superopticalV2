import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../../database/database.service';
import { tenants, tenantMemberships } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { IS_PUBLIC_KEY, REQUIRE_TENANT_KEY } from '../decorators';
import { TenantContext } from '@super-optical/types';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(DatabaseService) private readonly databaseService: DatabaseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiresTenant = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_TENANT_KEY,
      [context.getHandler(), context.getClass()]
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      return true; // JwtAuthGuard will have handled unauthenticated users if applied in chain
    }

    const requestedTenantId =
      (request.headers['x-tenant-id'] as string) ||
      (request.headers['x-tenant-id'.toLowerCase()] as string);

    const db = this.databaseService.getDb();

    let targetTenantId = requestedTenantId;

    if (!targetTenantId) {
      if (!requiresTenant) {
        return true;
      }

      // If tenant is required but header omitted, check if non-platform user has exactly 1 active membership
      if (!user.isPlatformAdmin) {
        const userMemberships = await db
          .select({ tenantId: tenantMemberships.tenantId })
          .from(tenantMemberships)
          .where(
            and(
              eq(tenantMemberships.userId, user.id),
              eq(tenantMemberships.status, 'ACTIVE')
            )
          );

        if (userMemberships.length === 1) {
          targetTenantId = userMemberships[0].tenantId;
        } else if (userMemberships.length === 0) {
          throw new ForbiddenException('User does not belong to any active tenant');
        } else {
          throw new BadRequestException(
            'Tenant context required. Please provide X-Tenant-ID header.'
          );
        }
      } else {
        throw new BadRequestException(
          'Tenant context required for this operation. Please provide X-Tenant-ID header.'
        );
      }
    }

    // Tenant ID was requested (either via header or single membership default)
    // 1. Verify tenant exists in database
    const [tenant] = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        status: tenants.status,
      })
      .from(tenants)
      .where(eq(tenants.id, targetTenantId))
      .limit(1);

    if (!tenant) {
      throw new ForbiddenException('Target tenant not found or access denied');
    }

    // 2. Platform Admin has universal authorized scope across tenants
    if (user.isPlatformAdmin) {
      request.tenantContext = {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
      } as TenantContext;
      return true;
    }

    // 3. For regular users: Tenant must be ACTIVE
    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException('Target tenant is suspended or inactive');
    }

    // 4. Verify explicit active membership
    const [membership] = await db
      .select()
      .from(tenantMemberships)
      .where(
        and(
          eq(tenantMemberships.tenantId, tenant.id),
          eq(tenantMemberships.userId, user.id),
          eq(tenantMemberships.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (!membership) {
      throw new ForbiddenException(
        'Access to requested tenant is forbidden: user is not an active member'
      );
    }

    request.tenantContext = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
    } as TenantContext;

    return true;
  }
}
