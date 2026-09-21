# Persona: Dispensing Optician

- **Persona ID:** P-06
- **Role Category:** Technical Optical Dispensing
- **Target Organization:** Optical Store Showroom & Dispensing Desk

---

## 1. Responsibilities & Goals
- **Responsibilities:** Taking facial optical measurements (inter-pupillary distance, fitting heights, segment heights for bifocals and progressives), selecting optimal lens index for high diopters, aligning frames to face, troubleshooting visual non-adaptation.
- **Goals:** Precise optical center alignment with patient pupils; zero lens remakes due to incorrect fitting heights; complete frame comfort on customer handover.

---

## 2. Daily Tasks
- Measures monocular PD and fitting heights using digital pupilometer or manual millimeter ruler.
- Validates that customer's chosen frame is structurally compatible with their prescription (e.g. avoiding high minus lenses in large thin-rim frames).
- Enters custom edging parameters (e.g. bevel placement, base curve matching) into the sales order.
- Performs anatomical frame adjustments (nose pads, temple bends, pantoscopic tilt) upon handover.

---

## 3. Permissions & Access Scope
- **Permissions:** `sales:edit_optical_spec`, `prescriptions:view`, `lab:dispatch_job`, `customer:view`.
- **Scope:** Assigned store dispensing desk.

---

## 4. Key Workflows
1. **Technical Fitting Parameter Entry:** Open POS cart line item $\rightarrow$ Enter Mono PD (R/L) $\rightarrow$ Enter Fitting Height $\rightarrow$ Add custom lab fitting notes $\rightarrow$ Confirm optical specifications.
2. **Non-Adaptation Troubleshooting:** Customer reports blurred vision in new glasses $\rightarrow$ Optician checks focimeter power against prescription $\rightarrow$ Checks optical center alignment $\rightarrow$ Logs remake if lab defect found.

---

## 5. Common Problems & Pain Points
- Sales staff taking inaccurate fitting heights, leading to customer progressive lens rejection.
- Workshop edging lenses without noting special bevel requests for high minus prescriptions.

---

## 6. Required Information
- Exact prescription values and optometrist clinical notes.
- Frame boxing system dimensions (A, B, ED, DBL).
- Minimum fitting height specifications for specific progressive lens designs.
