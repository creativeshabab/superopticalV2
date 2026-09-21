import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import * as schema from '../../backend/api/src/database/schema';
import { RoleScope, SystemRole } from '@super-optical/types';

dotenv.config();

export async function runSeeds(connectionString?: string) {
  const conn =
    connectionString ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:@localhost:5433/super_optical_dev?sslmode=disable';

  const pool = new Pool({ connectionString: conn });
  const db = drizzle(pool, { schema });

  try {
    console.log(`Seeding database at: ${conn}`);

    // Clean existing seed data
    await db.delete(schema.securityEvents);
    await db.delete(schema.auditLogs);
    await db.delete(schema.refreshTokens);
    await db.delete(schema.userRoles);
    await db.delete(schema.rolePermissions);
    await db.delete(schema.permissions);
    await db.delete(schema.roles);
    await db.delete(schema.storeMemberships);
    await db.delete(schema.tenantMemberships);
    await db.delete(schema.stores);
    await db.delete(schema.users);
    await db.delete(schema.tenants);

    const defaultPasswordHash = await bcrypt.hash('SuperOptical@2026', 10);

    // 1. Permissions
    const permissionDefinitions = [
      { key: 'tenant.read', name: 'View Tenant Details', category: 'Tenant' },
      { key: 'tenant.create', name: 'Create Tenant', category: 'Tenant' },
      { key: 'tenant.update', name: 'Update Tenant Settings', category: 'Tenant' },
      { key: 'tenant.manage_status', name: 'Suspend/Activate Tenant', category: 'Tenant' },
      { key: 'store.read', name: 'View Store Locations', category: 'Store' },
      { key: 'store.create', name: 'Create Store Branch', category: 'Store' },
      { key: 'store.update', name: 'Update Store Settings', category: 'Store' },
      { key: 'user.read', name: 'View Staff Users', category: 'User' },
      { key: 'user.create', name: 'Create Staff User', category: 'User' },
      { key: 'user.update', name: 'Update Staff Profile', category: 'User' },
      { key: 'user.disable', name: 'Disable/Enable User', category: 'User' },
      { key: 'role.read', name: 'View Roles & Permissions', category: 'RBAC' },
      { key: 'role.create', name: 'Create Custom Role', category: 'RBAC' },
      { key: 'role.update', name: 'Update Role Permissions', category: 'RBAC' },
      { key: 'permission.read', name: 'View Permission Catalog', category: 'RBAC' },
      { key: 'audit.read', name: 'View Security Audit Logs', category: 'Audit' },
      { key: 'platform.configure', name: 'Configure Platform Settings', category: 'Platform' },
    ];

    const insertedPermissions = await db
      .insert(schema.permissions)
      .values(permissionDefinitions)
      .returning();

    const permMap = new Map(insertedPermissions.map((p) => [p.key, p.id]));

    // 2. System Roles
    const systemRoles = [
      {
        key: SystemRole.PLATFORM_ADMIN,
        name: 'Platform Administrator',
        scope: RoleScope.PLATFORM,
        isSystem: true,
        description: 'Super-admin with platform-wide governance rights',
      },
      {
        key: SystemRole.TENANT_ADMIN,
        name: 'Tenant Administrator',
        scope: RoleScope.TENANT,
        isSystem: true,
        description: 'Optical business owner with full tenant control',
      },
      {
        key: SystemRole.STORE_MANAGER,
        name: 'Store Branch Manager',
        scope: RoleScope.STORE,
        isSystem: true,
        description: 'Store manager overseeing branch operations and staff',
      },
      {
        key: SystemRole.STAFF,
        name: 'Store Staff Member',
        scope: RoleScope.STORE,
        isSystem: true,
        description: 'Front-desk counter sales and operational staff',
      },
    ];

    const insertedRoles = await db.insert(schema.roles).values(systemRoles).returning();
    const roleMap = new Map(insertedRoles.map((r) => [r.key, r.id]));

    // 3. Role Permissions Bindings
    const rolePermAssignments: { roleId: string; permissionId: string }[] = [];

    // PLATFORM_ADMIN gets all permissions
    for (const p of insertedPermissions) {
      rolePermAssignments.push({
        roleId: roleMap.get(SystemRole.PLATFORM_ADMIN)!,
        permissionId: p.id,
      });
    }

    // TENANT_ADMIN gets tenant, store, user, role, permission, audit
    const tenantAdminPerms = [
      'tenant.read',
      'tenant.update',
      'store.read',
      'store.create',
      'store.update',
      'user.read',
      'user.create',
      'user.update',
      'user.disable',
      'role.read',
      'role.create',
      'role.update',
      'permission.read',
      'audit.read',
    ];
    for (const key of tenantAdminPerms) {
      if (permMap.has(key)) {
        rolePermAssignments.push({
          roleId: roleMap.get(SystemRole.TENANT_ADMIN)!,
          permissionId: permMap.get(key)!,
        });
      }
    }

    // STORE_MANAGER gets store.read, user.read, audit.read
    const storeManagerPerms = ['store.read', 'user.read', 'audit.read'];
    for (const key of storeManagerPerms) {
      if (permMap.has(key)) {
        rolePermAssignments.push({
          roleId: roleMap.get(SystemRole.STORE_MANAGER)!,
          permissionId: permMap.get(key)!,
        });
      }
    }

    // STAFF gets store.read
    rolePermAssignments.push({
      roleId: roleMap.get(SystemRole.STAFF)!,
      permissionId: permMap.get('store.read')!,
    });

    await db.insert(schema.rolePermissions).values(rolePermAssignments);

    // 4. Platform Admin User
    const [_platformAdmin] = await db
      .insert(schema.users)
      .values({
        email: 'platform.admin@superoptical.com',
        fullName: 'Global Platform Administrator',
        passwordHash: defaultPasswordHash,
        isPlatformAdmin: true,
        status: 'ACTIVE',
      })
      .returning();

    // 5. Tenant A: Super Optical Bihar
    const [tenantA] = await db
      .insert(schema.tenants)
      .values({
        name: 'Super Optical Bihar',
        slug: 'super-optical-bihar',
        code: 'SO-BHR',
        status: 'ACTIVE',
        planTier: 'Business',
        settings: { state: 'Bihar', stateCode: '10' },
      })
      .returning();

    const [storeA1] = await db
      .insert(schema.stores)
      .values({
        tenantId: tenantA.id,
        name: 'Begusarai Main Branch',
        code: 'BHR-BEG',
        isMainBranch: true,
        address: { city: 'Begusarai', state: 'Bihar', postalCode: '851101' },
        phone: '9876543210',
        email: 'begusarai@superoptical.bihar',
        status: 'ACTIVE',
      })
      .returning();

    const [storeA2] = await db
      .insert(schema.stores)
      .values({
        tenantId: tenantA.id,
        name: 'Ballia Express Store',
        code: 'BHR-BAL',
        isMainBranch: false,
        address: { city: 'Ballia', state: 'Uttar Pradesh', postalCode: '277001' },
        phone: '9876543211',
        email: 'ballia@superoptical.bihar',
        status: 'ACTIVE',
      })
      .returning();

    // Tenant A Users
    const [adminA] = await db
      .insert(schema.users)
      .values({
        email: 'admin.bihar@superoptical.com',
        fullName: 'Ramesh Kumar (Bihar Owner)',
        passwordHash: defaultPasswordHash,
        isPlatformAdmin: false,
        status: 'ACTIVE',
      })
      .returning();

    const [managerA1] = await db
      .insert(schema.users)
      .values({
        email: 'manager.begusarai@superoptical.com',
        fullName: 'Amit Verma (Begusarai Manager)',
        passwordHash: defaultPasswordHash,
        isPlatformAdmin: false,
        status: 'ACTIVE',
      })
      .returning();

    const [managerA2] = await db
      .insert(schema.users)
      .values({
        email: 'manager.ballia@superoptical.com',
        fullName: 'Sunil Singh (Ballia Manager)',
        passwordHash: defaultPasswordHash,
        isPlatformAdmin: false,
        status: 'ACTIVE',
      })
      .returning();

    const [staffA1] = await db
      .insert(schema.users)
      .values({
        email: 'staff.begusarai@superoptical.com',
        fullName: 'Pooja Kumari (Begusarai Counter Staff)',
        passwordHash: defaultPasswordHash,
        isPlatformAdmin: false,
        status: 'ACTIVE',
      })
      .returning();

    // Tenant A Memberships
    await db.insert(schema.tenantMemberships).values([
      { tenantId: tenantA.id, userId: adminA.id, isOwner: true, status: 'ACTIVE' },
      { tenantId: tenantA.id, userId: managerA1.id, isOwner: false, status: 'ACTIVE' },
      { tenantId: tenantA.id, userId: managerA2.id, isOwner: false, status: 'ACTIVE' },
      { tenantId: tenantA.id, userId: staffA1.id, isOwner: false, status: 'ACTIVE' },
    ]);

    // Store Memberships for Tenant A
    await db.insert(schema.storeMemberships).values([
      // Admin A has access to both stores
      { tenantId: tenantA.id, storeId: storeA1.id, userId: adminA.id, isDefault: true },
      { tenantId: tenantA.id, storeId: storeA2.id, userId: adminA.id, isDefault: false },
      // Manager A1 scoped to Store A1
      { tenantId: tenantA.id, storeId: storeA1.id, userId: managerA1.id, isDefault: true },
      // Manager A2 scoped to Store A2
      { tenantId: tenantA.id, storeId: storeA2.id, userId: managerA2.id, isDefault: true },
      // Staff A1 scoped to Store A1
      { tenantId: tenantA.id, storeId: storeA1.id, userId: staffA1.id, isDefault: true },
    ]);

    // Role Assignments for Tenant A
    await db.insert(schema.userRoles).values([
      {
        tenantId: tenantA.id,
        userId: adminA.id,
        roleId: roleMap.get(SystemRole.TENANT_ADMIN)!,
        storeId: null,
      },
      {
        tenantId: tenantA.id,
        userId: managerA1.id,
        roleId: roleMap.get(SystemRole.STORE_MANAGER)!,
        storeId: storeA1.id,
      },
      {
        tenantId: tenantA.id,
        userId: managerA2.id,
        roleId: roleMap.get(SystemRole.STORE_MANAGER)!,
        storeId: storeA2.id,
      },
      {
        tenantId: tenantA.id,
        userId: staffA1.id,
        roleId: roleMap.get(SystemRole.STAFF)!,
        storeId: storeA1.id,
      },
    ]);

    // 6. Tenant B: Super Optical UP
    const [tenantB] = await db
      .insert(schema.tenants)
      .values({
        name: 'Super Optical UP',
        slug: 'super-optical-up',
        code: 'SO-UP',
        status: 'ACTIVE',
        planTier: 'Starter',
        settings: { state: 'Uttar Pradesh', stateCode: '09' },
      })
      .returning();

    const [storeB1] = await db
      .insert(schema.stores)
      .values({
        tenantId: tenantB.id,
        name: 'Varanasi Central Counter',
        code: 'UP-VNS',
        isMainBranch: true,
        address: { city: 'Varanasi', state: 'Uttar Pradesh', postalCode: '221001' },
        phone: '9876543220',
        email: 'varanasi@superoptical.up',
        status: 'ACTIVE',
      })
      .returning();

    const [storeB2] = await db
      .insert(schema.stores)
      .values({
        tenantId: tenantB.id,
        name: 'Gorakhpur Optical Hub',
        code: 'UP-GKP',
        isMainBranch: false,
        address: { city: 'Gorakhpur', state: 'Uttar Pradesh', postalCode: '273001' },
        phone: '9876543221',
        email: 'gorakhpur@superoptical.up',
        status: 'ACTIVE',
      })
      .returning();

    const [adminB] = await db
      .insert(schema.users)
      .values({
        email: 'admin.up@superoptical.com',
        fullName: 'Vikas Sharma (UP Owner)',
        passwordHash: defaultPasswordHash,
        isPlatformAdmin: false,
        status: 'ACTIVE',
      })
      .returning();

    const [managerB1] = await db
      .insert(schema.users)
      .values({
        email: 'manager.varanasi@superoptical.com',
        fullName: 'Rajesh Gupta (Varanasi Manager)',
        passwordHash: defaultPasswordHash,
        isPlatformAdmin: false,
        status: 'ACTIVE',
      })
      .returning();

    // Tenant B Memberships
    await db.insert(schema.tenantMemberships).values([
      { tenantId: tenantB.id, userId: adminB.id, isOwner: true, status: 'ACTIVE' },
      { tenantId: tenantB.id, userId: managerB1.id, isOwner: false, status: 'ACTIVE' },
    ]);

    // Store Memberships for Tenant B
    await db.insert(schema.storeMemberships).values([
      { tenantId: tenantB.id, storeId: storeB1.id, userId: adminB.id, isDefault: true },
      { tenantId: tenantB.id, storeId: storeB2.id, userId: adminB.id, isDefault: false },
      { tenantId: tenantB.id, storeId: storeB1.id, userId: managerB1.id, isDefault: true },
    ]);

    // Role Assignments for Tenant B
    await db.insert(schema.userRoles).values([
      {
        tenantId: tenantB.id,
        userId: adminB.id,
        roleId: roleMap.get(SystemRole.TENANT_ADMIN)!,
        storeId: null,
      },
      {
        tenantId: tenantB.id,
        userId: managerB1.id,
        roleId: roleMap.get(SystemRole.STORE_MANAGER)!,
        storeId: storeB1.id,
      },
    ]);

    console.log('Seed data inserted successfully.');
    console.log('Available test credentials (Password: SuperOptical@2026):');
    console.log('  Platform Admin: platform.admin@superoptical.com');
    console.log('  Tenant A Admin: admin.bihar@superoptical.com');
    console.log('  Tenant A Store A1 Manager: manager.begusarai@superoptical.com');
    console.log('  Tenant A Store A2 Manager: manager.ballia@superoptical.com');
    console.log('  Tenant A Store A1 Staff: staff.begusarai@superoptical.com');
    console.log('  Tenant B Admin: admin.up@superoptical.com');
    console.log('  Tenant B Store B1 Manager: manager.varanasi@superoptical.com');
  } catch (err) {
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

// Run directly if CLI
if (require.main === module) {
  runSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
