/*
==========================================================
FILE MANAGEMENT SYSTEM (FMS)

File:
firebase-loader.js

Purpose:
Load Firebase SDK files before Firebase Bootstrap

Developer:
Lekha Technologies

Version:
1.0
==========================================================
*/

(function () {

    "use strict";

    console.log(
        "FMS Firebase Loader Starting..."
    );


    /*
    ======================================================
    FIREBASE SDK VERSION
    ======================================================
    */

    const FIREBASE_VERSION = "10.13.2";

    const FIREBASE_BASE =
        "https://www.gstatic.com/firebasejs/" +
        FIREBASE_VERSION + "/";


    /*
    ======================================================
    SDK FILES
    ======================================================
    */

    const SDK_FILES = [

        "firebase-app-compat.js",

        "firebase-firestore-compat.js",

        "firebase-auth-compat.js",

        "firebase-storage-compat.js"

    ];


    /*
    ======================================================
    LOAD SCRIPT
    ======================================================
    */

    function loadScript(src) {

        return new Promise(
            function (resolve, reject) {

                /*
                ------------------------------------------------
                Avoid loading the same script twice
                ------------------------------------------------
                */

                const existing =
                    document.querySelector(
                        'script[src="' + src + '"]'
                    );

                if (existing) {

                    resolve();

                    return;
                }


                /*
                ------------------------------------------------
                Create script element
                ------------------------------------------------
                */

                const script =
                    document.createElement("script");

                script.src = src;

                script.async = false;


                /*
                ------------------------------------------------
                Success
                ------------------------------------------------
                */

                script.onload = function () {

                    console.log(
                        "Firebase SDK Loaded:",
                        src
                    );

                    resolve();

                };


                /*
                ------------------------------------------------
                Error
                ------------------------------------------------
                */

                script.onerror = function () {

                    console.error(
                        "Unable to load Firebase SDK:",
                        src
                    );

                    reject(
                        new Error(
                            "Firebase SDK load failed: " +
                            src
                        )
                    );

                };


                /*
                ------------------------------------------------
                Add to document
                ------------------------------------------------
                */

                document.head.appendChild(
                    script
                );

            }
        );
    }


    /*
    ======================================================
    LOAD ALL FIREBASE SDK FILES
    ======================================================
    */

    async function loadFirebaseSDK() {

        try {

            for (
                const file
                of SDK_FILES
            ) {

                await loadScript(
                    FIREBASE_BASE + file
                );

            }


            console.log(
                "All Firebase SDK files loaded."
            );


            /*
            ------------------------------------------------
            Load Firebase Bootstrap
            ------------------------------------------------
            */

            await loadScript(
                "../../js/firebase/firebase-bootstrap.js"
            );


            console.log(
                "Firebase Bootstrap Loaded."
            );


            /*
            ------------------------------------------------
            READY
            ------------------------------------------------
            */

            window.dispatchEvent(
                new CustomEvent(
                    "fmsFirebaseLoaderReady"
                )
            );


        } catch (error) {

            console.error(
                "FMS Firebase Loader Error:",
                error
            );


            window.fmsFirebaseReady =
                false;


            /*
            ------------------------------------------------
            Display visible error
            ------------------------------------------------
            */

            const message =
                document.createElement("div");

            message.style.position =
                "fixed";

            message.style.top =
                "0";

            message.style.left =
                "0";

            message.style.right =
                "0";

            message.style.zIndex =
                "99999";

            message.style.padding =
                "15px";

            message.style.background =
                "#dc3545";

            message.style.color =
                "#ffffff";

            message.style.fontFamily =
                "Arial, sans-serif";

            message.style.fontSize =
                "16px";

            message.style.textAlign =
                "center";

            message.innerHTML =
                "<strong>FMS Firebase Error:</strong> " +
                "Unable to connect to Firebase. " +
                "Please check your internet connection.";

            document.body.prepend(
                message
            );

        }

    }


    /*
    ======================================================
    START
    ======================================================
    */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            loadFirebaseSDK
        );

    } else {

        loadFirebaseSDK();

    }

})();