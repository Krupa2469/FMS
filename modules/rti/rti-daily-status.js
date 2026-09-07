/* ============================================================
   FILE MANAGEMENT SYSTEM (FMS)

   Module    : RTI
   File      : rti-daily-status.js
   Version   : 3.0
   Developer : Lekha Technologies

   Purpose:
   RTI Daily Status Report

   Firestore Collection:
   rtiApplications
   ============================================================ */

"use strict";


console.log("======================================");
console.log("RTI DAILY STATUS JS LOADED");
console.log("======================================");


/* ============================================================
   CONFIGURATION
============================================================ */

const RTI_COLLECTION =
    "rtiApplications";


/* ============================================================
   GLOBAL DATA
============================================================ */

let rtiRecords = [];

let currentFYRecords = [];

let rtiSummary = {

    financialYear: "",

    totalApplications: 0,

    pendingApplications: 0,

    overdueApplications: 0,

    disposedApplications: 0

};


/* ============================================================
   DOM READY
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Initializing RTI Daily Status Report..."
        );

        initializeRTIDailyStatus();

    }
);


/* ============================================================
   INITIALIZE
============================================================ */

async function initializeRTIDailyStatus() {

    try {

        /*
         * Firebase must already be initialized
         * by firebase-config.js.
         */

        if (
            typeof db === "undefined"
        ) {

            throw new Error(
                "Firebase Firestore database is not initialized."
            );

        }


        setupButtons();

        setupSummaryLinks();


        await loadRTIApplications();


        calculateRTISummary();


        updateRTIDailyStatus();


        console.log(
            "RTI Daily Status Report Ready."
        );

    }

    catch (error) {

        console.error(
            "RTI Daily Status Initialization Error:",
            error
        );


        showError(
            "Unable to load RTI Daily Status Report. " +
            error.message
        );

    }

}


/* ============================================================
   LOAD RTI APPLICATIONS
============================================================ */

async function loadRTIApplications() {

    console.log(
        "Loading RTI applications from Firestore..."
    );


    if (
        typeof db === "undefined"
    ) {

        throw new Error(
            "Firebase Firestore is not available."
        );

    }


    const snapshot =
        await db
            .collection(
                RTI_COLLECTION
            )
            .get();


    rtiRecords = [];


    snapshot.forEach(
        function (doc) {

            rtiRecords.push({

                id: doc.id,

                ...doc.data()

            });

        }
    );


    console.log(
        "RTI applications loaded:",
        rtiRecords.length
    );

}


/* ============================================================
   FINANCIAL YEAR
   Indian FY = 1 April to 31 March
============================================================ */

function getCurrentFinancialYear() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        today.getMonth() + 1;


    let startYear;


    if (month >= 4) {

        startYear =
            year;

    }

    else {

        startYear =
            year - 1;

    }


    return {

        startYear:
            startYear,

        endYear:
            startYear + 1,

        label:
            startYear +
            "-" +
            String(
                startYear + 1
            ).slice(-2)

    };

}


/* ============================================================
   DATE PARSER
============================================================ */

function parseRTIDate(value) {

    if (!value) {

        return null;

    }


    /*
     * Firestore Timestamp
     */

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        return value.toDate();

    }


    /*
     * JavaScript Date
     */

    if (
        value instanceof Date
    ) {

        return value;

    }


    /*
     * Firestore timestamp-like object
     */

    if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        return new Date(
            Number(
                value.seconds
            ) * 1000
        );

    }


    /*
     * YYYY-MM-DD
     */

    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(
            value
        )
    ) {

        const parts =
            value.split("-");


        return new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );

    }


    /*
     * General date parsing
     */

    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


/* ============================================================
   CURRENT FINANCIAL YEAR CHECK
============================================================ */

function isCurrentFinancialYear(
    dateValue
) {

    const date =
        parseRTIDate(
            dateValue
        );


    if (!date) {

        return false;

    }


    const fy =
        getCurrentFinancialYear();


    const startDate =
        new Date(
            fy.startYear,
            3,
            1,
            0,
            0,
            0,
            0
        );


    const endDate =
        new Date(
            fy.endYear,
            2,
            31,
            23,
            59,
            59,
            999
        );


    return (
        date >= startDate &&
        date <= endDate
    );

}


/* ============================================================
   GET STATUS
============================================================ */

function getStatus(record) {

    return String(
        record.presentStatus ||
        record.status ||
        ""
    )
    .trim()
    .toLowerCase();

}


/* ============================================================
   DISPOSED / COMPLETED
============================================================ */

