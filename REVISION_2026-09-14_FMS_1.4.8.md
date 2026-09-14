# FMS 1.4.8 - Temporary Hosting Deploy Workflow Fix

- Updated GitHub Actions deployment workflow to skip Cloud Storage rules temporarily.
- Deploys Firestore rules and Firebase Hosting only.
- This avoids the current 403 serviceusage/firebasestorage error while allowing the app changes to go live.
- Storage rules should be deployed after `firebasestorage.googleapis.com` permission/API issue is fixed in Google Cloud IAM.
