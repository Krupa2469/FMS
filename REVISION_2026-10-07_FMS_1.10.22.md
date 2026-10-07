# FMS Version 1.10.23 — 07-Oct-2026

## Report summary totals corrected

### Change
Report Summary cards are now calculated from the complete selected Financial Year/date-range dataset, not from the records remaining after report-level or section-level filters.

### Behaviour
- Section filters continue to control only the records shown inside that section.
- Flat report filters continue to control only the report detail rows.
- Summary Cards selected in Reports Master remain unchanged.
- `Total Received 2026-27` now shows all eligible records for FY 2026-27 even when the report section/table is filtered to a smaller subset.
- Other selected summary cards (Within Due Date, Due Today, Overdue, ATR/Reply Awaited, etc.) are also calculated from the complete selected FY/date-range dataset.
- Export Preview, PDF, Excel, JPEG and Print continue to use the same corrected Summary values.

### Compatibility
Existing Reports Master definitions, section filters, three-filter support, custom main headings, report sections, sorting, exports, print and sharing are retained.

Application version: **1.10.23**
