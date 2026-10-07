# FMS Version 1.10.19 — 07-Oct-2026

## GRIEVANCES module naming correction

This revision corrects the application hierarchy so **GRIEVANCES** is the module and **CPGRAMS** remains one of the Grievance Types.

### Updated
- Reports standard module label changed from **CPGRAMS Report** to **GRIEVANCES Report**.
- Reports runtime module name changed from **CPGRAMS** to **GRIEVANCES** while preserving the existing internal `cpgrams` collection/key for compatibility.
- Home sidebar parent heading changed to **GRIEVANCES**.
- CPGRAMS-specific pending entries remain clearly identified as **CPGRAMS Grievances** and **CPGRAMS Appeals**.
- The common top navigation continues to show **CPGRAMS** because it is a Grievance Type alongside Prajavani, Public Grievances, Direct Complaints, LAQ, LCQ, etc.
- Modules Master now treats only **GRIEVANCES, RTI and DISHA** as operational modules.
- Form Fields Master displays **GRIEVANCES** as the module while retaining `CPGRAMS` as the grievance type where applicable.
- Legacy master records that used CPGRAMS or another grievance type as a module are displayed/mapped under **GRIEVANCES** without changing the existing grievance data model.
- Legacy dashboard module label changed to **GRIEVANCES** and the quick action changed to **New Grievance**.
- Shared office-processing/document-processing descriptions now refer to the **GRIEVANCES** module.

### Compatibility
- No Firestore collection names, grievance type values, URLs, CPGRAMS portal fields, parsers, or existing CPGRAMS records were renamed.
- Existing CPGRAMS data continues to work as a Grievance Type.

Version: **1.10.19**
