# Super Optical V2 — Requirements Traceability Matrix (RTM)

This matrix establishes the bidirectional traceability linking business requirements from the Master Specification to architectural designs, backend modules, APIs, database entities, implementation files, automated tests, and acceptance criteria.

---

## Traceability Schema

Every requirement follows this lifecycle flow:

```text
Requirement ID
  → Architectural Design
  → Domain Module
  → API Endpoint Contract
  → Database Entities
  → Implementation Packages/Files
  → Automated Test Suite
  → Acceptance Verification
```

---

## Phase 0 Baseline Traceability Matrix

| Req ID | Requirement Summary | Architecture Document | Target Module | Target API | Target Database | Target Test | Status |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **REQ-AUTH-01** | Multi-tenant user authentication with JWT & refresh tokens | `security-architecture.md` | `02 Auth` | `POST /auth/login`, `POST /auth/refresh` | `users`, `tenant_users` | `tests/integration/auth.spec.ts` | Phase 1 Scope |
| **REQ-TEN-01** | Cross-tenant data isolation enforcement | `security-architecture.md` | `01 SaaS`, `05 Stores` | All endpoints | `tenants`, `stores`, RLS | `tests/integration/tenant-isolation.spec.ts` | Phase 2 Scope |
| **REQ-RBAC-01** | Role-based store-level permissions | `security-architecture.md` | `04 Users/RBAC` | `GET /rbac/permissions` | `roles`, `permissions`, `user_store_access` | `tests/unit/rbac.spec.ts` | Phase 2 Scope |
| **REQ-CUST-01** | Customer profile with family member linking | `domain-boundaries.md` | `06 Customers`, `07 Family` | `POST /customers`, `POST /customers/:id/family` | `customers`, `customer_family_members` | `tests/integration/customer.spec.ts` | Phase 3 Scope |
| **REQ-CLIN-01** | Clinical eye test examination and prescription recording | `domain-boundaries.md` | `08 Clinical`, `09 Prescription` | `POST /clinical/examinations`, `POST /prescriptions` | `eye_examinations`, `prescriptions` | `tests/integration/clinical.spec.ts` | Phase 3 Scope |
| **REQ-CAT-01** | Normalized product catalog with variants (frames, lenses) | `domain-boundaries.md` | `10 Product Catalog` | `POST /products`, `POST /products/:id/variants` | `products`, `product_variants`, `barcodes` | `tests/integration/catalog.spec.ts` | Phase 4 Scope |
| **REQ-INV-01** | Append-only ledger-driven store inventory movements | `database-architecture.md` | `13 Inventory` | `POST /inventory/movements`, `GET /inventory/stock` | `store_inventory`, `inventory_movements` | `tests/integration/inventory-ledger.spec.ts` | Phase 5 Scope |
| **REQ-PROC-01** | Purchase orders and goods receipts with stock increase | `domain-boundaries.md` | `14 Procurement` | `POST /procurement/orders`, `POST /procurement/receipts` | `purchase_orders`, `goods_receipts` | `tests/integration/procurement.spec.ts` | Phase 5 Scope |
| **REQ-POS-01** | Atomic multi-item checkout with optical prescription linking | `system-architecture.md` | `16 POS`, `17 Sales` | `POST /sales` | `sales`, `sale_items`, `sale_item_prescriptions` | `tests/integration/sales.spec.ts` | Phase 6 Scope |
| **REQ-FIN-01** | Multi-tender split payments and immutable payment records | `database-architecture.md` | `18 Payments` | `POST /sales/:id/payments` | `payments`, `payment_allocations` | `tests/integration/payments.spec.ts` | Phase 7 Scope |
| **REQ-FIN-02** | Customer credit/debit account for excess payment / advances | `database-architecture.md` | `20 Credit/Debit` | `POST /customers/:id/credits` | `customer_credits`, `customer_debits` | `tests/integration/credits.spec.ts` | Phase 7 Scope |
| **REQ-INV-REV** | Versioned invoice revision preserving financial/stock audit | `database-architecture.md` | `21 Invoice Lifecycle` | `POST /sales/:id/revise` | `sale_revisions`, `inventory_movements` | `tests/integration/invoice-revision.spec.ts` | Phase 8 Scope |
| **REQ-LAB-01** | Optical lab job workflow (fitting, edging, QC, ready) | `domain-boundaries.md` | `22 Optical Lab` | `POST /lab/jobs`, `PATCH /lab/jobs/:id/status` | `lab_jobs`, `fitting_jobs`, `quality_checks` | `tests/integration/lab-job.spec.ts` | Phase 9 Scope |
| **REQ-REP-01** | Reconciled sales, inventory, and GST financial reports | `domain-boundaries.md` | `27 Reports` | `GET /reports/sales`, `GET /reports/gst` | Materialized views / aggregations | `tests/integration/reports.spec.ts` | Phase 10 Scope |
| **REQ-SYNC-01** | Offline idempotent command queue with conflict resolution | `offline-sync-architecture.md` | `29 Offline/Sync` | `POST /sync/batch` | `sync_commands`, `sync_conflicts` | `tests/offline/sync-engine.spec.ts` | Phase 11 Scope |
| **REQ-HARD-01** | Hardware printing (ESC/POS thermal & A4) and barcode scanners | `platform-architecture.md` | `30 Hardware` | Platform Adapters | Device driver interface | `tests/unit/hardware-adapters.spec.ts` | Phase 12 Scope |

---

## Detailed Requirement Specifications (Samples for Phase 1+)

### REQ-POS-01: Atomic Multi-Item Sale
- **Source:** Master Specification Section 8 & 9
- **Description:** A sales transaction must validate customer, inventory, pricing, discounts, and taxes, creating `sales`, `sale_items`, `payment_allocations`, and `inventory_movements` inside a single database transaction. If any step fails, the entire transaction is rolled back.
- **Acceptance Criteria:**
  1. Cart containing a frame, lenses with prescription, and sunglasses completes atomically.
  2. Inventory is decremented via `SALE_DEDUCTION` movements.
  3. No partial state is written if payment processing or inventory lock fails.

### REQ-INV-REV: Revision-Based Invoice Modification
- **Source:** Master Specification Section 6.8 & 9
- **Description:** Modifying an order after confirmation creates a new `sale_revision` record. Historical items and prices remain immutable. Differences in totals adjust inventory movements and payment balances.
- **Acceptance Criteria:**
  1. Revising an invoice total downward results in unallocated payment being credited to the customer account or queued for refund.
  2. Replacing a frame returns the original frame to inventory (`SALE_REVERSAL`) and deducts the replacement frame (`SALE_DEDUCTION`).
  3. All 20 cases of the Mandatory Invoice Test Matrix pass without drift.
