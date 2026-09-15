# FMS Version 1.5.9 — CPGRAMS Save in Edit Mode Fix

## Problem
The CPGRAMS full-screen EDIT form displayed both Save and Update. In v1.5.8, Save was forced to create-only behavior, so clicking Save while editing an existing grievance did not persist the intended edit to that record.

## Fix
- Save is now context-aware.
- NEW mode: Save creates a new CPGRAMS document.
- EDIT mode with a loaded document ID: Save updates that existing document.
- Update continues to update the existing document.
- New-record Save performs duplicate grievance-number validation and never silently converts a duplicate into an update.
- Cache-busting/version markers updated to 1.5.9.

## Expected behavior
Opening a record with Edit and changing a field, then clicking Save, must persist the change to the same Firestore document and keep dashboard/register counts unchanged. Creating a genuinely new grievance with Save must create one new document and increase the applicable dashboard/register count by one.
