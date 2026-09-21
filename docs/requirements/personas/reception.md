# Persona: Reception / Front Desk

- **Persona ID:** P-04
- **Role Category:** Customer Intake & Triage
- **Target Organization:** Optical Store Front Desk

---

## 1. Responsibilities & Goals
- **Responsibilities:** Welcoming incoming customers, registering new patient profiles, linking family members, managing the in-store optical refraction waiting list, answering phone inquiries.
- **Goals:** Under 5 seconds customer profile lookup; clean phone database with zero duplicate records; friendly, efficient customer intake.

---

## 2. Daily Tasks
- Searches customer by phone number or full name.
- Registers walk-in customers and captures consent for notifications.
- Links dependent family members under primary customer account.
- Queues customer for optometrist eye test or directs them to frame displays.
- Reprints customer receipts or optical prescription cards upon request.

---

## 3. Permissions & Access Scope
- **Permissions:** `customer:create`, `customer:edit`, `customer:view`, `prescriptions:view_card`.
- **Scope:** Assigned store location.

---

## 4. Key Workflows
1. **Walk-in Customer Intake:** Type 10-digit mobile number $\rightarrow$ If found: Confirm name & address $\rightarrow$ If new: Register customer $\rightarrow$ Add to optometrist queue.
2. **Family Member Registration:** Open primary customer $\rightarrow$ Click 'Add Family Member' $\rightarrow$ Enter relative name, relation (e.g. 'Daughter'), DOB $\rightarrow$ Save.

---

## 5. Common Problems & Pain Points
- Duplicate customer accounts created when customers give alternate phone numbers.
- Inability to quickly see if a customer has an existing spectacles order ready for pickup.
- Cluttered manual paper registers for customer visits.

---

## 6. Required Information
- Fast search index for customers by mobile, name, or customer code.
- Immediate visual indicators showing active family members and pending orders.
