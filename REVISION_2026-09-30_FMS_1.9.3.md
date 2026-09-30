# FMS 1.9.3 — DISHA report columns and summary-card layout

- Enforces the DISHA Meetings Status Report columns as: Sl.No., District, Meeting Date, PoM Uploaded, PoM Pending Days, Remarks.
- Applies the six-column layout even when an older saved Firestore report definition still contains the former four-column field list.
- Dynamic Sl.No. is generated after filtering/sorting.
- Remarks displays `PoM Uploaded` or `PoM not Uploaded`.
- Adds PoM Pending Days to the DISHA Reports Master field catalog and updates the default DISHA report definition for new setups.
- Changes export preview summary to aligned cards spanning the same width as the data table.
- Reduces the export report title size.
- Applies the summary-card presentation to JPEG, PDF and Print export layouts.
