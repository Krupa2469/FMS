# FMS Version 1.6.0 — CPGRAMS Strict Date / OCR Rollover Fix

## Problem
A parser/OCR value such as `15/94/2023` was accepted as a date. JavaScript silently rolled month 94 forward and displayed `15/10/2030`, with the due date becoming `05/11/2030`.

## Fix
- Added strict calendar validation for parsed CPGRAMS dates.
- Invalid month/day values are rejected instead of being normalized by JavaScript.
- CPGRAMS document capture now prefers labelled/local received dates and cross-checks the year against the grievance number year where available.
- Due Date is recalculated only from a validated Date Received, at exactly 21 days.
- Invalid parser/OCR dates are left blank for user verification rather than displaying a fabricated future date.
- Shared record/FY date parsing and CPGRAMS due-date validation now use strict calendar checks.
- Updated CPGRAMS cache-busting/version markers to 1.6.0.

## Expected behavior
`15/94/2023` is rejected. It must never become a 2030 date. A valid `15/09/2026` is displayed as `15/09/2026` and its due date is `06/10/2026`.
