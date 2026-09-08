/******************************************************************
 * FILE MANAGEMENT SYSTEM (FMS)
 *
 * Module    : DISHA
 * File      : disha-whatsapp.js
 * Version   : 1.0
 * Developer : Lekha Technologies
 *
 * Purpose:
 * Prepare DISHA Daily Status Report message and share through
 * WhatsApp Web.
 *
 * Storage:
 * Firebase Firestore
 *
 * Collection:
 * dishaMeetings
 ******************************************************************/

"use strict";

console.log("DISHA WhatsApp Module V1 Loaded");


/* ================================================================
   FIRESTORE COLLECTION
================================================================ */

const DISHA_WHATSAPP_COLLECTION = "dishaMeetings";


/* ================================================================
   GET FIRESTORE DATABASE
================================================================ */

function getDishaWhatsAppDB() {

    if (typeof db !== "undefined") {
        return db;
    }

    if (
        typeof window !== "undefined" &&
        window.db
    ) {
        return window.db;
    }

    if (
        typeof firebase !== "undefined" &&
        firebase.firestore
    ) {
        return firebase.firestore();
    }

    console.error(
        "Firestore database is not available."
    );

    return null;
}


/* ================================================================
   LOAD DISHA RECORDS
================================================================ */

async function loadDishaWhatsAppRecords() {

    const database =
        getDishaWhatsAppDB();

    if (!database) {

        throw new Error(
            "Firebase Firestore is not initialized."
        );
    }


    const snapshot =
        await database
            .collection(
                DISHA_WHATSAPP_COLLECTION
            )
            .get();


    const records = [];


    snapshot.forEach(
        function (doc) {

            records.push({

                id: doc.id,

                ...doc.data()

            });

        }
    );


    return records;
}


/* ================================================================
   DATE PARSER
================================================================ */

function parseDishaWhatsAppDate(value) {

    if (!value) {
        return null;
    }


    /* Firestore Timestamp */

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        return value.toDate();

    }


    /* Firestore Timestamp object */

    if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        return new Date(
            Number(value.seconds) * 1000
        );

    }


    /* Internal Firestore format */

    if (
        typeof value === "object" &&
        value._seconds !== undefined
    ) {

        return new Date(
            Number(value._seconds) * 1000
        );

    }


    if (value instanceof Date) {

        return value;

    }


    const text =
        String(value).trim();


    /* YYYY-MM-DD */

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(text)
    ) {

        const parts =
            text.split("-");

        return new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );

    }


    /* DD/MM/YYYY */

    if (
        /^\d{2}\/\d{2}\/\d{4}$/.test(text)
    ) {

        const parts =
            text.split("/");

        return new Date(
            Number(parts[2]),
            Number(parts[1]) - 1,
            Number(parts[0])
        );

    }


    const date =
        new Date(text);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;
}


/* ================================================================
   FORMAT DATE
================================================================ */

function formatDishaWhatsAppDate(value) {

    const date =
        parseDishaWhatsAppDate(value);


    if (!date) {
        return "-";
    }


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const year =
        date.getFullYear();


    return (
        day +
        "/" +
        month +
        "/" +
        year
    );
}


/* ================================================================
   CURRENT FINANCIAL YEAR
================================================================ */

function getDishaWhatsAppFinancialYear() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        today.getMonth() + 1;


    if (month >= 4) {

        return (
            year +
            "-" +
            String(
                year + 1
            ).slice(-2)
        );

    }


    return (
        year - 1 +
        "-" +
        String(year).slice(-2)
    );
}


/* ================================================================
   CURRENT FINANCIAL YEAR FILTER
================================================================ */

