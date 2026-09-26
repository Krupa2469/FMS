# FMS v1.6.3 — Prajavani redesign

- Prajavani dashboard now shows Total Grievances, Pending, Overdue and Disposed. Total/Pending/Disposed show all-time and current FY counts; Overdue shows current FY.
- Prajavani data entry uses the requested Grievance Details, Complainant Details and Office Processing fields while leaving CPGRAMS behavior intact.
- Added read-only dynamic S.No. for Prajavani. Active records are numbered by creation order; deleting a record closes the gap and the next new record uses the next available sequential number.
- Prajavani No. uses the existing grievance-number storage with compatibility alias `prajavaniNo`.
- Prajavani Due Date uses the configured 30-day rule and is recalculated after document parsing.
- Grievance document parsing/OCR remains enabled and fills the compatible grievance/complainant fields.
- Office Processing adds Communication Status: Awaiting Approval / Despatched. Communication No./Date map to the existing memo fields for backward compatibility. Upload UO Note/Memo/Letter is hidden for Prajavani only.
- ATR Status, Grievance Final Status and Attachments are retained.
- Prajavani inline and full-screen registers now show S.No., Prajavani No., Date, Subject, Complainant Name, Mobile Number, District, Mandal, Village, Sent to, Communication Status, ATR Status and Status. Action controls remain available as register utilities for View/Edit/Delete.
