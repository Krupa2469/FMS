# FMS Web v1.4.7

## RTI / DISHA UI and parser fixes

- RTI and DISHA dashboard cards no longer show the text "View filtered data".
- RTI and DISHA second action row now keeps only Save, Update and Delete.
- RTI application document parses automatically immediately after file selection; the separate Parse RTI Application button was removed.
- RTI parser uses central normalised PDF/OCR text before field mapping.
- RTI form removed Reply Received Date, Reply Received From, Reply Summary, Upload Section Reply and complete Section 5 Disposal.
- DISHA form removed Meeting Subject, Meeting Venue, Chaired By, PoM Due Date, PoM Remarks and Reply obtained from.
- DISHA retains Add New Section to Section Master and Status of file.
- DISHA attachment file selection now parses and auto-populates matching fields using the central document parser.
- Master-table save/update/delete now broadcasts immediately so dropdowns and registers can refresh without waiting for a reload.