function isDishaWhatsAppCurrentFY(
    record
) {

    const meetingDate =
        parseDishaWhatsAppDate(
            record.dateOfMeeting
        );


    if (!meetingDate) {
        return false;
    }


    const today =
        new Date();


    const currentYear =
        today.getFullYear();


    const currentMonth =
        today.getMonth() + 1;


    let fyStartYear;


    if (currentMonth >= 4) {

        fyStartYear =
            currentYear;

    } else {

        fyStartYear =
            currentYear - 1;

    }


    const fyStart =
        new Date(
            fyStartYear,
            3,
            1
        );


    const fyEnd =
        new Date(
            fyStartYear + 1,
            2,
            31,
            23,
            59,
            59,
            999
        );


    return (
        meetingDate >= fyStart &&
        meetingDate <= fyEnd
    );
}


/* ================================================================
   NORMALIZE VALUE
================================================================ */

function normalizeDishaWhatsAppValue(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase();

}


/* ================================================================
   CHECK POM OVERDUE
================================================================ */

function isDishaWhatsAppPOMOverdue(
    record
) {

    if (
        normalizeDishaWhatsAppValue(
            record.pomUploaded
        ) === "yes"
    ) {

        return false;

    }


    const dueDate =
        parseDishaWhatsAppDate(
            record.pomDueDate
        );


    if (!dueDate) {
        return false;
    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    dueDate.setHours(
        0,
        0,
        0,
        0
    );


    return today > dueDate;
}


/* ================================================================
   BUILD SUMMARY
================================================================ */

function buildDishaWhatsAppSummary(
    records
) {

    const currentFYRecords =
        records.filter(
            isDishaWhatsAppCurrentFY
        );


    const total =
        currentFYRecords.length;


    const held =
        currentFYRecords.filter(
            record =>
                normalizeDishaWhatsAppValue(
                    record.statusOfMeeting
                ) === "held"
        ).length;


    const toBeHeld =
        currentFYRecords.filter(
            record =>
                normalizeDishaWhatsAppValue(
                    record.statusOfMeeting
                ) === "to be held"
        ).length;


    const postponed =
        currentFYRecords.filter(
            record =>
                normalizeDishaWhatsAppValue(
                    record.statusOfMeeting
                ) === "postponed"
        ).length;


    const uploaded =
        currentFYRecords.filter(
            record =>
                normalizeDishaWhatsAppValue(
                    record.pomUploaded
                ) === "yes"
        ).length;


    const awaiting =
        currentFYRecords.filter(
            record =>
                normalizeDishaWhatsAppValue(
                    record.pomUploaded
                ) !== "yes"
        ).length;


    const overdue =
        currentFYRecords.filter(
            isDishaWhatsAppPOMOverdue
        ).length;


    return {

        total,

        held,

        toBeHeld,

        postponed,

        uploaded,

        awaiting,

        overdue

    };
}


/* ================================================================
   BUILD WHATSAPP MESSAGE
================================================================ */

function buildDishaWhatsAppMessage(
    records
) {

    const summary =
        buildDishaWhatsAppSummary(
            records
        );


    const financialYear =
        getDishaWhatsAppFinancialYear();


    let message = "";


    message +=
        "GOVERNMENT OF TELANGANA\n";

    message +=
        "OFFICE OF THE COMMISSIONER, RURAL DEVELOPMENT\n";

    message +=
        "DISHA MEETING DAILY STATUS REPORT\n";

    message +=
        "Financial Year: " +
        financialYear +
        "\n";

    message +=
        "Date: " +
        formatDishaWhatsAppDate(
            new Date()
        ) +
        "\n";


    message +=
        "------------------------------\n";


    message +=
        "Total Meetings : " +
        summary.total +
        "\n";


    message +=
        "Meetings Held : " +
        summary.held +
        "\n";


    message +=
        "To Be Held : " +
        summary.toBeHeld +
        "\n";


    message +=
        "Postponed : " +
        summary.postponed +
        "\n";


    message +=
        "PoM Uploaded : " +
        summary.uploaded +
        "\n";


    message +=
        "PoM Awaiting Upload : " +
        summary.awaiting +
        "\n";


    message +=
        "PoM Overdue : " +
        summary.overdue +
        "\n";


    message +=
        "------------------------------\n";


    message +=
        "DISHA Daily Status\n";

    message +=
        "Generated from FMS\n";

    message +=
        "Lekha Technologies";


    return message;
}


/* ================================================================
   SHARE THROUGH WHATSAPP
================================================================ */

async function shareDishaDailyStatusWhatsApp() {
<<<<<<< HEAD
    const summary = document.querySelector(".report-container")?.innerText || document.querySelector("main")?.innerText || "DISHA Daily Status Update";
    return window.FMSWhatsAppService?.compose({
        module:"DISHA",
        title:"DISHA Daily Status Message",
        defaultMessage:`DISHA Daily Status Update\nStatus as on: ${new Date().toLocaleDateString("en-IN")}\n\n${summary.slice(0,2800)}\n\nPlease type or edit your custom message.`
    });
}
window.shareDishaDailyStatusWhatsApp = shareDishaDailyStatusWhatsApp;
=======

    try {

        const records =
            await loadDishaWhatsAppRecords();


        if (!records) {

            alert(
                "Unable to load DISHA records."
            );

            return;

        }


        const message =
            buildDishaWhatsAppMessage(
                records
            );


        const encodedMessage =
            encodeURIComponent(
                message
            );


        const whatsappURL =
            "https://wa.me/?text=" +
            encodedMessage;


        window.open(
            whatsappURL,
            "_blank"
        );

    }
    catch (error) {

        console.error(
            "DISHA WhatsApp Error:",
            error
        );


        alert(
            "Unable to prepare WhatsApp message.\n\n" +
            error.message
        );

    }
}


