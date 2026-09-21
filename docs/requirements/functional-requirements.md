# Super Optical V2 — Functional Requirements Catalog

**Document Version:** 1.0.0  
**Phase:** Phase 1 — Product Definition & Business Requirements  
**Classification:** Canonical Functional Specifications  

---

## 1. Specification Format & Standard Fields

Every functional requirement in Super Optical V2 is structured with mandatory engineering fields:
- **ID:** Standardized unique identifier (`FR-[DOMAIN]-###`)
- **Description:** Concise statement of business functionality
- **Actor:** Primary persona triggering or using the function
- **Preconditions:** System state or prerequisites required prior to execution
- **Expected Behavior:** Step-by-step system response
- **Validation:** Input constraints, schema enforcement, business rules
- **Permission:** Security capability required (`rbac:permission_code`)
- **Data Affected:** Database entities and ledgers mutated
- **Acceptance Criteria:** Testable verification conditions
- **Priority:** `MUST_HAVE`, `SHOULD_HAVE`, `LATER`, `ENTERPRISE`
- **Implementation Phase:** Target build milestone (Phases 1 through 14)

---

## 2. Customer & Family Requirements

### FR-CUSTOMER-001: Walk-In Customer Registration
- **Description:** Register a new customer profile with contact information and optical communication preferences.
- **Actor:** Receptionist, Sales Associate, Cashier, Optometrist
- **Preconditions:** User authenticated in an active store session.
- **Expected Behavior:** System validates inputs, checks for duplicate mobile numbers, assigns a unique `customer_code`, commits record, and returns customer profile.
- **Validation:** 10-digit mobile number mandatory; valid phone format; full name minimum 2 characters.
- **Permission:** `customers:create`
- **Data Affected:** `customers`, `customer_addresses`, `customer_consents`
- **Acceptance Criteria:** Given a valid 10-digit phone number and name, when submitted, a new customer record is created and retrievable via search in $< 50\text{ ms}$.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 3

### FR-CUSTOMER-002: Customer Search & Lookup
- **Description:** Instantly locate an existing customer by phone number, name, or customer code.
- **Actor:** All Store Staff
- **Preconditions:** User authenticated.
- **Expected Behavior:** System performs indexed search across customer records and returns matching profiles with recent purchase summary.
- **Validation:** Search query minimum 3 characters or 3 digits.
- **Permission:** `customers:view`
- **Data Affected:** `customers` (Read-only)
- **Acceptance Criteria:** Searching a 10-digit phone number returns the exact profile within $100\text{ ms}$.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 3

### FR-CUSTOMER-003: Family Member Linking
- **Description:** Associate dependent family members (spouse, child, parent) under a primary customer account for unified billing.
- **Actor:** Receptionist, Sales Associate, Optometrist
- **Preconditions:** Primary customer profile exists.
- **Expected Behavior:** System adds a dependent family member profile referencing the primary customer ID while maintaining distinct medical records.
- **Validation:** Family member name and relationship type required.
- **Permission:** `customers:edit`
- **Data Affected:** `customer_family_members`
- **Acceptance Criteria:** Given a primary customer, multiple family members can be added and selected independently during clinical eye tests and POS checkout.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 3

---

## 3. Clinical & Prescription Requirements

### FR-CLINICAL-001: Record Optical Refraction Examination
- **Description:** Record subjective and objective vision refraction measurements for right (OD) and left (OS) eyes.
- **Actor:** Optometrist
- **Preconditions:** Customer or family member profile selected in clinical queue.
- **Expected Behavior:** Optometrist enters SPH, CYL, AXIS, ADD, PD, and visual acuity. System auto-calculates transposed values, checks diopter ranges, and saves examination.
- **Validation:** Diopter steps in $0.25\text{ D}$; Axis mandatory ($1^\circ - 180^\circ$) if Cylinder $\neq 0$; PD between $45 - 75\text{ mm}$.
- **Permission:** `clinical:examination_create`
- **Data Affected:** `eye_examinations`, `eye_examination_measurements`
- **Acceptance Criteria:** Refraction record saves successfully; cannot be saved if Cylinder is entered without an Axis.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 3

