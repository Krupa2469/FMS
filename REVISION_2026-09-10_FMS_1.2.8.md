# FMS Web v1.2.8 — All Grievances Data Import

- Prepared 106 CPGRAMS records from the supplied **All Grievances.pdf**.
- Source fields mapped without inventing missing data:
  - Registration Number -> `grievanceNumber` and `registrationNumber`
  - Name -> `complainantName`
  - Org Received Date -> `dateReceived`
  - Dairy Date -> `diaryDate`
  - Grievance Type -> `CPGRAMS`
- Other Data Entry fields are not overwritten, so they can be completed later.
- Added `data/all-grievances-2026-09-10.json` and CSV audit copy.
- Added `pages/admin/import-all-grievances.html`:
  - previews all 106 prepared records,
  - reads the current Firestore `cpgrams` collection,
  - upserts by normalized Registration Number,
  - preserves unrelated existing fields,
  - verifies that all supplied Registration Numbers exist after import,
  - records migration metadata in `systemMigrations/all-grievances-2026-09-10`.
- Added an **Import All Grievances** shortcut to Master Tables.
