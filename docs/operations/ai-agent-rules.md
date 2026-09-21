# Super Optical V2 — AI Agent Rules of Engagement

These 15 rules are mandatory and non-negotiable for any AI coding agent or software engineer operating on the Super Optical V2 codebase.

---

## The 15 Non-Negotiable Engineering Laws

### Rule 1: Read Relevant Documentation Before Coding
Always read the master specification (`SUPER_OPTICAL_V2_ANTIGRAVITY_MASTER_BUILD_SPEC.md`) and the relevant architecture and domain documents in `docs/` before touching code. Never guess existing interfaces.

### Rule 2: Never Modify Unrelated Modules
Confine changes strictly to the files and packages relevant to the assigned task. Never perform speculative "drive-by" refactoring of untouched domains.

### Rule 3: Never Silently Change Architecture
Do not alter chosen frameworks, libraries, protocols, or storage topologies without documenting the rationale, considering alternatives, and recording a formal entry in `docs/decisions/decision-log.md`.

### Rule 4: Never Create Duplicate Business Logic
Core domain calculations (pricing, GST, prescription transposition, inventory math, validation rules) belong exclusively in `packages/`. Never re-implement formulas inside frontend views or backend controllers.

### Rule 5: Never Hard-Code Business-Critical Financial Rules
Never hard-code GST rates (e.g., `total * 0.18`), discount thresholds, or optical pricing rules directly in application code. Tax schedules and pricing rules must be driven by data models and configuration engines.

### Rule 6: Never Bypass Validation
All input arriving across platform boundaries, HTTP endpoints, or sync queues must be validated through strict Zod schemas (`@super-optical/validation`). Never cast untrusted payloads with `as unknown as T`.

### Rule 7: Never Bypass Tenant or Store Authorization
Never trust `tenant_id` or `store_id` provided in client request bodies or query params. Always verify security context server-side against cryptographically verified tokens and database store memberships.

### Rule 8: Never Modify Financial History Destructively
Payments, refunds, credit notes, and debit notes are immutable append-only ledger entries. Never execute an `UPDATE` or `DELETE` on financial records. Adjustments must be made via compensating transactions.

### Rule 9: Never Mutate Inventory Without a Movement Record
Direct in-place edits of stock counts without an accompanying immutable `inventory_movements` row are strictly prohibited. Every stock change must be explainable by an audit trail.

### Rule 10: Every Feature Requires Tests
No feature or bug fix is complete without automated test coverage appropriate to its risk level. Calculations and financial transaction boundaries require 100% path verification.

### Rule 11: Every Significant Architectural Decision Requires Documentation
Whenever a significant architectural question arises or a pattern is established, record it immediately in `docs/decisions/decision-log.md`.

### Rule 12: Every Completed Phase Requires a Completion Report
When a phase or milestone is concluded, publish a formal report matching the template in `docs/PHASE_0_COMPLETION_REPORT.md` before proceeding.

### Rule 13: Do Not Mark a Task Complete Without Verification
Never assume that written code functions correctly. You must execute typechecking, linting, and automated tests. Report actual execution outputs.

### Rule 14: If Requirements Are Unclear, Document Ambiguity Before Implementation
Never guess missing business rules. Log the question in `docs/requirements/assumptions-register.md`, define a reasonable assumption, and highlight it for human review.

### Rule 15: Prefer Small, Testable Modules Over Giant Files
Reject monolithic dumping grounds (such as `storage.js`, `api.js`, or mega-utility files). Keep modules focused, adhering to Single Responsibility and explicit interfaces.
