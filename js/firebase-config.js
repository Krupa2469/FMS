/*
==========================================================
FILE MANAGEMENT SYSTEM (FMS)
Government of Telangana

File:
firebase-config.js

Purpose:
Initializes Firebase App, Firestore and Storage

Developer:
Lekha Technologies

Version:
1.0
==========================================================
*/

// Firebase Compatibility SDK
// (Load these BEFORE this file in HTML)
//
// https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js
// https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore-compat.js
// https://www.gstatic.com/firebasejs/10.13.2/firebase-storage-compat.js
// https://www.gstatic.com/firebasejs/10.13.2/firebase-auth-compat.js

const firebaseConfig = {
    apiKey: "AIzaSyDaHe2aFmLF2nQF0SvPxt1qsgjaqM_0guE",
    authDomain: "crd-tg-fms.firebaseapp.com",
    projectId: "crd-tg-fms",
    storageBucket: "crd-tg-fms.firebasestorage.app",
    messagingSenderId: "657394050456",
    appId: "1:657394050456:web:7c1b42fc2cbfd0533c77ed"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firestore Database
const db = firebase.firestore();

// Firebase Storage
const storage = firebase.storage();

// Firebase Authentication
const auth = firebase.auth();

console.log("========================================");
console.log("FMS Firebase Connected Successfully");
console.log("Project : CRD-TG FMS");
console.log("========================================");