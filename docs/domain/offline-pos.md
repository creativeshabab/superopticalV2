# Domain: Offline POS & Edge Synchronization

**Document Version:** 2.0.0  
**Phase:** Phase 1 — Product Definition & Business Requirements  
**Domain Code:** `29-OFFLINE-SYNC`  
**Status:** Approved Specification (DEC-008 & DEC-014 Approved)  

---

## 1. Domain Mission: Resilient Retail Counter Continuity

Optical stores in tier-2/tier-3 locations experience intermittent internet outages, ISP cuts, and broadband instability.  
**Super Optical V2 must never freeze or halt checkout operations when internet connectivity drops.**

---

## 2. Offline Operational Capabilities

When disconnected from the cloud server, the POS counter continues to perform:

| Feature | Offline Behavior | Persistence & Fallback Mechanism |
|:---|:---|:---|
| **Customer Search** | Searches locally cached customer index. | Fast read-only query against local IndexedDB (Dexie.js). |
| **Customer Registration** | Allows creating new walk-in customer. | Generates client-side UUIDv7 customer ID; enqueues `CUSTOMER_CREATE` command. |
| **Product Lookup** | Instant barcode scanning and catalog search. | Full store catalog, active prices, and tax rates cached in IndexedDB. |
| **Prescription Entry** | Optometrist records eye refraction test. | Stored locally; prints paper slip; queued for cloud backup upon reconnect. (Free service ₹0). |
| **POS Cart & Sale** | Builds cart, bundles frame + lenses, applies promos. | Generates client-side UUIDv7 sale ID; marks status `LOCAL_PENDING`. |
| **Payment Collection** | Accepts Cash, UPI offline reference, Card. | Generates immutable payment record; allocates to sale; queues for sync. |
| **Receipt Printing** | Prints thermal receipt slip instantly via USB/Bluetooth. | Direct ESC/POS hardware print without cloud roundtrip; tagged *"Offline Receipt"*. |

---

## 3. The Offline Command Queue Protocol

All mutations initiated offline are encapsulated into immutable **Command Envelopes** persisted in IndexedDB:

```mermaid
graph TD
    UserAction[Cashier Completes Offline Sale] --> LocalWrite[Write Optimistic Sale to IndexedDB]
    UserAction --> Enqueue[Create OfflineCommand Envelope:<br/>• command_id: UUIDv7<br/>• device_id: DEV-01<br/>• store_id: STORE-BEG<br/>• command_type: SALE_CREATE<br/>• payload: { sale, items, payment }<br/>• status: PENDING]
    Enqueue --> QueueStore[(IndexedDB: sync_queue)]
    Enqueue --> DirectPrint[Direct Thermal Hardware Print]

    QueueStore -.->|Internet Restored| SyncWorker[Background Sync Worker]
    SyncWorker --> ServerAPI[POST /api/v1/sync/batch]
```

---

## 4. Conflict Detection & Non-Destructive Reconciliation

> [!CAUTION]
> **No Simplistic Last-Write-Wins (LWW)**  
> Server timestamp precedence is strictly forbidden for financial and inventory state. Sync reconciliation must never silently overwrite data.

### Conflict Scenarios & Policies:
1. **Concurrent Stockout Conflict & Emergency Exception (DEC-014):**
   - *Scenario:* Offline POS terminal sells the last Ray-Ban frame. While it was offline, another store counter or online portal sold that same unit.
   - *Server Resolution:* 
     - The financial payment is **ACCEPTED** (preserving customer transaction).
     - The sale is placed in `PROCESSING_EXCEPTION` status.
     - System records an emergency negative inventory adjustment flagged with `CONCURRENT_STOCKOUT_CONFLICT`.
     - Alert raised on store manager dashboard to transfer replacement frame from another store or re-order from supplier.
     - Never silently overwrites or ignores the depleted inventory ledger row.
2. **Concurrent Invoice Revision Conflict:**
   - *Scenario:* Offline cashier modifies an invoice while store manager online applied a customer credit note.
   - *Server Resolution:* 
     - Checked against `aggregate_version`. If server version $>$ client base version, command is quarantined in `sync_conflicts`.
     - Manager reviews side-by-side diff in Conflict Resolution Queue to merge or cancel changes.
