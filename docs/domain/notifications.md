# Domain: Automated Customer Notifications & Messaging

**Document Version:** 1.0.0  
**Phase:** Phase 1 — Product Definition & Business Requirements  
**Domain Code:** `26-NOTIFICATIONS`  

---

## 1. Domain Scope: Event-Driven Customer Communications

The **Notifications & Messaging** domain manages transactional messaging triggered by business events across the optical retail lifecycle. It keeps customers informed about spectacle order progress, digital prescriptions, and fiscal receipts while remaining vendor-agnostic.

---

## 2. Notification Triggers & Use Cases

| Event Trigger | Recipient | Channels | Default Message Content Summary |
|:---|:---|:---|:---|
| **Prescription Finalized** | Customer | WhatsApp, SMS | "Dear {name}, your optical prescription from {store} is ready. View your digital prescription card: {link}" |
| **Order Placed (Advance Paid)** | Customer | WhatsApp, SMS, Email | "Thank you for your order #{order_no} at {store}. Total: ₹{total}, Advance: ₹{paid}, Balance: ₹{balance}. Estimated pickup date: {date}." |
| **Lab Job Passed QC (Ready)** | Customer | WhatsApp, SMS | "Good news! Your spectacles for order #{order_no} are ready for pickup at {store}. Store hours: 10am - 8pm." |
| **Delivery Handover Completed** | Customer | WhatsApp, Email | "Thank you for visiting {store}. Your spectacles have been delivered. View your official tax invoice: {link}." |
| **Annual Eye Test Recall** | Customer | WhatsApp, SMS | "Hi {name}, it has been 12 months since your last eye exam at {store}. Protect your vision by visiting us for a check-up." |
| **Low Stock Alert** | Store Manager | Email, In-App | "Low stock warning: Ray-Ban RB3025 is down to 1 unit at {store}." |

---

## 3. Pluggable Notification Gateway Architecture

> [!NOTE]
> **Vendor-Agnostic Messaging Provider Model**  
> In accordance with DEC-013, the messaging engine is built on an abstracted `INotificationProvider` interface. No specific vendor (Twilio, Gupshup, Wati, Meta Cloud API) is hardcoded.

```mermaid
graph TD
    Event[Domain Event: Order Marked READY] --> Engine[Notification Engine]
    Engine --> Template[Template Engine & Variable Interpolation]
    Template --> Queue[Redis BullMQ Dispatch Queue]

    subgraph Providers["Pluggable Drivers"]
        WA[WhatsApp Driver<br/>(Meta Cloud API / Twilio)]
        SMS[SMS Gateway Driver<br/>(DLT Compliant SMS)]
        Email[Email Driver<br/>(SMTP / SendGrid)]
        Push[Native Push Driver<br/>(Firebase Cloud Messaging)]
    end

    Queue --> WA
    Queue --> SMS
    Queue --> Email
    Queue --> Push
```

---

## 4. Indian Regulatory Compliance (DLT & WhatsApp Opt-In)

1. **TRAI DLT (Distributed Ledger Technology) Compliance:** For SMS in India, message templates must include registered Entity IDs, Header IDs, and Template IDs approved on Indian telecom operator DLT portals.
2. **Explicit Consent Tracking:** Customers' explicit opt-in preference is captured during registration (`customer_consents` table). Customers can opt out of promotional messages while continuing to receive critical transactional receipts.