function isDisposed(record) {

    const status =
        getStatus(record);


    const disposedStatuses = [

        "disposed",

        "disposed of",

        "completed",

        "complete",

        "closed",

        "reply furnished",

        "replied",

        "final reply sent",

        "final reply furnished"

    ];


    return disposedStatuses.includes(
        status
    );

}


/* ============================================================
   OVERDUE
============================================================ */

function isOverdue(record) {

    /*
     * A disposed application can never
     * be overdue.
     */

    if (
        isDisposed(record)
    ) {

        return false;

    }


    const dueDate =
        parseRTIDate(
            record.dueDate
        );


    if (!dueDate) {

        return false;

    }


    const today =
        new Date();


    today.setHours(
        23,
        59,
        59,
        999
    );


    return (
        today > dueDate
    );

}


/* ============================================================
   PENDING
============================================================ */

function isPending(record) {

    return !isDisposed(
        record
    );

}


/* ============================================================
   CALCULATE SUMMARY
============================================================ */

function calculateRTISummary() {

    console.log(
        "Calculating RTI Daily Status..."
    );


    /*
     * Only current financial year
     * applications are included.
     */

    currentFYRecords =
        rtiRecords.filter(
            function (record) {

                return isCurrentFinancialYear(
                    record.applicationDate
                );

            }
        );


    let total =
        currentFYRecords.length;


    let pending =
        0;


    let overdue =
        0;


    let disposed =
        0;


    currentFYRecords.forEach(
        function (record) {

            if (
                isDisposed(record)
            ) {

                disposed++;

            }

            else {

                pending++;


                if (
                    isOverdue(record)
                ) {

                    overdue++;

                }

            }

        }
    );


    const fy =
        getCurrentFinancialYear();


    rtiSummary = {

        financialYear:
            fy.label,

        totalApplications:
            total,

        pendingApplications:
            pending,

        overdueApplications:
            overdue,

        disposedApplications:
            disposed

    };


    console.log(
        "RTI SUMMARY:",
        rtiSummary
    );

}


/* ============================================================
   UPDATE REPORT
============================================================ */

function updateRTIDailyStatus() {

    console.log(
        "Updating RTI Daily Status..."
    );


    /*
     * Report header
     */

    setText(
        "financialYear",
        rtiSummary.financialYear
    );


    setText(
        "statusDate",
        formatDate(
            new Date()
        )
    );


    /*
     * Summary cards
     */

    setText(
        "totalApplications",
        rtiSummary.totalApplications
    );


    setText(
        "pendingApplications",
        rtiSummary.pendingApplications
    );


    setText(
        "overdueApplications",
        rtiSummary.overdueApplications
    );


    setText(
        "disposedApplications",
        rtiSummary.disposedApplications
    );


    /*
     * RTI Application Status table
     */

    setText(
        "linkTotal",
        rtiSummary.totalApplications
    );


    setText(
        "linkPending",
        rtiSummary.pendingApplications
    );


    setText(
        "linkOverdue",
        rtiSummary.overdueApplications
    );


    setText(
        "linkDisposed",
        rtiSummary.disposedApplications
    );


    /*
     * Daily Position table
     */

    setText(
        "dailyTotal",
        rtiSummary.totalApplications
    );


    setText(
        "dailyPending",
        rtiSummary.pendingApplications
    );


    setText(
        "dailyOverdue",
        rtiSummary.overdueApplications
    );


    setText(
        "dailyDisposed",
        rtiSummary.disposedApplications
    );


    console.log(
        "RTI Daily Status Updated."
    );

}


/* ============================================================
   SET TEXT
============================================================ */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.textContent =
        value;

}


/* ============================================================
   FORMAT DATE
============================================================ */

function formatDate(date) {

    if (!date) {

        return "-";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


/* ============================================================
   SUMMARY LINKS
============================================================ */

function setupSummaryLinks() {

    bindFilterLink(
        "linkTotal",
        "total"
    );


    bindFilterLink(
        "linkPending",
        "pending"
    );


    bindFilterLink(
        "linkOverdue",
        "overdue"
    );


    bindFilterLink(
        "linkDisposed",
        "completed"
    );


    bindFilterLink(
        "dailyTotal",
        "total"
    );


    bindFilterLink(
        "dailyPending",
        "pending"
    );


    bindFilterLink(
        "dailyOverdue",
        "overdue"
    );


    bindFilterLink(
        "dailyDisposed",
        "completed"
    );


    bindCardFilter(
        "cardTotal",
        "total"
    );


    bindCardFilter(
        "cardPending",
        "pending"
    );


    bindCardFilter(
        "cardOverdue",
        "overdue"
    );


    bindCardFilter(
        "cardDisposed",
        "completed"
    );

}


/* ============================================================
   LINK FILTER
============================================================ */

function bindFilterLink(
    elementId,
    filter
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            openRTIFilter(
                filter
            );

        }
    );

}


