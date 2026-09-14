# FMS Web v1.5.0 — Firebase CRUD Fix

Date: 2026-09-14

## Scope
Fixed and standardized Firebase Create, Read, Update and Delete operations across the FMS web app.

## Major fixes
- Added a common `FMSCrud` service for reliable Firestore readiness, create, read, update, soft delete and duplicate checks.
- CPGRAMS / Grievances Save, Update and Delete now use the common CRUD service directly.
- CPGRAMS Save clears the form after successful save and refreshes dashboard/register.
- RTI Save, Update and Delete now use the common CRUD service.
- RTI Save clears the form after successful save.
- DISHA Save, Update and Delete now use the common CRUD service.
- DISHA Save clears the form after successful save.
- Master Tables Save, Update and Delete now use the common CRUD service and refresh immediately.
- Reports Master Save, Update and Delete now use the common CRUD service.
- Office Processing Master Save, Update and Delete now use the common CRUD service.
- Register delete actions for GRIEVANCES, RTI and DISHA now use soft-delete consistently.
- Added Utilities > Firebase CRUD Test page for testing temporary create/read/update/delete permissions.

## Notes
- Firestore/Storage rules were already deployed locally by the user.
- This package retains the Hosting-only GitHub workflow so GitHub deployment will not fail on rules deployment.
- Rules can still be deployed locally when changed.
