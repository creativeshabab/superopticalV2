# Super Optical V2 — Architecture Specification: Authentication

## 1. Overview & Security Philosophy

Authentication in **Super Optical V2** establishes verifiable identity for all platform operators, tenant administrators, store managers, and staff. As an optical enterprise platform handling sensitive clinical and retail data, authentication design enforces strict token isolation, cryptographic privacy, active session control, and permanent bootstrap protection.

---

## 2. Core Authentication Mechanics

### 2.1 Access Tokens (JWT)
- **Standard**: JSON Web Token (RFC 7519), signed with HMAC-SHA256 (`HS256`).
- **Lifespan**: Strictly limited to 15 minutes (`900s`).
- **Payload Schema**:
  ```json
  {
    "sub": "b2c3d4e5-f6a7-48b9-0123-c456789abcde",
    "email": "admin.bihar@superoptical.com",
    "isPlatformAdmin": false,
    "iat": 1774200000,
    "exp": 1774200900
  }
  ```
- **Stateless Verification**: Evaluated on each incoming request via `JwtAuthGuard`. The user's active status is verified against the database to guarantee that disabled accounts cannot utilize existing JWTs for remaining token lifespans.

### 2.2 Refresh Tokens & Cryptographic Rotation
- **Token Entropy**: 64-byte cryptographically secure random hexadecimal string generated via `crypto.randomBytes(64)`.
- **Database Storage Privacy**: Plaintext refresh tokens are **NEVER** stored in the database. Only their SHA-256 cryptographic digest (`crypto.createHash('sha256').update(token).digest('hex')`) is persisted in `refresh_tokens.token_hash`.
- **Lifespan**: 7 days (`604800s`).
- **Rotation on Use**: Every call to `POST /api/v1/auth/refresh` revokes the consumed refresh token and issues a new access token and a newly generated refresh token.
- **Token Families**: All tokens originating from an initial login share a unique `family_id` (UUID).

---

## 3. Threat Mitigation & Security Protections

### 3.1 Token Reuse Detection (Family Invalidation)
When an attacker attempts to replay an already-consumed or revoked refresh token:
1. The backend hashes the presented token and queries `refresh_tokens`.
2. If the token is found with `is_revoked = true`, an active breach attempt is detected.
3. The backend immediately invalidates the entire token family:
   ```sql
   UPDATE refresh_tokens 
   SET is_revoked = true, revoked_at = NOW() 
   WHERE family_id = $1;
   ```
4. A `CRITICAL` severity security event (`TOKEN_REUSE_DETECTED`) is logged synchronously to `security_events`.
5. The request is rejected with `401 Unauthorized`.

### 3.2 Instant Account Disablement & Token Revocation
When a tenant administrator or platform administrator changes a user's status to `DISABLED` or `SUSPENDED` via `PATCH /api/v1/users/:id/status`:
1. The user's status in `users` is updated immediately.
2. All active refresh tokens across all families for that user are synchronously revoked in the database:
   ```sql
   UPDATE refresh_tokens 
   SET is_revoked = true, revoked_at = NOW() 
   WHERE user_id = $1 AND is_revoked = false;
   ```
3. A `USER_ACCOUNT_DISABLED` security audit event is synchronously emitted.
4. Any immediate subsequent request using tokens associated with this user returns `401 Unauthorized`.

### 3.3 Explicit Logout
- Calling `POST /api/v1/auth/logout` revokes the caller's active refresh token in the database.
- An `AUTH_LOGOUT` audit log is recorded.

---

## 4. Platform Administrator Bootstrap Protection

Initial system provisioning requires creating the first Platform Administrator account via `POST /api/v1/auth/bootstrap-admin`.

### Security Rules:
1. **Secret Key Guard**: Requires header/body `bootstrapSecret` matching the server environment variable `BOOTSTRAP_SECRET`. Unauthorized secrets return `403 Forbidden`.
2. **Permanent Single-Use Lock**: The endpoint performs an atomic check against the `users` table:
   ```sql
   SELECT COUNT(*) FROM users WHERE is_platform_admin = true;
   ```
   If any Platform Administrator already exists in the system, the endpoint permanently locks itself and returns `403 Forbidden`, preventing replay attacks or hostile takeover even if the `BOOTSTRAP_SECRET` is leaked post-provisioning.
3. **Auditability**: Successful initialization logs `BOOTSTRAP_INITIALIZED` (`INFO`), while unauthorized attempts log `BOOTSTRAP_ATTEMPT_DENIED` (`CRITICAL`).

---

## 5. Endpoints Specification

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | Authenticates credentials, generates JWT + hashed refresh token |
| `POST` | `/api/v1/auth/refresh` | Public | Rotates refresh token, invalidates family on reuse detection |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revokes current refresh token |
| `POST` | `/api/v1/auth/bootstrap-admin` | Public (Secret guarded) | Provisions first platform administrator (permanent single-use lock) |
| `GET` | `/api/v1/auth/me` | Authenticated | Returns authenticated user profile, active tenant & memberships |
