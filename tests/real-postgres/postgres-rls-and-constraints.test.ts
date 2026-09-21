import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:@localhost:5433/super_optical_test?sslmode=disable';

describe('Real PostgreSQL 18: RLS Isolation & Composite FK Constraint Integrity', () => {
  let pool: Pool;
  let tenantAId: string;
  let tenantBId: string;
  let storeA1Id: string;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });

    // Fetch seeded tenants
    const tenantRes = await pool.query(
      "SELECT id, slug FROM tenants WHERE slug IN ('super-optical-bihar', 'super-optical-up')"
    );
    const tenantMap = new Map(tenantRes.rows.map((r) => [r.slug, r.id]));
    tenantAId = tenantMap.get('super-optical-bihar')!;
    tenantBId = tenantMap.get('super-optical-up')!;

    expect(tenantAId).toBeDefined();
    expect(tenantBId).toBeDefined();

    // Fetch store from Tenant A
    const storeRes = await pool.query(
      'SELECT id FROM stores WHERE tenant_id = $1 LIMIT 1',
      [tenantAId]
    );
    storeA1Id = storeRes.rows[0].id;
    expect(storeA1Id).toBeDefined();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('RLS Isolation: SET LOCAL app.current_tenant_id filters query results strictly to target tenant', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET ROLE app_user');

      // Set session variable locally to Tenant A
      await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantAId]);

      const res = await client.query('SELECT id, tenant_id FROM stores');
      expect(res.rows.length).toBeGreaterThan(0);

      // Verify every returned store strictly belongs to Tenant A
      for (const row of res.rows) {
        expect(row.tenant_id).toBe(tenantAId);
        expect(row.tenant_id).not.toBe(tenantBId);
      }

      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('RLS Isolation: Switching session variable to Tenant B returns only Tenant B rows', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET ROLE app_user');

      await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantBId]);

      const res = await client.query('SELECT id, tenant_id FROM stores');
      expect(res.rows.length).toBeGreaterThan(0);

      for (const row of res.rows) {
        expect(row.tenant_id).toBe(tenantBId);
        expect(row.tenant_id).not.toBe(tenantAId);
      }

      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('Transaction Scoping: SET LOCAL expires cleanly when transaction ends', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantAId]);
      await client.query('COMMIT');

      // Check current setting outside transaction
      const settingRes = await client.query(
        "SELECT current_setting('app.current_tenant_id', true) as val"
      );
      // Once transaction commits, SET LOCAL setting reverts to null or empty
      expect(settingRes.rows[0].val).toBeFalsy();
    } finally {
      client.release();
    }
  });

  it('Composite FK Rejection: PostgreSQL rejects store membership pointing to a store from another tenant (23503)', async () => {
    const client = await pool.connect();
    try {
      // Find a user ID in the test DB
      const userRes = await client.query('SELECT id FROM users LIMIT 1');
      const userId = userRes.rows[0].id;

      // Attempt to insert store_memberships where store_id is Store A1 (belongs to Tenant A),
      // but tenant_id is specified as Tenant B!
      let errorThrown: any = null;
      try {
        await client.query(
          `INSERT INTO store_memberships (tenant_id, store_id, user_id, is_default)
           VALUES ($1, $2, $3, false)`,
          [tenantBId, storeA1Id, userId]
        );
      } catch (err) {
        errorThrown = err;
      }

      expect(errorThrown).not.toBeNull();
      // Postgres error code 23503 is foreign_key_violation
      expect(errorThrown.code).toBe('23503');
      expect(errorThrown.constraint).toBe('fk_store_memberships_store_tenant');
    } finally {
      client.release();
    }
  });

  it('Composite Unique Constraint: PostgreSQL rejects duplicate store code within the same tenant (23505)', async () => {
    const client = await pool.connect();
    try {
      // Find existing code in Tenant A
      const storeRes = await client.query(
        'SELECT code FROM stores WHERE tenant_id = $1 LIMIT 1',
        [tenantAId]
      );
      const existingCode = storeRes.rows[0].code;

      let errorThrown: any = null;
      try {
        await client.query(
          `INSERT INTO stores (tenant_id, name, code, is_main_branch, status)
           VALUES ($1, 'Duplicate Code Store', $2, false, 'ACTIVE')`,
          [tenantAId, existingCode]
        );
      } catch (err) {
        errorThrown = err;
      }

      expect(errorThrown).not.toBeNull();
      // Postgres error code 23505 is unique_violation
      expect(errorThrown.code).toBe('23505');
      expect(errorThrown.constraint).toBe('uq_stores_tenant_code');
    } finally {
      client.release();
    }
  });
});
