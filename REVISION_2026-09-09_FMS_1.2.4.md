# FMS Web v1.2.4 — Dynamic Grievance Entry Forms

- Renamed the page heading to **GRIEVANCES DATA ENTRY**.
- **Grievance Type** is now the first field and controls the form shown below it.
- The GRIEVANCES (CPGRAMS-compatible) form removes Grievance ID, Priority, Grievance Source, Date Assigned and Office File Subject while retaining the other fields.
- Prajavani, Public Grievances, Direct Complaints, Court Cases, VIP/CMO/PMO References, Audit Paras and Vigilance Cases use the same Sections 2–4 as GRIEVANCES, with a simplified Section 1 containing Date Received, Due Date, Subject, Grievance Description and Upload Grievance Document.
- Replaced the Assembly Questions type/card with separate **LAQ** and **LCQ** types/cards.
- LAQ/LCQ uses a dedicated question entry form with S.No., Question Type, Received Date, Concerned Section, Question, Answer, Answer Furnished By/To/Date, Communication Type/File No./Date, File Status and document attachment.
- LAQ/LCQ master-backed dropdowns read Sections, Officers, Office Communication Types and Office File Statuses.
- Existing Firestore collection compatibility is retained.
