# CRD-TG-FMS Web v1.2.0 — 2026-09-09

This revision consolidates the active FMS modules to CPGRAMS, RTI and DISHA.

## Dashboard and register behaviour
- Dashboard cards remain above the data-entry form in every active module.
- All dashboard figures are clickable, including zero values.
- Dashboard clicks open the corresponding filtered register with FY preserved.
- Filtered register mode hides search/summary cards and expands the data table to full width.
- RTI filtered-register FY helper scope issue fixed.

## Masters
- Central Master Tables & Registers page with CRUD for Districts, Mandals, Villages, Departments, Sections, Officers, Designations, Grievance Categories, Complaint Sources, Priority Levels, General Status, File Locations, Office Communication Types, Office File Statuses, Grievance Nature, Contact Methods, Gender, DISHA Meeting Status and DISHA Bill Status.
- Existing CPGRAMS, RTI and DISHA data can be synchronized into the relevant master registers.
- Module dropdowns merge active values from the central masters while retaining built-in fallback options.

## Reports
- Central Reports module supports standard and saved custom reports.
- Reports Master provides CRUD for custom report definitions including selected columns, filters, sorting and date presets.
- Default editable custom report definitions are created when the reports master is empty.

## Exports and WhatsApp
- Excel, PDF, JPEG and Print exports implemented for central reports, master registers, Reports Master, CPGRAMS register/search, RTI register and DISHA register.
- JPEG export added to RTI and DISHA daily-status reports.
- WhatsApp composer now lets the user choose Device Share Menu, WhatsApp/WhatsApp Business app, WhatsApp Web, wa.me universal link, or configured WhatsApp Cloud API.

## Deployment
- Firebase Hosting merge workflow targets the `master` branch.
