# Super Optical V2 — Optical Business Personas Matrix

**Document Version:** 1.0.0  
**Phase:** Phase 1 — Product Definition & Business Requirements  
**Target:** Optical Retail, Clinical, and Workshop Personas (Zero Hospital Personas)  

---

## 1. Persona Directory Overview

This matrix defines the 13 optical retail and business personas interacting with Super Optical V2:

| # | Persona | Role Category | Primary Focus |
|:---:|:---|:---|:---|
| **P-01** | **Owner / Managing Director** | Executive & Business Strategy | Profitability, multi-store growth, revenue, shrinkage prevention. |
| **P-02** | **Store Manager** | Store Operations & Supervision | Daily sales targets, cash drawer sign-off, invoice discount approvals, staff shifts. |
| **P-03** | **Sales Associate / Stylist** | Frontline Retail & Dispensing | Frame recommendation, lens upgrades (anti-glare, progressive), cart building. |
| **P-04** | **Receptionist / Front Desk** | Customer Intake & Triage | Customer greeting, phone lookup, family linking, optical queue management. |
| **P-05** | **Optometrist** | Clinical Refraction & Eye Health | Visual acuity testing, subjective refraction (OD/OS), prescription issuance. |
| **P-06** | **Dispensing Optician** | Technical Fitting & Measurements | Pupillary distance (PD), segment height, pantoscopic tilt, frame adjustment. |
| **P-07** | **Inventory Manager** | Supply Chain & Stock Control | Stock procurement, purchase orders, physical audits, inter-store transfers. |
| **P-08** | **Cashier** | Payment Processing & Checkout | Fast payment collection (Cash/UPI/Card), split payments, cash drawer balancing. |
| **P-09** | **Optical Lab Technician** | Lens Processing & Workshop | Lens edging, frame fitting, groove cut, QC verification, remake logging. |
| **P-10** | **Accountant / Bookkeeper** | Financial Reconciliation & Tax | GST returns (GSTR-1, GSTR-3B), ledger reconciliation, supplier payables, P&L. |
| **P-11** | **Tenant Administrator** | Business IT Administration | Adding stores, onboarding staff, configuring role permissions, notification templates. |
| **P-12** | **Platform Administrator** | Super-Admin / SaaS Operations | Provisioning tenants, monitoring uptime, database tenant health, subscription licensing. |
| **P-13** | **Customer / Eyewear Buyer** | End-User & Patient | Buying frames/lenses, receiving ready alerts on WhatsApp, tracking prescription history. |

---

## 2. Detailed Persona Profiles

### P-01: Owner / Managing Director
- **Responsibilities:** Overall business profitability, multi-store expansion, supplier negotiations, regulatory compliance.
- **Goals:** View consolidated revenue across all branches in real-time; eliminate inventory shrinkage; monitor top-selling brands.
- **Daily Tasks:** Checks executive dashboard morning and evening; reviews store revenue vs targets; reviews gross profit margins.
- **Permissions:** Full tenant-wide administrative access (`tenant:all`).
- **Common Problems:** Inability to trust reported cash balances; delayed sales reports from branch stores; unexplainable inventory losses.
- **Required Information:** Consolidated P&L, sales by store, stock valuation, outstanding customer balances.

---

### P-02: Store Manager
- **Responsibilities:** In-store operational smooth running, staff attendance, customer escalation resolution, discount approvals.
- **Goals:** Hit monthly store sales quota; ensure zero cash register discrepancies; ensure lab jobs are delivered on time.
- **Daily Tasks:** Opens store cash session; approves customer discount overrides on POS; conducts evening drawer close; inspects delayed lab orders.
- **Permissions:** Store-level manager access (`store:manage`, `sales:approve_discount`, `cash:close_session`, `inventory:adjust`).
- **Common Problems:** Staff applying unauthorized discounts; discrepancies between physical cash and POS reports; lab delivery bottlenecks.
- **Required Information:** Live store register status, pending lab jobs, daily sales total, low-stock alerts.

---

