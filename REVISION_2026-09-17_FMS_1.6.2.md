# FMS Version 1.6.2 — CPGRAMS Section Titles and Register Columns

Date: 2026-09-17

## Changes

- Simplified CPGRAMS form section captions:
  - GRIEVANCE DETAILS
  - COMPLAINANT DETAILS
  - OFFICE PROCESSING
- Removed `SECTION 1 :`, `SECTION 2 :`, and `SECTION 3 :` prefixes from the visible headings.
- Replaced the CPGRAMS inline and full-screen register columns with:
  - Grievance No.
  - Date Received
  - Complaint Name
  - Subject
  - District
  - Mandal
  - Village
  - ATR Status
  - Grievance Status
  - Action
- Removed Sl.No. from CPGRAMS register views only.
- ATR Status now shows the saved ATR Status value when present instead of reducing all values to only Received/Awaited.
- Grievance Status uses the existing final status mapping (Pending / Disposed).
- Bumped CPGRAMS page/cache version references to 1.6.2.

## Compatibility

- No Firestore fields are deleted or migrated.
- Other grievance-type register layouts are unchanged.
