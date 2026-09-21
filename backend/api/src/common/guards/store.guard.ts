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
import { stores, storeMemberships, userRoles, roles } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { IS_PUBLIC_KEY, REQUIRE_STORE_KEY } from '../decorators';
import { StoreContext } from '@super-optical/types';

@Injectable()
export class StoreGuard implements CanActivate {
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

    const requiresStore = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_STORE_KEY,
      [context.getHandler(), context.getClass()]
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      return true;
    }

    const requestedStoreId =
      (request.headers['x-store-id'] as string) ||
      (request.headers['x-store-id'.toLowerCase()] as string);

    const db = this.databaseService.getDb();
    let targetStoreId = requestedStoreId;

    if (!targetStoreId) {
      if (!requiresStore) {
        return true;
      }

      // If store is required, tenant context must exist
      const tenantContext = request.tenantContext;
      if (!tenantContext) {
        throw new BadRequestException('Store context requires an active tenant context');
      }

      // If non-admin user has exactly 1 active store membership in this tenant, default to it
      const memberships = await db
        .select({ storeId: storeMemberships.storeId })
        .from(storeMemberships)
        .where(
          and(
            eq(storeMemberships.tenantId, tenantContext.id),
            eq(storeMemberships.userId, user.id)
          )
        );

      if (memberships.length === 1) {
        targetStoreId = memberships[0].storeId;
      } else if (memberships.length === 0 && !user.isPlatformAdmin) {
        throw new ForbiddenException('User has no active store memberships in this tenant');
      } else {
        throw new BadRequestException(
          'Store context required. Please provide X-Store-ID header.'
        );
      }
    }

    // A store ID was requested:
    // 1. Verify that tenant context is established
    const tenantContext = request.tenantContext;
    if (!tenantContext) {
      throw new BadRequestException(
        'Store operations require an active tenant context (X-Tenant-ID header)'
      );
    }

    // 2. Fetch the store from the database
    const [store] = await db
      .select({
        id: stores.id,
        tenantId: stores.tenantId,
        code: stores.code,
        name: stores.name,
        status: stores.status,
      })
      .from(stores)
      .where(eq(stores.id, targetStoreId))
      .limit(1);

    if (!store) {
      throw new ForbiddenException('Target store not found or access denied');
    }

    // 3. Verify store strictly belongs to current tenant
    if (store.tenantId !== tenantContext.id) {
      throw new ForbiddenException(
        'Store does not belong to the active tenant context'
      );
    }

    // 4. Verify store is active
    if (store.status !== 'ACTIVE' && !user.isPlatformAdmin) {
      throw new ForbiddenException('Target store is deactivated');
    }

    // 5. Verify user authorization for this store:
    // Platform Admins have universal store access.
    if (user.isPlatformAdmin) {
      request.storeContext = {
        id: store.id,
        code: store.code,
        name: store.name,
        tenantId: store.tenantId,
      } as StoreContext;
      return true;
    }

    // Check if user has Tenant Admin role in this tenant (grants tenant-wide store access)
    const userTenantRoles = await db
      .select({
        roleName: roles.name,
        roleScope: roles.scope,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.tenantId, tenantContext.id),
          eq(userRoles.userId, user.id)
        )
      );

    const isTenantAdmin = userTenantRoles.some(
      (r) => r.roleName === 'TENANT_ADMIN' || r.roleScope === 'TENANT' || r.roleScope === 'PLATFORM'
    );

    if (isTenantAdmin) {
      request.storeContext = {
        id: store.id,
        code: store.code,
        name: store.name,
        tenantId: store.tenantId,
      } as StoreContext;
      return true;
    }

    // Non-admin staff MUST have an active store membership for this exact store and tenant
    const [membership] = await db
      .select()
      .from(storeMemberships)
      .where(
        and(
          eq(storeMemberships.tenantId, tenantContext.id),
          eq(storeMemberships.storeId, store.id),
          eq(storeMemberships.userId, user.id)
        )
      )
      .limit(1);

    if (!membership) {
      throw new ForbiddenException(
        'User is not an active member of the requested store'
      );
    }

    request.storeContext = {
      id: store.id,
      code: store.code,
      name: store.name,
      tenantId: store.tenantId,
    } as StoreContext;

    return true;
  }
}
