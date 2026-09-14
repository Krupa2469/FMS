# FMS Web v1.5.2 — Save/Update/Delete and Firestore Network Fix

- Enabled Firestore long-polling mode to avoid browser QUIC/WebChannel failures during Save, Update, Delete and duplicate checks.
- Fixed CPGRAMS DD/MM/YYYY due-date calculation; NaN-NaN-NaN is no longer generated.
- CPGRAMS Save now works as an upsert for existing grievance numbers and clears the form after successful Save.
- CPGRAMS validation now allows complainant and district to be added later when uploaded documents do not parse those fields.
- Duplicate grievance number blur-check now informs that Save will update the existing record instead of blocking the user.
- RTI Save also updates an existing application number instead of blocking on duplicates.
- Calendar picker warning was made non-blocking and no longer interrupts Save/Upload flows.
