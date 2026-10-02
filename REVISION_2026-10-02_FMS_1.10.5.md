# FMS Version 1.10.5 — 02-Oct-2026

## Registers Master

Added a new **Registers Master**, similar to Reports Master, for centrally maintaining register layouts.

### Register Master functions
- Create, view, update and delete register definitions.
- Select the target register:
  - CPGRAMS Grievances
  - CPGRAMS Appeals
  - Other Grievance Types
  - LAQ / LCQ
  - RTI Applications
  - DISHA Meetings
  - DISHA Pending Files
- Select which fields/columns must appear in each register.
- Maintain register column order based on the field list.
- Maintain default sort field and direction.
- Active / inactive definition control.
- Auto-fit columns option.
- Restore standard default register layouts.
- Only one active layout is maintained for each target register.

### Integration
The active Register Master definition now controls the displayed columns for:
- CPGRAMS / grievance registers
- CPGRAMS Appeals register
- LAQ / LCQ register
- RTI Applications register
- DISHA Meetings register
- DISHA Pending Files register

If no active Register Master definition exists, the application safely uses the built-in register layout.

### Navigation
- Added **Registers Master** button in Master Tables.
- Added **Registers Master** button in Reports Master.

Application version updated to **1.10.5**.
