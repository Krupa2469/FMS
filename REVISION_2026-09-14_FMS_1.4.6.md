# FMS Web v1.4.6 — Save, Attachments and Document Parsing Fix

Date: 14/09/2026

## Fixes

- Fixed client save/update failure caused by expired Firestore and Storage development rules.
- Updated GitHub Actions merge workflow to deploy Firestore rules and Storage rules before Firebase Hosting.
- Save in Grievances/CPGRAMS now uploads selected Grievance Document, Memo/Letter, ATR/Reply and Attachment files after the record is created.
- After successful Save, the Grievances form is cleared and ready for a new CPGRAMS entry.
- Update also uploads any newly selected document files without losing existing fields.
- Memo/Letter upload now parses the document and fills Memo/Letter No., Date, Communication Type, Addressed To, File No. and Subject where available.
- ATR/Reply upload now parses the document and fills ATR Status, ATR Date, Received From and ATR Summary where available.
- Attachment upload now shows clear validation messages instead of silently failing.
- Added Firestore inline attachment fallback for small files when Firebase Storage is unavailable or temporarily blocked.
- Updated shared attachment service used by DISHA and other pages with the same Storage fallback.
- Updated RTI attachment upload with the same fallback.
- Fixed common showMessage compatibility so both showMessage(message,type) and showMessage(type,message) work across the app.

## Important deployment note

After pushing this ZIP to master, GitHub Actions deploys Firestore rules, Storage rules and Hosting. If deploying manually, run:

```bash
firebase deploy --only firestore:rules,storage,hosting --project crd-tg-fms-2026
```