/* ================================================================
   COPY REPORT TO CLIPBOARD
================================================================ */

async function copyDishaDailyStatus() {

    try {

        const records =
            await loadDishaWhatsAppRecords();


        const message =
            buildDishaWhatsAppMessage(
                records
            );


        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
        ) {

            await navigator.clipboard.writeText(
                message
            );


            showDishaWhatsAppMessage(
                "DISHA Daily Status copied to clipboard.",
                "success"
            );


            return;

        }


        /* Fallback */

        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            message;


        document.body.appendChild(
            textarea
        );


        textarea.select();


        document.execCommand(
            "copy"
        );


        document.body.removeChild(
            textarea
        );


        showDishaWhatsAppMessage(
            "DISHA Daily Status copied to clipboard.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "Clipboard Error:",
            error
        );


        alert(
            "Unable to copy the DISHA report."
        );

    }
}


/* ================================================================
   MESSAGE
================================================================ */

function showDishaWhatsAppMessage(
    message,
    type = "info"
) {

    const element =
        document.getElementById(
            "dishaMessage"
        );


    if (!element) {

        alert(message);

        return;

    }


    element.innerHTML = `

        <div class="alert alert-${type}">
            ${message}
        </div>

    `;


    setTimeout(
        function () {

            element.innerHTML = "";

        },
        4000
    );

}


/* ================================================================
   REGISTER WHATSAPP BUTTON
================================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const whatsappButton =
            document.getElementById(
                "btnWhatsApp"
            );


        if (whatsappButton) {

            whatsappButton.addEventListener(
                "click",
                shareDishaDailyStatusWhatsApp
            );

        }


        const copyButton =
            document.getElementById(
                "btnCopyStatus"
            );


        if (copyButton) {

            copyButton.addEventListener(
                "click",
                copyDishaDailyStatus
            );

        }

    }
);


/* ================================================================
   GLOBAL FUNCTIONS
================================================================ */

window.shareDishaDailyStatusWhatsApp =
    shareDishaDailyStatusWhatsApp;


window.copyDishaDailyStatus =
    copyDishaDailyStatus;


window.buildDishaWhatsAppMessage =
    buildDishaWhatsAppMessage;


console.log(
    "DISHA WhatsApp functions ready."
);
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604
