# FMS Version 1.10.20 — 07-Oct-2026

## Reports Master — Custom Main Heading and Sectioned Reports

This release extends Reports Master while retaining the existing report definition features such as module selection, three dynamic filters, sorting, date range, summary cards, exports, print and sharing.

### New Reports Master features
- Added **Custom Main Heading**. This heading is displayed and exported as the report's main title. If left blank, the existing Report Name is used.
- Added a dynamic **Report Sections** builder.
- Any number of report sections can be added.
- Each section has:
  - a custom Section Heading;
  - a multi-select list of fields/columns for that section;
  - Move Up / Move Down controls;
  - Remove control.
- Existing flat **Fields / Columns** remain available as the fallback layout when no sections are configured.
- When sections are configured, the report fields are automatically derived from the fields selected in those sections.
- Existing report definitions without sections remain fully compatible.

### Report output
- Saved report sections render as separate headed tables on the Reports screen.
- The same section headings and field groupings are shown in the full-screen export preview.
- Section layout is carried into:
  - Excel export;
  - PDF export;
  - JPEG export;
  - Print;
  - shared/downloaded report files.
- Existing filters, three-level sorting, financial-year/date controls and selected Summary Cards remain unchanged.

### Validation
- Reports Master requires either flat report fields or at least one valid report section.
- Each configured section requires a heading and at least one field.
- JavaScript syntax checks passed for Reports Master, Reports and Export Service.
- v1.10.18 report filter/summary tests passed.
- v1.10.20 sectioned-report checks passed.

Version: **1.10.20**
