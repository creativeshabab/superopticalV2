# Super Optical V2 — MVP Scope Classification

**Document Version:** 1.0.0  
**Phase:** Phase 1 — Product Definition & Business Requirements  
**Target:** Optical Retail POS + ERP + Clinical Refraction Minimum Viable Product  

---

## 1. Scope Categorization Methodology

To prevent scope creep, ensure rapid delivery of core business value, and guarantee that the Minimum Viable Product (MVP) functions as an exceptional, high-speed optical business system, all capabilities are classified into four tiers:

1. **`MUST HAVE` (MVP Core):** Mandatory for store opening and commercial checkout. Without these, an optical store cannot legally trade, dispense eyewear, or balance its cash drawer.
2. **`SHOULD HAVE` (Post-MVP Fast Follow):** High-value capabilities that enhance efficiency, customer engagement, and supplier workflows.
3. **`LATER` (Secondary Enhancements):** Advanced analytical and automation capabilities planned for mature phases.
4. **`ENTERPRISE` (Large Chain Features):** Complex integrations for multi-store chains operating centralized lens surfacing manufacturing factories.

---

## 2. Feature Classification Matrix

| Domain Module | Feature / Capability | Classification | Target Phase |
|:---|:---|:---:|:---:|
| **Authentication** | Multi-tenant JWT auth, password reset, session refresh | `MUST HAVE` | Phase 1 |
| **Organization & RBAC**| Stores, roles, user permissions, store-level assignment | `MUST HAVE` | Phase 2 |
| **Customer Management**| Walk-in customer registration, search by phone, address | `MUST HAVE` | Phase 3 |
| **Family Management** | Linking dependents under primary billing account | `MUST HAVE` | Phase 3 |
| **Clinical Refraction**| OD/OS measurements (SPH, CYL, AXIS, ADD, PD, VA), sign-off | `MUST HAVE` | Phase 3 |
| **Prescriptions** | Digital optical prescription card, auto-transposition | `MUST HAVE` | Phase 3 |
| **Product Catalog** | Normalized Brands, Products, Variants (Frames, Lenses, Sunglasses) | `MUST HAVE` | Phase 4 |
| **Barcode Management** | Barcode generation and scanning (Code 128 / EAN-13) | `MUST HAVE` | Phase 4 |
| **Pricing & Discounts** | MRP, store selling price, line-item and cart discounts | `MUST HAVE` | Phase 4 |
| **Store Inventory** | Store stock tracking, low-stock warnings, physical counts | `MUST HAVE` | Phase 5 |
| **Inventory Movements**| Immutable movement ledger (`PURCHASE_RECEIPT`, `SALE_DEDUCTION`, etc.) | `MUST HAVE` | Phase 5 |
| **Inter-Store Transfers**| Two-phase dispatch and receipt between store branches | `SHOULD HAVE` | Phase 5 |
| **Procurement** | Purchase Orders to frame/lens vendors, Goods Receipts (GRN) | `MUST HAVE` | Phase 5 |
| **Supplier Ledger** | Supplier profiles, invoice registration, accounts payable | `SHOULD HAVE` | Phase 5 |
| **Optical POS** | Optical cart, frame+lens bundling, prescription attachment | `MUST HAVE` | Phase 6 |
| **Checkout & Payments** | Multi-tender checkout: Cash, UPI QR, Card, split payments | `MUST HAVE` | Phase 7 |
| **Advance Deposits** | Collecting partial payments, tracking balances due upon delivery | `MUST HAVE` | Phase 7 |
| **Customer Credits** | Account ledger for excess payment credits and refunds | `MUST HAVE` | Phase 7 |
| **Cash Register** | Opening float, cash-in/out, day closing with denomination count | `MUST HAVE` | Phase 7 |
| **Store Expenses** | Petty cash expense vouchers from register drawer | `SHOULD HAVE` | Phase 7 |
| **Invoice Lifecycle** | Revision-based invoice editing, cancellation, credit notes | `MUST HAVE` | Phase 8 |
| **GST Tax Engine** | CGST, SGST, IGST calculation, HSN code breakdowns | `MUST HAVE` | Phase 8 |
| **Optical Lab Jobs** | In-store lab job ticketing, edging, fitting, QC verification | `MUST HAVE` | Phase 9 |
| **Remake / Defect Logs**| Logging broken lenses and edging rework reasons | `SHOULD HAVE` | Phase 9 |
| **Store Delivery** | In-store pickup handover, four-point fit check, final balance | `MUST HAVE` | Phase 9 |
| **Daily Sales Reports** | Daily store revenue, cash breakdown, staff sales volume | `MUST HAVE` | Phase 10 |
| **GST Tax Reports** | GSTR-1 outward sales export, HSN summary reports | `MUST HAVE` | Phase 10 |
| **Profit & Margin Reports**| Gross profit margin by brand and product category | `SHOULD HAVE` | Phase 10 |
| **Offline POS Mode** | Local sales, offline queue, local receipt printing, sync | `SHOULD HAVE` | Phase 11 |
| **Direct Thermal Print** | ESC/POS silent receipt printing via Tauri desktop shell | `MUST HAVE` | Phase 12 |
| **Barcode Tag Print** | Thermal butterfly/dumbbell label printing for spectacle temples | `MUST HAVE` | Phase 12 |
| **Automated Messaging** | WhatsApp/SMS order ready notifications & receipts | `SHOULD HAVE` | Phase 12 |
| **SaaS Provisioning** | Self-service tenant registration, plan quotas | `ENTERPRISE` | Phase 13 |
| **Central Factory Lab** | Automated conveyor routing for centralized lens surfacing hub | `ENTERPRISE` | Phase 14 |
| **Legacy Data Migration**| Automated ETL tool to import legacy Super Optical data dump | `SHOULD HAVE` | Phase 14 |
