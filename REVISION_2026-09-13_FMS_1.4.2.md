# FMS Web v1.4.2 — Clean FMS Package

- Created a clean FMS-only package after accidental Rose App files were reported in the local FMS folder.
- Removed any explicit Rose Gardens / Residents / Colony Fund / Ganesh / association artefacts if present.
- Preserved FMS modules only: CPGRAMS/Grievances, RTI, DISHA, Master Tables, Reports, Utilities and Data Import.
- App version updated to 1.4.2.

Important local deployment note: replacing files by copy/paste does not delete extra files already present in the local repository. Clean the local folder except `.git` before extracting this ZIP.
