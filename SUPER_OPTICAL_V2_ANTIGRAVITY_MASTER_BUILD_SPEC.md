# Super Optical V2 — AI Build Master Specification
## Google Antigravity Implementation Guide

**Document status:** Master Build Specification  
**Target:** Production-ready Super Optical Business Operating System  
**Primary execution environment:** Google Antigravity  
**Clients:** Web/PWA + Windows Desktop + Android/iOS  
**Architecture principle:** Single codebase + shared domain + platform adapters  
**Build strategy:** Documentation-first, phase-gated, AI-assisted implementation

---

# 1. Mission

Build Super Optical V2 from the approved V2 architecture as a complete optical retail/clinical business operating system.

The system must be designed once and delivered through:

- Web/PWA
- Windows Desktop
- Android
- iOS

The application must support:

- Multi-tenant SaaS
- Multiple stores per tenant
- Role-based access control
- Customer and family management
- Eye examination and prescriptions
- Product catalog
- Multi-store inventory
- Procurement
- POS
- Payments
- Refunds
- Customer credit/debit
- Invoice revisions and controlled editing
- Optical lab/workshop workflow
- Delivery
- GST/tax configuration
- Cash register/day closing
- Reports
- Notifications
- Audit trail
- Offline-first operation
- Synchronization
- Hardware integration
- SaaS administration

The original application must not be copied architecturally. Its known weaknesses must be eliminated.

---

# 2. Non-Negotiable Engineering Rules

Antigravity must follow these rules throughout the project.

## 2.1 Never create a second source of truth

Financial, inventory, order, payment and invoice state must have one authoritative server-side domain model.

IndexedDB is a local working database/cache and offline command store, not an alternative accounting system.

## 2.2 Never use localStorage as the application database

Do not store:

- sales
- payments
- inventory
- customers
- prescriptions
- invoices

as application records in localStorage.

localStorage may only be used for trivial UI preferences where appropriate.

## 2.3 Never create a giant storage/service file

No monolithic file such as:

- storage.js
- api.js
- utils.js

containing unrelated business logic.

Domain logic must remain modular.

## 2.4 Never put financial history inside JSON blobs

Do not use:

- invoice_snapshot
- notes
- JSON strings

as substitutes for relational entities.

Use normalized tables/entities.

## 2.5 Financial records are append-only

Do not silently overwrite:

- payments
- refunds
- credits
- debits
- waivers
- financial adjustments

Use explicit transactions and ledger records.

## 2.6 Inventory is ledger-driven

Inventory changes must create immutable movement records.

Never silently change stock without a corresponding business event.

## 2.7 Invoice editing is revision-based

Do not destroy historical invoice state.

An invoice may have revisions.

After certain lifecycle states, use controlled mechanisms such as:

- revision
- return
- refund
- credit note
- debit note
- replacement
- cancellation

according to the business rule.

## 2.8 Frontend is never the final authority for security

Never trust tenant_id, store_id, role or permissions supplied by the browser.

Authorization must be enforced server-side.

## 2.9 Offline financial actions must be command-based

Do not resolve financial conflicts with simple last-write-wins or server timestamp precedence.

Use:

- command ID
- device ID
- idempotency
- validation
- transactional execution
- explicit conflict handling

## 2.10 Tax rules must be configurable

Never hard-code one GST rate into business logic.

Tax must be represented by tax categories/rules with effective dates and product mappings.

## 2.11 Do not build everything at once

Every phase must:

1. Define
2. Implement
3. Test
4. Verify
5. Document
6. Pass acceptance criteria
7. Commit/tag the working state
8. Only then start the next phase

---

# 3. Product Architecture

## 3.1 Client architecture

Use one shared React/TypeScript application/domain.

Platform adapters:

```text
                    SHARED APPLICATION
                           |
             +-------------+-------------+
             |             |             |
            WEB         DESKTOP        MOBILE
            PWA          TAURI       CAPACITOR
```