### FR-CLINICAL-002: Generate Signed Optical Prescription
- **Description:** Finalize and digitally sign an optical prescription card, making it available for POS dispensing.
- **Actor:** Optometrist
- **Preconditions:** Finalized eye examination exists.
- **Expected Behavior:** System locks examination record to read-only, generates unique `rx_number`, and renders digital prescription card with QR code.
- **Validation:** Finalization is irreversible; clinical data becomes immutable.
- **Permission:** `prescriptions:create`
- **Data Affected:** `prescriptions`, `prescription_items`, `audit_logs`
- **Acceptance Criteria:** Once finalized, attempting an update on the prescription values throws a validation error; prescription displays in POS cart.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 3

---

## 4. Product Catalog & Pricing Requirements

### FR-PRODUCT-001: Manage Product Master & Variants
- **Description:** Create and maintain optical products with decoupled color, size, and power variants.
- **Actor:** Inventory Manager, Tenant Admin
- **Preconditions:** Brand, category, and tax category configured.
- **Expected Behavior:** System saves product definition and generates distinct variant SKUs with barcodes and MRP.
- **Validation:** SKU and Barcode must be globally unique within tenant.
- **Permission:** `catalog:manage`
- **Data Affected:** `products`, `product_variants`, `product_barcodes`
- **Acceptance Criteria:** Creating a frame model with 3 colors and 2 sizes generates 6 distinct product variants with independent barcodes.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 4

### FR-PRICING-001: Deterministic Optical Pricing & Discounts
- **Description:** Calculate item prices, line discounts, promotional bundles, and order-level discounts.
- **Actor:** POS Checkout System, Cashier
- **Preconditions:** Items added to POS cart.
- **Expected Behavior:** Calculates subtotals, applies proportional order discount distribution, and extracts/adds tax using exact integer arithmetic.
- **Validation:** Final item price cannot drop below Minimum Selling Price (MSP) without supervisor authorization.
- **Permission:** `sales:create`, `sales:approve_discount` (for overrides)
- **Data Affected:** `sales`, `sale_items`, `sale_discounts`
- **Acceptance Criteria:** Rounding differences never exceed 1 paisa; discounted totals match line-item sum exactly.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 4

---

## 5. Inventory & Supply Chain Requirements

### FR-INVENTORY-001: Append-Only Stock Movement Logging
- **Description:** Record every physical stock addition, reduction, transfer, or audit adjustment in `inventory_movements`.
- **Actor:** System Engine, Inventory Manager, Store Manager
- **Preconditions:** Valid store and product variant context.
- **Expected Behavior:** Inserts immutable movement row, computes new balance after, and updates current `store_inventory` snapshot.
- **Validation:** Movement type must be an approved business code; reason text required for manual adjustments.
- **Permission:** `inventory:adjust_stock`
- **Data Affected:** `inventory_movements`, `store_inventory`
- **Acceptance Criteria:** No quantity change can occur in `store_inventory` without a corresponding `inventory_movements` record.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 5

### FR-INVENTORY-002: Inter-Store Stock Transfer Dispatch & Receipt
- **Description:** Transfer stock between store branches using a two-phase transit protocol.
- **Actor:** Store Manager, Inventory Manager
- **Preconditions:** Source store has sufficient available stock on hand.
- **Expected Behavior:** Source store dispatches items (`TRANSFER_OUT`); items enter `IN_TRANSIT`; receiving store scans items to confirm (`TRANSFER_IN`).
- **Validation:** Cannot dispatch reserved or zero-balance stock.
- **Permission:** `inventory:transfer_dispatch`, `inventory:transfer_receive`
- **Data Affected:** `stock_transfers`, `stock_transfer_items`, `inventory_movements`
- **Acceptance Criteria:** Stock immediately decrements at Store A upon dispatch and increments at Store B upon receipt acknowledgement.
- **Priority:** `SHOULD_HAVE`
- **Implementation Phase:** Phase 5

### FR-PROCUREMENT-001: Purchase Order & Goods Receipt Intake
- **Description:** Issue purchase orders to suppliers and receive incoming inventory with barcode tagging.
- **Actor:** Inventory Manager
- **Preconditions:** Active supplier registered.
- **Expected Behavior:** Generates PO; upon shipment arrival, staff verifies quantities, logs GRN, updates inventory, and prints barcode price stickers.
- **Validation:** Received quantities cannot exceed ordered quantities by $> 10\%$ without warning.
- **Permission:** `procurement:create_po`, `procurement:receive_goods`
- **Data Affected:** `purchase_orders`, `goods_receipts`, `store_inventory`, `inventory_movements`
- **Acceptance Criteria:** Confirming GRN increases `quantity_on_hand` and logs `PURCHASE_RECEIPT` movements.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 5

