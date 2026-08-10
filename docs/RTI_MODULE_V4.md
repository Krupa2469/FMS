# RTI Module V4

The RTI module is redesigned into four sections: Application Details, Applicant Details, Office Processing, and Attachments Upload.

The RTI Application file is selected in Application Details, parsed with the central FMS Document Engine, and used to populate empty fields. On Save/Update, the RTI Application file is uploaded to Firebase Storage and its metadata is stored in the RTI Firestore document.

Bottom attachments are categorized as Letter Sent, Reply Furnished, or Other and are stored in Firebase Storage with metadata in Firestore.

The parser source file is not stored merely because it is parsed; it is stored only as the explicit RTI Application attachment when the user saves the RTI record, as requested.


## RTI V4.3 updates
- Section 1 parsing now uses the central document engine and robust RTI label detection.
- Section 2 Mandal and Village are dropdowns with inline Save controls for new master values.
- Section 3 Letter addressed to is sourced from Officer Master with inline Save; Reply obtained from remains Section Master.
- Officer, Mandal and Village master values are stored in Firestore.
