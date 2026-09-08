/* ============================================================
   FILE MANAGEMENT SYSTEM (FMS)

   Module   : DISHA
   File     : disha-daily-status.js
   Version  : 1.0
   Project  : CRD-TG-FMS
   Developer: Lekha Technologies

   Purpose:
   DISHA Daily Status Report
   Financial Year based reporting
   Firestore source: dishaMeetings

   ============================================================ */

"use strict";

console.log("DISHA Daily Status JS Loaded...");


/* ============================================================
   FIRESTORE COLLECTION
   ============================================================ */

const DISHA_COLLECTION =
    "dishaMeetings";


/* ============================================================
   GLOBAL DATA
   ============================================================ */

let dishaDailyRecords = [];

let dishaCurrentFYRecords = [];

let dishaDailySummary = {};


/* ============================================================
   INITIALIZATION
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeDailyStatus
);


async function initializeDailyStatus() {

    console.log(
        "Initializing DISHA Daily Status Report..."
    );

    try {

        await loadDISHARecords();

        buildDailyStatus();

    }

    catch (error) {

        console.error(
            "DISHA Daily Status Error:",
            error
        );

    }

}


/* ============================================================
   FIRESTORE
   ============================================================ */

async function loadDISHARecords() {

    if (
        typeof db ===
        "undefined"
    ) {

        throw new Error(
            "Firestore database is not initialized."
        );

    }


    const snapshot =
        await db
            .collection(
                DISHA_COLLECTION
            )
            .get();


    dishaDailyRecords =
        snapshot.docs.map(
            function (doc) {

                return {

                    id: doc.id,

                    ...doc.data()

                };

            }
        );


    console.log(
        "DISHA Daily Status records loaded:",
        dishaDailyRecords
    );

}


/* ============================================================
   FINANCIAL YEAR
   ============================================================ */

function getCurrentFinancialYear() {

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
        String(
            year
        ).slice(-2)
    );

}


/* ============================================================
   DATE PARSER
   ============================================================ */

function parseDISHAdate(value) {

    if (!value) {

        return null;

    }


    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        return value.toDate();

    }


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


    if (
        typeof value === "object" &&
        value._seconds !== undefined
    ) {

        return new Date(
            Number(
                value._seconds
            ) * 1000
        );

    }


    if (
        value instanceof Date
    ) {

        return value;

    }


    const text =
        String(value).trim();


    /* YYYY-MM-DD */

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            text
        )
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
        /^\d{2}\/\d{2}\/\d{4}$/.test(
            text
        )
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


/* ============================================================
   CURRENT FINANCIAL YEAR CHECK
   ============================================================ */

