# FMS Version 1.10.30 — 08-Oct-2026

## Mobile Responsive Update

This release makes the FMS application responsive for phones and tablets while preserving the existing desktop layout and business logic.

### Application-wide mobile improvements
- Common Government/FMS header scales down cleanly on phones while retaining the logo and all header lines.
- Home sidebar becomes a horizontally swipeable module rail on smaller screens instead of consuming the full page height.
- Dashboard cards use two columns on tablets and one column on narrow phones.
- Data-entry forms stack cleanly on mobile and use touch-friendly controls.
- Bottom Save / Update / Delete actions become full-width touch buttons on phones.
- Module navigation remains horizontally swipeable and keeps the current module highlighted.
- Registers/master grids remain readable with touch-friendly horizontal scrolling instead of shrinking the text excessively.
- Pending Alerts becomes a mobile bottom-sheet style panel so it does not cover the entire application header/content.
- Dialogs, images, input groups and standard cards are constrained to the device viewport.

### Mobile Reports / Preview
- Report Preview now fits the phone viewport; the previous minimum-width desktop paper is removed on mobile.
- Summary cards display as a compact two-column mobile grid.
- Report section tables switch to a clear mobile record-card layout: each value is shown beside its field name.
- Grievance / Appeal / Application / File numbers retain no-wrap behavior and can be read clearly without splitting identifiers.
- Report sections no longer require horizontal page scrolling on mobile.
- Preview header/footer are compact and remain usable on small screens.
- The existing desktop table layout, PDF/JPEG/Excel/Print output logic, section filters, summary cards and report definitions remain intact.

### Version
- Application version updated to **1.10.30**.
- CSS/JS cache-busting references updated to ensure the responsive changes load after deployment.
