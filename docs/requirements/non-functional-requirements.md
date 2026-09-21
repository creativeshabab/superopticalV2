# Super Optical V2 — Non-Functional Requirements (NFR)

**Document Version:** 1.0.0  
**Phase:** Phase 1 — Product Definition & Business Requirements  
**Status:** Canonical Engineering Specification  

---

## 1. Performance & Latency Requirements
- **NFR-PERF-01 (POS Checkout Latency):** Local POS cart operations (adding items, recalculating totals, applying discounts) must complete in $< 50\text{ ms}$ on local desktop terminals.
- **NFR-PERF-02 (API Response Time):** Standard read/write REST API endpoints must respond with $p95 < 200\text{ ms}$ under normal network conditions.
- **NFR-PERF-03 (Barcode Interception):** USB barcode scanner input must be detected, parsed, and populated into the active sales cart in $< 100\text{ ms}$.
- **NFR-PERF-04 (Thermal Slip Print Dispatch):** Silent ESC/POS thermal receipt printing must dispatch bytes to the local USB/spooler within $500\text{ ms}$ of payment confirmation.

---

## 2. Security & Isolation Requirements
- **NFR-SEC-01 (Multi-Tenant Isolation):** Zero cross-tenant data leakage. Enforced via NestJS authentication context checks and PostgreSQL Row-Level Security (RLS) policies.
- **NFR-SEC-02 (Store Isolation):** Staff can only transact within their explicitly authorized store scopes. Cross-store inventory adjustments require explicit managerial permissions.
- **NFR-SEC-03 (Transport & Storage Encryption):** All network traffic encrypted via TLS 1.3. Sensitive secrets and tokens encrypted at rest using AES-256-GCM.
- **NFR-SEC-04 (Authentication Security):** Passwords hashed using Argon2id with salt. Short-lived access tokens ($15 - 60\text{ min}$) paired with secure, revocable refresh tokens ($7\text{ days}$).
- **NFR-SEC-05 (Client Non-Trust):** All client-submitted scopes (`tenant_id`, `store_id`, `role`) are strictly ignored and extracted exclusively from validated server session claims.

---

## 3. Reliability, Availability & Fault Tolerance
- **NFR-REL-01 (Continuous Counter Availability):** Retail POS counter checkout and receipt printing must remain functional during complete broadband internet outages (via offline IndexedDB and local printer drivers).
- **NFR-REL-02 (Idempotent Recovery):** Replaying offline sync commands after network dropouts must produce identical state without duplicate transactions or double stock deductions.
- **NFR-REL-03 (Graceful Degradation):** Failure of external notification gateways (e.g. WhatsApp / SMS) must never block sale completion or fiscal receipt printing.

---

## 4. Data Integrity & Financial Consistency
- **NFR-DATA-01 (Append-Only Financial History):** Payment records, refunds, customer credits, and debits are strictly write-once. Zero in-place `UPDATE` or `DELETE` queries permitted on financial transaction tables.
- **NFR-DATA-02 (Ledger-Driven Inventory):** Physical stock balances are governed by the `inventory_movements` ledger. Zero unexplainable stock quantity alterations.
- **NFR-DATA-03 (Mathematical Precision):** Currency calculations executed using deterministic integer paise/cents or fixed-point `NUMERIC(14, 2)`. Floating-point arithmetic is strictly banned.

---

## 5. Auditability & Compliance
- **NFR-AUD-01 (Comprehensive Audit Trail):** All security, clinical prescription, financial allocation, and inventory adjustment events must emit immutable records to `audit_logs`.
- **NFR-AUD-02 (Audit Immutability):** Database triggers prevent deletion or tampering of historical audit records.
- **NFR-AUD-03 (Statutory Tax Compliance):** Invoice sequence numbering is unbroken and per-store compliant with Indian GST audit mandates.

---

## 6. Usability & Ergonomics (Desktop & Mobile)
- **NFR-UI-01 (High-Speed Keyboard Navigation):** POS counter interfaces on desktop must support complete mouse-free operation via standard keyboard shortcuts (`F1` Help, `F2` Customer Search, `F3` Barcode Scan, `F4` Hold Cart, `F8` Discount, `F12` Settle Payment, `Enter` advance).
- **NFR-UI-02 (Touch-Friendly Responsive Profiles):** Tablet and mobile views must maintain minimum tap target dimensions of $44\text{ px} \times 44\text{ px}$ with bottom navigation and bottom-sheet forms.
- **NFR-UI-03 (Visual Sync Status):** The interface must clearly indicate connectivity state and sync badge status (`ONLINE`, `OFFLINE`, `SYNCING`, `SYNC_CONFLICT`).

---

## 7. Maintainability & Testability
- **NFR-DEV-01 (Pure Domain Logic):** Core financial, tax, and optical calculations must reside in pure TypeScript monorepo packages (`packages/calculations`, `packages/tax`, `packages/optical`) with zero framework dependencies.
- **NFR-DEV-02 (Automated Test Rigor):** Calculation packages must maintain 100% path test coverage. Critical transaction services must maintain integration tests verifying rollback on error.
