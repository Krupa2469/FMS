# FMS Office Processing V3

Implemented shared Office Processing for CPGRAMS, RTI and DISHA.

Fields:
- File No.
- Date Arised
- Subject
- Type of communication: Letter, D.O. Letter, UO Note, Memo
- Letter addressed to
- Reply obtained from: central Section Master + Add button
- Status of file: Arised, Under Circulation, Despatched, Reply Obtained, Closed

The section master is stored in Firestore collection `sections`.
Communication types use `officeCommunicationTypes`.
File statuses use `fileStatuses`.

The new Admin page:
`pages/admin/office-processing-master.html`

The existing Admin Master Management also exposes these masters.

Office Processing data is saved with each CPGRAMS, RTI and DISHA record.
The temporary document selected for parsing is not saved as an attachment.