The business rules must not be duplicated for each platform.

## 3.2 Recommended technology direction

Frontend:

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Tailwind CSS / shared design system

Backend:

- NestJS
- TypeScript
- PostgreSQL
- Redis where required
- Object storage
- Authentication provider
- REST API or clearly documented API contract

Local/offline:

- IndexedDB
- Dexie
- Offline command queue
- Sync engine

Desktop:

- Tauri

Mobile:

- Capacitor

Testing:

- Vitest
- Playwright
- API/integration tests
- Offline/sync test suite

---

# 4. Domain Modules

The final application is divided into these domains.

```text
01 Platform / SaaS
02 Authentication
03 Organization
04 Users / Roles / Permissions
05 Stores
06 Customers
07 Family
08 Clinical / Eye Test
09 Prescription
10 Product Catalog
11 Pricing
12 Tax
13 Inventory
14 Procurement
15 Suppliers
16 POS
17 Sales
18 Payments
19 Refunds
20 Customer Credit/Debit
21 Invoice Lifecycle
22 Optical Lab / Workshop
23 Delivery
24 Cash Register
25 Expenses
26 Notifications
27 Reports
28 Audit
29 Offline / Sync
30 Hardware
31 Platform Administration
```

---

# 5. Core Entity Model

The initial domain model should include at minimum:

## SaaS

```text
tenants
tenant_settings
subscription_plans
tenant_subscriptions
tenant_features
```

## Organization

```text
stores
departments
users
tenant_users
roles
permissions
role_permissions
user_store_access
devices
```

## Customer

```text
customers
customer_addresses
customer_family_members
customer_notes
customer_tags
customer_consents
```

## Clinical

```text
eye_examinations
eye_examination_measurements
prescriptions
prescription_items
clinical_notes
```

## Product

```text
brands
categories
products
product_variants
product_attributes
product_prices
product_tax_mapping
barcodes
```

## Inventory

```text
store_inventory
inventory_lots
inventory_movements
stock_adjustments
stock_transfers
stock_transfer_items
stock_counts
stock_count_items
```

## Procurement

```text
suppliers
purchase_orders
purchase_order_items
goods_receipts
goods_receipt_items
purchase_invoices
purchase_invoice_items
supplier_payments
purchase_returns
```

## Sales

```text
sales
sale_revisions
sale_items
sale_item_prescriptions
sale_discounts
sale_taxes
```

## Finance

```text
payments
payment_allocations
refunds
refund_items
customer_credits
customer_debits
credit_notes
debit_notes
waivers
cash_registers
cash_sessions
cash_transactions
expenses
expense_categories
```

## Workshop

```text
lab_jobs
lab_job_items
lab_status_history
lens_orders
lens_order_items
fitting_jobs
quality_checks
```

## Delivery

```text
delivery_orders
delivery_events
customer_notifications
```

## System

```text
audit_logs
attachments
notifications
sync_commands
sync_conflicts
device_registrations
```

---

# 6. Critical Business Rules

## 6.1 Tenant isolation

Every tenant-owned entity must be tenant-scoped.

A user from Tenant A must never be able to access Tenant B data.

Store access must also be enforced.

## 6.2 Store isolation

A tenant may own multiple stores.

Users may be:

- tenant-wide
- assigned to one store
- assigned to multiple stores

Permissions must account for both tenant and store scope.

## 6.3 Product vs stock

Do not combine product definition and store stock.

Correct model:

```text
Product
  |
Variant
  |
Store Inventory
```

Example:

```text
Ray-Ban RB123
  |
Black / 52
  |
Begusarai = 4
Ballia = 2
```

## 6.4 Inventory calculation

Inventory must be explainable through movements.

Examples:

```text
PURCHASE_RECEIPT
SALE_DEDUCTION
SALE_REVERSAL
RETURN
TRANSFER_IN
TRANSFER_OUT
DAMAGE
STOCK_ADJUSTMENT
```

