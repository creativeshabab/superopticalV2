# Persona: Sales Staff / Eyewear Stylist

- **Persona ID:** P-03
- **Role Category:** Frontline Retail & Dispensing
- **Target Organization:** Optical Store Showroom

---

## 1. Responsibilities & Goals
- **Responsibilities:** Assisting walk-in customers with frame selection based on facial structure and prescription, presenting lens options (anti-reflective, blue-cut, progressives), creating quotations and sales carts.
- **Goals:** High average order value (AOV); high conversion of refraction prescriptions into complete eyewear sales; prompt customer satisfaction.

---

## 2. Daily Tasks
- Welcomes customer and looks up profile by mobile phone.
- Scans frame barcodes to check price, material, and available color variants.
- Recommends lens packages matching the optometrist's clinical prescription.
- Configures optical bundles (Frame + Lens + Coating) and enters sales orders.
- Issues draft quotations or advances payment receipts.

---

## 3. Permissions & Access Scope
- **Permissions:** `sales:create`, `customer:view`, `customer:create`, `catalog:view`, `prescriptions:view`, `sales:create_quote`.
- **Scope:** Assigned store location.

---

## 4. Key Workflows
1. **Optical Bundle Checkout:** Search customer $\rightarrow$ Scan frame barcode $\rightarrow$ Link active prescription $\rightarrow$ Select lens brand & coating $\rightarrow$ Apply eligible promo $\rightarrow$ Send to Cashier for payment.
2. **Quotation Generation:** Build cart $\rightarrow$ Save as Quotation $\rightarrow$ Send estimate via WhatsApp to customer.

---

## 5. Common Problems & Pain Points
- Searching multiple drawers to find if a frame color variant is in stock.
- Confusing manual lens price calculations involving cylinder and index surcharges.
- Inability to quickly check what frame style the customer purchased last year.

---

## 6. Required Information
- Real-time store frame inventory by color and size.
- Pre-configured lens catalog with transparent add-on pricing.
- Customer's active prescription and past purchase history.
