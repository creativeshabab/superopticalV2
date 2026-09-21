import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import {
  users,
  tenantMemberships,
  storeMemberships,
  stores,
  userRoles,
  roles,
  refreshTokens,
} from '../database/schema';
import { eq, and, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import {
  SafeUser,
  TenantContext,
  CreateUserInput,
  AssignUserRolesInput,
  AssignUserStoresInput,
} from '@super-optical/types';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  /**
   * List users, optionally scoped to active tenant
   */
  async findAll(tenant?: TenantContext, currentUser?: SafeUser) {
    const db = this.databaseService.getDb();

    if (tenant) {
      return db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          phone: users.phone,
          status: users.status,
          isPlatformAdmin: users.isPlatformAdmin,
          isOwner: tenantMemberships.isOwner,
          membershipStatus: tenantMemberships.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .innerJoin(
          tenantMemberships,
          eq(users.id, tenantMemberships.userId)
        )
        .where(
          and(
            eq(tenantMemberships.tenantId, tenant.id),
            eq(tenantMemberships.status, 'ACTIVE')
          )
        );
    }

    if (currentUser?.isPlatformAdmin) {
      return db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          phone: users.phone,
          status: users.status,
          isPlatformAdmin: users.isPlatformAdmin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users);
    }

    throw new ForbiddenException('Tenant context required to list users');
  }

  /**
   * Find user by ID with tenant boundary validation
   */
  async findById(userId: string, tenant?: TenantContext, currentUser?: SafeUser) {
    const db = this.databaseService.getDb();

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        status: users.status,
        isPlatformAdmin: users.isPlatformAdmin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!currentUser?.isPlatformAdmin && tenant) {
      const [membership] = await db
        .select()
        .from(tenantMemberships)
        .where(
          and(
            eq(tenantMemberships.tenantId, tenant.id),
            eq(tenantMemberships.userId, user.id)
          )
        )
        .limit(1);

      if (!membership) {
        throw new ForbiddenException('User is not a member of your tenant');
      }
    }

    // Get user roles
    let assignedRoles: any[] = [];
    if (tenant) {
      assignedRoles = await db
        .select({
          roleId: roles.id,
          roleName: roles.name,
          roleKey: roles.key,
          scope: roles.scope,
          storeId: userRoles.storeId,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
          and(
            eq(userRoles.tenantId, tenant.id),
            eq(userRoles.userId, user.id)
          )
        );
    }

    // Get user store memberships
    let assignedStores: any[] = [];
    if (tenant) {
      assignedStores = await db
        .select({
          storeId: stores.id,
          storeName: stores.name,
          storeCode: stores.code,
          isDefault: storeMemberships.isDefault,
        })
        .from(storeMemberships)
        .innerJoin(stores, eq(storeMemberships.storeId, stores.id))
        .where(
          and(
            eq(storeMemberships.tenantId, tenant.id),
            eq(storeMemberships.userId, user.id)
          )
        );
    }

    return {
      ...user,
      roles: assignedRoles,
      stores: assignedStores,
    };
  }

  /**
   * Create user and associate with current tenant
   */
  async create(
    input: CreateUserInput,
    tenant: TenantContext,
    currentUser: SafeUser,
    ipAddress?: string
  ) {
    const db = this.databaseService.getDb();
    const email = input.email.toLowerCase().trim();

    // 1. Check existing user by email
    let targetUserId: string;
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      // Check if already in this tenant
      const [existingMembership] = await db
        .select()
        .from(tenantMemberships)
        .where(
          and(
            eq(tenantMemberships.tenantId, tenant.id),
            eq(tenantMemberships.userId, existing.id)
          )
        )
        .limit(1);

      if (existingMembership) {
        throw new ConflictException('User is already a member of this tenant');
      }

      targetUserId = existing.id;
    } else {
      const passwordHash = await bcrypt.hash(input.password, 12);
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          fullName: input.fullName.trim(),
          phone: input.phone,
          status: 'ACTIVE',
          isPlatformAdmin: false,
        })
        .returning();

      targetUserId = newUser.id;
    }

    // 2. Add tenant membership
    await db.insert(tenantMemberships).values({
      tenantId: tenant.id,
      userId: targetUserId,
      status: 'ACTIVE',
      isOwner: false,
    });

    // 3. Resolve role keys and assign roles
    if (input.roleKeys && input.roleKeys.length > 0) {
      const foundRoles = await db
        .select()
        .from(roles)
        .where(
          inArray(roles.key, input.roleKeys)
        );

      for (const role of foundRoles) {
        await db.insert(userRoles).values({
          tenantId: tenant.id,
          userId: targetUserId,
          roleId: role.id,
          storeId: null,
        });
      }
    }

    // 4. Assign store memberships if provided
    if (input.storeIds && input.storeIds.length > 0) {
      for (const sId of input.storeIds) {
        // Validate store belongs to this tenant
        const [store] = await db
          .select()
          .from(stores)
          .where(
            and(
              eq(stores.id, sId),
              eq(stores.tenantId, tenant.id)
            )
          )
          .limit(1);

        if (store) {
          await db.insert(storeMemberships).values({
            tenantId: tenant.id,
            storeId: store.id,
            userId: targetUserId,
            isDefault: false,
          });
        }
      }
    }

    // 5. Synchronous Audit Log
    await this.auditService.log({
      tenantId: tenant.id,
      userId: currentUser.id,
      action: 'USER_CREATED',
      resource: 'users',
      resourceId: targetUserId,
      ipAddress,
      metadata: { email, roles: input.roleKeys, stores: input.storeIds },
    });

    return this.findById(targetUserId, tenant, currentUser);
  }

  /**
   * Update user status (ACTIVE / DISABLED / SUSPENDED)
   * Synchronously invalidates all active sessions/tokens if status is not ACTIVE.
   */
  async updateStatus(
    userId: string,
    status: 'ACTIVE' | 'DISABLED' | 'SUSPENDED',
    tenant?: TenantContext,
    currentUser?: SafeUser,
    ipAddress?: string
  ) {
    if (currentUser?.id === userId && status !== 'ACTIVE') {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    const targetUser = await this.findById(userId, tenant, currentUser);
    const db = this.databaseService.getDb();

    await db
      .update(users)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUser.id));

    // If disabled or suspended: synchronously revoke all refresh tokens
    if (status !== 'ACTIVE') {
      await db
        .update(refreshTokens)
        .set({
          isRevoked: true,
          revokedAt: new Date(),
        })
        .where(eq(refreshTokens.userId, targetUser.id));

      await this.auditService.logSecurityEvent({
        eventType: 'USER_ACCOUNT_DISABLED',
        severity: 'WARN',
        actorId: currentUser?.id,
        tenantId: tenant?.id,
        ipAddress,
        details: { targetUserId: targetUser.id, newStatus: status },
      });
    }

    await this.auditService.log({
      tenantId: tenant?.id,
      userId: currentUser?.id,
      action: 'USER_STATUS_UPDATED',
      resource: 'users',
      resourceId: targetUser.id,
      ipAddress,
      metadata: { previousStatus: targetUser.status, newStatus: status },
    });

    return { success: true, id: targetUser.id, status };
  }

  /**
   * Assign roles to user within tenant
   */
  async assignRoles(
    userId: string,
    input: AssignUserRolesInput,
    tenant: TenantContext,
    currentUser: SafeUser,
    ipAddress?: string
  ) {
    const targetUser = await this.findById(userId, tenant, currentUser);
    const db = this.databaseService.getDb();

    // Verify roles exist
    const foundRoles = await db
      .select()
      .from(roles)
      .where(inArray(roles.id, input.roleIds));

    if (foundRoles.length !== input.roleIds.length) {
      throw new BadRequestException('One or more specified role IDs do not exist');
    }

    // Verify store if specified
    if (input.storeId) {
      const [store] = await db
        .select()
        .from(stores)
        .where(
          and(
            eq(stores.id, input.storeId),
            eq(stores.tenantId, tenant.id)
          )
        )
        .limit(1);

      if (!store) {
        throw new BadRequestException('Specified store does not belong to this tenant');
      }
    }

    // Delete existing roles for this target user in this tenant (and store if specified)
    await db
      .delete(userRoles)
      .where(
        and(
          eq(userRoles.tenantId, tenant.id),
          eq(userRoles.userId, targetUser.id)
        )
      );

    // Insert new roles
    for (const role of foundRoles) {
      await db.insert(userRoles).values({
        tenantId: tenant.id,
        userId: targetUser.id,
        roleId: role.id,
        storeId: input.storeId || null,
      });
    }

    await this.auditService.log({
      tenantId: tenant.id,
      userId: currentUser.id,
      action: 'USER_ROLES_ASSIGNED',
      resource: 'users',
      resourceId: targetUser.id,
      ipAddress,
      metadata: { roleIds: input.roleIds, storeId: input.storeId },
    });

    return this.findById(targetUser.id, tenant, currentUser);
  }

  /**
   * Assign store memberships to user
   */
  async assignStores(
    userId: string,
    input: AssignUserStoresInput,
    tenant: TenantContext,
    currentUser: SafeUser,
    ipAddress?: string
  ) {
    const targetUser = await this.findById(userId, tenant, currentUser);
    const db = this.databaseService.getDb();

    // Validate that all storeIds belong to this tenant
    const foundStores = await db
      .select()
      .from(stores)
      .where(
        and(
          eq(stores.tenantId, tenant.id),
          inArray(stores.id, input.storeIds)
        )
      );

    if (foundStores.length !== input.storeIds.length) {
      throw new ForbiddenException(
        'One or more stores do not belong to the active tenant'
      );
    }

    // Remove existing store memberships for this tenant
    await db
      .delete(storeMemberships)
      .where(
        and(
          eq(storeMemberships.tenantId, tenant.id),
          eq(storeMemberships.userId, targetUser.id)
        )
      );

    // Insert new store memberships
    for (const sId of input.storeIds) {
      await db.insert(storeMemberships).values({
        tenantId: tenant.id,
        storeId: sId,
        userId: targetUser.id,
        isDefault: input.defaultStoreId === sId,
      });
    }

    await this.auditService.log({
      tenantId: tenant.id,
      userId: currentUser.id,
      action: 'USER_STORES_ASSIGNED',
      resource: 'users',
      resourceId: targetUser.id,
      ipAddress,
      metadata: { storeIds: input.storeIds, defaultStoreId: input.defaultStoreId },
    });

    return this.findById(targetUser.id, tenant, currentUser);
  }
}
