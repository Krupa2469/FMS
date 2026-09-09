# CRD-TG-FMS Web v1.2.1 — 2026-09-09

## Report export preview and device sharing

- Excel, PDF, JPEG and Print buttons on the central Reports page now open a full-screen report preview before any export action.
- Preview shows the complete current report table, report title, generated timestamp and record count.
- User can change the export format from the preview (Excel / PDF / JPEG).
- Download button exports the selected format from the preview.
- Print button opens the browser/device print dialog from the preview.
- Share button invokes the browser/device native share menu using the Web Share API.
- When supported by the device/browser, the actual selected report file is supplied to the share sheet, so the user can choose among available installed apps such as WhatsApp, WhatsApp Business, Mail, Teams, Messages, Drive and other share targets.
- If native device sharing is not supported, the selected report file is downloaded as a fallback and the user is informed.
- Existing dedicated WhatsApp report composer remains available separately.

## Export service

- Added reusable file builders for Excel, PDF and JPEG.
- Added native `shareFile()` support for report files.
- Existing direct export methods remain compatible for registers and masters.
