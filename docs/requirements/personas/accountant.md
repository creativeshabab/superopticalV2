# Persona: Accountant / Bookkeeper

- **Persona ID:** P-10
- **Role Category:** Financial Reconciliation & Tax Accounting
- **Target Organization:** Optical Business Finance Office

---

## 1. Responsibilities & Goals
- **Responsibilities:** Verifying daily store cash and electronic collections, filing monthly GST returns (GSTR-1, GSTR-3B), managing supplier accounts payable, tracking customer credits and bad debts, generating financial statements.
- **Goals:** Zero tax filing discrepancies; seamless reconciliation between POS reports, bank deposits, and payment gateway settlements; accurate gross margin calculation.

---

## 2. Daily & Monthly Tasks
- Reconciles daily store sales summaries against bank statement credits.
- Verifies input tax credit (ITC) on supplier purchase invoices.
- Generates GSTR-1 sales export with correct HSN code summaries and CGST/SGST/IGST splits.
- Reviews customer advance payments, credit balances, and aged accounts receivable.
- Audits store petty cash expenses and vouchers.

---

## 3. Permissions & Access Scope
- **Permissions:** `reports:view_financial`, `tax:manage`, `tax:export`, `expenses:manage`, `suppliers:view_ledger`.
- **Scope:** Tenant-wide financial data.

---

## 4. Key Workflows
1. **GST Return Preparation:** Accounting Module $\rightarrow$ Select Tax Period $\rightarrow$ Generate GSTR-1 JSON / Excel $\rightarrow$ Review B2B vs B2C Invoices $\rightarrow$ Verify HSN 9003 (Frames) and HSN 9001 (Lenses) rate distributions.
2. **Payment Gateway Settlement Reconciliation:** Import settlement report $\rightarrow$ Match gateway transaction references against POS payment records $\rightarrow$ Flag discrepancies.

---

## 5. Common Problems & Pain Points
- Store staff altering invoices after tax periods have closed.
- Difficulties determining if tax on mixed bundles (e.g. eye test fee + spectacle sale) was computed properly.
- Unallocated advance payments creating accounting confusion.

---

## 6. Required Information
- Tax invoice registers with date, customer GSTIN, HSN codes, and taxable values.
- Immutable payment allocation ledgers.
- Supplier invoices and accounts payable aging summaries.
