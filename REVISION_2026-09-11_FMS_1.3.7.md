# FMS Web v1.3.7 — Home FY Label and Mark Disposed Fix

- Home dashboard cards now show the selected FY label, for example 2026-27, instead of the generic text Current FY.
- Home dashboard status text now uses FY <selected year> consistently.
- Fixed Mark Existing Grievances Disposed utility by avoiding a global db() function name collision that overwrote window.db.
- The status update utility now validates the Firestore instance before running batch updates.
- Existing grievance records can be marked Disposed / Closed after deploying this version and running the utility again.
