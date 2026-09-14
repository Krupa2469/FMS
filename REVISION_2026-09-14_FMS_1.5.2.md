# FMS Web v1.5.2 — Firebase CRUD Reliability Fix

Date: 14/09/2026

## Purpose
Fix Save, Update and Delete buttons not completing on live Firebase deployment, especially where the browser shows Firestore WebChannel/QUIC errors.

## Changes

- Added Firestore REST write path in the common Firebase CRUD service.
- Save, Update and Delete now use REST first, with SDK fallback.
- Read/list operations use REST first and SDK fallback.
- Added operation timeouts so buttons do not remain stuck silently.
- Added normalized existing-record lookup through the common CRUD service.
- CPGRAMS Save no longer waits on direct Firestore query before saving.
- CPGRAMS Save now disables the button while saving and clears the form after success.
- CPGRAMS Due Date calculation made robust and prevents NaN-NaN-NaN from parsed documents.
- CPGRAMS document parser now ignores invalid parser date values before filling fields.
- Attachment metadata save/list/delete now uses the common CRUD service.
- Central attachment service now uses the common CRUD service for metadata.
- RTI existing application lookup now uses the common CRUD service.
- Master Tables load/duplicate/save/update/delete now use the same stable CRUD path.
- Reports Master load/save/update/delete now use the same stable CRUD path.

## Notes
The app still uses Firebase Storage for real file uploads. If Storage upload fails, small files fall back to Firestore inline storage as earlier.

## Validation
- JavaScript syntax check completed.
- ZIP package generated successfully.
