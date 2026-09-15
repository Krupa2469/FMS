# FMS Version 1.5.7 — CPGRAMS FY Source-of-Truth Alignment

## Problem fixed
Home dashboard showed 17 CPGRAMS records for FY 2026-27 while the CPGRAMS dashboard and register showed only 13. All screens were reading the same 108 Firestore documents, so the mismatch was caused by different FY classification logic.

## Changes
- Added one shared `recordFY()` policy in `js/record-consistency.js`.
- Saved `financialYear` / `grievanceFinancialYear` is now authoritative when present.
- Legacy records without an FY field fall back to received-date calculation.
- CPGRAMS date fallback order is aligned with the Home dashboard.
- Home dashboard, CPGRAMS dashboard, inline register and full register now use the same FY rule.
- Updated CPGRAMS version/cache-busting to 1.5.7.
- Added console diagnostics (`fyCountBeforeType`) for future count mismatches.

## Expected result
For FY 2026-27, if Home shows 17 CPGRAMS records, the CPGRAMS dashboard and register should also show 17.
