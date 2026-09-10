# FMS Web v1.2.7 — Grievance Workspace and Register Context

- Home: Master Tables and Central Reports cards moved to the bottom.
- Grievance Type selector moved immediately below New/Save/Update/Delete toolbar.
- Grievance Type `GRIEVANCES` renamed to `CPGRAMS` in the data-entry selector; legacy `GRIEVANCES` records remain compatible.
- Financial Year selector placed immediately below Grievance Type; current FY is the default.
- On selecting a Grievance Type, the page order is now: selected-type Dashboard -> selected-type Register -> Data Entry Form.
- Dashboard and register use the exact same active + Grievance Type + FY record set.
- Embedded register title changes by type (for example CPGRAMS Register, LAQ Register, LCQ Register).
- Register columns change by Grievance Type to mirror the corresponding data-entry fields.
- Separate Grievances Register now uses a Grievance Type dropdown instead of the Grievance Number search box.
- Dashboard drill-down opens the respective filtered register in full-screen mode.
- Legacy records and Firestore collection names are preserved.
