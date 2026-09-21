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
├── reports/                                 # Official phase completion and verification reports
│   └── phase-1-final-completion-report.md   # Comprehensive final sign-off and verification report for Phase 1
├── PHASE_0_COMPLETION_REPORT.md             # Formal sign-off and verification report for Phase 0
├── PHASE_1_COMPLETION_REPORT.md             # Executive completion report for Phase 1
│
├── requirements/                            # Product specifications and traceability
│   ├── product-definition.md                # 35 core areas, strict optical retail scope, exclusions
│   ├── business-model.md                    # 5-tier organizational hierarchy & SaaS model
│   ├── mvp-scope.md                         # MUST HAVE, SHOULD HAVE, LATER, ENTERPRISE matrix
│   ├── functional-requirements.md           # 26 comprehensive FRs with unique IDs (FR-*-###)
│   ├── non-functional-requirements.md       # NFRs: Performance, security, reliability, data integrity
│   ├── assumptions-register.md              # Explicit assumption tracking (ASSUMPTION-xxx)
│   ├── migration-requirements.md            # Legacy Super Optical 6-stage ETL migration blueprint
│   ├── requirements-traceability.md         # End-to-end Requirements -> Tests matrix
│   └── personas/                            # 13 optical retail, clinical, and workshop personas
│       ├── personas-matrix.md               # Master persona directory and comparison
│       ├── owner.md                         # P-01: Owner / Managing Director
│       ├── store-manager.md                 # P-02: Store Manager
│       ├── sales-staff.md                   # P-03: Sales Associate / Eyewear Stylist
│       ├── reception.md                     # P-04: Receptionist / Front Desk
│       ├── optometrist.md                   # P-05: Optometrist (Clinical Refraction)
│       ├── optician.md                      # P-06: Dispensing Optician (Fitting & Measurements)
│       ├── inventory-manager.md             # P-07: Inventory Manager (Stock & Procurement)
│       ├── cashier.md                       # P-08: Cashier (POS Payments & Drawer)
│       ├── lab-staff.md                     # P-09: Optical Lab Technician (Lens Edging & QC)
│       ├── accountant.md                    # P-10: Accountant / Bookkeeper (Reconciliation & GST)
│       ├── tenant-admin.md                  # P-11: Tenant Administrator (Branch & User Setup)
│       ├── platform-admin.md                # P-12: Platform Administrator (Super-Admin SaaS)
│       └── customer.md                      # P-13: Customer / Eyewear Buyer
│
├── domain/                                  # Domain boundary definitions & invariants
│   ├── domain-boundaries.md                 # 31 domain maps, ownership boundaries, and core entities
│   ├── customer-management.md               # Customer profile, family tree, deduplication
│   ├── clinical-optical.md                  # Eye examination, OD/OS refraction, signed prescriptions
│   ├── product-catalog.md                   # Normalized catalog, variants (frames, lenses), barcodes
│   ├── pricing.md                           # Deterministic pricing engine, discounts, package bundles
│   ├── inventory.md                         # Stock quantities, append-only movement ledger
│   ├── procurement.md                       # Suppliers, POs, goods receipts (GRN), vendor bills
│   ├── pos.md                              # High-speed POS, optical bundles, cart hold/resume
│   ├── sales-invoice.md                     # Order lifecycle, revision engine, credit/debit notes
│   ├── payments-finance.md                  # Multi-tender payments, allocations, customer credits
│   ├── tax-gst.md                           # Configurable Indian GST engine, HSN schedules
│   ├── optical-lab.md                       # Workshop edging, mounting, QC checklist, reworks
│   ├── delivery.md                          # In-store pickup, four-point anatomical fit, handover
│   ├── cash-register.md                     # Shift sessions, denomination counting, day close variance
│   ├── reports.md                           # 14 report suites: Sales, inventory, tax, margins
│   ├── roles-permissions.md                 # Granular optical RBAC catalog (Role, Permission, Scope)
│   ├── multi-store.md                       # Multi-store chain operations, inter-store transfers
│   ├── offline-pos.md                       # Offline POS checkout, command queue, reconciliation
│   ├── hardware.md                          # Direct ESC/POS thermal printing, barcode scanners
│   ├── notifications.md                     # Event-driven customer alerts (WhatsApp, SMS, Email)
│   ├── audit.md                             # Immutable audit trail, security & clinical logs
│   ├── business-rules.md                    # Confirmed, proposed, and pending business rules
│   └── state-machines.md                    # 11 finite state machines & transition matrices
│
├── architecture/                            # System and technical architectures
│   ├── system-architecture.md               # Overall client-server, NestJS, and Redis topology
│   ├── platform-architecture.md             # Web, Desktop (Tauri), Mobile (Capacitor), and Hardware
│   ├── security-architecture.md             # Auth, Tenant/Store isolation, RBAC, and Audit
│   └── offline-sync-architecture.md         # IndexedDB, Command Queue, Idempotency, and Conflict Handling
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

## Core Principles

1. **Strict Optical Domain Focus**: Designed purely for optical retail, optometry refraction, and eyewear workshops. Generic hospital or appointment modules are strictly excluded.
2. **Single Source of Truth**: The PostgreSQL database and server-side domain model are authoritative. IndexedDB is strictly a cache and offline command queue.
3. **Immutable Financial Records**: Financial transactions (payments, refunds, credits, debits) are append-only ledger events. No mutating invoice payment totals in place.
4. **Ledger-Driven Inventory**: Every change in stock must have an immutable `inventory_movement` record with an explicit business reason.
5. **Revision-Based Invoice Lifecycle**: Invoices are never destructively edited; changes produce versioned revisions with full audit trails.
6. **Command-Driven Offline Sync**: Mutations are queued as idempotent commands and synchronized transactionally with explicit conflict resolution.