---

## 6. POS & Sales Order Requirements

### FR-POS-001: Optical Bundle Cart Assembly
- **Description:** Combine frame, prescription lenses, lens coatings, and clinical prescription into a single checkout item.
- **Actor:** Sales Staff, Cashier
- **Preconditions:** Customer selected; items in catalog.
- **Expected Behavior:** Bundles frame and lenses; links prescription diopter values; calculates bundled package price and taxes.
- **Validation:** Prescription required if prescription lenses selected; Frame stock validated.
- **Permission:** `sales:create`
- **Data Affected:** `sales`, `sale_items`, `sale_item_prescriptions`
- **Acceptance Criteria:** Cart accurately shows frame and lens details; reserves frame inventory upon order confirmation.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 6

### FR-POS-002: Hold and Resume Cart
- **Description:** Temporarily park an active cart session to serve another customer and resume later.
- **Actor:** Sales Staff, Cashier
- **Preconditions:** Active cart with at least one item.
- **Expected Behavior:** Serializes cart state to local storage; clears active counter screen; lists held carts with timestamp and customer name.
- **Validation:** Held carts expire after store closing.
- **Permission:** `sales:create`
- **Data Affected:** Client session cache
- **Acceptance Criteria:** Resuming a held cart restores all selected frames, lenses, and prescription attachments without data loss.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 6

### FR-SALES-001: Atomic Sales Confirmation
- **Description:** Commit customer order, line items, initial payment, inventory reservations, and lab job dispatch in a single database transaction.
- **Actor:** Cashier, Sales Associate
- **Preconditions:** POS cart valid; customer verified.
- **Expected Behavior:** Commits sale; generates sequential invoice number; reserves inventory; creates lab job; logs audit event. Rollback on any failure.
- **Validation:** Atomicity enforced; zero partial writes.
- **Permission:** `sales:create`
- **Data Affected:** `sales`, `sale_items`, `payments`, `payment_allocations`, `inventory_movements`, `lab_jobs`, `audit_logs`
- **Acceptance Criteria:** If payment gateway or inventory reservation fails, no order or payment record is persisted.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 6

### FR-SALES-002: Revision-Based Invoice Modification
- **Description:** Modify a confirmed order (e.g. frame swap or lens upgrade) by generating a versioned revision.
- **Actor:** Store Manager
- **Preconditions:** Sale in `CONFIRMED` or `PROCESSING` status.
- **Expected Behavior:** Freezes current state; creates `sale_revisions` record; adjusts inventory movements; recalculates balance; credits excess payment if applicable.
- **Validation:** Requires revision reason; manager approval mandatory.
- **Permission:** `sales:revise_invoice`
- **Data Affected:** `sale_revisions`, `sales`, `sale_items`, `inventory_movements`, `customer_credits`
- **Acceptance Criteria:** Total revision history is preserved; historical line items remain auditable.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 8

---

## 7. Payments & Financial Accounting Requirements

### FR-PAYMENT-001: Multi-Tender Split Payment Processing
- **Description:** Collect order payments across multiple payment methods (Cash, UPI, Card, Customer Credit) in a single checkout.
- **Actor:** Cashier
- **Preconditions:** Active order balance due $> 0$.
- **Expected Behavior:** Creates discrete immutable `payments` records for each tender; allocates amounts to sale; updates balance due.
- **Validation:** Sum of tenders must not exceed balance due unless excess is routed to customer credit.
- **Permission:** `payments:create`
- **Data Affected:** `payments`, `payment_allocations`, `cash_transactions`
- **Acceptance Criteria:** Splitting ₹5,000 into ₹2,000 Cash and ₹3,000 UPI creates two distinct payment records with correct tender attributes.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 7

