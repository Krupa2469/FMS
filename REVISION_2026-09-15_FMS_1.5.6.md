# FMS Web v1.5.6 - CPGRAMS Dashboard/Register Live Refresh + Cache Fix

- Added cache-busting (`?v=1.5.6`) to the CPGRAMS save, workspace, register and Firebase CRUD scripts.
- Added Firebase Hosting no-cache headers for HTML/JavaScript so an old CPGRAMS controller cannot continue running after a deployment.
- Save now updates the inline dashboard and inline register immediately from the successfully-created Firestore record, then verifies with a server refresh while preserving the just-saved row against a temporarily stale snapshot.
- Added same-tab, cross-tab and cross-page CPGRAMS change notifications using `fmsRecordChanged`, `localStorage` and `BroadcastChannel`.
- The full CPGRAMS register automatically reloads when Save/Update changes are made in another page/tab.
- Updated CPGRAMS and register visible versions to 1.5.6 and added console build markers.

## Verification
After deployment, the browser console must show:
- `GRIEVANCES Version 5.6 Initializing...`
- `FMS Grievances Workspace v1.5.6 loaded`

A new Save should immediately increase the dashboard total and inline register count before the Firestore verification refresh completes.
