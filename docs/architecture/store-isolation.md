# Super Optical V2 — Architecture Specification: Store Branch Isolation

## 1. Store Context Overview

In optical retail, physical store branches (e.g. showroom, optical dispensary, edging lab, or optical workshop) require strict operational boundaries:
- Staff members are assigned to specific store branches.
- Inventory, point-of-sale registers, optical lab jobs, and order handoffs are partitioned by store branch.
- Cross-tenant store access is strictly prohibited.
- A store must strictly belong to the active tenant.

---

## 2. Server-Side Context Verification (`StoreGuard`)

Like `X-Tenant-ID`, the header `X-Store-ID` is treated strictly as an untrusted hint.

### 2.1 Verification Lifecycle
1. **Tenant Context Prerequisite**: The request must pass `TenantGuard` to establish an authentic `tenantContext`.
2. **Store Resolution**: `StoreGuard` extracts `X-Store-ID` (or route parameter `:storeId` / `:id`).
3. **Cross-Tenant Ownership Validation**:
   ```sql
   SELECT id, code, name, status, tenant_id
   FROM stores
   WHERE id = $1 AND tenant_id = $2;
   ```
   If no store matches both `id` AND `tenantContext.id`, the request is immediately rejected with **`403 Forbidden`**. This completely blocks cross-tenant store spoofing.
4. **User Store Membership Validation**:
   - Platform Administrators are exempt and have universal store visibility.
   - Tenant Administrators (`TENANT` scope) have visibility across all stores within their tenant.
   - Store Managers and Staff (`STORE` scope) must have an active record in `store_memberships` for that specific `store_id`:
     ```sql
     SELECT id FROM store_memberships
     WHERE tenant_id = $1 AND user_id = $2 AND store_id = $3;
     ```
     If the user does not possess membership in that branch: **`403 Forbidden`**.
5. **Request Binding**: The verified store context is bound to `request.storeContext`.

---

## 3. Database Relational Constraints (PostgreSQL Composite Foreign Keys)

To prevent cross-tenant data corruption at the database engine level (such as an operator accidentally associating a user with a store belonging to a competitor tenant), the schema enforces composite relational constraints.

### 3.1 Composite Unique Key on Stores
```sql
ALTER TABLE stores 
ADD CONSTRAINT uq_stores_id_tenant UNIQUE (id, tenant_id);
```

### 3.2 Composite Foreign Key on Store Memberships
```sql
ALTER TABLE store_memberships
ADD CONSTRAINT fk_store_memberships_tenant_store
FOREIGN KEY (store_id, tenant_id)
REFERENCES stores (id, tenant_id)
ON DELETE CASCADE;
```
**Impact**: It is mathematically impossible in PostgreSQL to create a store membership record where `store_memberships.tenant_id` does not match `stores.tenant_id`. Any query attempting to do so is aborted by PostgreSQL error code `23503` (foreign_key_violation).

### 3.3 Composite Foreign Key on User Roles
```sql
ALTER TABLE tenant_memberships
ADD CONSTRAINT uq_tenant_memberships_tenant_user UNIQUE (tenant_id, user_id);

ALTER TABLE user_roles
ADD CONSTRAINT fk_user_roles_tenant_membership
FOREIGN KEY (tenant_id, user_id)
REFERENCES tenant_memberships (tenant_id, user_id)
ON DELETE CASCADE;
```
**Impact**: A user cannot be assigned a tenant role or store role without first being a verified member of that tenant.

---

## 4. Route Protection Matrix

| Route Pattern | Required Headers | Guards Active | Enforced Behavior |
|---|---|---|---|
| `GET /api/v1/stores` | `Authorization`, `X-Tenant-ID` | `JwtAuthGuard`, `TenantGuard` | Lists only stores belonging to caller's verified tenant |
| `GET /api/v1/stores/:id` | `Authorization`, `X-Tenant-ID` | `JwtAuthGuard`, `TenantGuard`, `StoreGuard` | Rejects IDOR with 403 if store belongs to another tenant |
| `POST /api/v1/stores` | `Authorization`, `X-Tenant-ID` | `JwtAuthGuard`, `TenantGuard`, `PermissionsGuard` | Requires `stores:create`; forbidden to standard staff (403) |
| `PATCH /api/v1/stores/:id` | `Authorization`, `X-Tenant-ID` | `JwtAuthGuard`, `TenantGuard`, `PermissionsGuard` | Updates store branch details within tenant boundary |