### FR-PAYMENT-002: Customer Advance Deposit & Balance Settlement
- **Description:** Accept partial advance payments on custom spectacle orders and collect remaining balance upon delivery.
- **Actor:** Cashier
- **Preconditions:** Order total $> 0$.
- **Expected Behavior:** Logs advance payment; sets status `PARTIALLY_PAID`; prints receipt with balance due; upon pickup, collects balance and marks `PAID`.
- **Validation:** Advance amount must be $> 0$.
- **Permission:** `payments:create`
- **Data Affected:** `payments`, `payment_allocations`, `sales`
- **Acceptance Criteria:** Order remains in `PARTIALLY_PAID` until final balance payment equals total order amount.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 7

### FR-TAX-001: Configurable Indian GST Tax Calculation
- **Description:** Calculate CGST, SGST, or IGST based on store state and customer address according to date-effective HSN rate schedules.
- **Actor:** System Calculation Engine
- **Preconditions:** Store state and customer state resolved; product tax categories mapped.
- **Expected Behavior:** Applies 6% CGST + 6% SGST for intra-state sales; applies 12% IGST for inter-state sales; generates itemized tax summary.
- **Validation:** Tax rates must never be hard-coded; resolved dynamically from database schedules.
- **Permission:** Internal system calculation
- **Data Affected:** `sale_taxes`, `sale_items`
- **Acceptance Criteria:** Changing store location dynamically toggles between CGST/SGST split and IGST without code modification.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 8

---

## 8. Workshop & Delivery Requirements

### FR-LAB-001: Optical Lab Job Ticketing & QC Verification
- **Description:** Route custom prescription orders to workshop, track lens edging and fitting, and execute digital QC checklist.
- **Actor:** Optical Lab Technician, Dispensing Optician
- **Preconditions:** Sale confirmed with prescription spectacle item.
- **Expected Behavior:** Generates lab job ticket with OD/OS specs; tracks progress through edging and fitting; requires focimeter QC sign-off to enter `READY`.
- **Validation:** Cannot mark job `READY` without passing all mandatory QC checklist items.
- **Permission:** `lab:update_status`, `lab:qc_signoff`
- **Data Affected:** `lab_jobs`, `lab_status_history`, `quality_checks`
- **Acceptance Criteria:** Order status automatically transitions to `READY_FOR_PICKUP` upon successful QC completion.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 9

### FR-DELIVERY-001: Store Pickup Handover & Completion
- **Description:** Verify optical fit on customer face, collect outstanding balance, and sign off physical delivery.
- **Actor:** Dispensing Optician, Sales Staff, Cashier
- **Preconditions:** Order is `READY_FOR_PICKUP`.
- **Expected Behavior:** Verifies customer fit; cashier settles remaining balance; staff confirms handover; order transitions to `DELIVERED`.
- **Validation:** Cannot complete delivery if balance due $> 0$ without explicit store credit approval.
- **Permission:** `sales:settle`, `delivery:confirm`
- **Data Affected:** `sales`, `delivery_orders`, `audit_logs`
- **Acceptance Criteria:** Order marks `DELIVERED`; sends tax invoice link to customer via WhatsApp/SMS.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 9

---

## 9. Cash Management, Reporting & System Requirements

### FR-CASH-001: Daily Register Session & Denomination Close
- **Description:** Open cash drawer with opening float and close with physical denomination count and variance reconciliation.
- **Actor:** Cashier, Store Manager
- **Preconditions:** Store register configured.
- **Expected Behavior:** Opens session; tracks cash transactions; at close, prompts for count of ₹500, ₹200, ₹100, etc. notes; computes variance; flags discrepancies.
- **Validation:** Physical cash count required; variance requires reason text and manager approval.
- **Permission:** `cash:open_session`, `cash:close_session`, `cash:approve_variance`
- **Data Affected:** `cash_sessions`, `cash_transactions`
- **Acceptance Criteria:** Difference between expected cash and counted cash calculates accurately; variance $> ₹100$ alerts manager.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 7

### FR-REPORT-001: Statutory GST & Daily Sales Reports
- **Description:** Generate daily sales reconciliation and monthly GSTR-1 outward tax supply reports.
- **Actor:** Store Manager, Accountant, Owner
- **Preconditions:** Sales and payments recorded.
- **Expected Behavior:** Exports sales summaries by store/tender, HSN-wise tax breakdowns, and B2B/B2C lists matching GST portal schemas.
- **Validation:** Financial totals must reconcile exactly with transaction ledgers.
- **Permission:** `reports:view_sales`, `reports:view_financial`
- **Data Affected:** Analytical views (Read-only)
- **Acceptance Criteria:** Sum of reported daily sales matches sum of payments and accounts receivable ledgers.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 10

