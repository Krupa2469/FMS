# FMS Version 1.10.32 — 14-Oct-2026

## Grievance-Type Scoped Report Summary Cards

Report dashboard/summary cards under the GRIEVANCES module are now restricted to the grievance type represented by the report.

### Behaviour
- If a report is filtered for `Public Grievances`, every selected GRIEVANCES summary card calculates only from Public Grievances records.
- If a report is filtered for `Prajavani`, cards calculate only from Prajavani records.
- If a report is filtered for `CPGRAMS`, cards calculate only from CPGRAMS records.
- The same scope is supported for Direct Complaints, LAQ, LCQ, Court Cases, VIP References, CMO References, PMO References, Audit Paras and Vigilance Cases.
- Grievance type is detected from the report/section Grievance Type filter. For compatible existing reports, the report name/main heading is also used as a fallback when it clearly names a grievance type.
- Existing report and section filters continue to apply after the grievance-type scope is established.
- `Total Received <FY>` and all workflow/status cards therefore use the same grievance-type population.
- Export Preview, PDF, JPEG, Excel and Print continue to receive the same report summary array, so the scoped values are consistent across outputs.

Application version: **1.10.32**
