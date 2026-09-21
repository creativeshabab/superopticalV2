# Super Optical V2 — Architectural Decision Log

This document records all significant architectural, technological, and domain decisions for the Super Optical V2 project.

---

## Approved Specification Decisions

### DEC-001: Monorepo Structure & Package Boundaries
- **Date:** 2026-09-22
- **Topic:** Repository Organization & Code Sharing
- **Decision:** Use a single monorepo comprising `apps/` (web, desktop, mobile), `packages/` (ui, types, validation, calculations, optical, tax, sync, printing), `backend/` (api), `database/` (migrations, seeds), `docs/`, and `tests/`.
- **Reason:** Business calculations, optical formulas, validation rules, and type definitions must remain strictly unified across all target platforms (Web, Windows Desktop, Android, iOS) without duplication.
- **Alternatives Considered:** Multi-repo setup (causes version desynchronization across platforms and slows cross-cutting changes).
- **Consequences:** Requires clean package boundaries, strict dependency graphs, and shared TypeScript configs.
- **Status:** Approved / Existing Specification Decision

---

### DEC-002: Client Shared Core with Platform Adapters
- **Date:** 2026-09-22
- **Topic:** Cross-Platform Client Architecture
- **Decision:** Build a single shared React/TypeScript application core. Deploy to Web/PWA natively, to Windows Desktop via Tauri, and to Android/iOS via Capacitor. Interface with hardware and platform services via abstracted platform adapters.
- **Reason:** Optical retail workflows, clinical forms, and POS interfaces are complex and must remain consistent across operating systems, while native runtime packaging enables low-overhead OS integration.
- **Alternatives Considered:** Separate Electron desktop app and native Kotlin/Swift mobile apps (3x development effort, logic divergence risk).
- **Consequences:** Platform-specific capabilities (printers, scanners, local file system) must always be injected through platform adapter interfaces.
- **Status:** Approved / Existing Specification Decision

---

### DEC-003: Authoritative Server-Side State & Client Cache Role
- **Date:** 2026-09-22
- **Topic:** Data Authority and Source of Truth
- **Decision:** PostgreSQL and the server-side domain model are the sole authoritative source of truth. IndexedDB (via Dexie) serves strictly as a client working cache and offline command queue. `localStorage` is strictly forbidden for application data records.
- **Reason:** Eliminates multi-database divergence, data tampering, and accounting discrepancies identified as critical vulnerabilities in legacy optical software.
- **Alternatives Considered:** Dual-master multi-way peer sync (high collision risk for financial/inventory state).
- **Consequences:** Clients must be designed to handle asynchronous server confirmations and optimistic updates with explicit status indicators.
- **Status:** Approved / Existing Specification Decision

---

### DEC-004: Multi-Tenant and Store Isolation Pattern
- **Date:** 2026-09-22
- **Topic:** Data Isolation in Multi-Tenant & Multi-Store SaaS
- **Decision:** Enforce multi-tenancy and store isolation server-side via mandatory `tenant_id` and `store_id` relational constraints, verified within the authenticated request context and fortified with PostgreSQL Row-Level Security (RLS) policies. Client-supplied tenant/store IDs in payloads will never be trusted.
- **Reason:** Ensures strict regulatory and commercial isolation between independent optical business tenants, as well as role-based store boundaries within the same organization.
- **Alternatives Considered:** Database-per-tenant (costly infrastructure overhead for small stores); pure application-level WHERE filtering (vulnerable to developer oversight without RLS enforcement).
- **Consequences:** Every tenant-owned database query must resolve tenant context from validated session claims.
- **Status:** Approved / Existing Specification Decision

---

### DEC-005: Ledger-Driven Inventory Architecture
- **Date:** 2026-09-22
- **Topic:** Inventory State and Stock Mutation
- **Decision:** Current stock counts are derived or validated from an append-only `inventory_movements` ledger. Direct, silent mutation of stock counts is strictly prohibited. Every stock change requires an explicit business movement record (e.g., `PURCHASE_RECEIPT`, `SALE_DEDUCTION`, `TRANSFER_OUT`, `TRANSFER_IN`, `DAMAGE`, `STOCK_ADJUSTMENT`).
- **Reason:** Optical frames, lenses, and accessories require end-to-end traceability for shrinkage prevention, multi-store auditing, and tax compliance.
- **Alternatives Considered:** In-place mutable inventory counters (legacy failure mode causing unexplained stock discrepancies).
- **Consequences:** Inventory adjustment operations require reason codes, user attribution, and transaction atomicity.
- **Status:** Approved / Existing Specification Decision

