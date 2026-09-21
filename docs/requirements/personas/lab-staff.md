# Persona: Optical Lab Technician

- **Persona ID:** P-09
- **Role Category:** Lens Processing & Workshop Fitting
- **Target Organization:** In-Store Workshop / Central Optical Laboratory

---

## 1. Responsibilities & Goals
- **Responsibilities:** Reviewing optical lab jobs, pulling frame and uncut lens blanks, setting up CNC lens edging machines, beveling, grooving, assembling lenses into frames, performing quality control (QC) inspection on focimeter, packing spectacles.
- **Goals:** Zero lens breakage during edging; zero axis deviation; 100% adherence to prescription tolerances (ISO/ANSI); rapid turnaround from order confirmation to `READY`.

---

## 2. Daily Tasks
- Checks optical lab dashboard for newly assigned jobs.
- Verifies lens blank power on focimeter against prescription before edging.
- Edges lenses according to frame tracing and bevel profile.
- Mounts lenses into frame and cleans spectacles.
- Conducts final optical QC inspection: verifies SPH, CYL, AXIS, ADD, PD, prism, and cosmetic condition.
- Signs off digital QC checklist and marks order `READY_FOR_DELIVERY`.

---

## 3. Permissions & Access Scope
- **Permissions:** `lab:view`, `lab:update_status`, `lab:qc_signoff`, `lab:log_rework`.
- **Scope:** Assigned optical lab / workshop.

---

## 4. Key Workflows
1. **Lab Job Execution:** Open Job $\rightarrow$ Verify Prescription & Frame $\rightarrow$ Mount & Edge Lenses $\rightarrow$ Fit in Frame $\rightarrow$ Complete QC Checklist $\rightarrow$ Mark `READY` $\rightarrow$ System triggers customer notification.
2. **Lens Remake Logging:** Lens chips during edging $\rightarrow$ Click 'Log Rework' $\rightarrow$ Select reason ('Edge Chipping') $\rightarrow$ System logs waste, deducts replacement lens blank, updates ETA.

---

## 5. Common Problems & Pain Points
- Unclear or missing lens specifications on paper slips (e.g. bevel type, pupil height).
- Edging incorrect lens powers due to handwritten prescription confusion.
- Inability to notify store sales staff immediately when a supplier lens delivery is delayed.

---

## 6. Required Information
- Clear digital lab job ticket with exact OD/OS prescription numbers, PD, and lens brand/index.
- Frame parameters and special mounting instructions.
- Tolerances guide and digital QC sign-off checklist.
