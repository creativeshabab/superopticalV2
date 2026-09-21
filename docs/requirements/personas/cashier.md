# Persona: Cashier

- **Persona ID:** P-08
- **Role Category:** Payment Processing & POS Checkout
- **Target Organization:** Optical Store Checkout Counter

---

## 1. Responsibilities & Goals
- **Responsibilities:** Collecting customer payments at POS, issuing fiscal receipts and tax invoices, processing multi-tender split payments (Cash, UPI, Card), managing physical cash drawer float.
- **Goals:** High transaction speed (sub-30 seconds per checkout); 100% cash reconciliation at end of shift; clear tracking of advance payments and remaining balances.

---

## 2. Daily Tasks
- Receives POS order from sales staff.
- Selects payment tender (e.g., ₹2,000 Cash + ₹1,500 UPI QR + ₹1,000 Customer Credit).
- Records advance deposit and prints receipt slip.
- Collects remaining balance upon eyewear delivery and marks order settled.
- Counts cash drawer contents at shift change.

---

## 3. Permissions & Access Scope
- **Permissions:** `payments:create`, `sales:settle`, `cash:drawer_entry`, `invoices:print`.
- **Scope:** Assigned store register.

---

## 4. Key Workflows
1. **Split-Payment Collection:** Select Order $\rightarrow$ Enter Cash Amount $\rightarrow$ Click 'Add Tender' $\rightarrow$ Enter UPI reference $\rightarrow$ Confirm $\rightarrow$ System commits atomic payment allocation $\rightarrow$ Print thermal receipt.
2. **Advance Payment & Balance Settlement:** Customer pays advance $\rightarrow$ Cashier records partial payment $\rightarrow$ Order moves to `PARTIALLY_PAID` $\rightarrow$ Upon delivery: Customer pays balance $\rightarrow$ Order moves to `PAID`.

---

## 5. Common Problems & Pain Points
- POS software freezing during rush hours when network drops.
- Slow entry of split payments across different methods.
- Mismatched cash drawer at end of day due to unrecorded cash petty expenses.

---

## 6. Required Information
- Outstanding balance per order.
- Quick cash denomination calculator.
- Real-time payment gateway transaction status.
