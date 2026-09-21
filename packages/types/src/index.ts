/**
 * Super Optical V2 — Shared Domain Types, Enums & Interfaces
 * Phase 2 Baseline: Authentication, Tenant, Store, RBAC & Audit
 */

// ============================================================================
// ENUMS & TAXONOMY
// ============================================================================

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  INVITED = 'INVITED',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  CANCELLED = 'CANCELLED',
}

export enum StoreStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum RoleScope {
  PLATFORM = 'PLATFORM',
  TENANT = 'TENANT',
  STORE = 'STORE',
}

export enum SystemRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  STORE_MANAGER = 'STORE_MANAGER',
  STAFF = 'STAFF',
}

export enum SecurityEventSeverity {
  INFO = 'INFO',
  WARN = 'WARN',
  CRITICAL = 'CRITICAL',
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  REFRESH_SUCCESS = 'REFRESH_SUCCESS',
  REFRESH_REUSE_DETECTED = 'REFRESH_REUSE_DETECTED',
  BOOTSTRAP_INITIALIZED = 'BOOTSTRAP_INITIALIZED',
  BOOTSTRAP_ATTEMPT_DENIED = 'BOOTSTRAP_ATTEMPT_DENIED',
  USER_CREATED = 'USER_CREATED',
  USER_DISABLED = 'USER_DISABLED',
  USER_ENABLED = 'USER_ENABLED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REVOKED = 'ROLE_REVOKED',
  PERMISSION_MODIFIED = 'PERMISSION_MODIFIED',
  TENANT_SWITCH = 'TENANT_SWITCH',
  STORE_SWITCH = 'STORE_SWITCH',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
}

export type PermissionKey =
  | 'tenant.read'
  | 'tenant.create'
  | 'tenant.update'
  | 'tenant.manage_status'
  | 'store.read'
  | 'store.create'
  | 'store.update'
  | 'user.read'
  | 'user.create'
  | 'user.update'
  | 'user.disable'
  | 'role.read'
  | 'role.create'
  | 'role.update'
  | 'permission.read'
  | 'audit.read'
  | 'platform.configure'
  | 'tenants:read'
  | 'tenants:create'
  | 'tenants:update'
  | 'stores:read'
  | 'stores:create'
  | 'stores:update'
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'roles:manage'
  | 'audit:read';

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus | 'ACTIVE' | 'SUSPENDED' | 'PROVISIONING' | 'TRIAL' | 'CANCELLED';
}

export interface StoreContext {
  id: string;
  code: string;
  name: string;
  tenantId: string;
}


// ============================================================================
// CORE ENTITY MODELS
// ============================================================================

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  isPlatformAdmin: boolean;
  status: UserStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type SafeUser = Omit<User, 'passwordHash'>;

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  code: string;
  status: TenantStatus;
  planTier: string;
  settings?: Record<string, unknown> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Store {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  isMainBranch: boolean;
  address?: Record<string, unknown> | null;
  phone?: string | null;
  email?: string | null;
  status: StoreStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  status: 'ACTIVE' | 'INACTIVE';
  isOwner: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StoreMembership {
  id: string;
  tenantId: string;
  storeId: string;
  userId: string;
  isDefault: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Role {
  id: string;
  tenantId?: string | null; // null for global system roles
  key: string;
  name: string;
  scope: RoleScope;
  description?: string | null;
  isSystem: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Permission {
  id: string;
  key: PermissionKey;
  name: string;
  category: string;
  description?: string | null;
  createdAt: Date | string;
}

export interface UserRole {
  id: string;
  tenantId: string;
  userId: string;
  roleId: string;
  storeId?: string | null;
  createdAt: Date | string;
}

export interface AuditLog {
  id: string;
  tenantId?: string | null;
  storeId?: string | null;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date | string;
}

export interface SecurityEvent {
  id: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  actorId?: string | null;
  tenantId?: string | null;
  ipAddress?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: Date | string;
}

// ============================================================================
// AUTHENTICATION & SESSION CONTEXT
// ============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds (e.g. 900 for 15m)
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  isPlatformAdmin: boolean;
  tenantId?: string;
  storeId?: string;
  permissions?: string[];
  sessionId?: string;
  iat?: number;
  exp?: number;
}


export interface TenantContextSummary {
  tenant: Tenant;
  isOwner: boolean;
  roles: Role[];
  permissions: PermissionKey[];
  stores: Store[];
}

export interface ActiveSessionContext {
  user: SafeUser;
  activeTenant?: Tenant | null;
  activeStore?: Store | null;
  roles: Role[];
  permissions: PermissionKey[];
  availableTenants: Tenant[];
  availableStores: Store[];
}

// ============================================================================
// DTO DEFINITIONS
// ============================================================================

export interface LoginRequestDto {
  email: string;
  password: string;
  requestedTenantId?: string;
  requestedStoreId?: string;
}

export interface LoginResponseDto {
  user: SafeUser;
  tokens: AuthTokens;
  activeTenant?: Tenant | null;
  activeStore?: Store | null;
  availableTenants: Tenant[];
  availableStores: Store[];
  effectivePermissions: PermissionKey[];
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface BootstrapAdminDto {
  email: string;
  password: string;
  fullName: string;
  bootstrapSecret: string;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  code: string;
  planTier?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateTenantDto {
  name?: string;
  status?: TenantStatus;
  planTier?: string;
  settings?: Record<string, unknown>;
}

export interface CreateStoreDto {
  name: string;
  code: string;
  isMainBranch?: boolean;
  address?: Record<string, unknown>;
  phone?: string;
  email?: string;
}

export interface UpdateStoreDto {
  name?: string;
  code?: string;
  isMainBranch?: boolean;
  status?: StoreStatus;
  address?: Record<string, unknown>;
  phone?: string;
  email?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  roleKeys: string[];
  storeIds?: string[];
}

export interface UpdateUserDto {
  fullName?: string;
  phone?: string;
}

export interface AssignUserRolesDto {
  roleIds: string[];
  storeId?: string; // for store-scoped roles
}

export interface AssignUserStoresDto {
  storeIds: string[];
  defaultStoreId?: string;
}

export interface CreateRoleDto {
  name: string;
  key: string;
  scope: RoleScope;
  description?: string;
  permissionKeys: PermissionKey[];
}

export interface UpdateRolePermissionsDto {
  permissionKeys: PermissionKey[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    statusCode: number;
    error: string;
    message: string | string[];
    correlationId: string;
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    correlationId: string;
    path: string;
  };
}

export type CreateTenantInput = CreateTenantDto;
export type UpdateTenantInput = UpdateTenantDto;
export type CreateStoreInput = CreateStoreDto;
export type UpdateStoreInput = UpdateStoreDto;
export type CreateUserInput = CreateUserDto;
export type AssignUserRolesInput = AssignUserRolesDto;
export type AssignUserStoresInput = AssignUserStoresDto;
export type CreateRoleInput = CreateRoleDto;
export type LoginResponse = LoginResponseDto | any;
export type AuthUserSession = any;

