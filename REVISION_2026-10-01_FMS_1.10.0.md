# FMS Version 1.10.0 — 01-Oct-2026

## Home sidebar pending counts
- Added pending counts for Prajavani, Public Grievances, Direct Complaints, LAQ, LCQ, Court Cases, VIP References, CMO References, PMO References, Audit Paras and Vigilance Cases.
- RTI now shows its pending application count in the Home sidebar.
- DISHA now shows the pending-file count in the Home sidebar.
- Sidebar pending links open the matching filtered all-years register so the displayed records match the count.
- CPGRAMS continues to show separate pending Grievances and pending Appeals counts.

## CPGRAMS / Grievances registers
- Register columns auto-fit the available width and wrap long values instead of forcing wide columns.
- Action buttons wrap compactly to reduce horizontal scrolling.
- `register=grievances` shows only the filtered grievance register; the Appeals Register remains hidden.
- `register=appeals` shows only the filtered Appeals Register.
- Grievance No. is clickable for CPGRAMS and all other grievance/reference types and opens the uploaded document.
- LAQ No. and LCQ No. are clickable and open the uploaded document.

## RTI
- RTI Application No. is clickable in the RTI Register.
- Clicking it opens the uploaded RTI Application document (including Firestore-inline/data URL fallback).

## DISHA
- Added a Pending Files filter based on Status of File; records are pending until explicitly Closed/Disposed/Completed.
- Pending Files register shows District, File No., File Status, Meeting Date, Remarks and Action.

## Version
- Application version updated to 1.10.0 and changed script references cache-busted accordingly.
