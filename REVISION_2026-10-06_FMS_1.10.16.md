# FMS Version 1.10.16 — Document Register Enhancements

The application now supports multiple document selection from its Attachments uploader in the CPGRAMS/Grievances (including Prajavani and other grievance types), RTI, and DISHA data-entry forms.

- Upload several files together after the parent record is saved. The CPGRAMS form Save/Update also uploads all files selected in its Attachments picker.
- Set a document type before uploading. Supported types include **Grievance, Appeal, Memo, ATR, Final Reply, RTI Application, First Appeal, Second Appeal, PoM, Meeting Notice, Agenda and Other**, with the relevant module types shown in its upload dropdown.
- Saved documents are listed in document registers with dynamic S.No., file name, document type, file size and action buttons.
- **View** opens the stored document (if one is available); **Edit** changes its document type in an inline dropdown and saves it to Firestore; **Delete** removes the document using each module's existing delete workflow.
- Existing saved attachments remain compatible: legacy document roles appear as a selectable option when editing.
- Individual uploads are handled sequentially. A failure reports affected filenames while retaining successful documents. Reselect failed files to retry; successful files should not be uploaded again.
- Existing single-document upload-and-parse fields (e.g. main RTI application) retain their established parsing behaviour; the new multi-upload workflow applies to the Attachments section.
- The database collections remain unchanged: `attachments` for CPGRAMS, embedded `documents`/`attachments` on RTI applications, and `fmsAttachments` for DISHA.

This release does not change grievance processing, RTI disposition logic, DISHA workflow, or pending-alert calculations.