## 6.5 Payment rule

A payment is a transaction, not a mutable invoice field.

Invoice totals may be recalculated from authoritative business records.

## 6.6 Excess payment

If an invoice is revised below the amount already paid:

```text
original total = 5000
paid = 3000
new total = 2500
excess = 500
```

The system must create/maintain a customer credit or refund workflow.

Do not silently lose the excess.

## 6.7 Invoice lifecycle

Suggested lifecycle:

```text
DRAFT
CONFIRMED
PARTIALLY_PAID
PAID
PROCESSING
READY
DELIVERED
```

Exceptional states:

```text
CANCELLED
REFUND_PENDING
REFUNDED
```

The exact transition matrix must be documented before implementation.

## 6.8 Invoice revision

Every revision must capture:

- revision number
- reason
- user
- timestamp
- previous state
- new state
- affected items
- financial impact
- inventory impact
- approval if required

## 6.9 Payment cannot be edited

If a payment was entered incorrectly:

Do not mutate the old payment.

Create an appropriate reversal/refund/correction transaction.

## 6.10 Inventory cannot be edited silently

If stock is wrong:

Use:

- stock adjustment
- purchase receipt
- return
- transfer
- damage
- correction transaction

with audit trail.

---

# 7. Optical Workflow

The core optical workflow must be:

```text
Customer
   |
Eye Test
   |
Prescription
   |
Frame Selection
   |
Lens Selection
   |
Pricing
   |
Advance Payment
   |
Order Confirmation
   |
Lab Job
   |
Lens Processing
   |
Fitting
   |
Quality Check
   |
READY
   |
Customer Notification
   |
Delivery
   |
Final Payment
```

The system must allow an order to move through this workflow without duplicating customer or prescription information.

---

# 8. POS Architecture

The POS must support:

- single item
- multi-item cart
- multiple family members
- frame
- lens
- frame + lens
- own frame
- sunglasses
- contact lens
- accessories
- services

Payment support:

- cash
- UPI
- card
- bank transfer
- credit
- split payments

Example:

```text
Total = ₹4,500

Cash = ₹2,000
UPI = ₹1,500
Credit = ₹1,000
```

The transaction must be atomic.

---

# 9. Invoice Transaction Engine

All critical operations must be implemented as explicit transactional application commands.

## Create sale

```text
Validate user
Validate tenant/store
Validate customer
Validate items
Validate inventory
Calculate prices
Calculate discounts
Calculate taxes
Create sale
Create sale items
Create payment records
Create inventory movements
Create lab job if required
Create audit event
Commit
```

If any required step fails, the transaction must not leave partial business state.

## Edit sale

```text
Authorize
Lock current sale
Load current revision
Validate new state
Calculate differences
Apply inventory adjustments
Create new revision
Calculate financial impact
Handle excess payment if applicable
Create audit event
Commit
```

Do not implement invoice edit as blind delete-and-recreate.

---

# 10. Offline Architecture

Offline architecture:

```text
UI
 |
Domain/Application Store
 |
Repository
 |
IndexedDB
 |
Command Queue
 |
Sync Engine
 |
API
 |
PostgreSQL
```

Each offline mutation gets:

```text
command_id
device_id
tenant_id
store_id
user_id
command_type
aggregate_id
payload
created_at
status
retry_count
```

## Sync rules

1. Commands are idempotent.
2. Server verifies authorization.
3. Server validates current aggregate version.
4. Server executes a transaction.
5. Server records command result.
6. Duplicate command returns the original result.
7. Business conflicts become explicit sync conflicts.
8. Financial/inventory conflicts must not be silently overwritten.

---

# 11. Desktop Architecture

Windows desktop must use the shared web application packaged through Tauri.

Desktop-specific adapters:

```text
Printing
USB devices
Barcode scanners
Bluetooth
Local filesystem where justified
Native notifications
```

The business domain must remain platform-independent.

---

# 12. Mobile Architecture

