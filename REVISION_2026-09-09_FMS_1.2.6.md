# FMS Web v1.2.6 — Dashboard/Register Consistency + Operational Data Reset

- Home, module dashboards, registers and Central Reports now use the same active-record and Financial-Year rules.
- Soft-deleted records (`active:false`) are excluded everywhere.
- GRIEVANCES FY date fields include LAQ/LCQ `questionReceivedDate`.
- RTI and DISHA FY date fallbacks are aligned across all views.
- DISHA summary cards respect the selected FY rather than forcing current FY.
- GRIEVANCES register summary uses the same selected-FY records as dashboard cards.
- One-time reset utility: `pages/admin/reset-operational-data.html`.
- Reset deletes operational GRIEVANCES, RTI, DISHA and attachment metadata only; master tables/report definitions are preserved.
