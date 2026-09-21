import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { stores, storeMemberships, userRoles, roles } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import {
  SafeUser,
  TenantContext,
  CreateStoreInput,
  UpdateStoreInput,
} from '@super-optical/types';

@Injectable()
export class StoresService {
  constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  /**
   * Helper: check if user is a tenant admin within this tenant
   */
  private async isUserTenantAdmin(userId: string, tenantId: string): Promise<boolean> {
    const db = this.databaseService.getDb();
    const assignedRoles = await db
      .select({
        roleName: roles.name,
        roleScope: roles.scope,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.tenantId, tenantId),
          eq(userRoles.userId, userId)
        )
      );

    return assignedRoles.some(
      (r) => r.roleName === 'TENANT_ADMIN' || r.roleScope === 'TENANT' || r.roleScope === 'PLATFORM'
    );
  }

  /**
   * List stores within tenant context
   */
  async findAll(tenant: TenantContext, user: SafeUser) {
    const db = this.databaseService.getDb();

    // Platform admin and tenant admin see all stores in the tenant
    const hasFullTenantVisibility =
      user.isPlatformAdmin || (await this.isUserTenantAdmin(user.id, tenant.id));

    if (hasFullTenantVisibility) {
      return db
        .select()
        .from(stores)
        .where(eq(stores.tenantId, tenant.id));
    }

    // Regular staff only see stores they are assigned to
    return db
      .select({
        id: stores.id,
        tenantId: stores.tenantId,
        name: stores.name,
        code: stores.code,
        isMainBranch: stores.isMainBranch,
        status: stores.status,
        address: stores.address,
        phone: stores.phone,
        email: stores.email,
        createdAt: stores.createdAt,
        updatedAt: stores.updatedAt,
      })
      .from(stores)
      .innerJoin(
        storeMemberships,
        eq(stores.id, storeMemberships.storeId)
      )
      .where(
        and(
          eq(stores.tenantId, tenant.id),
          eq(storeMemberships.userId, user.id)
        )
      );
  }

  /**
   * Find store by ID, enforcing tenant boundary and user authorization
   */
  async findById(storeId: string, tenant: TenantContext, user: SafeUser) {
    const db = this.databaseService.getDb();

    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Enforce Tenant Boundary: If store belongs to another tenant, 403 Forbidden!
    if (store.tenantId !== tenant.id) {
      throw new ForbiddenException(
        'Cross-tenant access prohibited: store belongs to a different tenant'
      );
    }

    // Check user authorization if not admin
    const hasFullTenantVisibility =
      user.isPlatformAdmin || (await this.isUserTenantAdmin(user.id, tenant.id));

    if (!hasFullTenantVisibility) {
      const [membership] = await db
        .select()
        .from(storeMemberships)
        .where(
          and(
            eq(storeMemberships.storeId, store.id),
            eq(storeMemberships.tenantId, tenant.id),
            eq(storeMemberships.userId, user.id)
          )
        )
        .limit(1);

      if (!membership) {
        throw new ForbiddenException(
          'User is not an active member of the requested store'
        );
      }
    }

    return store;
  }

  /**
   * Create a new store within active tenant context
   */
  async create(
    input: CreateStoreInput,
    tenant: TenantContext,
    user: SafeUser,
    ipAddress?: string
  ) {
    const db = this.databaseService.getDb();

    // Check duplicate code in this tenant
    const [existing] = await db
      .select()
      .from(stores)
      .where(
        and(
          eq(stores.tenantId, tenant.id),
          eq(stores.code, input.code)
        )
      )
      .limit(1);

    if (existing) {
      throw new ConflictException(
        `Store with code '${input.code}' already exists in this tenant`
      );
    }

    const [newStore] = await db
      .insert(stores)
      .values({
        tenantId: tenant.id,
        name: input.name,
        code: input.code,
        isMainBranch: input.isMainBranch ?? false,
        address: input.address || {},
        phone: input.phone,
        email: input.email,
        status: 'ACTIVE',
      })
      .returning();

    await this.auditService.log({
      tenantId: tenant.id,
      storeId: newStore.id,
      userId: user.id,
      action: 'STORE_CREATED',
      resource: 'stores',
      resourceId: newStore.id,
      ipAddress,
      metadata: { name: newStore.name, code: newStore.code },
    });

    return newStore;
  }

  /**
   * Update an existing store
   */
  async update(
    storeId: string,
    input: UpdateStoreInput,
    tenant: TenantContext,
    user: SafeUser,
    ipAddress?: string
  ) {
    const store = await this.findById(storeId, tenant, user);

    const db = this.databaseService.getDb();

    const [updated] = await db
      .update(stores)
      .set({
        ...(input.name && { name: input.name }),
        ...(input.code && { code: input.code }),
        ...(input.isMainBranch !== undefined && { isMainBranch: input.isMainBranch }),
        ...(input.status && { status: input.status }),
        ...(input.address && { address: input.address }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.email !== undefined && { email: input.email }),
        updatedAt: new Date(),
      })
      .where(eq(stores.id, store.id))
      .returning();

    await this.auditService.log({
      tenantId: tenant.id,
      storeId: store.id,
      userId: user.id,
      action: 'STORE_UPDATED',
      resource: 'stores',
      resourceId: store.id,
      ipAddress,
      metadata: { updates: input },
    });

    return updated;
  }

  /**
   * Switch user store context
   */
  async switchStore(storeId: string, tenant: TenantContext, user: SafeUser) {
    const store = await this.findById(storeId, tenant, user);
    return {
      storeContext: {
        id: store.id,
        code: store.code,
        name: store.name,
        tenantId: store.tenantId,
      },
    };
  }
}
