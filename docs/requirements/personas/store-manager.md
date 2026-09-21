# Persona: Store Manager

- **Persona ID:** P-02
- **Role Category:** Store Operations & Supervision
- **Target Organization:** Optical Store Location

---

## 1. Responsibilities & Goals
- **Responsibilities:** Managing retail store staff, approving POS discount exceptions, managing daily cash drawer reconciliation, monitoring customer order turnaround times, store inventory control.
- **Goals:** Achieve monthly store sales targets; ensure zero cash register discrepancies; ensure optical lab orders are delivered on time without delays.

---

## 2. Daily Tasks
- Opens store cash register session in the morning with opening float verification.
- Authorizes manager discounts or price overrides on the POS checkout counter.
- Monitors pending lab jobs and follows up on delayed lens deliveries.
- Conducts evening cash drawer closing, verifying cash count denominations against expected totals.
- Reviews daily sales reports and signs off on any cash variance.

---

## 3. Permissions & Access Scope
- **Permissions:** `store:manage`, `sales:approve_discount`, `sales:revise_invoice`, `cash:close_session`, `inventory:adjust`, `inventory:transfer_dispatch`.
- **Scope:** Assigned store location(s).

---

## 4. Key Workflows
1. **Cash Session Opening & Closing:** Verify float $\rightarrow$ Enter opening amount $\rightarrow$ Operate day $\rightarrow$ Count cash denominations $\rightarrow$ Submit variance explanation $\rightarrow$ Close session.
2. **Discount Approval:** Cashier requests discount above staff limit $\rightarrow$ Manager inputs PIN or approves in-app $\rightarrow$ Sale recalculates.
3. **Store Stock Intake:** Receive inter-store transfer $\rightarrow$ Scan incoming barcode tags $\rightarrow$ Acknowledge receipt into store inventory.

---

## 5. Common Problems & Pain Points
- Staff applying unauthorized discounts or manipulating prices.
- Cash shortages discovered at end of day without clear transaction attribution.
- Customer complaints about delayed spectacles due to untracked lab bottlenecks.

---

## 6. Required Information
- Live cash session balances (expected vs counted).
- Real-time store sales and staff performance rankings.
- Lab orders nearing delivery due date.
- Low-stock alerts for high-demand frame models.
