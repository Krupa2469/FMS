/* ============================================================
   FILE MANAGEMENT SYSTEM (FMS)

   Module    : RTI
   File      : rti-reports.js
   Version   : 1.0
   Developer : Lekha Technologies

   Purpose:
   RTI Reports / Summary Hyperlinks

   Works with:
   - rti-register.html
   - rti-register.js
   - rti-daily-status.html
   - rti-daily-status.js

   Firestore Collection:
   rtiApplications
   ============================================================ */

"use strict";


console.log("======================================");
console.log("RTI Reports JS Loaded");
console.log("======================================");


/* ============================================================
   CONFIGURATION
   ============================================================ */

const RTI_REPORT_COLLECTION =
    "rtiApplications";


/* ============================================================
   INITIALIZATION
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Initializing RTI Reports..."
        );

        registerRTIReportEvents();

    }
);


/* ============================================================
   REGISTER EVENTS
   ============================================================ */

function registerRTIReportEvents() {

    /*
       Total
    */

    const total =
        document.getElementById(
            "linkTotal"
        );

    if (total) {

        total.addEventListener(
            "click",
            function () {

                openRTIRegisterFilter(
                    "total"
                );

            }
        );

    }


    /*
       Pending
    */

    const pending =
        document.getElementById(
            "linkPending"
        );

    if (pending) {

        pending.addEventListener(
            "click",
            function () {

                openRTIRegisterFilter(
                    "pending"
                );

            }
        );

    }


    /*
       Overdue
    */

    const overdue =
        document.getElementById(
            "linkOverdue"
        );

    if (overdue) {

        overdue.addEventListener(
            "click",
            function () {

                openRTIRegisterFilter(
                    "overdue"
                );

            }
        );

    }


    /*
       Completed / Disposed
    */

    const disposed =
        document.getElementById(
            "linkDisposed"
        );

    if (disposed) {

        disposed.addEventListener(
            "click",
            function () {

                openRTIRegisterFilter(
                    "completed"
                );

            }
        );

    }


    /*
       Daily Status Report
    */

    const dailyStatus =
        document.getElementById(
            "btnDailyStatus"
        );

    if (dailyStatus) {

        dailyStatus.addEventListener(
            "click",
            openRTIDailyStatus
        );

    }


    /*
       Print Report
    */

    const printReport =
        document.getElementById(
            "btnPrintReport"
        );

    if (printReport) {

        printReport.addEventListener(
            "click",
            printRTIReport
        );

    }

}


/* ============================================================
   OPEN REGISTER FILTER
   ============================================================ */

function openRTIRegisterFilter(
    filterType
) {

    if (!filterType) {

        return;

    }


    console.log(
        "Opening RTI register filter:",
        filterType
    );


    window.location.href =
        "rti-register.html?filter=" +
        encodeURIComponent(
            filterType
        );

}


/* ============================================================
   OPEN TOTAL
   ============================================================ */

function openRTITotal() {

    openRTIRegisterFilter(
        "total"
    );

}


/* ============================================================
   OPEN PENDING
   ============================================================ */

function openRTIPending() {

    openRTIRegisterFilter(
        "pending"
    );

}


/* ============================================================
   OPEN OVERDUE
   ============================================================ */

function openRTIOverdue() {

    openRTIRegisterFilter(
        "overdue"
    );

}


/* ============================================================
   OPEN COMPLETED
   ============================================================ */

function openRTICompleted() {

    openRTIRegisterFilter(
        "completed"
    );

}


/* ============================================================
   OPEN DAILY STATUS
   ============================================================ */

function openRTIDailyStatus() {

    console.log(
        "Opening RTI Daily Status Report..."
    );


    window.location.href =
        "rti-daily-status.html";

}


/* ============================================================
   OPEN RTI REGISTER
   ============================================================ */

function openRTIRegister() {

    window.location.href =
        "rti-register.html";

}


/* ============================================================
   OPEN RTI APPLICATION
   ============================================================ */

function openRTIApplication() {

    window.location.href =
        "rti.html";

}


/* ============================================================
   HOME
   ============================================================ */

function openRTIHome() {

    window.location.href =
        "../../index.html";

}


/* ============================================================
   PRINT REPORT
   ============================================================ */

function printRTIReport() {

    console.log(
        "Printing RTI Report..."
    );


    window.print();

}


/* ============================================================
   EXPORT REPORT
   ============================================================ */

function exportRTIReport() {

    console.log(
        "RTI Export requested."
    );


    /*
       Export functionality will be added
       after the report table is finalized.
    */

    alert(
        "RTI Excel export will be enabled in the next report version."
    );

}


/* ============================================================
   GLOBAL FUNCTIONS
   ============================================================ */

window.openRTIRegisterFilter =
    openRTIRegisterFilter;


window.openRTITotal =
    openRTITotal;


window.openRTIPending =
    openRTIPending;


window.openRTIOverdue =
    openRTIOverdue;


window.openRTICompleted =
    openRTICompleted;


window.openRTIDailyStatus =
    openRTIDailyStatus;


window.openRTIRegister =
    openRTIRegister;


window.openRTIApplication =
    openRTIApplication;


window.openRTIHome =
    openRTIHome;


window.printRTIReport =
    printRTIReport;


window.exportRTIReport =
    exportRTIReport;


console.log(
    "RTI Reports JS Ready."
);