Capacitor wrapper around the shared application.

Mobile capabilities:

```text
Camera barcode scanning
Bluetooth printing where supported
Push notifications
Secure storage
Offline database
Native navigation integration
```

The mobile UI must be touch-first rather than simply shrinking the desktop layout.

---

# 13. Responsive UX

## Desktop

```text
Sidebar
Main workspace
Optional right cart/context panel
Keyboard shortcuts
Dense tables
```

## Tablet

```text
Top navigation
Two-column workspace
Large touch targets
```

## Mobile

```text
Bottom navigation
Cards
Bottom sheets
Full-screen forms
Large touch controls
```

The same domain components should be reused wherever possible.

---

# 14. Hardware Strategy

Support through adapters.

```text
Barcode Scanner Adapter
Thermal Printer Adapter
A4 Printer Adapter
Bluetooth Printer Adapter
Camera Adapter
```

Never put hardware-specific code directly inside POS business logic.

---

# 15. Reporting

Reports must include:

## Sales

- daily sales
- monthly sales
- store sales
- staff sales
- product sales
- category sales
- discount report
- refund report
- credit sales
- outstanding

## Inventory

- current stock
- low stock
- stock valuation
- fast-moving products
- slow-moving products
- stock adjustments
- transfers
- damage

## Customer

- new customers
- repeat customers
- purchase history
- outstanding
- prescription history

## Financial

- cash
- UPI
- card
- credit
- refunds
- expenses
- tax
- day closing

---

# 16. Cash Register

Required workflow:

```text
Open Register
   |
Opening Balance
   |
Sales
   |
Refunds
   |
Expenses
   |
Cash In/Out
   |
Close Register
   |
Expected Cash
   |
Actual Cash
   |
Difference
   |
Manager Approval
```

---

# 17. Procurement

Required workflow:

```text
Supplier
 |
Purchase Order
 |
Goods Receipt
 |
Stock Increase
 |
Purchase Invoice
 |
Supplier Payable
 |
Supplier Payment
```

Include purchase returns.

---

# 18. Notification System

Events:

- order created
- payment received
- order ready
- payment due
- delivery reminder
- prescription ready

Channels:

- in-app
- WhatsApp
- SMS
- email

Messaging providers must be abstracted behind a notification service.

---

# 19. Security

Every protected request must evaluate:

```text
Authentication
+
Tenant
+
Store
+
Role
+
Permission
+
Resource ownership
```

Add:

- rate limiting
- validation
- secure headers
- audit logging
- secret management
- backup
- restore procedure
- session management
- device management

---

# 20. Project Repository

Use a monorepo:

```text
super-optical/
|
├── apps/
│   ├── web/
│   ├── desktop/
│   └── mobile/
|
├── packages/
│   ├── ui/
│   ├── types/
│   ├── validation/
│   ├── calculations/
│   ├── optical/
│   ├── tax/
│   ├── sync/
│   └── printing/
|
├── backend/
│   └── api/
|
├── database/
│   ├── migrations/
│   └── seeds/
|
├── docs/
│   ├── requirements/
│   ├── architecture/
│   ├── domain/
│   ├── api/
│   ├── workflows/
│   ├── database/
│   └── testing/
|
└── tests/
    ├── unit/
    ├── integration/
    ├── e2e/
    └── offline/
```

---

# 21. Antigravity Documentation Contract

Before writing production code, Antigravity must maintain:

```text
docs/
├── 00-project-charter.md
├── 01-product-requirements.md
├── 02-domain-model.md
├── 03-architecture.md
├── 04-database-design.md
├── 05-api-contract.md
├── 06-security-model.md
├── 07-rbac-permissions.md
├── 08-workflows.md
├── 09-invoice-lifecycle.md
├── 10-inventory-rules.md
├── 11-payment-rules.md
├── 12-offline-sync.md
├── 13-printing-hardware.md
├── 14-notifications.md
├── 15-reporting.md
├── 16-testing-strategy.md
├── 17-deployment.md
├── 18-migration-plan.md
├── 19-decision-log.md
├── 20-assumptions-register.md
└── 21-progress-tracker.md
```

