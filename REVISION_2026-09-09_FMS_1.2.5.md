# FMS Web v1.2.5 — LAQ / LCQ Number Labels

- Replaced the LAQ/LCQ question-entry **S.No.** label with a dynamic number label.
- When Grievance Type is **LAQ**, the field is shown as **LAQ No.**
- When Grievance Type is **LCQ**, the field is shown as **LCQ No.**
- Validation messages and input placeholders use the selected question type.
- Reports Master / custom-report field label is shown as **LAQ / LCQ No.** for the shared stored field.
- Existing Firestore field `questionSerialNo` is retained internally for backward compatibility with existing records.
