import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../../database/database.service';
import { userRoles, rolePermissions, permissions } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '../decorators';
import { PermissionKey } from '@super-optical/types';

@Injectable()
export class PermissionsGuard implements CanActivate {
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

    const requiredPermissions = this.reflector.getAllAndOverride<PermissionKey[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Platform admin has universal authorization across all permissions
    if (user.isPlatformAdmin) {
      return true;
    }

    const tenantContext = request.tenantContext;
    if (!tenantContext) {
      throw new ForbiddenException(
        'Tenant context is required to evaluate permissions'
      );
    }

    const db = this.databaseService.getDb();

    // Query active permissions for the user within this tenant
    const userPerms = await db
      .select({
        permKey: permissions.key,
      })
      .from(userRoles)
      .innerJoin(
        rolePermissions,
        eq(userRoles.roleId, rolePermissions.roleId)
      )
      .innerJoin(
        permissions,
        eq(rolePermissions.permissionId, permissions.id)
      )
      .where(
        and(
          eq(userRoles.tenantId, tenantContext.id),
          eq(userRoles.userId, user.id)
        )
      );

    const granted = new Set(userPerms.map((p) => p.permKey as string));

    const normalizePerm = (p: string): string => {
      return p
        .toLowerCase()
        .replace(':', '.')
        .replace(/^users\./, 'user.')
        .replace(/^stores\./, 'store.')
        .replace(/^tenants\./, 'tenant.')
        .replace(/^roles\./, 'role.');
    };

    const hasPermission = (req: string): boolean => {
      if (granted.has(req)) return true;
      const normReq = normalizePerm(req);
      for (const g of granted) {
        const normG = normalizePerm(g);
        if (normG === normReq) return true;
        if (normReq === 'role.manage' && normG.startsWith('role.')) return true;
        if (normG === 'role.manage' && normReq.startsWith('role.')) return true;
      }
      return false;
    };

    const missing = requiredPermissions.filter((p) => !hasPermission(p));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Insufficient permissions. Missing: ${missing.join(', ')}`
      );
    }

    return true;
  }
}