### P-03: Sales Associate / Eyewear Stylist
- **Responsibilities:** Assisting customers in choosing frames, recommending lens materials and premium coatings, building sales orders.
- **Goals:** High average order value (AOV); high conversion rate of eye-test patients to eyewear buyers; customer satisfaction.
- **Daily Tasks:** Searches customer profile; scans frame barcodes; bundles frame with lens coating packages; generates quotations.
- **Permissions:** Retail POS access (`sales:create`, `customer:view`, `customer:create`, `catalog:view`).
- **Common Problems:** Forgetting available frame stock in the backroom; calculating manual lens coating addon prices; complex prescription data entry.
- **Required Information:** Frame inventory by color/size, lens pricing matrix, customer's active prescription, package promos.

---

### P-04: Receptionist / Front Desk
- **Responsibilities:** Welcoming walk-in customers, registering new customer profiles, retrieving existing family accounts.
- **Goals:** Rapid customer lookup under 5 seconds; clean customer phone database without duplicates; smooth handover to optometrist or sales.
- **Daily Tasks:** Searches customer by mobile number; registers new family members; prints prescription duplicate slips.
- **Permissions:** Customer registration and clinical queue (`customer:create`, `customer:edit`, `clinical:queue`).
- **Common Problems:** Duplicate accounts created due to minor spelling errors; missing phone numbers; confused family member records.
- **Required Information:** Customer lookup by phone/name, family member list, past visit dates, pending order statuses.

---

### P-05: Optometrist
- **Responsibilities:** Performing comprehensive eye refraction tests, recording visual acuity, determining subjective refraction, prescribing corrective lenses.
- **Goals:** Accurate prescription recording with zero transcription errors; clinical history tracking; clear lens recommendations (e.g. anti-fatigue, progressive).
- **Daily Tasks:** Conducts eye refraction; inputs OD/OS measurements (SPH, CYL, AXIS, ADD, PD); issues digitally signed optical prescriptions.
- **Permissions:** Clinical domain access (`clinical:examination_create`, `prescriptions:create`, `customer:view`).
- **Common Problems:** Rushed data entry leading to transposition errors (e.g. minus vs plus cylinder); inability to view patient's previous Rx history side-by-side.
- **Required Information:** Previous prescription history, OD/OS refraction form, visual acuity charts, optometrist sign-off pad.

---

### P-06: Dispensing Optician
- **Responsibilities:** Measuring technical optical parameters (inter-pupillary distance, fitting heights, segment heights, pantoscopic tilt), verifying frame fit.
- **Goals:** Perfect lens alignment with patient's optical centers; zero non-adaptation remakes on progressive lenses.
- **Daily Tasks:** Measures mono-PD and fitting heights; inputs lens edging instructions; performs frame adjustments upon customer delivery.
- **Permissions:** POS optical configuration and lab dispatch (`sales:edit_optical_spec`, `lab:dispatch`, `prescriptions:view`).
- **Common Problems:** Optical center misalignment causing customer dizziness; incorrect base curve selection for high-power prescriptions.
- **Required Information:** Detailed prescription parameters, lens diameter requirements, frame A/B/ED/DBL dimensions.

---

### P-07: Inventory Manager
- **Responsibilities:** Maintaining adequate stock levels, creating purchase orders to frame and lens suppliers, receiving shipments, dispatching branch transfers.
- **Goals:** Zero stock-outs on fast-moving frames; accurate physical inventory audits; rapid processing of vendor receipts.
- **Daily Tasks:** Reviews low-stock dashboard; issues purchase orders; scans barcode tags during goods receipt; logs damaged frames.
- **Permissions:** Inventory & procurement control (`inventory:manage`, `procurement:manage`, `suppliers:manage`).
- **Common Problems:** Supplier invoice prices differing from purchase order; stock count discrepancies during monthly physical audit; slow branch transfers.
- **Required Information:** Reorder levels, supplier catalogs, movement ledger history, transfer dispatch/receipt status.

---

### P-08: Cashier
- **Responsibilities:** Collecting customer payments at POS, issuing fiscal receipts, processing split tenders, managing cash drawer float.
- **Goals:** Fast checkout speed under 30 seconds; zero cash shortage at register close; accurate UPI and card payment reconciliation.
- **Daily Tasks:** Receives advance payments; collects final balance upon eyewear pickup; balances cash drawer at end of shift.
- **Permissions:** Cash register and payment entry (`payments:create`, `cash:drawer_entry`, `sales:settle`).
- **Common Problems:** Customer paying partially by cash and partially by UPI; mismatched gateway transaction IDs; managing advance payment receipts.
- **Required Information:** Sale balance due, payment tender options (Cash, UPI QR, Card), cash drawer opening balance.

