import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  unique,
  foreignKey,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// 1. TENANTS TABLE
// ============================================================================
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  code: text('code').notNull().unique(),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, SUSPENDED, TRIAL, CANCELLED
  planTier: text('plan_tier').notNull().default('Starter'),
  settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// 2. STORES TABLE
// ============================================================================
export const stores = pgTable(
  'stores',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    code: text('code').notNull(),
    isMainBranch: boolean('is_main_branch').notNull().default(false),
    address: jsonb('address').$type<Record<string, unknown>>().default({}),
    phone: text('phone'),
    email: text('email'),
    status: text('status').notNull().default('ACTIVE'), // ACTIVE, INACTIVE
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Composite unique on (id, tenant_id) to allow composite foreign keys
    tenantStoreUnique: unique('uq_stores_id_tenant').on(table.id, table.tenantId),
    tenantCodeUnique: unique('uq_stores_tenant_code').on(table.tenantId, table.code),
    tenantIdx: index('idx_stores_tenant').on(table.tenantId),
  })
);

// ============================================================================
// 3. USERS TABLE
// ============================================================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  isPlatformAdmin: boolean('is_platform_admin').notNull().default(false),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, DISABLED, INVITED
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// 4. TENANT MEMBERSHIPS TABLE
// ============================================================================
export const tenantMemberships = pgTable(
  'tenant_memberships',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('ACTIVE'), // ACTIVE, INACTIVE
    isOwner: boolean('is_owner').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantUserUnique: unique('uq_tenant_memberships_tenant_user').on(table.tenantId, table.userId),
    tenantIdx: index('idx_tenant_memberships_tenant').on(table.tenantId),
    userIdx: index('idx_tenant_memberships_user').on(table.userId),
  })
);

// ============================================================================
// 5. STORE MEMBERSHIPS TABLE (WITH COMPOSITE FK INTEGRITY)
// ============================================================================
export const storeMemberships = pgTable(
  'store_memberships',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    storeId: uuid('store_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    storeUserUnique: unique('uq_store_memberships_store_user').on(table.storeId, table.userId),
    // Composite foreign key ensuring store belongs strictly to tenant
    compositeStoreTenantFk: foreignKey({
      columns: [table.storeId, table.tenantId],
      foreignColumns: [stores.id, stores.tenantId],
      name: 'fk_store_memberships_store_tenant',
    }).onDelete('cascade'),
    tenantIdx: index('idx_store_memberships_tenant').on(table.tenantId),
    userIdx: index('idx_store_memberships_user').on(table.userId),
  })
);

// ============================================================================
// 6. ROLES TABLE
// ============================================================================
export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }), // null for system roles
    key: text('key').notNull(),
    name: text('name').notNull(),
    scope: text('scope').notNull(), // PLATFORM, TENANT, STORE
    description: text('description'),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantRoleUnique: unique('uq_roles_tenant_key').on(table.tenantId, table.key),
    tenantIdx: index('idx_roles_tenant').on(table.tenantId),
  })
);

// ============================================================================
// 7. PERMISSIONS TABLE
// ============================================================================
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// 8. ROLE PERMISSIONS TABLE
// ============================================================================
export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    rolePermUnique: unique('uq_role_permissions_role_perm').on(table.roleId, table.permissionId),
    roleIdx: index('idx_role_permissions_role').on(table.roleId),
  })
);

// ============================================================================
// 9. USER ROLES TABLE (WITH COMPOSITE TENANT-USER FK INTEGRITY)
// ============================================================================
export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id').notNull(),
    userId: uuid('user_id').notNull(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }), // nullable for store-scoped roles
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Composite FK ensuring user belongs to tenant before receiving tenant role
    compositeTenantUserFk: foreignKey({
      columns: [table.tenantId, table.userId],
      foreignColumns: [tenantMemberships.tenantId, tenantMemberships.userId],
      name: 'fk_user_roles_tenant_user',
    }).onDelete('cascade'),
    tenantUserRoleUnique: unique('uq_user_roles_tenant_user_role_store').on(
      table.tenantId,
      table.userId,
      table.roleId,
      table.storeId
    ),
    tenantIdx: index('idx_user_roles_tenant').on(table.tenantId),
    userIdx: index('idx_user_roles_user').on(table.userId),
  })
);

// ============================================================================
// 10. REFRESH TOKENS TABLE (HASHED PERSISTENCE & ROTATION)
// ============================================================================
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(), // SHA-256 hash of token string
    familyId: uuid('family_id').notNull(),
    isRevoked: boolean('is_revoked').notNull().default(false),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashIdx: index('idx_refresh_tokens_hash').on(table.tokenHash),
    familyIdx: index('idx_refresh_tokens_family').on(table.familyId),
    userIdx: index('idx_refresh_tokens_user').on(table.userId),
  })
);

// ============================================================================
// 11. AUDIT LOGS TABLE
// ============================================================================
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
    storeId: uuid('store_id').references(() => stores.id, { onDelete: 'set null' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    resource: text('resource').notNull(),
    resourceId: text('resource_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('idx_audit_logs_tenant').on(table.tenantId),
    actionIdx: index('idx_audit_logs_action').on(table.action),
    createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt),
  })
);

// ============================================================================
// 12. SECURITY EVENTS TABLE
// ============================================================================
export const securityEvents = pgTable(
  'security_events',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    eventType: text('event_type').notNull(),
    severity: text('severity').notNull(), // INFO, WARN, CRITICAL
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
    ipAddress: text('ip_address'),
    details: jsonb('details').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    eventTypeIdx: index('idx_security_events_type').on(table.eventType),
    severityIdx: index('idx_security_events_severity').on(table.severity),
    createdAtIdx: index('idx_security_events_created_at').on(table.createdAt),
  })
);
