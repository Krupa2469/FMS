# FMS 1.7.6 — DISHA Dynamic Sl.No. and FY Filters

- DISHA Sl.No. is now dynamic from active records rather than legacy/imported serial values.
- New record Sl.No. = active record count + 1; deletion automatically closes gaps in displayed registers.
- View/Edit synchronizes the form Sl.No. to the record's current dynamic sequence.
- Added Financial Year selector to DISHA home workspace; current FY is the default.
- Home DISHA register is filtered year-wise using Meeting Date (April–March FY).
- DISHA dashboard uses the same selected FY while retaining all-years totals on cards that show Total + FY.
- Standalone/full-screen DISHA register retains its FY selector and current-FY default.