---

### DEC-006: Immutable Transactional Financial Records
- **Date:** 2026-09-22
- **Topic:** Payment, Refund, and Credit Accounting
- **Decision:** Payments, refunds, customer credits, and debits are first-class, immutable ledger transactions linked via allocation records. Payment records can never be updated or deleted in place; errors must be corrected through explicit reversal or refund transactions.
- **Reason:** Financial integrity requires an unbreakable audit trail for cash register reconciliation, split payments, and tax audits.
- **Alternatives Considered:** Storing `amount_paid` as a mutable column on the invoice row (causes financial desynchronization on invoice modifications).
- **Consequences:** Invoice balance and payment status are computed deterministically from the sum of allocated payment transactions.
- **Status:** Approved / Existing Specification Decision

---

### DEC-007: Revision-Based Invoice Lifecycle Management
- **Date:** 2026-09-22
- **Topic:** Order and Invoice Modifications
- **Decision:** Invoices follow a strict lifecycle (`DRAFT`, `CONFIRMED`, `PARTIALLY_PAID`, `PAID`, `PROCESSING`, `READY`, `DELIVERED`). Modifications after confirmation produce a new versioned `sale_revision` capturing historical state, reason, user, financial impact, and inventory adjustments.
- **Reason:** Optical orders often undergo lens changes or frame replacements while advance payments have already been made; blind in-place edits erase historical customer agreements.
- **Alternatives Considered:** Blind delete-and-recreate (destroys audit trail and corrupts payment allocations).
- **Consequences:** If an invoice revision lowers the total below payments received, the excess must automatically generate a customer credit balance or trigger a formal refund workflow.
- **Status:** Approved / Existing Specification Decision

---

### DEC-008: Idempotent Command-Based Offline Synchronization
- **Date:** 2026-09-22
- **Topic:** Offline Mutation and Conflict Handling
- **Decision:** Offline actions are stored as structured mutation commands (`command_id`, `device_id`, `tenant_id`, `store_id`, `user_id`, `command_type`, `payload`, `aggregate_version`). Upon reconnection, commands are submitted to the sync engine, which validates aggregate version and executes transactionally. Duplicate command IDs return the original cached response.
- **Reason:** Simple "last-write-wins" or "server timestamp wins" strategies inevitably corrupt financial records and double-count inventory movements.
- **Alternatives Considered:** Last-Write-Wins (unacceptable for financial transactions); pure read-only offline mode (unusable in areas with intermittent internet).
- **Consequences:** Business conflicts (e.g., stock depleted remotely while device was offline) are quarantined in a `sync_conflicts` queue for supervisor resolution.
- **Status:** Approved / Existing Specification Decision

---

### DEC-009: Configurable Rule-Based Tax Calculation Engine
- **Date:** 2026-09-22
- **Topic:** GST and Tax Computation
- **Decision:** Tax rates (CGST, SGST, IGST, etc.) are defined through configurable tax categories with effective date ranges and product mappings. Tax calculations are isolated in `@super-optical/tax`.
- **Reason:** Indian GST laws and optical product tax schedules change over time (e.g., different rates for frames vs contact lenses vs eye exam services); hard-coded rates violate regulatory compliance.
- **Alternatives Considered:** Hard-coding 12% or 18% GST in POS checkout logic (forbidden by spec).
- **Consequences:** The POS cart calculation must resolve effective tax rates dynamically based on store location and product tax category.
- **Status:** Approved / Existing Specification Decision

---

### DEC-010: Backend Framework & API Standard
- **Date:** 2026-09-22
- **Topic:** Server Architecture & Protocol
- **Decision:** Build the backend API using NestJS, TypeScript, and PostgreSQL with Redis for caching and background queues. Define strict RESTful endpoint contracts with Zod/class-validator DTO validation and OpenAPI documentation.
- **Reason:** NestJS provides enterprise-grade modularity, dependency injection, and clean separation between controllers, services, repositories, and guards.
- **Alternatives Considered:** Minimal Express server (lacks architectural structure and opinionated dependency injection); GraphQL (adds client caching complexity for offline sync).
- **Consequences:** All backend domain boundaries will be implemented as discrete NestJS modules.
- **Status:** Approved / Existing Specification Decision

---

## Approved Architectural & Business Decisions (Phase 1 Baseline)

