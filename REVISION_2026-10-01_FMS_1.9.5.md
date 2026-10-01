# FMS v1.9.5 — 01/10/2026

- Home dashboard now runs/awaits the 30-09-2026 PMO/DARPG import before calculating totals.
- Import is idempotent and updates matching records so DARPG items remain classified under CPGRAMS and PMO items under PMO References.
- Prajavani and Public Grievances FY cards derive FY from the actual record date before any stale legacy FY value.
- Application/footer version updated to 1.9.5 with cache-busting on the home page.
- CPGRAMS, RTI and DISHA registers default to Date latest first.
- Inline grievance register is sorted by record Date, not last modified time.
- Standard reports default to Date latest first; custom date sorts are parsed as dates instead of text.
- Register field sorting is date-aware for DD/MM/YYYY and YYYY-MM-DD values.
