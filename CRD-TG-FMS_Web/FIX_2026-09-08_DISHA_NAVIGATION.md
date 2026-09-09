# DISHA Daily Status Navigation Fix - 2026-09-08

Fixed `modules/disha/disha-daily-status.js` so page controls are bound during initialization.

- **Back to DISHA** returns to the DISHA module dashboard.
- **Home** returns to the FMS home page.
- **Refresh** reloads DISHA records and rebuilds the daily status.
- **Print / PDF** opens the browser print dialog.
- Summary card links now open the corresponding filtered DISHA register.
- Control binding occurs before Firestore loading, so navigation remains available even if data loading fails.
