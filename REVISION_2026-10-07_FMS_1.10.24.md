# FMS Version 1.10.24 — 07-Oct-2026

## Reports Master — global section fields and dashboard cards

- Report Sections can now select fields from **all operational modules**:
  - GRIEVANCES
  - RTI
  - DISHA
- Section field selectors are grouped module-wise for easier selection.
- Section-wise filter fields are also available from all modules.
- Filter Value dropdowns load values from the module that owns the selected section filter field.
- The field catalogue is enriched from **Form Fields Master** at runtime, so active/visible custom fields are also available in report sections.
- Dashboard / Summary Cards in Reports Master now show cards from **GRIEVANCES, RTI and DISHA** together, regardless of the report's base module.
- Selected dashboard cards from multiple modules can appear together in the same generated Report and Export Preview.
- Summary-card values continue to use the complete selected FY/date-range dataset for their own module and are not reduced by section filters.
- Existing saved report definitions using older unqualified field/card keys remain compatible.
- Existing custom main heading, report sections, section-wise filters, sorting, date range, exports, print, share and flat-report behavior are retained.