These documents are part of the system and must be updated as architecture changes.

---

# 22. Decision Log

Every significant architecture decision must be recorded.

Format:

```text
Decision ID:
Date:
Decision:
Reason:
Alternatives:
Chosen option:
Impact:
Status:
```

Never silently change architecture.

---

# 23. Assumptions Register

Any requirement that is unclear must go into:

```text
docs/20-assumptions-register.md
```

Format:

```text
ASSUMPTION-001

Question:
Assumption:
Impact:
Status:
Owner:
```

Antigravity must not invent critical business requirements.

---

# 24. API Contract

Every backend module must define:

- endpoint
- request
- response
- validation
- authorization
- error cases
- transaction behavior

Example:

```text
POST /sales
POST /sales/:id/payments
POST /sales/:id/revise
POST /sales/:id/refund
GET  /sales/:id
GET  /customers
POST /customers
POST /eye-tests
POST /inventory/transfers
POST /purchases
```

The final API naming must be consistent across the application.

---

# 25. Coding Standards for Antigravity

Before modifying an existing module:

1. Read the relevant architecture document.
2. Search the repository.
3. Identify dependencies.
4. Identify affected database entities.
5. Identify affected APIs.
6. Identify affected tests.
7. Make the smallest coherent change.
8. Run tests.
9. Run lint/type checking.
10. Update documentation.
11. Report exactly what changed.

Do not rewrite unrelated files.

Do not introduce a dependency without recording why it is needed.

---

# 26. AI Agent Working Rules

Antigravity must act as a senior engineering team.

For each task:

```text
ANALYZE
   ↓
PLAN
   ↓
IMPLEMENT
   ↓
TEST
   ↓
VERIFY
   ↓
DOCUMENT
   ↓
REPORT
```

Before coding, the agent must state:

- objective
- affected modules
- affected files
- database impact
- API impact
- risk
- test plan

After coding, it must state:

- files changed
- database changes
- APIs changed
- tests executed
- test result
- remaining risks

---

# 27. Phase-Gated Build Plan

## Phase 0 — Project Governance

Deliver:

- project charter
- requirements
- domain model
- architecture
- decision log
- assumptions
- development standards

Acceptance:

No unresolved architecture ambiguity for Phase 1.

---

## Phase 1 — Engineering Foundation

Build:

- monorepo
- frontend
- backend
- database
- authentication
- configuration
- logging
- error handling
- CI/test foundation

Acceptance:

A user can authenticate and reach a protected application.

---

## Phase 2 — Tenant / Store / RBAC

Build:

- tenants
- stores
- users
- roles
- permissions
- device registration
- tenant/store authorization

Acceptance:

Tenant A cannot access Tenant B.

Store A cannot access Store B without permission.

---

## Phase 3 — Customer + Family + Clinical

Build:

- customer
- family
- eye examination
- prescription
- history

Acceptance:

A prescription can be created and linked to a customer/family member.

---

## Phase 4 — Product Catalog

Build:

- brands
- categories
- products
- variants
- pricing
- barcodes
- tax mapping

Acceptance:

A product variant can be created and assigned to stores.

---

## Phase 5 — Inventory + Procurement

Build:

- stock
- movements
- purchase
- suppliers
- transfer
- adjustment
- stock count

Acceptance:

Every stock change has an explainable movement.

---

## Phase 6 — POS

Build:

- customer selection
- cart
- optical configuration
- prescription
- pricing
- discount
- tax
- checkout

Acceptance:

A complete sale can be created atomically.

---

## Phase 7 — Payments + Finance

Build:

- payments
- split payment
- refunds
- credits
- debits
- waivers
- cash register
- day closing

Acceptance:

Every monetary change is traceable.

---

