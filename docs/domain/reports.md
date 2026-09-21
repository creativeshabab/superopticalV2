# Domain: Reporting & Business Analytics Engine

**Document Version:** 1.0.0  
**Phase:** Phase 1 — Product Definition & Business Requirements  
**Domain Code:** `27-REPORTS`  

---

## 1. Domain Scope: Analytical Reporting Architecture

The **Reporting & Business Analytics** domain provides management, store operators, optometrists, and accountants with structured operational and financial intelligence.

> [!NOTE]
> **Reporting Definition Only**  
> In accordance with Phase 1 constraints, this document defines required **Report Inputs and Outputs**; reports will be implemented in Phase 10.

---

## 2. Standard Optical Report Catalog

Super Optical V2 defines 14 core analytical report suites:

### 2.1 Sales Reports
- **Report Types:** Daily Sales Summary, Sales by Store, Sales by Category (Frames vs Lenses vs Sunglasses vs Contact Lenses), Sales by Brand, Sales Associate Performance / Commission.
- **Inputs:** Date range, store filter, staff filter, category filter.
- **Outputs:** Number of orders, gross revenue, net discounts given, net taxable sales, total tax collected, average order value (AOV).

### 2.2 Inventory Reports
- **Report Types:** Current Stock on Hand, Stock Valuation (at Cost and at Retail MSRP), Low Stock / Reorder Trigger Report, Fast-Moving vs Slow-Moving Aging Analysis ($> 180\text{ days}$ unsold), Damaged Stock Summary.
- **Inputs:** Store filter, brand filter, category filter, aging threshold.
- **Outputs:** SKU, Model, Color, Size, QOH, Available, Reserved, Unit Cost, Total Valuation, Days in Inventory.

### 2.3 Purchasing & Procurement Reports
- **Report Types:** Purchase Order Status, Supplier Spend Summary, Pending Goods Receipts, Supplier Price Variance Report.
- **Inputs:** Supplier filter, date range, store filter.
- **Outputs:** PO Number, Supplier Name, Ordered Quantity, Received Quantity, Outstanding Quantity, Invoiced Amount, Payment Status.

### 2.4 Customer & CRM Reports
- **Report Types:** New vs Repeat Customer Analysis, Customer Lifetime Value (LTV) Ranking, Optical Recall / Due for Re-Examination Report, Customer Retention Rate.
- **Inputs:** Store filter, date range, months since last eye test ($12, 24, 36\text{ months}$).
- **Outputs:** Customer Name, Mobile, Family Size, Total Orders, Total Spend, Last Eye Test Date, Recall Status.

### 2.5 Clinical & Optometry Reports
- **Report Types:** Optometrist Examination Volume, Visual Acuity Distribution, Refractive Error Trends (Myopia vs Hyperopia vs Astigmatism vs Presbyopia), Conversion Rate (Exam to Eyewear Sale).
- **Inputs:** Optometrist user filter, store clinic filter, date range.
- **Outputs:** Total exams completed, SPH/CYL distribution, prescriptions issued, attached sale orders, conversion percentage.

### 2.6 Payments & Financial Reports
- **Report Types:** Daily Payment Tender Breakdown (Cash vs UPI vs Card vs Credit), Payment Allocation Ledger, Discrepancy / Reversal Report.
- **Inputs:** Date range, store filter, tender type filter.
- **Outputs:** Transaction ID, Payment Method, Amount, Bank Reference / UTR, Allocation to Sale ID, Cashier User, Timestamp.

### 2.7 Outstanding Balances & Accounts Receivable
- **Report Types:** Unpaid Customer Balances, Aging Accounts Receivable ($30, 60, 90+\text{ days}$), Pending Advance Balances on Custom Lab Orders.
- **Inputs:** Store filter, aging bucket, minimum balance threshold.
- **Outputs:** Customer Name, Phone, Sale ID, Order Date, Total Sale, Total Paid, Balance Due, Days Overdue.

### 2.8 GST / Statutory Tax Reports
- **Report Types:** GSTR-1 Sales Report (B2B, B2C Large, B2C Small), HSN-Wise Summary of Outward Supplies, Input Tax Credit (ITC) Purchase Report.
- **Inputs:** Financial month / quarter, tenant GSTIN, store filter.
- **Outputs:** Invoice Number, Date, Customer GSTIN, HSN Code (9001, 9003, 9004), Taxable Value, CGST Amount, SGST Amount, IGST Amount, Total Invoice Value.

### 2.9 Profitability & Margin Analysis
- **Report Types:** Gross Profit by Product, Margin by Brand, Store Profitability Summary.
- **Inputs:** Date range, store filter, minimum margin threshold.
- **Outputs:** Product Name, Brand, Units Sold, Total Revenue, Total Cost of Goods Sold (COGS), Gross Profit (₹), Gross Margin (%).

### 2.10 Cash Register & Day Close Reports
- **Report Types:** Daily Cash Session Summary, Drawer Shortage/Overage History, Cashier Balance Audit.
- **Inputs:** Store filter, date range, cashier user filter.
- **Outputs:** Session ID, Opened By, Closed By, Opening Float, Cash Sales, Cash Refunds, Petty Cash Expenses, Expected Cash, Counted Cash, Variance (Short/Surplus).

### 2.11 Store Expenses Report
- **Report Types:** Petty Cash Expense Breakdown, Expenses by Category, Monthly Expense Trends.
- **Inputs:** Store filter, date range, category filter.
- **Outputs:** Expense ID, Date, Category, Amount, Payee, Voucher Number, Approved By.

### 2.12 Optical Lab / Workshop Reports
- **Report Types:** Lab Job Turnaround Time (TAT), Pending Lab Orders by Status, Lens Remake / Defect Analysis Report, External Lab Turnaround Comparison.
- **Inputs:** Lab filter, technician filter, date range.
- **Outputs:** Job Number, Prescription Type, Frame Source, Technician, Assigned Date, Completed Date, TAT (Hours), Remake Reason (if failed).

### 2.13 Multi-Store Performance Comparison
- **Report Types:** Store-by-Store Sales Comparison, Inventory Turnover Ratio by Store, Revenue per Square Foot / per Staff Member.
- **Inputs:** Tenant-wide, date range.
- **Outputs:** Store Name, Revenue Rank, Total Sales, Units Sold, Average Order Value, Gross Margin.
