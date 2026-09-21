# Persona: Tenant Administrator

- **Persona ID:** P-11
- **Role Category:** Business IT Administration
- **Target Organization:** Optical Business IT / Management

---

## 1. Responsibilities & Goals
- **Responsibilities:** Managing organizational settings, adding and configuring store branches, provisioning staff user accounts, configuring role-based permissions, registering POS hardware terminals, customizing invoice layouts and notification templates.
- **Goals:** 100% system availability for store operations; rapid onboarding of new store locations; strict security compliance with least-privilege role assignments.

---

## 2. Daily & Administrative Tasks
- Provisions new staff accounts and assigns them to specific stores with appropriate roles.
- Pairs and approves physical POS terminals and barcode scanners with secure device tokens.
- Configures receipt and invoice print templates with company logo, tax GSTIN, and legal disclaimers.
- Reviews system audit logs for suspicious login attempts or unauthorized data exports.

---

## 3. Permissions & Access Scope
- **Permissions:** `tenant:manage_settings`, `users:manage`, `stores:manage`, `roles:manage`, `devices:manage`, `audit:view`.
- **Scope:** Tenant-wide administration.

---

## 4. Key Workflows
1. **Store Branch Onboarding:** Organization Settings $\rightarrow$ Add New Store $\rightarrow$ Configure Address, GSTIN, and Operating Hours $\rightarrow$ Assign Initial Staff $\rightarrow$ Assign Store Devices.
2. **Device Authorization:** New Windows POS terminal launches $\rightarrow$ Generates Pairing Code $\rightarrow$ Admin enters code in Tenant Dashboard $\rightarrow$ Device issued permanent cryptographic certificate.

---

## 5. Common Problems & Pain Points
- Staff forgetting passwords and sharing accounts, compromising audit trails.
- Store printers failing to print due to complex manual driver configurations.
- Staff requesting temporary elevated permissions and never having them revoked.

---

## 6. Required Information
- User access directory and active session monitors.
- Authorized device inventory with pairing status.
- Audit trail logs of administrative and security events.
