# FMS 1.6.9 - DISHA filtered register, Sl.No sync and sticky actions

- Fixed DISHA dashboard filtered registers so uploaded/source DISHA meetings remain available even if Firestore source-data synchronization is delayed or blocked; Firestore remains the primary store and source rows are de-duplicated by District + Meeting Date.
- Meetings Held / Districts Conducted filtering now recognizes legacy records by explicit status or past meeting date.
- Synchronized FY 2026-27 uploaded data Sl.No values (1..N) into matching Firestore records and fallback rows.
- Save / Update / Delete action toolbar is locked with sticky positioning while the DISHA home scrolls.
- Exit Full Screen continues to return to DISHA home.
- District + Meeting Date duplicate validation retained.
