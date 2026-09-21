# Domain: Cash Register & Store Expense Management

**Document Version:** 2.0.0  
**Phase:** Phase 1 — Product Definition & Business Requirements  
**Domain Code:** `24-CASH-REGISTER` / `25-EXPENSES`  
**Status:** Approved Specification (DEC-017 Approved)  

---

## 1. Domain Scope & Reconciliation Objectives

The **Cash Register & Store Expenses** domain enforces store-level cash reconciliation, physical drawer accountability, shift management, and petty cash expense tracking. It ensures that every physical rupee inside the optical store counter is accounted for from opening float to evening closing.

---

## 2. Cash Session Lifecycle & Reconciliation Formula

```mermaid
graph TD
    Open[1. Open Register Session<br/>Record Opening Float Amount] --> Transact[2. Normal Store Operations<br/>Cash Sales, Cash Advances, Balance Collections]
    Transact --> MiscIn[3. Cash In / Pay-In<br/>e.g. Additional float added]
    Transact --> MiscOut[4. Cash Out / Pay-Out<br/>e.g. Bank deposit or petty cash expense]
    Transact --> Refund[5. Cash Refunds Paid Out]
    MiscIn --> Close[6. Close Register & Count Cash]
    MiscOut --> Close
    Refund --> Close
    Close --> Compare{7. Expected Cash == Counted Cash?}
    Compare -->|Match: Variance = 0| Balanced[8. Session Balanced & Closed]
    Compare -->|Variance <= Rs 500| Permitted[9. Minor Variance Permitted with Note]
    Compare -->|Variance > Rs 500| Escalated[10. Manager Approval Required<br/>Status: PENDING_APPROVAL]
```

### The Expected Cash Invariant Formula:
$$\text{Expected Cash} = \text{Opening Float} + \sum(\text{Cash Sales}) + \sum(\text{Cash Advances}) + \sum(\text{Cash In}) - \sum(\text{Cash Refunds}) - \sum(\text{Petty Cash Expenses}) - \sum(\text{Cash Out})$$
$$\text{Cash Variance} = \text{Actual Physical Cash Counted} - \text{Expected Cash}$$

---

## 3. Cash Register Entities

```mermaid
erDiagram
    STORE ||--o{ CASH_REGISTER : houses
    CASH_REGISTER ||--o{ CASH_SESSION : operates
    CASH_SESSION ||--o{ CASH_TRANSACTION : records
    CASH_SESSION ||--o{ STORE_EXPENSE : disburses

    CASH_REGISTER {
        uuid id PK
        uuid tenant_id FK
        uuid store_id FK
        string name
        string terminal_id
        boolean is_active
    }

    CASH_SESSION {
        uuid id PK
        uuid register_id FK
        uuid opened_by_user_id FK
        uuid closed_by_user_id FK
        uuid approved_by_user_id FK
        timestamptz opened_at
        timestamptz closed_at
        decimal opening_float
        decimal expected_cash
        decimal counted_cash
        decimal variance_amount
        string variance_reason
        string status
    }

    CASH_TRANSACTION {
        uuid id PK
        uuid session_id FK
        string transaction_type
        decimal amount
        string reference_type
        uuid reference_id
        string reason
        timestamptz created_at
    }

    STORE_EXPENSE {
        uuid id PK
        uuid session_id FK
        uuid store_id FK
        string category
        decimal amount
        string recipient_name
        string receipt_voucher_number
        string description
        timestamptz created_at
    }
```

---

## 4. Cash Denomination Breakdown at Day Close

To prevent loose estimations, the closing screen prompts the cashier to enter physical counts for standard Indian currency denominations:

$$\text{Counted Cash} = (N_{500} \times 500) + (N_{200} \times 200) + (N_{100} \times 100) + (N_{50} \times 50) + (N_{20} \times 20) + (N_{10} \times 10) + \text{Coins}$$

The breakdown is stored as an immutable audit record in the session data.

---

## 5. Cash Variance Threshold & Manager Approval Workflow (DEC-017)

To balance cashier operational flow with financial accountability, cash drawer closing enforces an approved two-tier variance policy:

| Variance Condition | Operational Action | Required Approvals | Session Final Status |
|:---|:---|:---:|:---:|
| **Zero Variance** ($\text{Variance} = 0$) | Immediate standard closing | Cashier | `CLOSED` |
| **Minor Variance** ($0 < \|\text{Variance}\| \le ₹500$) | Cashier records descriptive reason note; system logs variance to audit ledger | Cashier | `CLOSED` |
| **Excessive Variance** ($\|\text{Variance}\| > ₹500$) | Cashier enters mandatory reason; session flagged; manager notification dispatched | Store Manager or Owner | `PENDING_APPROVAL` $\rightarrow$ `CLOSED` |

### Key Variance Rules:
1. **Configurable Default:** The threshold is initialized at **₹500** per session by default and is admin-configurable per store or tenant.
2. **Mandatory Manager Approval:** If the counted cash differs from expected cash by more than ₹500 (shortage or surplus), the session cannot transition to `CLOSED` without a manager's cryptographic signature or authenticated approval.
3. **Immutable Audit Record:** Every variance record captures the cashier ID, manager approver ID, expected amount, counted amount, variance delta, denomination counts, timestamp, and explanation text.

---

## 6. Store Petty Cash & Expense Logging

Optical retail stores frequently disburse cash from the drawer for operational necessities:
- **Eligible Expense Categories:** Store Cleaning Supplies, Staff Tea/Refreshments, Local Delivery Travel, Minor Hardware Repair, Postage/Courier, Electricity Bill.
- **Workflow:**
  1. Cashier enters amount and selects Expense Category.
  2. Enters payee name and optional physical voucher number.
  3. System logs `CASH_OUT` transaction reducing active session cash.
  4. Day closing report itemizes total petty cash disbursements alongside gross sales.