## Phase 8 — Invoice Lifecycle

Build:

- invoice
- revisions
- controlled editing
- returns
- refunds
- credit/debit notes
- approvals
- audit

Acceptance:

Complex invoice-edit test matrix passes without inventory or financial drift.

---

## Phase 9 — Optical Lab

Build:

- lab job
- lens order
- fitting
- QC
- ready
- delivery

Acceptance:

A complete optical order can move from prescription to delivery.

---

## Phase 10 — Reports

Build:

- dashboard
- sales reports
- inventory reports
- financial reports
- GST/tax reports
- customer reports

Acceptance:

Reports reconcile with transaction data.

---

## Phase 11 — Offline / Sync

Build:

- IndexedDB
- repositories
- command queue
- sync worker
- idempotency
- conflict handling
- sync status

Acceptance:

Create/edit permitted transactions offline, reconnect, and verify exact server reconciliation.

---

## Phase 12 — Hardware

Build:

- barcode scanning
- thermal printing
- A4 printing
- camera
- Bluetooth/USB adapters

Acceptance:

Hardware works through platform adapters without modifying business logic.

---

## Phase 13 — SaaS

Build:

- plans
- subscriptions
- tenant provisioning
- feature flags
- quotas
- platform administration

Acceptance:

A new tenant can be provisioned without code changes.

---

## Phase 14 — Production

Build/verify:

- security
- backups
- monitoring
- performance
- migration
- load testing
- E2E
- UAT
- Windows build
- Android build
- iOS build
- PWA deployment

Acceptance:

All release gates pass.

---

# 28. Testing Requirements

Every business-critical module must have:

## Unit tests

For:

- pricing
- tax
- discounts
- prescription calculations
- inventory calculations
- payment calculations

## Integration tests

For:

- sale
- payment
- refund
- stock transfer
- purchase
- invoice revision
- day close

## E2E tests

For:

```text
Login
Customer
Eye Test
Prescription
POS
Payment
Print
Lab
Delivery
```

## Offline tests

For:

```text
Offline sale
Offline edit
Reconnect
Duplicate command
Conflict
Retry
Partial failure
```

---

# 29. Mandatory Invoice Test Matrix

Before Phase 8 is considered complete:

```text
1. Create one-item invoice
2. Create multi-item invoice
3. Add item
4. Remove item
5. Change quantity
6. Change frame
7. Change lens
8. Change prescription only
9. Change discount
10. Increase price after payment
11. Reduce price below payment
12. Partial refund
13. Full refund
14. Split payment
15. Family-member multi-item order
16. Offline edit
17. Duplicate sync command
18. Concurrent modification
19. Cancelled invoice
20. Delivered invoice correction
```

No financial/inventory drift is acceptable.

---

# 30. Migration Strategy

Do not directly migrate the old production database into the new database.

Use:

```text
Legacy
  ↓
Extraction
  ↓
Staging
  ↓
Normalization
  ↓
Validation
  ↓
Reconciliation
  ↓
Production import
```

Historical data must be checked before cutover.

The old blueprint specifically identifies normalization needs for old invoice snapshots, duplicate customer phones and payment history. Those concepts should remain part of the migration plan.

---

# 31. Development Environment

Maintain separate environments:

```text
local
development
staging
production
```

Never develop directly against production data.

Use seeded demo data for Antigravity development.

---

# 32. Seed Data

Create realistic seed data:

```text
Tenant:
Super Optical Demo

Stores:
Begusarai
Ballia

Users:
Owner
Manager
Optometrist
Cashier
Lab Staff

Products:
Frames
Lenses
Sunglasses
Contact lenses
Accessories

Customers:
Multiple customers
Families
Prescriptions

Orders:
Draft
Processing
Lab
Ready
Delivered
```

This allows Antigravity to test real workflows.

---

# 33. Environment Variables

Never commit secrets.

Use:

