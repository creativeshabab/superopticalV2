# Super Optical V2 — Architecture Specification: Authorization & RBAC

## 1. Overview & Hierarchy

Access control in **Super Optical V2** uses a three-tier Role-Based Access Control (RBAC) model aligned with the optical retail domain:

```text
[ PLATFORM SCOPE ]
       │
       ▼
[ TENANT SCOPE ] (Optical Chain / Business)
       │
       ▼
[ STORE SCOPE ]  (Physical Retail Branch / Lab)
```

Roles define groupings of granular permissions. Access decisions are evaluated dynamically against the database on each request.

---

## 2. Role Taxonomy & Scopes

### 2.1 Role Scopes (`RoleScope`)
- **`PLATFORM`**: Applicable globally across all tenants. Reserved exclusively for platform owners and technical administrators.
- **`TENANT`**: Scoped to an entire optical business organization (all branches, stores, and warehouses within the tenant).
- **`STORE`**: Scoped to a specific physical retail location or branch workshop within a tenant.

### 2.2 Standard System Roles (`SystemRole`)
| Role Key | Scope | Target User | Default Responsibilities |
|---|---|---|---|
| `PLATFORM_ADMIN` | `PLATFORM` | System Owners, DevOps | Universal access across all tenants, stores, settings, and audits |
| `TENANT_ADMIN` | `TENANT` | Optical Business Owners, Directors | Manages tenant stores, staff, roles, permissions, and billing |
| `STORE_MANAGER` | `STORE` | Optical Store Branch Managers | Oversees branch inventory, daily operations, staff, and branch audits |
| `STAFF` | `STORE` | Sales Staff, Optometrists, Technicians | Counter sales, customer refractions, and retail order execution |

---

## 3. Dynamic Database Permission Evaluation

Permissions are not baked statically into JWT claims. Baking permissions into JWTs introduces authorization lag where permissions remain active until the JWT expires.

### 3.1 Evaluation Flow (`PermissionsGuard`)
1. **Platform Admin Bypass**: If `user.isPlatformAdmin === true`, access is granted unconditionally across all routes.
2. **Tenant Context Verification**: If the user is not a platform admin, a valid tenant context must be present in the request (`request.tenantContext`).
3. **Live Database Resolution**: The guard queries the database to evaluate active permissions assigned to the user within the target tenant:
   ```sql
   SELECT p.key AS perm_key
   FROM user_roles ur
   INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
   INNER JOIN permissions p ON rp.permission_id = p.id
   WHERE ur.tenant_id = $1 AND ur.user_id = $2;
   ```
4. **Immediate Revocation Effect**: If a role assignment is revoked in `user_roles` or a permission is removed from `role_permissions`, the very next API request from that user is immediately rejected with `403 Forbidden`.

---

## 4. Permission Catalog Baseline (Phase 2)

| Permission Key | Category | Description |
|---|---|---|
| `tenant.read` / `tenants:read` | Tenant | Read tenant profile and configuration |
| `tenant.create` / `tenants:create` | Tenant | Provision new optical retail tenant |
| `tenant.update` / `tenants:update` | Tenant | Modify tenant settings and metadata |
| `tenant.manage_status` | Tenant | Suspend or reactivate a tenant |
| `store.read` / `stores:read` | Store | View store branches within tenant |
| `store.create` / `stores:create` | Store | Create a new retail store branch |
| `store.update` / `stores:update` | Store | Update store branch details |
| `user.read` / `users:read` | User | View staff members and assignments |
| `user.create` / `users:create` | User | Onboard new staff members |
| `user.update` / `users:update` | User | Update staff profile, status, or memberships |
| `user.disable` | User | Disable/suspend staff member account |
| `role.read` | RBAC | View custom and system roles |
| `role.create` | RBAC | Create a new custom role |
| `role.update` | RBAC | Modify role permission assignments |
| `roles:manage` | RBAC | Full management of roles and permissions |
| `permission.read` | RBAC | View available permissions catalog |
| `audit.read` / `audit:read` | Audit | View audit logs and security events |
| `platform.configure` | Platform | Platform-level settings and flags |

---

## 5. Security & Boundary Enforcement

1. **Least Privilege**: Staff roles are strictly forbidden from administrative operations (`stores:create`, `users:create`, `roles:manage`).
2. **Context Isolation**: A tenant admin cannot assign permissions or roles outside their own tenant ID.
3. **Immutable System Roles**: System-defined roles (`is_system = true`) cannot be deleted or renamed.
