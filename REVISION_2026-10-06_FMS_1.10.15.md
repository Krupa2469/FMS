# FMS 1.10.15 — Individual Pending Alerts

The Home dashboard's roll-style Pending Alerts panel now lists open grievance/appeal records individually, showing the **complainant name** or **appellant name** and the number of days each record has remained pending.

- **CPGRAMS Grievances:** Uses Complainant Name and grievance Date Received.
- **CPGRAMS Appeals:** Uses Appellant Name and appeal Date Received (or Appeal Date). If an appellant name has not been entered, the original complainant name is used where available.
- **Other grievance types** (Prajavani, Public Grievances, etc.): Each pending case shows the Complainant Name and its own pending days.
- Entries are grouped by module, sorted oldest pending first, and link to their respective pending registers.
- Closed/disposed cases and inactive/deleted records remain excluded.
- Cases without a received date show **Date not recorded** rather than an incorrect elapsed-day number.
- Existing RTI replies and DISHA summary alerts are unchanged.
- Uses text escaping for names and reference numbers.
- The application version has been updated to 1.10.15.

## Verification

`node tests/test_v11015_person_pending_alerts.js` tests per-name age, sorting, exclusions, escaped HTML, missing dates, and links. Historical tests from earlier versions may contain fixed version/text assertions and are retained unchanged.
