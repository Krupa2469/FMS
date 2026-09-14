# FMS Web v1.4.9 - Hosting Only Deploy Workflow

This temporary revision changes GitHub Actions to deploy Firebase Hosting only.

Reason: the current GitHub Actions service account still lacks Service Usage permission to inspect `firestore.googleapis.com` and `firebasestorage.googleapis.com`, so Firestore/Storage rules deployment fails before Hosting can run.

Application files are retained from v1.4.8. Firestore and Storage rules files remain in the package but are not deployed by this temporary workflow. Deploy rules manually from Firebase/GCP after IAM is fixed.
