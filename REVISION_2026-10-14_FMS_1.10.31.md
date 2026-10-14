# FMS Version 1.10.31 — 14-Oct-2026

## Filtered Report Summary / Dashboard Cards

### Change
Report Summary/dashboard cards now use the same filtered record population as the generated report instead of always using the complete Financial Year/date-range dataset.

### Behaviour
- Flat custom reports: report-level Filter 1/2/3 apply to both detail rows and selected Summary Cards.
- Sectioned reports: section filters apply to the Summary Cards through the union of records represented by the relevant filtered sections.
- Multiple filters inside a section continue to work as AND conditions; different relevant sections contribute their matching records without duplicate counting.
- Summary cards selected from GRIEVANCES, RTI and DISHA are filtered using the filters relevant to their own module where available.
- `Total Received <FY>` now reflects the filtered report population. Example: a Public Grievances report containing 1 matching record shows Total Received = 1 rather than the complete GRIEVANCES FY count.
- GRIEVANCES cards such as Within Due Date, Due Today, Overdue, ATR/Reply Awaited, Disposed/Closed and Appeals cards use the same filtered rows.
- `Total Received since 2014-15`, when selected, applies the same report/section filters while using the all-years period from 2014-15 onward.
- Export Preview, PDF, JPEG, Excel, Print and Share continue to use the same Summary values shown on screen.

### Preserved
Custom main headings, sections, section-wise filters, filter-value dropdowns, three-level sorting, mobile responsiveness, report auto-fit, light report colours and export functionality remain unchanged.

Application version: **1.10.31**
