# FMS v1.6.7 — DISHA Data, Dashboard & Register

- Updated DISHA FY 2026-27 source data from the supplied workbook (I Quarter and II Quarter; source status dated 24-09-2026).
- Added idempotent Firestore synchronization keyed by District + Meeting Date so the supplied DISHA records populate without creating duplicate district/date meetings.
- Save and Update now reject an active DISHA record when the same District + Meeting Date already exists; Update excludes the record currently being edited.
- Save / Update / Delete toolbar is sticky while the DISHA form scrolls.
- DISHA register now waits for Firebase readiness before loading, and refreshes after source-data synchronization.
- Dashboard cards redesigned to: Meetings Held (Since Inception + CFY), PoM Uploaded, PoM Pending (count + maximum days after meeting), Districts with no meetings (Total + CFY), Districts conducted meetings (Total + CFY).
- DISHA register columns redesigned to: Sl.No, District, Meeting Date, PoM Uploaded, PoM Pending Days, Bills Status, Remarks, Action.
- Data Entry Form fields retained.
