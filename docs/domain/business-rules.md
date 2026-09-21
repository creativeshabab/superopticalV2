# Domain: Business Rules Catalog

**Document Version:** 1.0.0  
**Phase:** Phase 1 — Product Definition & Business Requirements  
**Classification:** Canonical Business Invariants  

---

## 1. Governance Classification Framework

Every rule in Super Optical V2 is strictly categorized into one of three statuses:
- **`CONFIRMED`**: Core architectural invariant approved in the Master Build Specification. Must not be altered.
- **`PROPOSED`**: Sound domain standard formulated during Phase 1 analysis. Recommended for execution unless rejected.
- **`PENDING BUSINESS DECISION`**: Open policy question requiring formal business or legal verification before commitment.

---

## 2. Master Catalog of Business Rules

### 2.1 Financial & Transactional Integrity
| Rule ID | Statement | Status | Rationale / Reference |
|:---|:---|:---:|:---|
| **BR-FIN-001** | Payments are discrete ledger transactions, not simple fields on the invoice row. | `CONFIRMED` | Master Spec Sec 2.5, DEC-006 |
| **BR-FIN-002** | Financial records (payments, refunds, credit notes) are strictly append-only and cannot be updated or deleted in place. | `CONFIRMED` | Master Spec Sec 2.5, DEC-006 |
| **BR-FIN-003** | Invoices must never be silently edited; post-confirmation modifications require versioned revisions with financial deltas. | `CONFIRMED` | Master Spec Sec 2.7, DEC-007 |
| **BR-FIN-004** | If an invoice revision lowers the total below payments already collected, the excess must automatically credit to the customer account or initiate a refund. | `CONFIRMED` | Master Spec Sec 6.6, DEC-007 |
| **BR-FIN-005** | Refunds must reference a previously completed payment and require explicit supervisor authorization. | `CONFIRMED` | Master Spec Sec 5, DEC-006 |
| **BR-FIN-006** | Cash drawer day closing requires physical cash count breakdown compared against expected drawer balance. | `PROPOSED` | Domain 24, ASSUMPTION-006 |
| **BR-FIN-007** | Invoice currency calculations must use deterministic 64-bit integer cents/paise; zero floating-point arithmetic permitted. | `CONFIRMED` | Master Spec Sec 28, DEC-001 |

### 2.2 Inventory & Supply Chain
| Rule ID | Statement | Status | Rationale / Reference |
|:---|:---|:---:|:---|
| **BR-INV-001** | Every physical stock change must create an immutable row in `inventory_movements` with an explicit movement type. | `CONFIRMED` | Master Spec Sec 2.6, DEC-005 |
| **BR-INV-002** | Direct in-place mutation of stock quantities without a corresponding movement event is strictly prohibited. | `CONFIRMED` | Master Spec Sec 2.6, DEC-005 |
| **BR-INV-003** | Product catalog definitions must be completely decoupled from store inventory stock levels. | `CONFIRMED` | Master Spec Sec 6.3, DEC-001 |
| **BR-INV-004** | Confirmed customer sales orders reserve physical stock, decrementing available stock while preserving quantity on hand until delivery. | `CONFIRMED` | Master Spec Sec 6.4 |
| **BR-INV-005** | Inter-store stock transfers must execute via a two-phase protocol (`TRANSFER_OUT` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `TRANSFER_IN`). | `CONFIRMED` | Master Spec Sec 5 |
| **BR-INV-006** | Physical stock count discrepancies require a formal stock adjustment record with supervisor sign-off. | `CONFIRMED` | Master Spec Sec 6.10 |

### 2.3 Clinical Refraction & Prescriptions
| Rule ID | Statement | Status | Rationale / Reference |
|:---|:---|:---:|:---|
| **BR-CLN-001** | Once finalized by an optometrist, eye examinations and optical prescriptions become immutable medical records. | `CONFIRMED` | Master Spec Sec 5 |
| **BR-CLN-002** | A new sales order, refund, or return must never overwrite or mutate existing clinical examination history. | `CONFIRMED` | Master Spec Sec 7 |
| **BR-CLN-003** | Optical prescriptions must validate that Axis ($1^\circ - 180^\circ$) is provided whenever Cylinder $\neq 0.00$. | `CONFIRMED` | Master Spec Sec 5 |
| **BR-CLN-004** | Optical prescriptions expire after 12 months by default, triggering visual expiry warnings at POS. | `PROPOSED` | Standard Optometric Practice |

### 2.4 Multi-Tenancy & Store Security
| Rule ID | Statement | Status | Rationale / Reference |
|:---|:---|:---:|:---|
| **BR-SEC-001** | The client application is never trusted for `tenant_id`, `store_id`, or permissions; all security context is resolved server-side. | `CONFIRMED` | Master Spec Sec 2.8, DEC-004 |
| **BR-SEC-002** | A user from Tenant A must never be able to read, write, or query Tenant B data under any condition (enforced via PostgreSQL RLS). | `CONFIRMED` | Master Spec Sec 6.1, DEC-004 |
| **BR-SEC-003** | Users must be assigned explicit store permissions; cross-store actions require multi-store roaming privileges. | `CONFIRMED` | Master Spec Sec 6.2 |
| **BR-SEC-004** | Each physical POS terminal must pair via a cryptographically validated device certificate before sync is enabled. | `PROPOSED` | Master Spec Sec 10, ASSUMPTION-003 |

### 2.5 Offline Operations & Edge Synchronization
| Rule ID | Statement | Status | Rationale / Reference |
|:---|:---|:---:|:---|
| **BR-OFF-001** | Offline mutations must be encapsulated as idempotent commands with client UUIDv7 keys to reject duplicate processing. | `CONFIRMED` | Master Spec Sec 2.9, DEC-008 |
| **BR-OFF-002** | Financial and inventory conflicts must never be resolved using simplistic "last-write-wins" or server timestamp precedence. | `CONFIRMED` | Master Spec Sec 2.9, DEC-008 |
| **BR-OFF-003** | Concurrent offline stock-out conflicts must accept customer payment, record an emergency adjustment, and quarantine in a manager exception queue. | `PROPOSED` | ASSUMPTION-002 |
| **BR-OFF-004** | The client UI must explicitly display visual sync badges (`LOCAL_PENDING`, `SYNCING`, `SERVER_CONFIRMED`, `SYNC_CONFLICT`). | `CONFIRMED` | Master Spec Sec 10 |

### 2.6 Open Business Decisions (Requiring Confirmation)
| Rule ID | Policy Question | Status | Impact / Validation |
|:---|:---|:---:|:---|
| **BR-OPN-001** | Should customer emergency negative inventory be permitted for optical frames during offline sales? | `PENDING BUSINESS DECISION` | Prevents lost retail sales vs risk of selling physically missing frames. |
| **BR-OPN-002** | What are the exact SaaS subscription tier pricing amounts (Starter, Growth, Enterprise)? | `PENDING BUSINESS DECISION` | Documented in `docs/requirements/business-model.md`. |
| **BR-OPN-003** | Should optometrist clinical examination fees be exempt from GST or taxed at 18% when bundled with eyewear sales? | `PENDING BUSINESS DECISION` | Indian GST legal opinion required for mixed supply vs composite supply. |
| **BR-OPN-004** | What is the maximum permitted cash drawer variance before mandatory Owner sign-off is required? | `PENDING BUSINESS DECISION` | Standard optical store threshold proposed at ₹100. |
