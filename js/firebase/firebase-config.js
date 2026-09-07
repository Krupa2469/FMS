/*
==========================================================
FILE MANAGEMENT SYSTEM (FMS)
Government of Telangana

File:
firebase-config.js

Purpose:
Initializes Firebase App, Firestore and Authentication

Developer:
Lekha Technologies

Version:
2.0
==========================================================
*/

// ======================================================
// Firebase Compatibility SDK
//
// Load these BEFORE this file:
//
// https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js
// https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore-compat.js
// https://www.gstatic.com/firebasejs/10.13.2/firebase-auth-compat.js
//
// NOTE:
// Do NOT load firebase-storage-compat.js while you are
// on the Spark plan if Storage is not enabled.
// ======================================================

const firebaseConfig = {

    apiKey: "AIzaSyArKYQAjXUuEHk6a06SVpPwqn19Gftf4Pw",

    authDomain: "crd-tg-fms-2026.firebaseapp.com",

    projectId: "crd-tg-fms-2026",

    storageBucket: "crd-tg-fms-2026.firebasestorage.app",

    messagingSenderId: "34516108075",

    appId: "1:34516108075:web:c3f5dadeb5620863cebb6e"

};

// ------------------------------------------------------
// Initialize Firebase
// ------------------------------------------------------

firebase.initializeApp(firebaseConfig);
// ------------------------------------------------------
// Firestore Database
// ------------------------------------------------------

const db = firebase.firestore();

// Make Firestore globally available
window.db = db;


// ------------------------------------------------------
// Firebase Authentication
// ------------------------------------------------------

const auth = firebase.auth();

// Make Authentication globally available
window.auth = auth;

// const storage = firebase.storage();
const storage = firebase.storage();

// Make Storage globally available
window.storage = storage;

// ------------------------------------------------------
// Console Log
// ------------------------------------------------------

console.log("========================================");
console.log("crd-tg-fms-2026 Connected Successfully");
console.log("Firestore  : Connected");
console.log("Authentication : Ready");
console.log("Storage : Connected");
console.log("Bucket :", storage.app.options.storageBucket);
console.log("========================================");