import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '../config/config.service';
import { tenants, tenantMemberships } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import {
  SafeUser,
  CreateTenantInput,
  UpdateTenantInput,
  AccessTokenPayload,
} from '@super-optical/types';

@Injectable()
export class TenantsService {
  constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {}

  /**
   * List tenants accessible to the current user
   */
  async findAll(user: SafeUser) {
    const db = this.databaseService.getDb();

    if (user.isPlatformAdmin) {
      return db.select().from(tenants);
    }

    // Regular users: return tenants where they hold an active membership
    return db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        code: tenants.code,
        status: tenants.status,
        planTier: tenants.planTier,
        settings: tenants.settings,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants)
      .innerJoin(
        tenantMemberships,
        eq(tenants.id, tenantMemberships.tenantId)
      )
      .where(
        and(
          eq(tenantMemberships.userId, user.id),
          eq(tenantMemberships.status, 'ACTIVE')
        )
      );
  }

  /**
   * Find tenant by ID with cross-tenant authorization enforcement
   */
  async findById(tenantId: string, user: SafeUser) {
    const db = this.databaseService.getDb();

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!user.isPlatformAdmin) {
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
        throw new ForbiddenException('Access to requested tenant is unauthorized');
      }
    }

    return tenant;
  }

  /**
   * Create a new tenant (Platform Admin only)
   */
  async create(input: CreateTenantInput, user: SafeUser, ipAddress?: string) {
    if (!user.isPlatformAdmin) {
      throw new ForbiddenException('Only Platform Administrators can create tenants');
    }

    const db = this.databaseService.getDb();

    // Check slug or code uniqueness
    const [existing] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, input.slug))
      .limit(1);

    if (existing) {
      throw new ConflictException(`Tenant with slug '${input.slug}' already exists`);
    }

    const [newTenant] = await db
      .insert(tenants)
      .values({
        name: input.name,
        slug: input.slug,
        code: input.code,
        planTier: input.planTier || 'Starter',
        settings: input.settings || {},
        status: 'ACTIVE',
      })
      .returning();

    await this.auditService.log({
      tenantId: newTenant.id,
      userId: user.id,
      action: 'TENANT_CREATED',
      resource: 'tenants',
      resourceId: newTenant.id,
      ipAddress,
      metadata: { name: newTenant.name, slug: newTenant.slug, code: newTenant.code },
    });

    return newTenant;
  }

  /**
   * Update an existing tenant
   */
  async update(
    tenantId: string,
    input: UpdateTenantInput,
    user: SafeUser,
    ipAddress?: string
  ) {
    const tenant = await this.findById(tenantId, user);

    const db = this.databaseService.getDb();

    const [updated] = await db
      .update(tenants)
      .set({
        ...(input.name && { name: input.name }),
        ...(input.status && { status: input.status }),
        ...(input.planTier && { planTier: input.planTier }),
        ...(input.settings && { settings: input.settings }),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenant.id))
      .returning();

    await this.auditService.log({
      tenantId: tenant.id,
      userId: user.id,
      action: 'TENANT_UPDATED',
      resource: 'tenants',
      resourceId: tenant.id,
      ipAddress,
      metadata: { updates: input },
    });

    return updated;
  }

  /**
   * Switch active tenant context for user
   */
  async switchTenant(targetTenantId: string, user: SafeUser) {
    const tenant = await this.findById(targetTenantId, user);

    const tokenPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
      tenantId: tenant.id,
    };

    const accessToken = jwt.sign(tokenPayload, this.configService.jwtSecret, {
      expiresIn: this.configService.jwtExpiresIn as any,
    });

    return {
      accessToken,
      tenantContext: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status as any,
      },
    };
  }
}
