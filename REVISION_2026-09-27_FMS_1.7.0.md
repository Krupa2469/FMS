# FMS 1.7.0 — DISHA Filtered Register Runtime Fix

- Added a self-contained DISHA register date parser, fixing the runtime `ReferenceError: parseDate is not defined` that prevented loaded Firestore records from rendering.
- Dashboard filtered registers now render after the Firestore load.
- Districts conducted filter returns one row per conducted district for the selected FY.
- Districts with no meetings filter lists the remaining districts from the 33-district DISHA master list, rather than intentionally returning an empty register.
- Retains DISHA Exit Full Screen -> DISHA home, synchronized Sl.No., duplicate District + Meeting Date validation, and sticky Save/Update/Delete actions from 1.6.9.
- DISHA script cache keys bumped to v1.7.0.
