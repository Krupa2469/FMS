# FMS v1.6.1 - CPGRAMS Office Processing Simplification

Date: 17 September 2026

## Office Processing fields retained

Section 3 is renamed to **OFFICE PROCESSING** and contains only:

- File No.
- Date Arised
- File Status: Arised, Under Circulation, Lie Over, Closed
- Communication Type
- Addressed To
- UO Note/Memo/Letter No.
- UO Note/Memo/Letter Date
- Upload UO Note/Memo/Letter
- ATR Status
- Grievance Final Status: Pending, Disposed

## Removed from Office Processing

- Put-up Date
- Received From
- Sent to Section Date
- Concerned Section
- ATR / Reply Received Date
- ATR / Reply Received From
- ATR Due Date
- ATR / Reply Summary
- Upload ATR / Reply

## Compatibility and status behavior

- Existing legacy Firestore fields are not deleted during update because Firestore updates use merge semantics.
- Legacy `putUpDate` / `officeDateArised` values populate the new Date Arised field where possible.
- Legacy file-status values are preserved if they cannot be represented by the new fixed File Status list.
- Fixed File Status and Grievance Final Status dropdowns are protected from master-option injection.
- Grievance Final Status is authoritative for CPGRAMS disposal: `Disposed` closes the grievance; `Pending` keeps it pending even if legacy workflow flags indicate closure.
- Upload ATR has been removed from the document-upload pipeline.

## Cache/version

- CPGRAMS form/register version updated to 1.6.1.
- Modified JavaScript assets are cache-busted with `v=1.6.1`.
