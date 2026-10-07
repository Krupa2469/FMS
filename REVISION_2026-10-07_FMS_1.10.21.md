# FMS Version 1.10.21 — 07-Oct-2026

## Reports Master — Section-wise Filters

This release changes report filtering for reports that use configurable sections.

### Changes
- Each Report Section in Reports Master now has its own three filter conditions:
  - Filter Field 1 / Operator 1 / Filter Value 1
  - Filter Field 2 / Operator 2 / Filter Value 2
  - Filter Field 3 / Operator 3 / Filter Value 3
- Filter Value is a dropdown populated from the actual values available for the selected section filter field.
- Section filters apply only to the section in which they are configured; they no longer filter the whole report.
- Different sections in the same report can therefore show different record groups, for example Pending, Closed, a particular District, or a particular Grievance Type.
- The report screen and export preview render each section using its own filtered rows.
- Excel, PDF, JPEG and Print exports preserve the same section-specific record sets.
- Report-level filters are retained only for flat reports with no sections, preserving existing non-sectioned report definitions.
- Existing sectioned reports that used older report-level filters are migrated on edit by copying those filters into their sections, so the prior output is retained until the section filters are changed.
- Existing report features remain unchanged: custom main heading, section headings/fields, summary-card selection, date range, three-level sorting, export, print and share.

### Version
Application version: **1.10.21**
