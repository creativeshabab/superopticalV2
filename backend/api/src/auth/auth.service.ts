import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '../config/config.service';
import { AuditService } from '../audit/audit.service';
import {
  users,
  refreshTokens,
  tenants,
  stores,
  tenantMemberships,
  storeMemberships,
  userRoles,
  roles,
  rolePermissions,
  permissions,
} from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  AccessTokenPayload,
  SafeUser,
  LoginResponse,
  AuthUserSession,
  PermissionKey,
} from '@super-optical/types';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateRawRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  /**
   * Resolve user permissions across roles
   */
  async getUserPermissions(userId: string, tenantId?: string): Promise<PermissionKey[]> {
    const db = this.databaseService.getDb();
    if (!tenantId) {
      return [];
    }

    const perms = await db
      .select({
        permKey: permissions.key,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(userRoles.tenantId, tenantId),
          eq(userRoles.userId, userId)
        )
      );

    return Array.from(new Set(perms.map((p) => p.permKey as PermissionKey)));
  }

  /**
   * Resolve user roles
   */
  async getUserRoles(userId: string, tenantId?: string) {
    const db = this.databaseService.getDb();
    if (!tenantId) {
      return [];
    }

    return db
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
          eq(userRoles.tenantId, tenantId),
          eq(userRoles.userId, userId)
        )
      );
  }

  /**
   * Authenticate user, issue access token & hashed refresh token
   */
  async login(
    email: string,
    passwordPlain: string,
    requestedTenantId?: string,
    requestedStoreId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    const db = this.databaseService.getDb();

    // 1. Fetch user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      await this.auditService.logSecurityEvent({
        eventType: 'AUTH_LOGIN_FAILED',
        severity: 'WARN',
        ipAddress,
        details: { email, reason: 'USER_NOT_FOUND' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Verify password with bcrypt
    const passwordMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!passwordMatch) {
      await this.auditService.logSecurityEvent({
        eventType: 'AUTH_LOGIN_FAILED',
        severity: 'WARN',
        actorId: user.id,
        ipAddress,
        details: { email, reason: 'PASSWORD_MISMATCH' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Verify user status
    if (user.status !== 'ACTIVE') {
      await this.auditService.logSecurityEvent({
        eventType: 'AUTH_LOGIN_BLOCKED',
        severity: 'WARN',
        actorId: user.id,
        ipAddress,
        details: { status: user.status },
      });
      throw new UnauthorizedException('User account is disabled or suspended');
    }

    // 4. Determine and validate requested Tenant context
    let activeTenantId = requestedTenantId;
    let tenantContext = undefined;

    if (!activeTenantId && !user.isPlatformAdmin) {
      // Find user's active tenant memberships
      const memberships = await db
        .select({ tenantId: tenantMemberships.tenantId })
        .from(tenantMemberships)
        .where(
          and(
            eq(tenantMemberships.userId, user.id),
            eq(tenantMemberships.status, 'ACTIVE')
          )
        );

      if (memberships.length > 0) {
        activeTenantId = memberships[0].tenantId;
      }
    }

    if (activeTenantId) {
      const [t] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, activeTenantId))
        .limit(1);

      if (t) {
        if (!user.isPlatformAdmin) {
          // Validate membership
          const [m] = await db
            .select()
            .from(tenantMemberships)
            .where(
              and(
                eq(tenantMemberships.tenantId, t.id),
                eq(tenantMemberships.userId, user.id),
                eq(tenantMemberships.status, 'ACTIVE')
              )
            )
            .limit(1);

          if (!m) {
            throw new ForbiddenException(
              'User does not have an active membership in the requested tenant'
            );
          }
        }
        tenantContext = {
          id: t.id,
          name: t.name,
          slug: t.slug,
          status: t.status as 'ACTIVE' | 'SUSPENDED' | 'PROVISIONING',
        };
      }
    }

    // 5. Determine and validate requested Store context
    let activeStoreId = requestedStoreId;
    let storeContext = undefined;

    if (activeTenantId && !activeStoreId && !user.isPlatformAdmin) {
      const sMemberships = await db
        .select({ storeId: storeMemberships.storeId })
        .from(storeMemberships)
        .where(
          and(
            eq(storeMemberships.tenantId, activeTenantId),
            eq(storeMemberships.userId, user.id)
          )
        );

      if (sMemberships.length > 0) {
        activeStoreId = sMemberships[0].storeId;
      }
    }

    if (activeTenantId && activeStoreId) {
      const [s] = await db
        .select()
        .from(stores)
        .where(
          and(
            eq(stores.id, activeStoreId),
            eq(stores.tenantId, activeTenantId)
          )
        )
        .limit(1);

      if (s) {
        storeContext = {
          id: s.id,
          code: s.code,
          name: s.name,
          tenantId: s.tenantId,
        };
      }
    }

    // 6. Resolve permissions and roles
    const userPermissions = user.isPlatformAdmin
      ? ['*'] // Platform admin token indicator
      : await this.getUserPermissions(user.id, activeTenantId);

    const userRoleList = await this.getUserRoles(user.id, activeTenantId);

    // 7. Generate 15-minute Access Token
    const tokenPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
      tenantId: activeTenantId,
      storeId: activeStoreId,
      permissions: userPermissions,
    };

    const accessToken = jwt.sign(tokenPayload, this.configService.jwtSecret, {
      expiresIn: this.configService.jwtExpiresIn as any,
    });

    // 8. Generate & Hash Refresh Token
    const rawRefreshToken = this.generateRawRefreshToken();
    const tokenHash = this.hashToken(rawRefreshToken);
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      familyId,
      isRevoked: false,
      expiresAt,
    });

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      isPlatformAdmin: user.isPlatformAdmin,
      status: user.status as any,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    // 9. Synchronous Audit Log
    await this.auditService.log({
      tenantId: activeTenantId,
      storeId: activeStoreId,
      userId: user.id,
      action: 'AUTH_LOGIN_SUCCESS',
      resource: 'auth',
      resourceId: user.id,
      ipAddress,
      userAgent,
      metadata: { email: user.email, isPlatformAdmin: user.isPlatformAdmin },
    });

    return {
      user: safeUser,
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900,
      tenantContext,
      storeContext,
      roles: userRoleList.map((r) => r.roleKey),
      permissions: userPermissions,
    };
  }

  /**
   * Rotate refresh token and issue new token pair. Detects token reuse.
   */
  async refresh(rawRefreshToken: string, ipAddress?: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const db = this.databaseService.getDb();

    // 1. Locate refresh token record
    const [tokenRecord] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);

    if (!tokenRecord) {
      await this.auditService.logSecurityEvent({
        eventType: 'REFRESH_TOKEN_INVALID',
        severity: 'WARN',
        ipAddress,
        details: { reason: 'HASH_NOT_FOUND' },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. Token Reuse Detection: If presented token was already revoked, invalidate family!
    if (tokenRecord.isRevoked) {
      await db
        .update(refreshTokens)
        .set({
          isRevoked: true,
          revokedAt: new Date(),
        })
        .where(eq(refreshTokens.familyId, tokenRecord.familyId));

      await this.auditService.logSecurityEvent({
        eventType: 'TOKEN_REUSE_DETECTED',
        severity: 'CRITICAL',
        actorId: tokenRecord.userId,
        ipAddress,
        details: {
          familyId: tokenRecord.familyId,
          tokenId: tokenRecord.id,
        },
      });

      throw new UnauthorizedException(
        'Token reuse detected. All sessions in this chain have been invalidated.'
      );
    }

    // 3. Expiration Check
    if (new Date() > tokenRecord.expiresAt) {
      await db
        .update(refreshTokens)
        .set({ isRevoked: true, revokedAt: new Date() })
        .where(eq(refreshTokens.id, tokenRecord.id));

      throw new UnauthorizedException('Refresh token has expired');
    }

    // 4. Verify User status
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenRecord.userId))
      .limit(1);

    if (!user || user.status !== 'ACTIVE') {
      // Invalidate all tokens for disabled/deleted user
      await db
        .update(refreshTokens)
        .set({ isRevoked: true, revokedAt: new Date() })
        .where(eq(refreshTokens.userId, tokenRecord.userId));

      throw new UnauthorizedException('User account is disabled or suspended');
    }

    // 5. Revoke currently used token
    await db
      .update(refreshTokens)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
      })
      .where(eq(refreshTokens.id, tokenRecord.id));

    // 6. Issue new rotated refresh token with SAME familyId
    const newRawRefreshToken = this.generateRawRefreshToken();
    const newTokenHash = this.hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: newTokenHash,
      familyId: tokenRecord.familyId,
      isRevoked: false,
      expiresAt: newExpiresAt,
    });

    // 7. Issue new Access Token
    const userPermissions = user.isPlatformAdmin
      ? ['*']
      : await this.getUserPermissions(user.id);

    const tokenPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
      permissions: userPermissions,
    };

    const accessToken = jwt.sign(tokenPayload, this.configService.jwtSecret, {
      expiresIn: this.configService.jwtExpiresIn as any,
    });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: 900,
    };
  }

  /**
   * Revoke refresh token / session on logout
   */
  async logout(rawRefreshToken?: string, userId?: string): Promise<void> {
    const db = this.databaseService.getDb();
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await db
        .update(refreshTokens)
        .set({ isRevoked: true, revokedAt: new Date() })
        .where(eq(refreshTokens.tokenHash, tokenHash));
    } else if (userId) {
      await db
        .update(refreshTokens)
        .set({ isRevoked: true, revokedAt: new Date() })
        .where(eq(refreshTokens.userId, userId));
    }

    if (userId) {
      await this.auditService.log({
        userId,
        action: 'AUTH_LOGOUT',
        resource: 'auth',
        resourceId: userId,
      });
    }
  }

  /**
   * Get authenticated user profile & tenant memberships
   */
  async getMe(userId: string): Promise<AuthUserSession> {
    const db = this.databaseService.getDb();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Get active tenant memberships
    const userTenantMemberships = await db
      .select({
        tenantId: tenants.id,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        tenantStatus: tenants.status,
        membershipStatus: tenantMemberships.status,
        isOwner: tenantMemberships.isOwner,
      })
      .from(tenantMemberships)
      .innerJoin(tenants, eq(tenantMemberships.tenantId, tenants.id))
      .where(
        and(
          eq(tenantMemberships.userId, userId),
          eq(tenantMemberships.status, 'ACTIVE')
        )
      );

    // Get active store memberships
    const userStoreMemberships = await db
      .select({
        storeId: stores.id,
        storeName: stores.name,
        storeCode: stores.code,
        tenantId: stores.tenantId,
        isDefault: storeMemberships.isDefault,
      })
      .from(storeMemberships)
      .innerJoin(stores, eq(storeMemberships.storeId, stores.id))
      .where(
          eq(storeMemberships.userId, userId)
      );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        isPlatformAdmin: user.isPlatformAdmin,
        status: user.status as any,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      tenants: userTenantMemberships.map((tm) => ({
        id: tm.tenantId,
        name: tm.tenantName,
        slug: tm.tenantSlug,
        status: tm.tenantStatus as any,
        isOwner: tm.isOwner,
      })),
      stores: userStoreMemberships.map((sm) => ({
        id: sm.storeId,
        name: sm.storeName,
        code: sm.storeCode,
        tenantId: sm.tenantId,
        isDefault: sm.isDefault,
      })),
    };
  }

  /**
   * Protected Bootstrap Admin Endpoint
   * Permanent single-use lock: if any platform admin exists, PERMANENTLY FORBIDDEN.
   */
  async bootstrapAdmin(
    secret: string,
    email: string,
    passwordPlain: string,
    fullName: string,
    ipAddress?: string
  ): Promise<{ success: boolean; message: string; userId: string }> {
    // 1. Verify environment secret
    const configuredSecret = this.configService.bootstrapSecret;
    if (!configuredSecret || configuredSecret.trim() === '') {
      throw new ForbiddenException('Bootstrap administration is disabled on this instance');
    }

    if (secret !== configuredSecret) {
      await this.auditService.logSecurityEvent({
        eventType: 'BOOTSTRAP_ATTEMPT_REJECTED',
        severity: 'CRITICAL',
        ipAddress,
        details: { reason: 'SECRET_MISMATCH' },
      });
      throw new ForbiddenException('Invalid bootstrap secret');
    }

    const db = this.databaseService.getDb();

    // 2. Check if ANY platform admin already exists
    const adminCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isPlatformAdmin, true));

    const adminCount = Number(adminCountResult[0]?.count ?? 0);
    if (adminCount > 0) {
      await this.auditService.logSecurityEvent({
        eventType: 'BOOTSTRAP_ATTEMPT_AFTER_INIT',
        severity: 'CRITICAL',
        ipAddress,
        details: { existingCount: adminCount },
      });
      throw new ForbiddenException(
        'Platform already has an initialized Platform Administrator. Bootstrap permanently locked.'
      );
    }

    // 3. Create initial Platform Administrator
    const passwordHash = await bcrypt.hash(passwordPlain, 12);
    const [newAdmin] = await db
      .insert(users)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName: fullName.trim(),
        isPlatformAdmin: true,
        status: 'ACTIVE',
      })
      .returning({ id: users.id });

    // 4. Synchronous CRITICAL Audit Log
    await this.auditService.log({
      userId: newAdmin.id,
      action: 'PLATFORM_BOOTSTRAP_ADMIN_CREATED',
      resource: 'users',
      resourceId: newAdmin.id,
      ipAddress,
      metadata: { email, isPlatformAdmin: true },
    });

    await this.auditService.logSecurityEvent({
      eventType: 'PLATFORM_BOOTSTRAP_ADMIN_CREATED',
      severity: 'CRITICAL',
      actorId: newAdmin.id,
      ipAddress,
      details: { email },
    });

    return {
      success: true,
      message: 'Platform Administrator created successfully. Bootstrap is now permanently locked.',
      userId: newAdmin.id,
    };
  }
}
