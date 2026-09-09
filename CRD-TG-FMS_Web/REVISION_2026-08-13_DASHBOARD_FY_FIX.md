# Dashboard / Financial Year Fix

- Fixed FMS Home dashboard counts so Firestore records are read after Firebase is ready.
- Added robust date parsing for DD/MM/YYYY, YYYY-MM-DD, Firestore Timestamp and common date fields.
- Added calendar-based Financial Year selector for current FY plus previous 10 FYs, while retaining any FYs found in records.
- CPGRAMS category dropdown remains available with CPGRAMS as default.
- Module dashboard FY utility also exposes current FY plus previous 10 FYs.
