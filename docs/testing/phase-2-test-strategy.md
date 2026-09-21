# Super Optical V2 — Phase 2 Test Strategy & Security Matrix

## 1. Quality & Security Assurance Strategy

Phase 2 introduces the foundational authentication, multi-tenant boundaries, store boundaries, and RBAC security gates for Super Optical V2. Because these components form the security perimeter for all future phases (POS, ERP, Clinical, Lab, and Inventory), test coverage enforces real database verification against PostgreSQL 18.

---

## 2. Test Architecture & Structure

```text
tests/
├── unit/
│   └── validation-and-auth.test.ts          # Zod validation, token hashing, password policy
├── real-postgres/
│   └── postgres-rls-and-constraints.test.ts # PostgreSQL 18 RLS policies & composite FKs
└── security/
    └── security-matrix.test.ts              # Canonical 20-point security matrix
```

---

## 3. The 20-Point Security Test Matrix

All 20 tests execute against the running Super Optical V2 API connected to PostgreSQL 18.

| # | Test Scenario Name | Target Protection | Verified Result |
|---|---|---|:---:|
| 1 | Unauthenticated Request Protection | Missing Bearer token on protected route | **`401 Unauthorized`** |
| 2 | Invalid/Tampered JWT Protection | Forged signature or corrupt JWT payload | **`401 Unauthorized`** |
| 3 | Expired JWT Protection | JWT past `exp` timestamp | **`401 Unauthorized`** |
| 4 | Cross-Tenant Spoofing Rejection | Valid token + spoofed `X-Tenant-ID` of non-member tenant | **`403 Forbidden`** |
| 5 | Suspended Tenant Access Rejection | Request with `X-Tenant-ID` pointing to suspended tenant | **`403 Forbidden`** |
| 6 | Cross-Tenant Store Spoofing Rejection | Spoofed `X-Store-ID` for store owned by another tenant | **`403 Forbidden`** |
| 7 | Store Spoofing Without Membership | Spoofed `X-Store-ID` for store where user lacks membership | **`403 Forbidden`** |
| 8 | URL Parameter IDOR Protection | Direct ID access via `GET /stores/:id` across tenants | **`403 Forbidden`** |
| 9 | Disabled User Account Token Rejection | Valid JWT presented for account with status `DISABLED` | **`401 Unauthorized`** |
| 10 | Instant Refresh Token Invalidation | Changing status to `DISABLED` revokes all active refresh tokens | **`401 Unauthorized`** |
| 11 | Refresh Token Reuse Detection | Replaying a consumed refresh token revokes entire token family | **`401 Unauthorized`** |
| 12 | Expired/Invalid Refresh Token | Invalid or non-existent refresh token string | **`401 Unauthorized`** |
| 13 | Bootstrap Protection: Invalid Secret | `POST /auth/bootstrap-admin` with incorrect secret key | **`403 Forbidden`** |
| 14 | Bootstrap Protection: Single-Use Lock | `POST /auth/bootstrap-admin` when Platform Admin exists | **`403 Forbidden`** |
| 15 | RBAC: Staff Cannot Create Store | Staff role attempting `POST /stores` (`stores:create`) | **`403 Forbidden`** |
| 16 | RBAC: Staff Cannot Create User | Staff role attempting `POST /users` (`users:create`) | **`403 Forbidden`** |
| 17 | Dynamic Permission Evaluation | Dynamically revoking role immediately blocks access | **`403 Forbidden`** |
| 18 | Platform Admin Universal Access | Platform Admin accesses stores across Tenant A and Tenant B | **`200 OK`** |
| 19 | Synchronous Audit Logging | Verifies synchronous audit trail for auth, logout, status change | Verified in DB |
| 20 | Synchronous Security Event Logging | Token reuse logs synchronous `CRITICAL` security event | Verified in DB |

---

## 4. Real PostgreSQL Engine Verification Suite

Executed directly against PostgreSQL 18 in `tests/real-postgres/postgres-rls-and-constraints.test.ts`:
1. **RLS Tenant Isolation**: An unprivileged database session (`SET ROLE app_user; SELECT set_config('app.current_tenant_id', tenantA, true)`) query on `stores` returns only Tenant A stores; Tenant B stores return 0 rows.
2. **Transaction Scoping Isolation**: A new connection without `app.current_tenant_id` set returns 0 rows across all RLS tables.
3. **Store Relational Integrity**: Attempting to insert a store membership where `store_memberships.tenant_id != stores.tenant_id` is rejected by PostgreSQL foreign key constraint `fk_store_memberships_tenant_store` (PostgreSQL Error Code `23503`).
4. **User-Tenant Relational Integrity**: Attempting to insert a `user_roles` record for a user not belonging to that tenant is rejected by composite foreign key `fk_user_roles_tenant_membership` (PostgreSQL Error Code `23503`).
5. **Tenant Membership Uniqueness**: Duplicate membership pairs in `tenant_memberships` are rejected by unique constraint (PostgreSQL Error Code `23505`).

---

## 5. Execution & Reproduction Instructions

To execute all tests across the repository:
```bash
# 1. Ensure PostgreSQL is active on 127.0.0.1:5433
# 2. Run complete test suite:
npm test
# Or with Vitest:
npx vitest run

# 3. Run typecheck validation:
npm run typecheck

# 4. Run frontend production build:
npm run build
```
