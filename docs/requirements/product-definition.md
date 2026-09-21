# Super Optical V2 — Product Definition & Scope Specification

**Document Version:** 1.0.0  
**Phase:** Phase 1 — Product Definition & Business Requirements  
**Status:** Approved / Active Baseline  
**Classification:** Canonical Product Requirement  

---

## 1. Product Mission & Vision

**Super Optical V2** is an **Optical Business Operating System** integrating Optical Retail Point of Sale (POS), Enterprise Resource Planning (ERP), Clinical Refraction, Store Inventory, Optical Lab / Workshop Processing, Multi-Store Management, and Multi-Tenant SaaS into a unified, high-performance platform.

The system is designed specifically for independent optical practices, retail optical chains, and prescription eyewear dispensing stores. It delivers a fast, offline-capable POS counter, an exact optical clinical refraction recording suite, automated optical workshop routing, and immutable financial and stock ledgers.

---

## 2. Explicit Scope Boundary: What Super Optical V2 Is and Is NOT

> [!IMPORTANT]
> **Strict Optical Retail & Store Operations Boundary**  
> Super Optical V2 is an optical retail, workshop, and clinical refraction operating system. It is **NOT** a general healthcare platform or hospital management system.

### 2.1 Out-of-Scope Modules (Explicitly Excluded)
To preserve domain focus, prevent architectural bloat, and protect usability, the following capabilities are **STRICTLY EXCLUDED** from Super Optical V2:
- ❌ **Hospital Management Systems (HMS)**: No inpatient management, bed allocation, wards, admissions, or discharge summaries.
- ❌ **Appointment Management**: No generic doctor/patient appointment scheduling calendars or queue tokens.
- ❌ **Pharmacy & General Medications**: No pharmaceutical dispensary, drug formularies, or medication dispensing (excluding over-the-counter optical contact lens solutions and eye drops sold as retail SKUs).
- ❌ **Nursing & Clinical Ward Modules**: No vitals charts, nurse notes, triage, or inpatient care plans.
- ❌ **Radiology & Pathology**: No imaging PACS, ultrasound, blood test panels, lab specimen tracking, or pathology reporting.
- ❌ **General Healthcare Billing**: No health insurance claims processing (TPA/CMS-1500), hospital ward billing, or surgical fee splitting.

### 2.2 In-Scope Core Areas (35 Functional Domains)
Super Optical V2 comprises exactly 35 core functional capabilities:

| # | Domain Area | In-Scope Operational Scope |
|:---:|:---|:---|
| **01** | **Customer Management** | Walk-in & registered customer profiles, contact info, tax IDs, purchase history, communication logs. |
| **02** | **Family Management** | Family grouping under primary billing accounts; independent member prescriptions & purchase records. |
| **03** | **Eye Examination** | Visual acuity (VA), subjective refraction (OD/OS), keratometry, intraocular pressure (IOP), optometrist sign-off. |
| **04** | **Prescription** | Optical prescriptions: Sphere (SPH), Cylinder (CYL), Axis, Addition (ADD), Pupillary Distance (PD), Prism, expiry dates. |
| **05** | **Product Catalog** | Normalized catalog decoupled from store stock: Brands, categories, models, attributes, variants, HSN codes. |
| **06** | **Frame Management** | Optical frames: Rim type (full, half, rimless), shape, material (acetate, titanium), eye size, bridge, temple length. |
| **07** | **Lens Management** | Ophthalmic lenses: Single vision, bifocal (Kryptok, D-segment), progressive; index (1.50 to 1.74); coatings (anti-reflective, blue-cut, photochromic). |
| **08** | **Contact Lens Management** | Contact lenses: Modality (daily, monthly, yearly), power, base curve, diameter, torics, multifocals, solutions. |
| **09** | **Accessories** | Sunglass cases, lens cleaning sprays, microfiber cloths, cords, repair kits. |
| **10** | **Pricing** | Multi-tier pricing: MSRP, store retail price, wholesale, minimum selling price, promotional schedules. |
| **11** | **Discounts** | Line-item and order-level discounts (percentage, fixed amount, coupon codes, manager overrides). |
| **12** | **Inventory** | Multi-store inventory tracking, reorder thresholds, physical stock counts, damage write-offs. |
| **13** | **Procurement** | Purchase orders to lens laboratories and frame suppliers, goods receipt verification, supplier bills. |
| **14** | **Suppliers** | Optical vendors, lens manufacturers (Essilor, Zeiss, Hoya, local labs), supplier ledgers, payables. |
| **15** | **POS (Point of Sale)** | High-speed retail checkout, barcode scanning, optical package configurator (Frame + Lens), customer linking. |
| **16** | **Quotation** | Draft estimates and quotations convertible to confirmed orders with price freeze. |
| **17** | **Sales** | Order confirmation, advance payments, order tracking, order completion, order cancellation. |
| **18** | **Payments** | Multi-tender split payments: Cash, UPI, Credit/Debit cards, NetBanking, customer credit balance. |
| **19** | **Credit / Debit** | Customer ledger accounts for store credit, excess payments, advance deposits, and outstanding receivables. |
| **20** | **Refunds / Returns** | Controlled return workflows: Item returns, exchange adjustments, refund vouchers, cash refunds. |
| **21** | **GST / Tax Engine** | Configurable Indian GST schedules: CGST, SGST, IGST calculation, HSN reporting, tax-inclusive pricing. |
| **22** | **Invoice Lifecycle** | Revision-controlled invoice editing, cancellation, credit notes, debit notes, immutable financial state. |
| **23** | **Optical Lab / Workshop**| Lens edging, frame fitting, lens tinting, quality control (QC) verification, rework tracking. |
| **24** | **Delivery** | Store pickup, ready for delivery notifications, customer handover signature, final payment settlement. |
| **25** | **Cash Register** | Drawer sessions, opening float, cash sales, pay-ins, pay-outs, petty expenses, day close reconciliation. |
| **26** | **Expenses** | Store expense logging: Petty cash, store supplies, utility payments, minor repair costs. |
| **27** | **Reports** | Daily sales, GST summary, stock valuation, fast/slow movers, staff sales commission, doctor referrals. |
| **28** | **Users & RBAC** | Role-based permissions specifically tailored to optical store staff (Optometrist, Cashier, Lab Tech, Manager). |
| **29** | **Multi-Store** | Centralized catalog with store-isolated stock, pricing, sessions, and inter-store stock transfers. |
| **30** | **Multi-Tenant SaaS** | Cloud SaaS architecture: Tenant provisioning, database row-level security (RLS), tenant branding. |
| **31** | **Offline POS** | Local offline sales & receipt printing with background sync engine and conflict quarantine queue. |
| **32** | **Hardware Adapters** | Direct USB/Bluetooth thermal printing (ESC/POS), A4 laser invoices, 1D/2D barcode scanners, cash drawers. |
| **33** | **Notifications** | Automated customer SMS/WhatsApp/Email notifications: Rx ready, order ready for pickup, payment receipt. |
| **34** | **Audit Trail** | Immutable audit logs for all security events, clinical edits, financial adjustments, and inventory movements. |
| **35** | **Data Migration** | Staged ETL migration tools to import legacy Super Optical customer, catalog, and invoice history. |
