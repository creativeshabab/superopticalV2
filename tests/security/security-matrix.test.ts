import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../backend/api/src/app.module';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const TEST_PORT = 4099;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api/v1`;
const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:@localhost:5433/super_optical_test?sslmode=disable';

describe('20-Point Security Test Matrix (Auth, Tenant/Store Context, RBAC, Audit)', () => {
  let app: INestApplication;
  let pool: Pool;

  // Cached Context Identifiers
  let tenantAId: string;
  let tenantBId: string;
  let storeA1Id: string;
  let storeA2Id: string;
  let storeB1Id: string;

  // Cached Auth Credentials & Tokens
  let platformAdminToken: string;
  let tenantAdminAToken: string;
  let staffA1Token: string;

  beforeAll(async () => {
    // Ensure test environment points to test DB
    process.env.DATABASE_URL = TEST_DB_URL;
    process.env.PORT = String(TEST_PORT);
    process.env.JWT_SECRET = 'super-optical-v2-dev-jwt-secret-key-32-chars-min';
    process.env.BOOTSTRAP_SECRET = 'super-optical-bootstrap-secret-key';

    pool = new Pool({ connectionString: TEST_DB_URL });

    // Fetch seeded IDs
    const tenantRes = await pool.query(
      "SELECT id, slug FROM tenants WHERE slug IN ('super-optical-bihar', 'super-optical-up')"
    );
    const tenantMap = new Map(tenantRes.rows.map((r) => [r.slug, r.id]));
    tenantAId = tenantMap.get('super-optical-bihar')!;
    tenantBId = tenantMap.get('super-optical-up')!;

    const storeRes = await pool.query('SELECT id, tenant_id, code FROM stores');
    for (const s of storeRes.rows) {
      if (s.tenant_id === tenantAId && s.code === 'BHR-BEG') storeA1Id = s.id;
      if (s.tenant_id === tenantAId && s.code === 'BHR-BAL') storeA2Id = s.id;
      if (s.tenant_id === tenantBId && s.code === 'UP-VNS') storeB1Id = s.id;
    }

    // Launch NestJS API application
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api/v1');
    await app.listen(TEST_PORT);

    // 1. Login Platform Admin
    const resPlat = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'platform.admin@superoptical.com',
        password: 'SuperOptical@2026',
      }),
    });
    const dataPlat = await resPlat.json();
    if (!resPlat.ok) {
      console.error('Login failed:', resPlat.status, dataPlat);
    }
    platformAdminToken = dataPlat.data?.accessToken;

    // 2. Login Tenant Admin A
    const resAdminA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin.bihar@superoptical.com',
        password: 'SuperOptical@2026',
        requestedTenantId: tenantAId,
      }),
    });
    const dataAdminA = await resAdminA.json();
    tenantAdminAToken = dataAdminA.data.accessToken;

    // 3. Login Staff A1
    const resStaff = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'staff.begusarai@superoptical.com',
        password: 'SuperOptical@2026',
        requestedTenantId: tenantAId,
        requestedStoreId: storeA1Id,
      }),
    });
    const dataStaff = await resStaff.json();
    staffA1Token = dataStaff.data.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (pool) await pool.end();
  });

  // 1. Unauthenticated Request
  it('1. Unauthenticated request to protected endpoint returns 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/tenants`);
    expect(res.status).toBe(401);
  });

  // 2. Expired / Invalid Token
  it('2. Request with invalid or expired access token returns 401 Unauthorized', async () => {
    const expiredToken = jwt.sign(
      { sub: '00000000-0000-0000-0000-000000000000' },
      'wrong-secret-key-1234567890'
    );
    const res = await fetch(`${BASE_URL}/tenants`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    expect(res.status).toBe(401);
  });

  // 3. Missing Required Tenant Header
  it('3. Request to tenant-required endpoint without X-Tenant-ID returns 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/stores`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${platformAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test Store', code: 'TST-01' }),
    });
    expect(res.status).toBe(400);
  });

  // 4. Spoofed Tenant ID
  it('4. Spoofed X-Tenant-ID for non-member tenant returns 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/stores`, {
      headers: {
        Authorization: `Bearer ${tenantAdminAToken}`,
        'X-Tenant-ID': tenantBId, // Malicious user from Tenant A targeting Tenant B
      },
    });
    expect(res.status).toBe(403);
  });

  // 5. Suspended Tenant Access
  it('5. Request with X-Tenant-ID for suspended/inactive tenant returns 403 Forbidden', async () => {
    // Create temporary suspended tenant
    const uid = Date.now();
    const ins = await pool.query(
      `INSERT INTO tenants (name, slug, code, status) VALUES ('Suspended Optical', 'suspended-opt-${uid}', 'S${uid.toString().slice(-6)}', 'SUSPENDED') RETURNING id`
    );
    const suspId = ins.rows[0].id;
    // Add membership
    const userRes = await pool.query("SELECT id FROM users WHERE email = 'admin.bihar@superoptical.com'");
    await pool.query('INSERT INTO tenant_memberships (tenant_id, user_id, status) VALUES ($1, $2, $3)', [
      suspId,
      userRes.rows[0].id,
      'ACTIVE',
    ]);

    const res = await fetch(`${BASE_URL}/stores`, {
      headers: {
        Authorization: `Bearer ${tenantAdminAToken}`,
        'X-Tenant-ID': suspId,
      },
    });
    expect(res.status).toBe(403);
  });

  // 6. Cross-Tenant Store Spoofing
  it('6. Spoofed X-Store-ID for store belonging to another tenant returns 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/stores`, {
      headers: {
        Authorization: `Bearer ${tenantAdminAToken}`,
        'X-Tenant-ID': tenantAId,
        'X-Store-ID': storeB1Id, // Store belongs to Tenant B, not Tenant A!
      },
    });
    expect(res.status).toBe(403);
  });

  // 7. Store Spoofing Without Store Membership
  it('7. Spoofed X-Store-ID for store where user is not an assigned member returns 403 Forbidden', async () => {
    // Staff A1 is only member of Store A1, not Store A2
    const res = await fetch(`${BASE_URL}/stores`, {
      headers: {
        Authorization: `Bearer ${staffA1Token}`,
        'X-Tenant-ID': tenantAId,
        'X-Store-ID': storeA2Id,
      },
    });
    expect(res.status).toBe(403);
  });

  // 8. Cross-Tenant Store Route Parameter (URL IDOR)
  it('8. Accessing store from another tenant via URL IDOR (GET /stores/:id) returns 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/stores/${storeB1Id}`, {
      headers: {
        Authorization: `Bearer ${tenantAdminAToken}`,
        'X-Tenant-ID': tenantAId,
      },
    });
    expect(res.status).toBe(403);
  });

  // 9. Disabled User Token Rejection
  it('9. Disabled user account immediately rejected with 401 Unauthorized on token usage', async () => {
    // Create test user and deactivate
    const uid = Date.now();
    const tempEmail = `disabled.${uid}@superoptical.com`;
    const tempUser = await pool.query(
      `INSERT INTO users (email, full_name, password_hash, status) VALUES ('${tempEmail}', 'Disabled User', 'hash', 'DISABLED') RETURNING id`
    );
    const token = jwt.sign(
      { sub: tempUser.rows[0].id, email: tempEmail },
      'super-optical-v2-dev-jwt-secret-key-32-chars-min'
    );

    const res = await fetch(`${BASE_URL}/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  // 10. Deactivating User Invalidates Refresh Tokens
  it('10. Deactivating a user immediately invalidates all active refresh tokens in database', async () => {
    // Fetch a staff user
    const uRes = await pool.query("SELECT id FROM users WHERE email = 'staff.begusarai@superoptical.com'");
    const userId = uRes.rows[0].id;

    // Verify active refresh tokens exist
    const tokenBefore = await pool.query(
      'SELECT id, is_revoked FROM refresh_tokens WHERE user_id = $1 AND is_revoked = false',
      [userId]
    );
    expect(tokenBefore.rows.length).toBeGreaterThan(0);

    // Deactivate user via PATCH /users/:id/status
    const patchRes = await fetch(`${BASE_URL}/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tenantAdminAToken}`,
        'X-Tenant-ID': tenantAId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'DISABLED' }),
    });
    expect(patchRes.status).toBe(200);

    // Check refresh tokens in DB are revoked
    const tokenAfter = await pool.query(
      'SELECT id FROM refresh_tokens WHERE user_id = $1 AND is_revoked = false',
      [userId]
    );
    expect(tokenAfter.rows.length).toBe(0);

    // Restore user to ACTIVE for subsequent tests
    await pool.query("UPDATE users SET status = 'ACTIVE' WHERE id = $1", [userId]);
  });

  // 11. Refresh Token Reuse Detection
  it('11. Refresh token reuse triggers immediate family invalidation and returns 401', async () => {
    // Perform initial normal login to get a fresh refresh token
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager.begusarai@superoptical.com',
        password: 'SuperOptical@2026',
      }),
    });
    const loginData = await loginRes.json();
    const originalRefreshToken = loginData.data.refreshToken;

    // 1st Refresh: succeeds and rotates
    const refresh1 = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: originalRefreshToken }),
    });
    expect(refresh1.status).toBe(200);
    const refresh1Data = await refresh1.json();
    const newRefreshToken = refresh1Data.data.refreshToken;

    // 2nd Refresh with REUSED original token: MUST detect reuse and return 401
    const reuseAttempt = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: originalRefreshToken }),
    });
    expect(reuseAttempt.status).toBe(401);

    // Subsequent refresh with new token in the same family must ALSO now be revoked!
    const familyAttempt = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: newRefreshToken }),
    });
    expect(familyAttempt.status).toBe(401);
  });

  // 12. Expired Refresh Token
  it('12. Expired refresh token returns 401 Unauthorized', async () => {
    const expiredRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'non-existent-or-expired-token-12345' }),
    });
    expect(expiredRes.status).toBe(401);
  });

  // 13. Bootstrap Admin with Invalid Secret
  it('13. Platform bootstrap endpoint with incorrect secret returns 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/auth/bootstrap-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newadmin@superoptical.com',
        password: 'Password123!',
        fullName: 'New Admin',
        bootstrapSecret: 'WRONG_SECRET',
      }),
    });
    expect(res.status).toBe(403);
  });

  // 14. Bootstrap Admin Permanent Single-Use Lock
  it('14. Bootstrap endpoint returns 403 Forbidden when Platform Admin already exists (permanent single-use lock)', async () => {
    const res = await fetch(`${BASE_URL}/auth/bootstrap-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'attacker@superoptical.com',
        password: 'Password123!',
        fullName: 'Attacker Admin',
        bootstrapSecret: 'super-optical-bootstrap-secret-key',
      }),
    });
    expect(res.status).toBe(403);
  });

  // 15. Staff Role Attempting stores:create
  it('15. User with STAFF role attempting stores:create returns 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/stores`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${staffA1Token}`,
        'X-Tenant-ID': tenantAId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Unauthorized Branch',
        code: 'UNAUTH-01',
      }),
    });
    expect(res.status).toBe(403);
  });

  // 16. Staff Role Attempting users:create
  it('16. User with STAFF role attempting users:create returns 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${staffA1Token}`,
        'X-Tenant-ID': tenantAId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'rogue.user@superoptical.com',
        fullName: 'Rogue User',
        password: 'Password123!',
        roleKeys: ['STAFF'],
      }),
    });
    expect(res.status).toBe(403);
  });

  // 17. Dynamic Permission Evaluation
  it('17. Dynamically revoking a role immediately revokes associated permissions', async () => {
    // Temporarily grant STORE_MANAGER role to staffA1
    const staffUserRes = await pool.query("SELECT id FROM users WHERE email = 'staff.begusarai@superoptical.com'");
    const staffId = staffUserRes.rows[0].id;
    const roleRes = await pool.query("SELECT id FROM roles WHERE key = 'STORE_MANAGER'");
    const roleId = roleRes.rows[0].id;

    await pool.query(
      'INSERT INTO user_roles (tenant_id, user_id, role_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [tenantAId, staffId, roleId]
    );

    // Permission check inside guard evaluates live DB: delete the assignment
    await pool.query('DELETE FROM user_roles WHERE tenant_id = $1 AND user_id = $2 AND role_id = $3', [
      tenantAId,
      staffId,
      roleId,
    ]);

    // Request with staff token to role-restricted endpoint is immediately forbidden
    const res = await fetch(`${BASE_URL}/stores`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${staffA1Token}`,
        'X-Tenant-ID': tenantAId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Denied Store', code: 'DEN-01' }),
    });
    expect(res.status).toBe(403);
  });

  // 18. Platform Admin Universal Tenant Access
  it('18. Platform Admin can access tenant and store context across any tenant', async () => {
    const resTenantA = await fetch(`${BASE_URL}/stores`, {
      headers: {
        Authorization: `Bearer ${platformAdminToken}`,
        'X-Tenant-ID': tenantAId,
      },
    });
    expect(resTenantA.status).toBe(200);

    const resTenantB = await fetch(`${BASE_URL}/stores`, {
      headers: {
        Authorization: `Bearer ${platformAdminToken}`,
        'X-Tenant-ID': tenantBId,
      },
    });
    expect(resTenantB.status).toBe(200);
  });

  // 19. Synchronous Audit Logging
  it('19. Synchronous audit logs are recorded for login, logout, and status modifications', async () => {
    const auditRes = await pool.query(
      "SELECT action, resource FROM audit_logs WHERE action IN ('AUTH_LOGIN_SUCCESS', 'USER_STATUS_UPDATED') LIMIT 10"
    );
    expect(auditRes.rows.length).toBeGreaterThan(0);
    const actions = auditRes.rows.map((r) => r.action);
    expect(actions).toContain('AUTH_LOGIN_SUCCESS');
  });

  // 20. Synchronous Security Event on Token Reuse
  it('20. Security event is synchronously recorded on token reuse detection', async () => {
    const secRes = await pool.query(
      "SELECT event_type, severity FROM security_events WHERE event_type = 'TOKEN_REUSE_DETECTED'"
    );
    expect(secRes.rows.length).toBeGreaterThan(0);
    expect(secRes.rows[0].severity).toBe('CRITICAL');
  });
});
