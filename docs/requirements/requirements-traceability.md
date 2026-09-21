# Super Optical V2 — Requirements Traceability Matrix (RTM)

**Document Version:** 1.1.0  
**Phase:** Phase 1 — Product Definition & Business Requirements  
**Status:** Active Traceability Baseline  

---

## 1. Bidirectional Traceability Architecture

Every functional requirement traces forward to architecture, APIs, database entities, and automated tests:

```text
Requirement ID (FR-*)
  → Business Capability
  → Domain Area
  → Operational Workflow
  → Future Backend Module
  → Future REST API Endpoint
  → Future Database Entities
  → Automated Test Suite
```

---

## 2. Complete Phase 1 Functional Requirements Traceability Matrix

| Requirement ID | Business Capability | Domain Area | Operational Workflow | Target Backend Module | Target REST API | Target Database Entities | Target Test Suite |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **FR-CUSTOMER-001** | Walk-in Customer Registration | `06-CUSTOMERS` | Customer Intake | `CustomerModule` | `POST /api/v1/customers` | `customers`, `customer_addresses` | `tests/integration/customer.spec.ts` |
| **FR-CUSTOMER-002** | Customer Search & Lookup | `06-CUSTOMERS` | POS / Clinic Lookup | `CustomerModule` | `GET /api/v1/customers/search` | `customers` (Indexed) | `tests/integration/customer.spec.ts` |
| **FR-CUSTOMER-003** | Family Member Linking | `07-FAMILY` | Family Account Tree | `CustomerModule` | `POST /api/v1/customers/:id/family` | `customer_family_members` | `tests/integration/family.spec.ts` |
| **FR-CLINICAL-001** | Record Optical Refraction | `08-CLINICAL` | Eye Examination | `ClinicalModule` | `POST /api/v1/clinical/examinations` | `eye_examinations`, `measurements` | `tests/integration/clinical.spec.ts` |
| **FR-CLINICAL-002** | Signed Optical Prescription | `09-PRESCRIPTION` | Prescription Issuance | `ClinicalModule` | `POST /api/v1/prescriptions` | `prescriptions`, `prescription_items` | `tests/integration/prescription.spec.ts` |
| **FR-PRODUCT-001** | Product Master & Variants | `10-CATALOG` | Catalog Management | `CatalogModule` | `POST /api/v1/products` | `products`, `product_variants` | `tests/integration/catalog.spec.ts` |
| **FR-PRICING-001** | Deterministic Optical Pricing | `11-PRICING` | Cart Pricing Engine | `@super-optical/calculations` | Internal domain engine | `product_prices`, `discounts` | `tests/unit/pricing.spec.ts` |
| **FR-INVENTORY-001** | Append-Only Stock Movements | `13-INVENTORY` | Stock Control | `InventoryModule` | `POST /api/v1/inventory/movements` | `store_inventory`, `movements` | `tests/integration/inventory.spec.ts` |
| **FR-INVENTORY-002** | Inter-Store Stock Transfer | `13-INVENTORY` | Branch Fulfillment | `InventoryModule` | `POST /api/v1/inventory/transfers` | `stock_transfers`, `movements` | `tests/integration/transfers.spec.ts` |
| **FR-PROCUREMENT-001**| PO & Goods Receipt Intake | `14-PROCUREMENT` | Vendor Procurement | `ProcurementModule` | `POST /api/v1/procurement/orders` | `purchase_orders`, `goods_receipts` | `tests/integration/procurement.spec.ts` |
| **FR-POS-001** | Optical Bundle Assembly | `16-POS` | Retail POS Checkout | `SalesModule` | `POST /api/v1/pos/cart/bundle` | `sales`, `sale_items`, `rx_links` | `tests/integration/pos.spec.ts` |
| **FR-POS-002** | Hold & Resume Cart | `16-POS` | Counter Triage | Client State (Dexie) | Local IndexedDB | Client Cache | `tests/unit/pos-cart.spec.ts` |
| **FR-SALES-001** | Atomic Sales Confirmation | `17-SALES` | Order Confirmation | `SalesModule` | `POST /api/v1/sales` | `sales`, `sale_items`, `payments` | `tests/integration/sales-atomic.spec.ts` |
| **FR-SALES-002** | Revision-Based Invoice Edit | `21-INVOICE` | Post-Confirm Revision | `SalesModule` | `POST /api/v1/sales/:id/revise` | `sale_revisions`, `movements` | `tests/integration/invoice-revision.spec.ts` |
| **FR-PAYMENT-001** | Split-Payment Processing | `18-PAYMENTS` | Multi-Tender Checkout | `FinanceModule` | `POST /api/v1/sales/:id/payments` | `payments`, `payment_allocations` | `tests/integration/payments.spec.ts` |
| **FR-PAYMENT-002** | Advance Deposit & Balance | `18-PAYMENTS` | Pickup Settlement | `FinanceModule` | `POST /api/v1/sales/:id/settle` | `payments`, `sales` | `tests/integration/payments.spec.ts` |
| **FR-TAX-001** | Configurable Indian GST | `12-TAX-GST` | Statutory Tax Calc | `@super-optical/tax` | Internal domain engine | `tax_schedules`, `sale_taxes` | `tests/unit/tax.spec.ts` |
| **FR-LAB-001** | Lab Job Ticketing & QC | `22-OPTICAL-LAB` | Workshop Lens Edging | `LabModule` | `PATCH /api/v1/lab/jobs/:id/qc` | `lab_jobs`, `quality_checks` | `tests/integration/lab.spec.ts` |
| **FR-DELIVERY-001** | Store Pickup & Handover | `23-DELIVERY` | Spectacle Dispensing | `SalesModule` | `POST /api/v1/sales/:id/deliver` | `delivery_orders`, `sales` | `tests/integration/delivery.spec.ts` |
| **FR-CASH-001** | Register Day Close & Variance| `24-CASH` | Drawer Reconciliation | `FinanceModule` | `POST /api/v1/cash/sessions/close` | `cash_sessions`, `transactions` | `tests/integration/cash.spec.ts` |
| **FR-REPORT-001** | GST & Daily Sales Reports | `27-REPORTS` | Business Intelligence | `ReportsModule` | `GET /api/v1/reports/gstr1` | Materialized Views | `tests/integration/reports.spec.ts` |
| **FR-RBAC-001** | Store-Level Access Guard | `04-USERS-RBAC` | Request Authorization | `AuthModule` (Guards) | All protected routes | `user_store_access`, `roles` | `tests/integration/rbac-guards.spec.ts` |
| **FR-OFFLINE-001** | Idempotent Offline Sync | `29-OFFLINE` | Edge Network Outage | `SyncModule` | `POST /api/v1/sync/batch` | `sync_commands`, `sync_conflicts` | `tests/offline/sync.spec.ts` |
| **FR-HARDWARE-001** | Direct Silent Thermal Print | `30-HARDWARE` | Counter Slip Printing | `@super-optical/printing` | Local Spooler IPC | Local Hardware Spooler | `tests/unit/printing.spec.ts` |
| **FR-AUDIT-001** | Immutable Audit Logging | `28-AUDIT` | Compliance & Security | `AuditModule` | System interceptor | `audit_logs` | `tests/integration/audit.spec.ts` |
| **FR-MIGRATION-001** | Staged Legacy ETL Import | `35-MIGRATION` | Historical Data Cutover| Migration Runner | CLI ETL Pipeline | Staging $\rightarrow$ Production | `tests/integration/migration.spec.ts` |
