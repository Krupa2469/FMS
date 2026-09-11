# FMS Web v1.3.5 — Workflow Redesign

Implemented workflow-based dashboards, registers, data-entry fields and reports.

## CPGRAMS
- Due date is calculated as Date Received + 21 days.
- Added workflow fields for file put-up to JC through AO, memo/letter to concerned officer/DRDO, ATR status, JC/EGS approval, reply to complainant and CPGRAMS portal upload.
- Dashboard cards now show workflow stages including ATR Awaited, ATR Received, Pending Approval, Portal Upload Pending and Disposed/Closed.
- Registers display workflow columns and calculated days left/overdue.

## Other Grievances
- Prajavani, Public Grievances, Direct Complaints, Court Cases, VIP/CMO/PMO References, Audit Paras and Vigilance Cases use the same workflow structure with reply to Government/referring authority as the final closure step.
- Prajavani wording reflects receipt from JC, Admin and reply back to JC, Admin.

## RTI
- Due date is calculated as Application Date + 30 days.
- Added section routing, reply received, reply sent and final disposal fields.
- RTI dashboards/registers now show workflow stages and days left/overdue.

## DISHA
- Meeting tracking focuses on PoM upload status.
- If PoM uploaded is Yes, status displays Yes.
- If PoM uploaded is No, days elapsed after the meeting are displayed.
- Dashboard shows PoM pending ranges: 0-7 days, 8-15 days and more than 15 days.

## Reports
- Central reports now include workflow stage, due status and module-specific workflow summary values.
