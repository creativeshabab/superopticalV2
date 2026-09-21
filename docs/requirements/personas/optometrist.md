# Persona: Optometrist

- **Persona ID:** P-05
- **Role Category:** Clinical Refraction & Eye Health
- **Target Organization:** Optical Store Refraction Room

---

## 1. Responsibilities & Goals
- **Responsibilities:** Performing comprehensive eye refraction examinations, measuring visual acuity (unaided and best-corrected), evaluating binocular vision, prescribing corrective optical lenses (distance, near, progressive), recommending optical coatings.
- **Goals:** Flawless prescription accuracy with zero transposition errors; fast refraction data entry; tracking patient prescription progression over time.

---

## 2. Daily Tasks
- Selects customer from optical examination queue.
- Reviews patient's previous optical prescriptions and current complaints.
- Performs objective (auto-refractometer / retinoscope) and subjective refraction.
- Enters OD (Right Eye) and OS (Left Eye) parameters: SPH, CYL, AXIS, ADD, PD, Prism.
- Finalizes prescription with clinical advice (e.g., "Recommend high-index progressive with blue-filter").
- Signs and generates digital optical prescription card.

---

## 3. Permissions & Access Scope
- **Permissions:** `clinical:examination_create`, `clinical:examination_edit_own`, `prescriptions:create`, `customer:view`.
- **Scope:** Assigned store clinic.

---

## 4. Key Workflows
1. **Refraction & Prescription Recording:** Open customer $\rightarrow$ Start Eye Test $\rightarrow$ Enter Visual Acuity (VA) $\rightarrow$ Enter OD/OS SPH, CYL, AXIS, ADD, PD $\rightarrow$ Check auto-transposition preview $\rightarrow$ Finalize $\rightarrow$ Prescription automatically attaches to customer profile.
2. **Clinical History Review:** View patient profile $\rightarrow$ Compare current refraction side-by-side with prior year refraction $\rightarrow$ Discuss power change with patient.

---

## 5. Common Problems & Pain Points
- Cumbersome software with dozens of unnecessary general medical fields getting in the way of fast optical refraction entry.
- Miskeying cylinder or axis values resulting in optical remakes.
- Lost historical paper prescription records.

---

## 6. Required Information
- Streamlined optical refraction form (OD/OS, SPH, CYL, AXIS, ADD, PD, Prism, VA).
- Side-by-side historical prescription viewer.
- Standardized lens recommendation shortcuts.
