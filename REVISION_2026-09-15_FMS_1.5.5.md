# FMS Web v1.5.5 - CPGRAMS Save/Create Fix

- CPGRAMS **Save** is now create-only and always creates a new Firestore document.
- Removed the v1.5.4 Save-time lookup that silently converted Save into Update.
- **Update** remains the only path for modifying an opened existing record.
- Newly created records are immediately upserted into the local grievance workspace so dashboard/register counts refresh without waiting for Firestore reload.
- Server refresh remains enabled after Save for persistence verification; the workspace preserves the just-saved row if a stale server response arrives.
- Version bumped to 1.5.5.
