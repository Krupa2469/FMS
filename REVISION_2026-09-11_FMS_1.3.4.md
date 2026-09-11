# FMS Web v1.3.4 — Save/Update Browser Prompt Fix

- Disabled the browser-native Leave site prompt on the Grievances data-entry page because it was interrupting Save, Update and register/dashboard navigation.
- Added explicit button-type guards and event prevention for New, Save, Update, Delete, Register, Dashboard, WhatsApp and Home buttons.
- Added form submit protection so accidental Enter/default-submit actions do not navigate away from the page.
- Existing form dirty tracking is retained for app logic, but it no longer triggers the browser popup during normal FMS use.
