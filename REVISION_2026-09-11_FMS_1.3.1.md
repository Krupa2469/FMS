# FMS Web v1.3.1 — DISHA Document Parser Removal

- Removed Document Parser/OCR dependencies from the DISHA data-entry module.
- Removed DISHA page references to PDF.js, Tesseract.js, Document Engine, Parser Service and Parser UI.
- Attachments remain available in DISHA and continue to save via Firebase Storage/Firestore metadata.
- Data Import Utility remains available separately under Utilities for document-based imports.