---

### P-09: Optical Lab Technician
- **Responsibilities:** Cutting and edging uncut lens blanks, beveling, fitting lenses into metal/plastic/rimless frames, performing quality control (QC).
- **Goals:** Zero lens breakage during edging; 100% adherence to prescription tolerances; on-time job delivery to retail store.
- **Daily Tasks:** Accepts lab job; mounts lens blanks into edger; fits lenses into frame; checks power on focimeter/lensmeter; signs off QC checklist.
- **Permissions:** Optical lab workshop management (`lab:update_status`, `lab:qc_signoff`, `lab:log_rework`).
- **Common Problems:** Axis slipping during edging; scratches on anti-reflective coating; uncut lens blanks delivered out-of-power from supplier.
- **Required Information:** Exact prescription (OD/OS), lens edging specs (bevel type, groove depth), frame tracing, focimeter verification tolerances.

---

### P-10: Accountant / Bookkeeper
- **Responsibilities:** Reconciling bank statements, verifying GST tax liabilities, tracking accounts payable to suppliers, preparing financial statements.
- **Goals:** Timely GSTR-1 and GSTR-3B filings with zero HSN discrepancies; accurate tracking of customer credit balances and bad debts.
- **Daily Tasks:** Exports daily GST tax breakdown reports; reconciles UPI/Card settlements against bank feeds; audits expense petty cash vouchers.
- **Permissions:** Financial reports and accounting view (`reports:view_financial`, `tax:export`, `expenses:view`).
- **Common Problems:** Invoices modified after tax reporting period; manual calculations of intra-state vs inter-state GST; unallocated customer advances.
- **Required Information:** B2B vs B2C invoice breakdowns, HSN summary reports, payment allocation ledgers, supplier bills.

---

### P-11: Tenant Administrator
- **Responsibilities:** Managing store branches, provisioning staff user accounts, setting up printer and scanner hardware, customizing store receipts.
- **Goals:** High system uptime; strict adherence to least-privilege security roles; smooth onboarding of new branch locations.
- **Daily Tasks:** Creates new user logins; assigns store access scopes; configures WhatsApp notification templates; registers POS hardware terminals.
- **Permissions:** Full tenant administrative control (`tenant:manage_settings`, `users:manage`, `stores:manage`, `devices:manage`).
- **Common Problems:** Staff sharing logins due to forgotten passwords; misconfigured thermal receipt slip layouts; store printer network disconnects.
- **Required Information:** User roster, store list, device authorization list, system audit logs.

---

### P-12: Platform Administrator (Super-Admin)
- **Responsibilities:** Managing cloud SaaS infrastructure, provisioning new tenant businesses, monitoring database health and subscription quotas.
- **Goals:** 99.9% platform availability; complete tenant isolation; rapid incident response.
- **Daily Tasks:** Reviews system telemetry; provisions new tenant accounts; inspects global background job queues and sync worker status.
- **Permissions:** Platform super-admin access (`platform:superadmin`).
- **Common Problems:** Cross-tenant resource contention; noisy neighbor database queries; managing client app version deprecation.
- **Required Information:** Tenant registry, PostgreSQL connection pool metrics, Redis queue depths, platform error rates.

---

### P-13: Customer / Eyewear Buyer
- **Responsibilities:** Selecting vision correction and eyewear, paying for orders, picking up completed spectacles.
- **Goals:** Accurate clear vision from new glasses; stylish comfortable frames; clear tracking of order progress with transparent pricing.
- **Daily Tasks:** Tries on frames; undergoes eye test; receives WhatsApp status updates ("Your spectacles are ready for pickup!"); collects order.
- **Permissions:** Customer view (read-only self-service via customer portal or receipt link).
- **Common Problems:** Unclear order completion dates; misplaced paper prescription slips; uncoordinated family eye test appointments.
- **Required Information:** Order status, invoice receipt, digital prescription copy, warranty details.