### FR-RBAC-001: Store-Level Access Enforcement
- **Description:** Restrict user actions to their assigned store branch unless granted multi-store roaming access.
- **Actor:** System Security Guard
- **Preconditions:** User authenticated with JWT.
- **Expected Behavior:** Backend guard extracts user store assignments and rejects requests targeting unassigned store IDs with `403 Forbidden`.
- **Validation:** Store context verified against database permissions on every protected request.
- **Permission:** Internal system guard
- **Data Affected:** None (Access gate)
- **Acceptance Criteria:** Cashier assigned to Store A cannot open register or process sale for Store B.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 2

### FR-OFFLINE-001: Idempotent Offline POS Checkout & Sync
- **Description:** Allow retail checkout and thermal receipt printing while offline, synchronizing transactionally upon reconnection.
- **Actor:** Cashier, Sync Engine
- **Preconditions:** Local catalog cached in IndexedDB.
- **Expected Behavior:** Saves sale locally; assigns UUIDv7 command ID; prints thermal receipt; sync worker submits batch upon reconnect; server executes idempotently.
- **Validation:** Duplicate command IDs return original cached response without re-executing stock or payment side effects.
- **Permission:** `sales:create`
- **Data Affected:** Client `sync_queue`, Server `sync_commands`, `sales`, `payments`
- **Acceptance Criteria:** Simulating network disconnection during 3 offline sales, followed by reconnection, commits all 3 sales with zero duplicates.
- **Priority:** `SHOULD_HAVE`
- **Implementation Phase:** Phase 11

### FR-HARDWARE-001: Direct Silent Thermal Receipt Printing
- **Description:** Print customer thermal slips directly to USB/network ESC/POS printers without displaying browser print dialogs.
- **Actor:** Cashier, Sales Associate
- **Preconditions:** Supported thermal printer configured in Tauri desktop client.
- **Expected Behavior:** Dispatches raw ESC/POS bytes to OS print spooler in $< 500\text{ ms}$ upon payment confirmation.
- **Validation:** Printer status checked prior to dispatch; paper-out errors surfaced gracefully.
- **Permission:** `invoices:print`
- **Data Affected:** Hardware adapter spooler
- **Acceptance Criteria:** Clicking 'Settle & Print' produces physical receipt on thermal printer without user print prompt.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 12

### FR-AUDIT-001: Immutable Audit Trail Logging
- **Description:** Capture write-once audit log entries for all security, clinical, financial, and inventory state changes.
- **Actor:** System Audit Interceptor
- **Preconditions:** Any mutating operation executed.
- **Expected Behavior:** Emits audit row with user ID, store ID, device ID, IP address, action code, and before/after state snapshots.
- **Validation:** Database trigger prevents `UPDATE` and `DELETE` on audit table.
- **Permission:** System-wide automatic capture
- **Data Affected:** `audit_logs`
- **Acceptance Criteria:** Modifying an invoice revision logs complete previous and new state JSON in audit table.
- **Priority:** `MUST_HAVE`
- **Implementation Phase:** Phase 2

### FR-MIGRATION-001: Staged Legacy System Data Import
- **Description:** Extract, normalize, and validate legacy Super Optical customer, catalog, and invoice history into V2.
- **Actor:** Database Administrator, Lead Architect
- **Preconditions:** Legacy database dump extracted into staging schema.
- **Expected Behavior:** Unpacks JSON snapshots, deduplicates phone numbers, normalizes relational entities, reconciles financial balances, and imports with legacy audit tags.
- **Validation:** Historical sales + payments must reconcile within 1-rupee rounding tolerance.
- **Permission:** Platform Super-Admin
- **Data Affected:** Production tables (tagged with `is_legacy_migrated: true`)
- **Acceptance Criteria:** Dry-run migration validates 100% of historical customers and reconciles total revenue without schema errors.
- **Priority:** `SHOULD_HAVE`
- **Implementation Phase:** Phase 14
