# FMS Version 1.10.13 — 05-Oct-2026

## Grievance register column overlap correction

- Corrected the inline Grievance/Prajavani register where **Grievance No.** and **Date Received** were overlapping.
- Removed the incorrect rule that treated the first column of every inline grievance register as a narrow serial-number column.
- Serial-number width is now applied only when the register actually contains an S.No. column, such as LAQ/LCQ.
- Added field-aware widths to the inline grievance register:
  - Grievance No. gets a dedicated readable width and can wrap safely.
  - Date Received stays on one line in a dedicated date column.
  - Complainant Name, Subject, District, Mandal, Village, status and Action columns receive sensible minimum widths.
- Added `data-field` markers to generated register headers/cells so column sizing stays aligned with the correct field.
- Horizontal scrolling remains available on smaller screens and wide registers.
- Version and cache-busting references updated to **1.10.13**.
