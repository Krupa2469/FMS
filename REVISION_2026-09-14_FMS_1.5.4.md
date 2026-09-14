# FMS Web v1.5.4 - Dashboard/Register Refresh After CRUD

Date: 2026-09-14

## Fixes
- CPGRAMS Save/Update now updates the inline dashboard and register immediately after a successful Firestore write.
- Added local upsert/remove in Grievances Workspace so the newly saved or updated record is reflected without waiting for Firestore cache/server refresh.
- Added forced server refresh after Save/Update/Delete to reconcile data from Firestore.
- Newly saved/updated row is highlighted and shown at the top of the inline register.
- Added selected Financial Year to saved grievance records.
- Delete now removes the row from the inline register immediately and then refreshes from Firestore.
- Firebase CRUD list now supports forceServer/source server reads.

## Validation
- JavaScript syntax checked.
- ZIP integrity checked.
