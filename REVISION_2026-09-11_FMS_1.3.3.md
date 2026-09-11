# FMS Web v1.3.3 — Register CRUD and Data Import Field Cleanup

- Data Import preview now shows only the required import fields for the selected module/grievance type.
- Data Import parser now ignores footer/privacy/contact text and other non-table fragments instead of creating extra records.
- Delimited/CSV mapping is used only for real delimited tables, preventing random comma text from becoming rows.
- Imported records are validated before preview/import and duplicates in the same upload are removed.
- GRIEVANCES, RTI and DISHA registers now provide View, Edit and Delete buttons.
- View opens the relevant Data Entry screen with existing values populated and Update/Delete actions enabled.
- Register-level delete uses soft-delete for RTI and DISHA, matching the active-record filtering model.
