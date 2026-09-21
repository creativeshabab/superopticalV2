# Super Optical V2 — Documentation Suite

Welcome to the architectural, domain, and operational documentation suite for **Super Optical V2**.

Super Optical V2 is a multi-tenant optical retail, clinical, and laboratory operating system built with a single shared domain core and platform adapters for Web/PWA, Windows Desktop (Tauri), and Mobile (Capacitor).

---

## Documentation Taxonomy

The documentation is organized into functional directories:

```text
docs/
├── README.md                                # Master documentation guide (this file)
├── progress-tracker.md                      # Phase-by-phase build and milestone tracker
├── PHASE_0_COMPLETION_REPORT.md             # Formal sign-off and verification report for Phase 0
│
├── architecture/                            # System and technical architectures
│   ├── system-architecture.md               # Overall client-server, NestJS, and Redis topology
│   ├── platform-architecture.md             # Web, Desktop (Tauri), Mobile (Capacitor), and Hardware
│   ├── security-architecture.md             # Auth, Tenant/Store isolation, RBAC, and Audit
│   └── offline-sync-architecture.md         # IndexedDB, Command Queue, Idempotency, and Conflict Handling
│
├── requirements/                            # Product specifications and traceability
│   ├── assumptions-register.md              # Explicit assumption tracking (ASSUMPTION-xxx)
│   └── requirements-traceability.md         # End-to-end Requirements -> Tests matrix
│
├── domain/                                  # Domain boundary definitions & invariants
│   └── domain-boundaries.md                 # 31 domain maps, ownership boundaries, and core entities
│
├── database/                                # Relational schema design and data integrity
│   └── database-architecture.md             # PostgreSQL design, multi-tenancy, ledgers, and revisions
│
├── decisions/                               # Architectural Decision Records (ADRs)
│   └── decision-log.md                      # Formal architectural decisions (DEC-xxx)
│
├── testing/                                 # Verification standards and matrices
│   └── testing-strategy.md                  # Test pyramid, offline testing, and 20-case invoice matrix
│
└── operations/                              # Engineering workflows and operating standards
    ├── development-workflow.md              # 8-step AI/developer execution cycle
    ├── ai-agent-rules.md                    # 15 non-negotiable engineering laws
    └── environment-strategy.md              # Local, Dev, Staging, and Production environment governance
```

---

## Mapping to Master Build Specification (`SUPER_OPTICAL_V2_ANTIGRAVITY_MASTER_BUILD_SPEC.md`)

For backward compatibility with the numbered document references in Section 21 of the Master Specification, use the following mapping:

| Spec Section 21 Reference | Corresponding Canonical Document |
|:---|:---|
| `00-project-charter.md` | [`SUPER_OPTICAL_V2_ANTIGRAVITY_MASTER_BUILD_SPEC.md`](../SUPER_OPTICAL_V2_ANTIGRAVITY_MASTER_BUILD_SPEC.md) (Sec 1) |
| `01-product-requirements.md` | [`docs/requirements/requirements-traceability.md`](requirements/requirements-traceability.md) |
| `02-domain-model.md` | [`docs/domain/domain-boundaries.md`](domain/domain-boundaries.md) |
| `03-architecture.md` | [`docs/architecture/system-architecture.md`](architecture/system-architecture.md) |
| `04-database-design.md` | [`docs/database/database-architecture.md`](database/database-architecture.md) |
| `05-api-contract.md` | [`docs/architecture/system-architecture.md`](architecture/system-architecture.md) & API Specifications |
| `06-security-model.md` | [`docs/architecture/security-architecture.md`](architecture/security-architecture.md) |
| `07-rbac-permissions.md` | [`docs/architecture/security-architecture.md`](architecture/security-architecture.md) (Sec 3) |
| `08-workflows.md` | [`docs/domain/domain-boundaries.md`](domain/domain-boundaries.md) |
| `09-invoice-lifecycle.md` | [`docs/domain/domain-boundaries.md`](domain/domain-boundaries.md) & [`docs/database/database-architecture.md`](database/database-architecture.md) |
| `10-inventory-rules.md` | [`docs/database/database-architecture.md`](database/database-architecture.md) (Sec 3) |
| `11-payment-rules.md` | [`docs/database/database-architecture.md`](database/database-architecture.md) (Sec 4) |
| `12-offline-sync.md` | [`docs/architecture/offline-sync-architecture.md`](architecture/offline-sync-architecture.md) |
| `13-printing-hardware.md` | [`docs/architecture/platform-architecture.md`](architecture/platform-architecture.md) (Sec 3) |
| `14-notifications.md` | [`docs/domain/domain-boundaries.md`](domain/domain-boundaries.md) (Domain 26) |
| `15-reporting.md` | [`docs/domain/domain-boundaries.md`](domain/domain-boundaries.md) (Domain 27) |
| `16-testing-strategy.md` | [`docs/testing/testing-strategy.md`](testing/testing-strategy.md) |
| `17-deployment.md` | [`docs/operations/environment-strategy.md`](operations/environment-strategy.md) |
| `18-migration-plan.md` | [`docs/operations/environment-strategy.md`](operations/environment-strategy.md) (Sec 4) |
| `19-decision-log.md` | [`docs/decisions/decision-log.md`](decisions/decision-log.md) |
| `20-assumptions-register.md` | [`docs/requirements/assumptions-register.md`](requirements/assumptions-register.md) |
| `21-progress-tracker.md` | [`docs/progress-tracker.md`](progress-tracker.md) |

---

## Core Principles

1. **Single Source of Truth**: The PostgreSQL database and server-side domain model are authoritative. IndexedDB is strictly a cache and offline command queue.
2. **Immutable Financial Records**: Financial transactions (payments, refunds, credits, debits) are append-only ledger events. No mutating invoice payment totals in place.
3. **Ledger-Driven Inventory**: Every change in stock must have an immutable `inventory_movement` record with an explicit business reason.
4. **Revision-Based Invoice Lifecycle**: Invoices are never destructively edited; changes produce versioned revisions with full audit trails.
5. **Command-Driven Offline Sync**: Mutations are queued as idempotent commands and synchronized transactionally with explicit conflict resolution.
