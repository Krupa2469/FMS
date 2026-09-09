# CRD-TG-FMS Web v1.2.2 — 2026-09-09

## Reports and export updates

- Fixed report Share handling so browser `Permission denied` / `NotAllowedError` no longer blocks the user; the service falls back to text sharing or downloads the selected report file.
- Added the official report header to preview, Excel, PDF, JPEG and Print outputs:
  - GOVERNMENT OF TELANGANA
  - OFFICE OF THE COMMISSIONER, RURAL DEVELOPMENT
  - #6-3-607, Anand Nagar Colony, Khairatabad,Hyderabad-500 004
- Standard report titles now use module-specific wording and today's date, e.g. `CPGRAMS Status Report as on Date DD/MM/YYYY`.
- Added Financial Year selection from 2014-15 through the current FY, with the current FY selected by default. Custom date range remains available.
- Added module-specific summary blocks above every report and inside every export/preview.
- Excel exports now include header, report title, FY/period, summary and data table in one workbook.
- PDF/JPEG/Print exports use the same report layout for consistency.
