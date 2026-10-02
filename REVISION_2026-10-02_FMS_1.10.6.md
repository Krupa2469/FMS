# FMS Version 1.10.6 — 02-Oct-2026

## Change completed
Redesigned **all dashboard cards throughout the application** to match the **light-colour RTI dashboard card style**.

## What was updated
- Applied a unified light dashboard-card theme across:
  - Home Dashboard cards
  - CPGRAMS / Grievances dashboard cards
  - RTI dashboard cards
  - DISHA dashboard cards
  - General dashboard statistics cards
- Replaced the earlier dark / gradient dashboard card look with soft pastel card backgrounds.
- Added a repeating light colour palette for dashboard cards:
  - light blue
  - light green
  - light yellow
  - light red
  - light violet
  - light teal
- Updated card borders, shadows and hover states for a cleaner and more elegant appearance.
- Updated Home dashboard value buttons so they match the same light RTI-style card design.
- Preserved the existing RTI 5-card row layout while keeping the new common design.
- Bumped visible application version references to **1.10.6**.
- Updated CSS version query strings to help avoid browser cache issues after deployment.

## Main files updated
- `css/style.css`
- `js/app.js`
- `js/dashboard.js`
- HTML files referencing `style.css`

## Output package
Build/package version: **1.10.6**
