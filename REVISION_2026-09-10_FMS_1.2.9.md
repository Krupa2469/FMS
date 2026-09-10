# FMS Web v1.2.9 — Grievances Register Loading Fix

- Fixed Grievances register not loading after the Grievance Number search box was replaced by the Grievance Type dropdown.
- Removed unsafe optional calls to undeclared helpers in the Grievances register controller.
- Register now loads Firestore directly and consistently filters by Grievance Type + Financial Year.
- CPGRAMS is selected by default in the Grievances Register so imported CPGRAMS records are visible immediately.
- Dashboard drill-down URLs using `grievanceType=CPGRAMS` are now supported in the register.
- Register columns continue to match the selected Grievance Type data-entry form.
- Firebase Storage initialization is now safe on pages that do not load storage-compat.js.
- Removed stray top-level `editRecord()` call from the Grievances data-entry controller.
