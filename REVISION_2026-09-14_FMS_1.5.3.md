# FMS Web v1.5.3 — CPGRAMS Save Focus and CRUD Stability Fix

Date: 2026-09-14

## Fixes

- Fixed CPGRAMS Save behavior that appeared to jump back to the Grievance Type selector after saving.
- Removed automatic focus on the Grievance Type dropdown during form clear/reset.
- After successful Save, the form is cleared for new entry while keeping the selected Grievance Type and Financial Year context.
- Added a top action message area so Save/Update/Delete success or error messages are visible immediately.
- Improved CPGRAMS Save progress messages.
- Existing grievance lookup is now timeout-protected so Save cannot get stuck while checking duplicates.
- Firebase CRUD service now prefers Firebase SDK writes/reads with forced long-polling, with REST fallback retained.
- Create, Update, Soft Delete and List operations use one stable common path.
- Updated app version to 1.5.3.

## Validation

- JavaScript syntax validation passed.
- ZIP integrity check passed.
