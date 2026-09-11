# FMS Web v1.3.2 — Register Loading and Accurate Data Import Parser

- Rebuilt the Grievances Register controller as a self-contained Firestore loader.
- Fixed Grievance Type detection so normal categories like Roads / Housing do not hide legacy CPGRAMS records.
- CPGRAMS is selected by default and old GRIEVANCES records remain compatible.
- Register now waits for Firebase before querying and shows a clear message if Firestore is not ready.
- Register columns still change by Grievance Type and FY.
- Data Import Utility now includes parser precision modes: Fast, Accurate and High precision OCR.
- Added normalised text extraction for OCR/PDF text, including spacing, dates, registration number cleanup, and table-row reconstruction.
- PDF parser now preserves table rows using text positions before falling back to OCR.
- OCR logs confidence and suggests High precision when confidence is low.
