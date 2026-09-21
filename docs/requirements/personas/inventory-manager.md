# Persona: Inventory Manager

- **Persona ID:** P-07
- **Role Category:** Supply Chain & Stock Control
- **Target Organization:** Optical Central Warehouse / Store Stockroom

---

## 1. Responsibilities & Goals
- **Responsibilities:** Managing frame and lens inventory across stores, issuing supplier purchase orders, verifying incoming goods against supplier invoices, conducting physical inventory audits, managing inter-store stock transfers.
- **Goals:** Zero stockouts on best-selling frames and standard lens blanks; 100% stock count accuracy during audits; zero unrecorded stock movements.

---

## 2. Daily Tasks
- Checks reorder-point notifications and generates purchase orders for frames and lenses.
- Receives vendor shipments, checks physical contents against purchase orders, and prints barcode labels.
- Approves and dispatches stock transfer requests between branches.
- Conducts cyclical stock counts and logs physical adjustments with reason codes.

---

## 3. Permissions & Access Scope
- **Permissions:** `inventory:view`, `inventory:adjust`, `inventory:transfer_manage`, `procurement:manage`, `suppliers:manage`, `barcodes:print`.
- **Scope:** Tenant-wide warehouse and store stockrooms.

---

## 4. Key Workflows
1. **Purchase Order to Goods Receipt:** Create PO for supplier $\rightarrow$ Receive delivery $\rightarrow$ Scan items $\rightarrow$ Confirm Goods Receipt Note (GRN) $\rightarrow$ System updates `store_inventory` and writes `PURCHASE_RECEIPT` movements $\rightarrow$ Print barcode price tags.
2. **Inter-Store Stock Transfer:** Store A requests 5 frames $\rightarrow$ Inventory Manager dispatches from Store B $\rightarrow$ System sets stock to `TRANSFERRED` $\rightarrow$ Store A scans upon delivery $\rightarrow$ Stock moves to Store A `AVAILABLE`.

---

## 5. Common Problems & Pain Points
- Inventory numbers drifting because staff swap frames without logging transfers.
- Supplier invoices listing different prices than agreed purchase orders.
- Manual data entry errors when typing long barcode strings.

---

## 6. Required Information
- Real-time stock levels (on hand, reserved, available, transferred).
- Minimum reorder levels and supplier lead times.
- Inventory movement audit ledger with user and timestamp attribution.
