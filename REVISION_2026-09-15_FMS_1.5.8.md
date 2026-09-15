# FMS Version 1.5.8 — CPGRAMS Type Classification Alignment

## Problem confirmed from v1.5.7 console
- Firestore total: 108.
- FY 2026-27 before grievance-type filtering: 17.
- CPGRAMS context after type filtering: 13.
- Therefore the remaining 4-record mismatch was caused by grievance-type classification, not FY or cache.

## Fix
- `grievanceType` / explicit reference type is now authoritative for record classification.
- `questionType` (LAQ/LCQ) is now only a fallback when no explicit grievance/reference type is available.
- Home dashboard now uses the same shared `FMSRecordPolicy.rowType()` logic as the CPGRAMS dashboard and register.
- CPGRAMS dashboard, inline register, and full-screen register therefore use one type-classification source of truth.
- Added `fyTypeBreakdown` console diagnostic to expose the FY record distribution by normalized grievance type.
- Updated CPGRAMS cache-busting/version markers to 1.5.8.

## Expected result
For the existing data shown in the v1.5.7 screenshot, FY 2026-27 CPGRAMS should align to 17 on Home, the CPGRAMS dashboard, inline register, and full-screen register.
