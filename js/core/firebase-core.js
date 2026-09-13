/*=========================================================
  RGMS COMMON FIREBASE CORE
  One Firebase connection for the entire application.
=========================================================*/

import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getAuth,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

import {
    getFunctions
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js";


window.RGMS = window.RGMS || {};

const config = window.RGMS_FIREBASE_CONFIG;

console.log("RGMS Firebase core loading...");


function isValidConfig(value) {
    return !!(
        value &&
        value.apiKey &&
        !value.apiKey.includes("...") &&
        value.projectId &&
        value.appId
    );
}


try {

    if (!isValidConfig(config)) {

        window.RGMS.firebaseConfigReady = false;

        console.error(
            "RGMS Firebase configuration is incomplete."
        );

    } else {

        const app = getApps().length
            ? getApp()
            : initializeApp(config);

        const auth = getAuth(app);


        // Keep Firebase Auth persistent across page navigation/reloads.
        window.RGMS.authPersistenceReady =
            setPersistence(
                auth,
                browserLocalPersistence
            ).catch(error => {

                console.warn(
                    "RGMS Firebase Auth persistence could not be enabled:",
                    error
                );

                return false;
            });


        // Firestore
        const db = getFirestore(app);


        // Firebase Storage
        const storage = getStorage(app);


        // Firebase Cloud Functions
        // Your deployed functions are in asia-south1.
        const functions = getFunctions(
            app,
            "asia-south1"
        );


        window.RGMS.firebase = {

            app,

            auth,

            db,

            storage,

            functions

        };


        // Compatibility aliases for older module code.
        window.RGMS_DB =
            window.RGMS.firebase.db;

        window.RGMS_AUTH =
            window.RGMS.firebase.auth;

        window.RGMS_STORAGE =
            window.RGMS.firebase.storage;

        window.RGMS_FUNCTIONS =
            window.RGMS.firebase.functions;


        window.RGMS.firebaseConfigReady = true;


        console.log(
            "RGMS Firebase initialized:",
            config.projectId
        );

        console.log(
            "RGMS Firebase Functions initialized: asia-south1"
        );
    }

} catch (error) {

    window.RGMS.firebaseConfigReady = false;

    console.error(
        "RGMS Firebase initialization failed:",
        error
    );
}