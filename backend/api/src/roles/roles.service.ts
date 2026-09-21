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
  roles,
  permissions,
  rolePermissions,
} from '../database/schema';
import { eq, and, or, isNull, inArray } from 'drizzle-orm';
import {
  SafeUser,
  TenantContext,
  CreateRoleInput,
} from '@super-optical/types';

@Injectable()
export class RolesService {
  constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  /**
   * List all available permissions in the system
   */
  async findAllPermissions() {
    const db = this.databaseService.getDb();
    return db.select().from(permissions);
  }

  /**
   * List roles accessible in the current tenant (system roles + tenant-specific roles)
   */
  async findAllRoles(tenant?: TenantContext) {
    const db = this.databaseService.getDb();

    if (tenant) {
      return db
        .select()
        .from(roles)
        .where(
          or(
            eq(roles.tenantId, tenant.id),
            eq(roles.isSystem, true),
            isNull(roles.tenantId)
          )
        );
    }

    // Platform level: return all roles
    return db.select().from(roles);
  }

  /**
   * Find role by ID with permissions
   */
  async findRoleById(roleId: string, tenant?: TenantContext) {
    const db = this.databaseService.getDb();

    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (tenant && role.tenantId && role.tenantId !== tenant.id) {
      throw new ForbiddenException('Role belongs to another tenant');
    }

    const assignedPerms = await db
      .select({
        id: permissions.id,
        key: permissions.key,
        name: permissions.name,
        category: permissions.category,
        description: permissions.description,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, role.id));

    return {
      ...role,
      permissions: assignedPerms,
    };
  }

  /**
   * Create custom tenant role
   */
  async createRole(
    input: CreateRoleInput,
    tenant: TenantContext,
    user: SafeUser,
    ipAddress?: string
  ) {
    const db = this.databaseService.getDb();

    // Check key uniqueness within tenant
    const [existing] = await db
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.tenantId, tenant.id),
          eq(roles.key, input.key)
        )
      )
      .limit(1);

    if (existing) {
      throw new ConflictException(
        `Role with key '${input.key}' already exists in this tenant`
      );
    }

    const [newRole] = await db
      .insert(roles)
      .values({
        tenantId: tenant.id,
        name: input.name,
        key: input.key,
        scope: input.scope,
        description: input.description,
        isSystem: false,
      })
      .returning();

    // Assign permissions
    if (input.permissionKeys && input.permissionKeys.length > 0) {
      const foundPerms = await db
        .select()
        .from(permissions)
        .where(inArray(permissions.key, input.permissionKeys));

      for (const p of foundPerms) {
        await db.insert(rolePermissions).values({
          roleId: newRole.id,
          permissionId: p.id,
        });
      }
    }

    await this.auditService.log({
      tenantId: tenant.id,
      userId: user.id,
      action: 'ROLE_CREATED',
      resource: 'roles',
      resourceId: newRole.id,
      ipAddress,
      metadata: { name: newRole.name, key: newRole.key, scope: newRole.scope },
    });

    return this.findRoleById(newRole.id, tenant);
  }

  /**
   * Update role permissions (system roles are immutable)
   */
  async updateRolePermissions(
    roleId: string,
    permissionKeys: string[],
    tenant: TenantContext,
    user: SafeUser,
    ipAddress?: string
  ) {
    const targetRole = await this.findRoleById(roleId, tenant);

    if (targetRole.isSystem) {
      throw new BadRequestException('System roles cannot be modified');
    }

    const db = this.databaseService.getDb();

    // Verify requested permissions exist
    const foundPerms = await db
      .select()
      .from(permissions)
      .where(inArray(permissions.key, permissionKeys));

    if (foundPerms.length !== permissionKeys.length) {
      throw new BadRequestException('One or more permission keys are invalid');
    }

    // Remove existing role permissions
    await db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, targetRole.id));

    // Insert new role permissions
    for (const p of foundPerms) {
      await db.insert(rolePermissions).values({
        roleId: targetRole.id,
        permissionId: p.id,
      });
    }

    await this.auditService.log({
      tenantId: tenant.id,
      userId: user.id,
      action: 'ROLE_PERMISSIONS_UPDATED',
      resource: 'roles',
      resourceId: targetRole.id,
      ipAddress,
      metadata: { permissionKeys },
    });

    return this.findRoleById(targetRole.id, tenant);
  }
}
