# Super Optical V2 — Architecture Specification: Multi-Tenant Isolation

## 1. Principles of Tenant Isolation

In **Super Optical V2**, multi-tenant security operates under a zero-trust model:
- **Frontend headers are untrusted hints**: An HTTP header such as `X-Tenant-ID` is merely a requested context identifier. It is **NEVER** treated as authorization.
- **Defense in Depth**: Isolation is enforced across three distinct layers:
  1. Application Guard (`TenantGuard`)
  2. Service / Repository Layer (`withTenantContext`)
  3. Database Engine Level (PostgreSQL Row-Level Security with `FORCE ROW LEVEL SECURITY`)

---

## 2. Server-Side Context Verification (`TenantGuard`)

Whenever an endpoint requires tenant context (marked with `@RequireTenant()` or resolving `@CurrentTenant()`):
1. **User Authentication**: The user must already be authenticated via `JwtAuthGuard`.
2. **Context Resolution**: The guard inspects `X-Tenant-ID` (or path param `tenantId`). If absent and the user belongs to exactly one tenant, that tenant is inferred.
3. **Platform Administrator Exemption**: If `user.isPlatformAdmin === true`, the administrator is authorized to operate within any active requested tenant.
4. **Tenant Membership Validation**: For standard users, the guard queries `tenant_memberships`:
   ```sql
   SELECT tm.status, t.status AS tenant_status, t.id, t.name, t.slug
   FROM tenant_memberships tm
   INNER JOIN tenants t ON tm.tenant_id = t.id
   WHERE tm.user_id = $1 AND tm.tenant_id = $2;
   ```
5. **Unauthorized Access Rejection**:
   - If the user is not an active member of the requested tenant: **`403 Forbidden`**.
   - If the requested tenant is `SUSPENDED` or `CANCELLED`: **`403 Forbidden`**.
6. **Request Attachment**: The verified tenant profile is attached to `request.tenantContext`.

---

## 3. Database-Level Multi-Tenancy (PostgreSQL RLS)

### 3.1 Unprivileged Application Role
PostgreSQL superusers (`postgres`) naturally bypass RLS policies even with `FORCE ROW LEVEL SECURITY`. To guarantee absolute engine-level enforcement, Super Optical V2 creates an unprivileged database role:
```sql
CREATE ROLE app_user WITH LOGIN NOSUPERUSER NOBYPASSRLS;
GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;
```

### 3.2 Transaction Scoping (`withTenantContext`)
All tenant-scoped queries execute inside an isolated transaction that binds the session variable `app.current_tenant_id`:
```typescript
await client.query('SET ROLE app_user');
await client.query(
  "SELECT set_config('app.current_tenant_id', $1, true)",
  [tenantId]
);
// Execute Drizzle ORM queries within tenant boundary
```

### 3.3 RLS Policy Schema
Every tenant-partitioned table (e.g. `stores`, `store_memberships`, `user_roles`, and audit logs) is protected by an explicit RLS policy:
```sql
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON stores
  AS RESTRICTIVE
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
  );
```

### 3.4 Relational Guarantees
- Any query attempting to read rows belonging to another tenant returns `0 rows` (invisible).
- Any attempt to insert or update rows matching a different `tenant_id` violates the `WITH CHECK` constraint and throws a PostgreSQL error.
- Setting an empty context or leaving context unbound evaluates `tenant_id = NULL`, completely isolating all tenant data.
