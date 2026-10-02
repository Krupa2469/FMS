# FMS Version 1.10.2 — 01-Oct-2026

## Home presentation
- Added the Government of Telangana emblem on the left side of the FMS Home header.
- Sidebar pending counts now hide the count completely when the value is zero; `(0)` is not displayed.
- Added user-friendly tooltips for Home navigation and common controls.

## Pending alert roll
- Added a scroll/roll-style Pending Alerts panel on the right side of Home after live data loads.
- The panel shows only items that are actually pending.
- CPGRAMS Grievances and CPGRAMS Appeals are shown separately with the age of the oldest pending item in days.
- Prajavani, Public Grievances, Direct Complaints, LAQ, LCQ, Court Cases, VIP References, CMO References, PMO References, Audit Paras and Vigilance Cases show pending age in days when applicable.
- RTI shows `RTI replies pending for N days` when replies are pending.
- DISHA alert calculations are restricted to the current financial year and show:
  - pending meeting PoMs; and
  - number of districts with no meeting conducted in the current FY.
- Alert lines are clickable and open the matching filtered register.
- Corrected appeal detection so records whose Appeal Status is `No Appeal` are not counted as Appeals.

## Production wording
- Removed visible developer/vendor branding from the production UI and generated status text.
- Replaced user-visible Firebase/Firestore/developer-oriented messages with plain production messages.
- Reworded RTI attachment/master help text in user terms.
- Renamed the technical diagnostics utility in the UI to `System Connection Check` and simplified its messages.
- Replaced the default technical 404 explanation with a user-facing page-not-found message and Home link.
- Removed standalone Firebase test pages from the production copy.

## Version
- Application version updated to 1.10.2 and changed script references cache-busted accordingly.
