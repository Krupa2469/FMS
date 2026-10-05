# FMS Version 1.10.14 — 05-Oct-2026

## Dynamic S.No. in all registers

Added a display-only **S.No.** column to all main FMS registers.

### Behaviour
- S.No. is generated dynamically from the current displayed order.
- It is not stored in Firestore and does not modify record IDs.
- After sorting, filtering, searching, deleting, or refreshing, S.No. is recalculated automatically.
- In paginated CPGRAMS registers, numbering continues across pages (for example 1–25, 26–50, etc.).

### Registers covered
- CPGRAMS Grievances
- CPGRAMS Appeals
- Prajavani
- Public Grievances
- Direct Complaints
- LAQ
- LCQ
- Court Cases
- VIP References
- CMO References
- PMO References
- Audit Paras
- Vigilance Cases
- RTI Applications
- DISHA registers / pending files
- CPGRAMS search results
- Existing Master/Reports/Registers Master grids continue using their dynamic serial numbering.

### UI
- S.No. is kept as a compact fixed-width column to avoid consuming unnecessary register space.

Application version: **1.10.14**
