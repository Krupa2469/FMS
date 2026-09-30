# FMS v1.9.1 — Reports Master Fields & DISHA Status Report

Date: 30/09/2026

## Changes
- Reports Master field catalog expanded so every non-file data-entry control from CPGRAMS, RTI and DISHA is available for custom report selection, filtering and sorting.
- CPGRAMS and RTI appeal data-entry fields are included in Reports Master.
- Uploaded document/file-name fields are exposed where they are persisted in the record.
- DISHA Meetings Status Report table standardized to:
  1. Sl.No.
  2. District
  3. Meeting Date
  4. PoM Uploaded
  5. PoM Pending Days
  6. Remarks
- DISHA Sl.No. is generated dynamically for the report.
- PoM Uploaded displays Yes/No.
- Remarks displays exactly `PoM Uploaded` or `PoM not Uploaded` according to PoM status.
- PoM Pending Days is calculated from Meeting Date to today only for meetings already due/held with PoM not uploaded; future meeting dates remain blank.
- Existing report summary cards, export preview, Excel/PDF/JPEG, print and share functions are retained.
