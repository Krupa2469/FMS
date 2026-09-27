# FMS 1.8.3

- Fixed CRUD Data Entry foreground mode activation for New/View/Edit/Delete.
- Foreground layer now covers the complete viewport and hides dashboard/register/navigation behind it.
- Accepts id, recordId, docId, fullscreenForm and formFullscreen navigation variants.
- Cache-busted form-focus-mode and DISHA module script so deployed browsers do not keep stale CRUD navigation behavior.
- Existing module data/business logic retained.
