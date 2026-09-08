/*
==========================================================
FILE MANAGEMENT SYSTEM (FMS)

File:
firebase-bootstrap.js

Purpose:
Common Firebase initialization for the entire FMS

Developer:
Lekha Technologies

Version:
1.0
==========================================================
*/

(function () {

    "use strict";

    console.log("========================================");
    console.log("FMS Firebase Bootstrap Starting...");
    console.log("========================================");


    /*
    ======================================================
    CHECK FIREBASE SDK
    ======================================================
    */

    if (typeof firebase === "undefined") {

        console.error(
            "Firebase SDK is not loaded."
        );

        window.fmsFirebaseReady = false;

        return;
    }


    /*
    ======================================================
    FIREBASE CONFIGURATION
    ======================================================
    */

    const firebaseConfig = {

        apiKey:
            "AIzaSyArKYQAjXUuEHk6a06SVpPwqn19Gftf4Pw",

        authDomain:
            "crd-tg-fms-2026.firebaseapp.com",

        projectId:
            "crd-tg-fms-2026",

        storageBucket:
            "crd-tg-fms-2026.firebasestorage.app",

        messagingSenderId:
            "34516108075",

        appId:
            "1:34516108075:web:c3f5dadeb5620863cebb6e"
    };


    /*
    ======================================================
    INITIALIZE ONLY ONCE
    ======================================================
    */

    if (!firebase.apps.length) {

        firebase.initializeApp(
            firebaseConfig
        );

        console.log(
            "Firebase App Initialized."
        );

    } else {

        console.log(
            "Firebase App Already Initialized."
        );
    }


    /*
    ======================================================
    COMMON FIREBASE SERVICES
    ======================================================
    */

    window.fmsFirebase = {

        app:
            firebase.app(),

        db:
            firebase.firestore(),

        auth:
            (typeof firebase.auth === "function" ? firebase.auth() : null),

        storage:
            (typeof firebase.storage === "function" ? firebase.storage() : null)
    };


    /*
    ======================================================
    GLOBAL SHORTCUTS
    ======================================================
    */

    window.db =
        window.fmsFirebase.db;

    window.auth =
        window.fmsFirebase.auth;

    window.storage =
        window.fmsFirebase.storage;


    /*
    ======================================================
    STATUS
    ======================================================
    */

    window.fmsFirebaseReady = true;


    console.log(
        "========================================"
    );

    console.log(
        "CRD-TG-FMS-2026 Connected Successfully"
    );

    console.log(
        "Firestore : Connected"
    );

    console.log(
        "Authentication : " + (window.auth ? "Ready" : "Not loaded on this page")
    );

    console.log(
        "Storage : " +
        (
            window.storage
                ? "Connected"
                : "Unavailable"
        )
    );

    console.log(
        "========================================"
    );


    /*
    ======================================================
    FIREBASE READY EVENT
    ======================================================
    */

    window.dispatchEvent(
        new CustomEvent(
            "fmsFirebaseReady"
        )
    );


})();

// Shared Firebase Functions accessor used by the FMS WhatsApp custom-message service.
window.getFMSFunctions = window.getFMSFunctions || function(){
  try { return (window.firebase && window.firebase.functions) ? window.firebase.functions("asia-south1") : null; }
  catch(e){ return null; }
};
