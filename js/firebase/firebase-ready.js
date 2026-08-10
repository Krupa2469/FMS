/*
==========================================================
FILE MANAGEMENT SYSTEM (FMS)

File:
firebase-ready.js

Purpose:
Common Firebase readiness controller for all FMS modules

Developer:
Lekha Technologies

Version:
1.0
==========================================================
*/

(function () {

    "use strict";

    console.log(
        "FMS Firebase Ready Controller Loaded..."
    );


    /*
    ======================================================
    WAIT FOR FIREBASE
    ======================================================
    */

    function waitForFirebase(callback) {

        /*
        --------------------------------------------------
        Firebase already ready
        --------------------------------------------------
        */

        if (
            window.fmsFirebaseReady === true &&
            window.fmsFirebase &&
            window.fmsFirebase.db
        ) {

            console.log(
                "FMS Firebase already ready."
            );

            callback(
                window.fmsFirebase
            );

            return;
        }


        /*
        --------------------------------------------------
        Wait for Firebase ready event
        --------------------------------------------------
        */

        window.addEventListener(
            "fmsFirebaseReady",
            function () {

                console.log(
                    "FMS Firebase Ready Event Received."
                );

                callback(
                    window.fmsFirebase
                );

            },
            {
                once: true
            }
        );


        /*
        --------------------------------------------------
        Safety timeout
        --------------------------------------------------
        */

        setTimeout(
            function () {

                if (
                    !window.fmsFirebaseReady
                ) {

                    console.error(
                        "FMS Firebase initialization timed out."
                    );

                    if (
                        typeof callback === "function"
                    ) {

                        callback(
                            null
                        );

                    }

                }

            },
            15000
        );

    }


    /*
    ======================================================
    GLOBAL FUNCTION
    ======================================================
    */

    window.waitForFMSFirebase =
        waitForFirebase;


    /*
    ======================================================
    FIREBASE STATUS
    ======================================================
    */

    window.isFMSFirebaseReady =
        function () {

            return (
                window.fmsFirebaseReady === true &&
                !!window.fmsFirebase &&
                !!window.fmsFirebase.db
            );

        };


    /*
    ======================================================
    GET FIRESTORE
    ======================================================
    */

    window.getFMSFirestore =
        function () {

            if (
                !window.isFMSFirebaseReady()
            ) {

                console.warn(
                    "Firestore requested before Firebase was ready."
                );

                return null;
            }

            return (
                window.fmsFirebase.db
            );

        };


    /*
    ======================================================
    GET STORAGE
    ======================================================
    */

    window.getFMSStorage =
        function () {

            if (
                !window.isFMSFirebaseReady()
            ) {

                console.warn(
                    "Storage requested before Firebase was ready."
                );

                return null;
            }

            return (
                window.fmsFirebase.storage
            );

        };


    /*
    ======================================================
    GET AUTH
    ======================================================
    */

    window.getFMSAuth =
        function () {

            if (
                !window.isFMSFirebaseReady()
            ) {

                console.warn(
                    "Authentication requested before Firebase was ready."
                );

                return null;
            }

            return (
                window.fmsFirebase.auth
            );

        };


    /*
    ======================================================
    STATUS FUNCTION
    ======================================================
    */

    window.getFMSFirebaseStatus =
        function () {

            return {

                ready:
                    window.isFMSFirebaseReady(),

                firestore:
                    !!(
                        window.fmsFirebase &&
                        window.fmsFirebase.db
                    ),

                storage:
                    !!(
                        window.fmsFirebase &&
                        window.fmsFirebase.storage
                    ),

                authentication:
                    !!(
                        window.fmsFirebase &&
                        window.fmsFirebase.auth
                    )

            };

        };


    console.log(
        "FMS Firebase Ready Controller Ready."
    );

})();