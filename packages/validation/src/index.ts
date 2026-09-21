import { z } from 'zod';
import { RoleScope, StoreStatus, TenantStatus } from '@super-optical/types';

// ============================================================================
// COMMON PRIMITIVES & REGEX
// ============================================================================

export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(
    passwordRegex,
    'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
  );

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .min(2, 'Slug must be at least 2 characters')
  .max(64, 'Slug cannot exceed 64 characters')
  .regex(slugRegex, 'Slug must be lowercase alphanumeric with optional hyphens');

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  requestedTenantId: z.string().uuid().optional(),
  requestedStoreId: z.string().uuid().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const bootstrapAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: passwordSchema,
  fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
  bootstrapSecret: z.string().min(1, 'Bootstrap secret is required'),
});

// ============================================================================
// TENANT SCHEMAS
// ============================================================================

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Tenant name must be at least 2 characters').trim(),
  slug: slugSchema,
  code: z.string().min(2, 'Tenant code must be at least 2 characters').max(16).toUpperCase().trim(),
  planTier: z.string().default('Starter'),
  settings: z.record(z.unknown()).optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).trim().optional(),
  status: z.nativeEnum(TenantStatus).optional(),
  planTier: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

// ============================================================================
// STORE SCHEMAS
// ============================================================================

export const createStoreSchema = z.object({
  name: z.string().min(2, 'Store name must be at least 2 characters').trim(),
  code: z.string().min(2, 'Store code must be at least 2 characters').max(16).toUpperCase().trim(),
  isMainBranch: z.boolean().default(false),
  address: z.record(z.unknown()).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
});

export const updateStoreSchema = z.object({
  name: z.string().min(2).trim().optional(),
  code: z.string().min(2).max(16).toUpperCase().trim().optional(),
  isMainBranch: z.boolean().optional(),
  status: z.nativeEnum(StoreStatus).optional(),
  address: z.record(z.unknown()).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: passwordSchema,
  fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
  phone: z.string().max(20).optional(),
  roleKeys: z.array(z.string()).min(1, 'At least one role is required'),
  storeIds: z.array(z.string().uuid()).optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).trim().optional(),
  phone: z.string().max(20).optional(),
});

export const assignUserRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()).min(1, 'At least one role ID is required'),
  storeId: z.string().uuid().optional(),
});

export const assignUserStoresSchema = z.object({
  storeIds: z.array(z.string().uuid()).min(1, 'At least one store ID is required'),
  defaultStoreId: z.string().uuid().optional(),
});

// ============================================================================
// ROLE & PERMISSION SCHEMAS
// ============================================================================

export const createRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').trim(),
  key: z.string().min(2).max(32).toUpperCase().regex(/^[A-Z0-9_]+$/, 'Role key must be uppercase letters, numbers, and underscores'),
  scope: z.nativeEnum(RoleScope),
  description: z.string().max(255).optional(),
  permissionKeys: z.array(z.string()).min(1, 'At least one permission is required'),
});

export const updateRolePermissionsSchema = z.object({
  permissionKeys: z.array(z.string()).min(1, 'At least one permission is required'),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'DISABLED', 'SUSPENDED']),
});

