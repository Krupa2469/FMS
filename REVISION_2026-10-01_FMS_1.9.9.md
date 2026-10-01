# FMS Version 1.9.9 — CPGRAMS Separate Grievances & Appeals Registers

- CPGRAMS now shows two separate register sections: **CPGRAMS Grievances Register** and **Appeals Register**.
- CPGRAMS Grievances Register fields: Dynamic Sl.No., Grievance No., Date Received, Complainant Name, ATR Status, Grievance Status, Appeal Status and Action.
- Grievance No. is clickable and opens the uploaded **Grievance Document**.
- Appeals Register fields: Sl.No., Appeal No., Date Received, Appellant Name, Corresponding Grievance No., Appeal Status and Action.
- Appeal No. opens the uploaded **Appeal Document**; Corresponding Grievance No. opens the uploaded grievance document.
- Added **Appellant Name** and **Upload Appeal Document** to CPGRAMS Appeal Details. Appeal files are stored in the existing `attachments` collection with file role `Appeal Document`.
- Home sidebar CPGRAMS now includes live open-item links: **Grievances (n)** and **Appeals (n)**. Grievances counts active CPGRAMS grievances not closed; Appeals counts CPGRAMS appeals not disposed/closed.
- Clicking the Home sidebar Grievances/Appeals item opens the matching filtered full-screen register.
- Grievances remain sorted by Date Received, latest first; Appeals are sorted by Appeal Date Received, latest first.
- Updated application version and changed-script cache-busting references to **1.9.9**.