```text
DATABASE_URL
AUTH_SECRET
STORAGE_URL
STORAGE_KEY
REDIS_URL
WHATSAPP_CONFIG
EMAIL_CONFIG
SMS_CONFIG
```

with separate environment values per deployment.

---

# 34. Release Gates

No phase is complete until:

```text
[ ] Feature works
[ ] Database migration works
[ ] API works
[ ] Authorization tested
[ ] Error states handled
[ ] Unit tests pass
[ ] Integration tests pass
[ ] Relevant E2E tests pass
[ ] Type checking passes
[ ] Lint passes
[ ] Documentation updated
[ ] Decision log updated
[ ] No known critical bug
```

---

# 35. Antigravity Prompt Execution Strategy

Do NOT give Antigravity one enormous "build the whole application" prompt.

Use sequential controlled prompts.

Each prompt should reference:

```text
MASTER_BUILD_SPEC.md
```

and the current phase.

Example:

```text
You are working on Super Optical V2.

Read:
- MASTER_BUILD_SPEC.md
- docs/03-architecture.md
- docs/04-database-design.md
- docs/19-decision-log.md
- docs/20-assumptions-register.md
- docs/21-progress-tracker.md

Current phase:
Phase 1 — Engineering Foundation

Task:
Implement only the approved Phase 1 scope.

Rules:
- Do not implement future phases.
- Do not invent requirements.
- Do not modify unrelated modules.
- Follow the architecture.
- Write tests.
- Update documentation.
- Run typecheck/lint/tests.
- Report all changes and remaining issues.
```

---

# 36. Progress Tracker

Maintain:

```text
Phase
Feature
Status
Owner/Agent
Started
Completed
Tests
Known Issues
Decision IDs
```

Statuses:

```text
NOT_STARTED
IN_PROGRESS
BLOCKED
TESTING
DONE
REJECTED
```

Never mark a feature DONE merely because code exists.

DONE means acceptance criteria pass.

---

# 37. Bug Handling

Every bug must become a tracked item.

Format:

```text
BUG-001

Title:
Severity:
Module:
Steps:
Expected:
Actual:
Root cause:
Fix:
Regression test:
Status:
```

For every production bug, add a regression test where practical.

---

# 38. Definition of Production Ready

The application is production-ready only when:

- tenant isolation is verified
- permissions are verified
- financial transactions reconcile
- inventory reconciles
- invoice revisions reconcile
- offline sync is verified
- backups are verified
- restore is tested
- printing is verified
- mobile build is verified
- desktop build is verified
- PWA works
- E2E suite passes
- migration is verified
- UAT is signed off

---

# 39. Final Product Goal

The finished application should behave as:

```text
                SUPER OPTICAL
                     |
        +------------+------------+
        |            |            |
       RETAIL     CLINICAL     WORKSHOP
        |            |            |
       POS        Eye Test       Lab
       Stock      Rx             Fitting
       Purchase   History        QC
       Payment
        |            |            |
        +------------+------------+
                     |
                 CUSTOMER
                     |
              DELIVERY / CRM
                     |
                 REPORTING
                     |
                  FINANCE
```

All domains operate on the same tenant/store/security foundation.

---

# 40. Final Instruction to Antigravity

Build Super Optical V2 as a production-grade system, not as a prototype.

The objective is not to reproduce the old application's code.

The objective is to preserve required business capabilities while rebuilding the architecture correctly.

Always prefer:

```text
Explicit domain model
+
Transactional business logic
+
Normalized data
+
Immutable financial history
+
Ledger-driven inventory
+
Revision-based invoices
+
Strong authorization
+
Offline command synchronization
+
Shared cross-platform domain
+
Automated tests
```

over quick hacks.

Never silently invent a business rule.

Never silently weaken security.

Never silently overwrite financial history.

Never mark incomplete functionality as complete.

Work phase-by-phase and keep the repository, documentation, tests, database migrations and progress tracker synchronized.

# END OF MASTER BUILD SPECIFICATION
