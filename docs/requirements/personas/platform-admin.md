# Persona: Platform Administrator (Super-Admin)

- **Persona ID:** P-12
- **Role Category:** SaaS System Administration
- **Target Organization:** Super Optical V2 SaaS Platform Operator

---

## 1. Responsibilities & Goals
- **Responsibilities:** Managing cloud SaaS infrastructure, provisioning new tenant businesses, monitoring database connection health, managing global background queues, ensuring multi-tenant data isolation, maintaining platform uptime.
- **Goals:** 99.9% platform availability; zero cross-tenant data leakage; proactive scaling to prevent performance degradation during peak optical store hours.

---

## 2. Daily Tasks
- Monitors platform health dashboards (API latencies, database CPU/memory, Redis queue depths).
- Provisions new optical business tenants upon SaaS onboarding.
- Manages platform feature flags and system-wide version updates.
- Investigates and resolves critical system anomalies or offline sync queue bottlenecks.

---

## 3. Permissions & Access Scope
- **Permissions:** Full platform super-admin access (`platform:superadmin`).
- **Scope:** Global SaaS platform infrastructure across all tenants.

---

## 4. Key Workflows
1. **Tenant Provisioning:** Receive SaaS onboarding request $\rightarrow$ Generate Tenant ID $\rightarrow$ Initialize Tenant Row $\rightarrow$ Set up default admin account $\rightarrow$ Issue activation email.
2. **System Health Inspection:** Review Prometheus/Grafana metrics $\rightarrow$ Inspect PostgreSQL query execution plans $\rightarrow$ Scale Redis workers if sync queues spike.

---

## 5. Common Problems & Pain Points
- Noisy neighbor tenants running heavy reports during retail peak hours.
- Handling database schema migrations without incurring downtime for 24/7 stores.

---

## 6. Required Information
- Global tenant registry and subscription status.
- Database connection pool health and query telemetry.
- Global offline sync worker error rates.
