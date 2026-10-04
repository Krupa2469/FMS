# FMS Version 1.10.11 — 04-Oct-2026

## Register layout corrections
- Removed the oversized minimum width previously applied to the first column of the CPGRAMS register.
- Applied content-based **auto-fit column sizing** to CPGRAMS, Appeals, RTI, DISHA, inline registers, Reports, Registers Master and Master register tables.
- Sl.No./S.No. first columns are kept compact (approximately 44–80 px where applicable).
- Long values wrap naturally so the register uses the available screen width efficiently.
- Action columns stay compact.

## Filtered register cleanup
- Removed the descriptive banner text such as `Filtered Register: pending • Grievance Type: CPGRAMS • FY: all`.
- The **Exit Full Screen** control is retained.

## Version
- Application version updated to **1.10.11**.