### DEC-011: Client State Management & Offline Cache Binding
- **Date:** 2026-09-22
- **Topic:** Global Client State vs Offline IndexedDB Binding
- **Decision:** Adopt Option A: Zustand for transient UI state + TanStack Query for server state caching + Dexie.js for offline IndexedDB persistence.
- **Reason:** Provides the fastest counter rendering performance, minimal JS bundle size, and cleanest decoupling between ephemeral component state and durable offline commands.
- **Status:** Approved (DEC-011)

---

### DEC-012: Database ORM / Query Builder Selection
- **Date:** 2026-09-22
- **Topic:** PostgreSQL Data Access Layer in NestJS
- **Decision:** Adopt Option A: Drizzle ORM with `node-postgres` driver.
- **Reason:** Provides compile-time type safety, zero runtime engine overhead, explicit SQL generation, and seamless integration with PostgreSQL Row-Level Security (RLS) policies.
- **Status:** Approved (DEC-012)

---

### DEC-013: WhatsApp Business API Provider Abstraction
- **Date:** 2026-09-22
- **Topic:** Messaging Service Gateway
- **Decision:** Implement a provider-agnostic `NotificationProvider` interface in `@super-optical/api` with pluggable drivers (Meta Cloud API, Twilio, Gupshup).
- **Reason:** Prevents vendor lock-in and allows optical stores to switch messaging vendors or use direct Meta Cloud API for lower messaging costs.
- **Status:** Approved (DEC-013)

---

### DEC-014: Emergency Negative Inventory Policy (BR-OPN-001)
- **Date:** 2026-09-22
- **Topic:** Inventory Invariant Enforcement & Emergency Exception Handling
- **Decision:** Standard checkout strictly blocks sales if `Available Stock < Requested Quantity`. As an audited exception, emergency negative inventory is permitted only with explicit Manager authorization, mandatory business reason code, immutable audit record (capturing user, manager, store, device, sale, variant, quantity, timestamp), and non-overwriting sync reconciliation.
- **Reason:** Prevents lost retail sales when physical stock is present on the shelf but delayed in administrative system intake, while preserving absolute financial and audit traceability.
- **Status:** Approved (DEC-014)

---

### DEC-015: SaaS Subscription Tiers & Entitlement Model (BR-OPN-002)
- **Date:** 2026-09-22
- **Topic:** Commercial SaaS Operating Model & Feature Governance
- **Decision:** Establish four canonical subscription tiers: Starter, Professional, Business, and Enterprise. Commercial pricing figures are not hard-coded in source code or database schemas. Plans configure feature entitlements, limits, and billing intervals, evaluated via a two-stage authorization engine.
- **Reason:** Enables flexible SaaS commercial packaging, tenant add-on overrides, and clean architectural separation between software code and commercial pricing.
- **Status:** Approved (DEC-015)

---

### DEC-016: Clinical Eye Test Free Invariant & Admin-Configurable GST Architecture (BR-OPN-003)
- **Date:** 2026-09-22
- **Topic:** Clinical Eye Examination Pricing & Indian GST Tax Classification
- **Decision:** Clinical eye refraction testing is formally established as a complimentary, free healthcare service (Price = ₹0) and not a taxable sale item. The tax engine is admin-configurable with initial default optical rates: Spectacle Frames (HSN 9003) @ 5%, Corrective Lenses (HSN 9001) @ 5%, Contact Lenses (HSN 9001) @ 5%, Corrective Spectacles (HSN 9004) @ 5%, Sunglasses admin-configurable. Historical tax snapshots are immutably preserved per invoice item.
- **Reason:** Accurately models optical store clinical practices where eye exams are offered free to drive eyewear dispensing, while complying with Indian GST requirements through a date-effective, category-driven tax engine.
- **Status:** Approved (DEC-016)

---

### DEC-017: Cash Register Variance Threshold & Manager Approval Workflow (BR-OPN-004)
- **Date:** 2026-09-22
- **Topic:** Cash Drawer Closing Reconciliation Threshold
- **Decision:** Cash drawer closing variance threshold is configurable per store/tenant with an initial default of ₹500. Variances within ₹500 permit standard session closure with an audit note. Variances exceeding ₹500 require mandatory manager approval and explanation, holding the session in `PENDING_APPROVAL` status until reviewed.
- **Reason:** Prevents operational gridlock at counter shifts for minor denomination rounding while ensuring robust managerial oversight over significant cash shortages or surpluses.
- **Status:** Approved (DEC-017)