/* ============================================================
   CARD FILTER
============================================================ */

function bindCardFilter(
    elementId,
    filter
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.style.cursor =
        "pointer";


    element.addEventListener(
        "click",
        function () {

            openRTIFilter(
                filter
            );

        }
    );

}


/* ============================================================
   OPEN REGISTER FILTER
============================================================ */

function openRTIFilter(
    filter
) {

    console.log(
        "Opening RTI Register filter:",
        filter
    );


    window.location.href =
        "rti-register.html?filter=" +
        encodeURIComponent(
            filter
        );

}


/* ============================================================
   BUTTONS
============================================================ */

function setupButtons() {

    /*
     * BACK TO RTI
     */

    const btnBack =
        document.getElementById(
            "btnBack"
        );


    if (btnBack) {

        btnBack.addEventListener(
            "click",
            function () {

                window.location.href =
                    "rti-register.html";

            }
        );

    }


    /*
     * REFRESH
     */

    const btnRefresh =
        document.getElementById(
            "btnRefresh"
        );


    if (btnRefresh) {

        btnRefresh.addEventListener(
            "click",
            function () {

                window.location.reload();

            }
        );

    }


    /*
     * PRINT / PDF
     */

    const btnPrint =
        document.getElementById(
            "btnPrint"
        );


    if (btnPrint) {

        btnPrint.addEventListener(
            "click",
            function () {

                window.print();

            }
        );

    }


    /*
     * HOME
     */

    const btnHome =
        document.getElementById(
            "btnHome"
        );


    if (btnHome) {

        btnHome.addEventListener(
            "click",
            function () {

                window.location.href =
                    "../../index.html";

            }
        );

    }


    /*
     * WHATSAPP
     */

    const btnWhatsApp =
        document.getElementById(
            "btnWhatsApp"
        );


    if (btnWhatsApp) {

        btnWhatsApp.addEventListener(
            "click",
            function () {

                shareRTIWhatsApp();

            }
        );

    }

}


/* ============================================================
   WHATSAPP
============================================================ */

function shareRTIWhatsApp() {

    const date =
        formatDate(
            new Date()
        );


    let message = "";


    message +=
        "GOVERNMENT OF TELANGANA\n";


    message +=
        "Office of the Commissioner, Rural Development\n\n";


    message +=
        "RTI DAILY STATUS REPORT\n\n";


    message +=
        "Financial Year: " +
        rtiSummary.financialYear +
        "\n";


    message +=
        "Status as on: " +
        date +
        "\n\n";


    message +=
        "RTI APPLICATION STATUS\n";


    message +=
        "Total RTI Applications: " +
        rtiSummary.totalApplications +
        "\n";


    message +=
        "Pending Applications: " +
        rtiSummary.pendingApplications +
        "\n";


    message +=
        "Overdue Applications: " +
        rtiSummary.overdueApplications +
        "\n";


    message +=
        "Completed / Disposed: " +
        rtiSummary.disposedApplications +
        "\n\n";


    message +=
        "FMS - RTI Module";


    const whatsappURL =
        "https://wa.me/?text=" +
        encodeURIComponent(
            message
        );


    window.open(
        whatsappURL,
        "_blank"
    );

}


/* ============================================================
   ERROR
============================================================ */

function showError(
    message
) {

    const container =
        document.querySelector(
            ".report-container"
        );


    if (!container) {

        alert(message);

        return;

    }


    /*
     * Remove previous error.
     */

    const oldError =
        document.getElementById(
            "rtiDailyStatusError"
        );


    if (oldError) {

        oldError.remove();

    }


    const errorBox =
        document.createElement(
            "div"
        );


    errorBox.id =
        "rtiDailyStatusError";


    errorBox.className =
        "alert alert-danger";


    errorBox.style.marginTop =
        "20px";


    errorBox.innerHTML =
        "<strong>Error:</strong> " +
        escapeHTML(
            message
        );


    container.prepend(
        errorBox
    );

}


/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHTML(
    value
) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* ============================================================
   GLOBAL FUNCTIONS
============================================================ */

window.openRTIFilter =
    openRTIFilter;


window.shareRTIWhatsApp =
    shareRTIWhatsApp;


window.loadRTIApplications =
    loadRTIApplications;


window.calculateRTISummary =
    calculateRTISummary;


/* ============================================================
   END
============================================================ */

console.log(
    "RTI Daily Status JS Ready."
);