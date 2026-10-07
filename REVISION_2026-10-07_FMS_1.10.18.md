# FMS Version 1.10.18 — 07-Oct-2026

## Reports / Reports Master changes

- Removed the duplicate **Records** text from the DISHA Meeting Register header. The existing label now shows a single value such as `Records: 20`.
- Reports Master now supports **three filter conditions**:
  - Filter Field 1 / Operator 1 / Filter Value 1
  - Filter Field 2 / Operator 2 / Filter Value 2
  - Filter Field 3 / Operator 3 / Filter Value 3
- Each Filter Value is now a **dropdown** populated with the distinct values available for the selected field in the selected module.
- All three filters are saved in `reportDefinitions`, restored during Edit, displayed in the Reports Master register, and applied together when generating the report.
- Added a **Summary Cards** multi-select to Reports Master. Available summary metrics change with the selected module.
- Report summary cards are now rendered **only from the Summary Cards selected in the saved Reports Master definition**. No summary cards are automatically hard-coded for a custom report.
- If a saved definition has no Summary Cards selected, the Report Summary section and export-preview Summary section remain hidden.
- Existing report definitions remain compatible; they can be edited in Reports Master to choose the required summary cards and additional filters.
- Version and cache-busting references updated to **1.10.18**.
