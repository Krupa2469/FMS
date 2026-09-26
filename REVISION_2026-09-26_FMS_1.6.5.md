# FMS v1.6.5 — Grievance Home Return & Dashboard Legibility

- Full-screen grievance Data Entry **Back to Register** now returns to the grievance-type home workspace (`cpgrams.html`) instead of the register-only page.
- The active grievance type and financial year are preserved, so Prajavani returns to the Prajavani home workspace and every other grievance type returns to its own dashboard/register/data-entry context.
- The home workspace now honors `grievanceType` and `fy` query parameters even though CPGRAMS is the HTML default.
- Prajavani Total/Pending/Disposed cards display Total and FY metrics on separate centered lines.
- Dashboard metric typography is reduced and kept on one line per metric for legibility.
- Corrected the CPGRAMS Overdue card to use the current FY/context rows.