function isCurrentFinancialYear(
    record
) {

    const meetingDate =
        parseDISHAdate(
            record.dateOfMeeting
        );


    if (!meetingDate) {

        return false;

    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        today.getMonth() + 1;


    let fyStartYear;


    if (month >= 4) {

        fyStartYear =
            year;

    }

    else {

        fyStartYear =
            year - 1;

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


/* ============================================================
   NORMALIZE
   ============================================================ */

function normalizeDISHA(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase();

}


/* ============================================================
   POM OVERDUE
   ============================================================ */

function isPOMOverdue(
    record
) {

    const uploaded =
        normalizeDISHA(
            record.pomUploaded
        );


    if (
        uploaded === "yes"
    ) {

        return false;

    }


    const dueDate =
        parseDISHAdate(
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


    return (
        today >
        dueDate
    );

}


/* ============================================================
   BUILD DAILY STATUS
   ============================================================ */

function buildDailyStatus() {

    const financialYear =
        getCurrentFinancialYear();


    dishaCurrentFYRecords =
        dishaDailyRecords.filter(
            isCurrentFinancialYear
        );


    console.log(
        "DISHA Current FY:",
        financialYear
    );


    console.log(
        "DISHA Current FY Records:",
        dishaCurrentFYRecords
    );


    const totalMeetings =
        dishaCurrentFYRecords.length;


    const meetingsHeld =
        dishaCurrentFYRecords.filter(
            function (record) {

                return (
                    normalizeDISHA(
                        record.statusOfMeeting
                    ) === "held"
                );

            }
        ).length;


    const meetingsToBeHeld =
        dishaCurrentFYRecords.filter(
            function (record) {

                return (
                    normalizeDISHA(
                        record.statusOfMeeting
                    ) ===
                    "to be held"
                );

            }
        ).length;


    const meetingsPostponed =
        dishaCurrentFYRecords.filter(
            function (record) {

                return (
                    normalizeDISHA(
                        record.statusOfMeeting
                    ) ===
                    "postponed"
                );

            }
        ).length;


    const pomUploaded =
        dishaCurrentFYRecords.filter(
            function (record) {

                return (
                    normalizeDISHA(
                        record.pomUploaded
                    ) === "yes"
                );

            }
        ).length;


    const pomAwaitingUpload =
        dishaCurrentFYRecords.filter(
            function (record) {

                return (
                    normalizeDISHA(
                        record.pomUploaded
                    ) === "no"
                );

            }
        ).length;


    const pomOverdue =
        dishaCurrentFYRecords.filter(
            isPOMOverdue
        ).length;


    const meetingExpenditure =
        dishaCurrentFYRecords.reduce(
            function (
                total,
                record
            ) {

                return (
                    total +
                    Number(
                        record.meetingExpenditure ||
                        0
                    )
                );

            },
            0
        );


    dishaDailySummary = {

        financialYear:

            financialYear,

        totalMeetings:

            totalMeetings,

        meetingsHeld:

            meetingsHeld,

        meetingsToBeHeld:

            meetingsToBeHeld,

        meetingsPostponed:

            meetingsPostponed,

        pomUploaded:

            pomUploaded,

        pomAwaitingUpload:

            pomAwaitingUpload,

        pomOverdue:

            pomOverdue,

        meetingExpenditure:

            meetingExpenditure

    };


    console.log(
        "DISHA DAILY STATUS SUMMARY:",
        dishaDailySummary
    );


    renderDailyStatus();

}


/* ============================================================
   RENDER DAILY STATUS
   ============================================================ */

function renderDailyStatus() {

    setText(
        "financialYear",
        dishaDailySummary.financialYear
    );


    setText(
        "reportDate",
        formatReportDate(
            new Date()
        )
    );


    setText(
        "totalMeetings",
        dishaDailySummary.totalMeetings
    );


    setText(
        "meetingsHeld",
        dishaDailySummary.meetingsHeld
    );


    setText(
        "meetingsToBeHeld",
        dishaDailySummary.meetingsToBeHeld
    );


    setText(
        "meetingsPostponed",
        dishaDailySummary.meetingsPostponed
    );


    setText(
        "pomUploaded",
        dishaDailySummary.pomUploaded
    );


    setText(
        "pomAwaitingUpload",
        dishaDailySummary.pomAwaitingUpload
    );


    setText(
        "pomOverdue",
        dishaDailySummary.pomOverdue
    );


    setText(
        "meetingExpenditure",
        formatCurrency(
            dishaDailySummary.meetingExpenditure
        )
    );

}


/* ============================================================
   SET TEXT
   ============================================================ */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {

        return;

    }


    element.textContent =
        value;

}


/* ============================================================
   DATE FORMAT
   ============================================================ */

function formatReportDate(
    date
) {

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
   CURRENCY
   ============================================================ */

function formatCurrency(
    value
) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    );

}


/* ============================================================
   OPEN DETAIL FILTER
   ============================================================ */

function openDailyDetail(
    filter
) {

    window.location.href =
        "disha-register.html?filter=" +
        encodeURIComponent(
            filter
        );

}


/* ============================================================
   OPEN COMPLETE REGISTER
   ============================================================ */

function openCompleteRegister() {

    window.location.href =
        "disha-register.html?filter=total";

}


/* ============================================================
   WHATSAPP REPORT TEXT
   ============================================================ */

function generateWhatsAppReport() {

    const s =
        dishaDailySummary;


    const reportDate =
        formatReportDate(
            new Date()
        );


    let message = "";

    message +=
        "*DISHA DAILY STATUS REPORT*\n\n";


    message +=
        "*Financial Year:* " +
        s.financialYear +
        "\n";


    message +=
        "*Status as on:* " +
        reportDate +
        "\n\n";


    message +=
        "*DISHA MEETING STATUS*\n\n";


    message +=
        "Total Meetings: " +
        s.totalMeetings +
        "\n";


    message +=
        "Meetings Held: " +
        s.meetingsHeld +
        "\n";


    message +=
        "Meetings To Be Held: " +
        s.meetingsToBeHeld +
        "\n";


    message +=
        "Meetings Postponed: " +
        s.meetingsPostponed +
        "\n\n";


    message +=
        "*PoM STATUS*\n\n";


    message +=
        "PoM Uploaded: " +
        s.pomUploaded +
        "\n";


    message +=
        "PoM Awaiting Upload: " +
        s.pomAwaitingUpload +
        "\n";


    message +=
        "PoM Overdue: " +
        s.pomOverdue +
        "\n\n";


    message +=
        "Meeting Expenditure: " +
        formatCurrency(
            s.meetingExpenditure
        ) +
        "\n\n";


    message +=
        "*Government of Telangana*\n";


    message +=
        "Office of the Commissioner, Rural Development";


    return message;

}


/* ============================================================
   SHARE TO WHATSAPP
   ============================================================ */

async function shareToWhatsApp() {
    try {
        const summary = typeof generateWhatsAppReport === "function"
            ? generateWhatsAppReport()
            : "";
        if (window.FMSWhatsAppService) {
            return await window.FMSWhatsAppService.compose({
                module: "DISHA",
                title: "DISHA Daily Status Report",
                summaryText: summary,
                element: document.querySelector(".report-container") || document.querySelector("main") || document.body
            });
        }
    } catch (error) {
        console.error("DISHA WhatsApp share failed:", error);
        alert("Unable to share DISHA Daily Status.\n\n" + error.message);
    }
}

/* ============================================================
   GLOBAL FUNCTIONS
   ============================================================ */

window.openDailyDetail =
    openDailyDetail;

window.openCompleteRegister =
    openCompleteRegister;

window.generateWhatsAppReport =
    generateWhatsAppReport;

window.shareToWhatsApp =
    shareToWhatsApp;


console.log(
    "DISHA Daily Status Report Ready."
);

document.addEventListener("DOMContentLoaded", function() {
  const b=document.getElementById("btnWhatsApp");
  if(b) b.addEventListener("click", shareToWhatsApp);
});
