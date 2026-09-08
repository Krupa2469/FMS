/* ============================================================
   DISHA MEETING REGISTER
   File        : disha-register.js
   Version     : 2.0
   Project     : CRD-TG-FMS
   Developer   : Lekha Technologies

   Purpose:
   - Load DISHA meetings from Firestore
   - Display current FY records
   - Support Daily Status Report hyperlinks
   - Support search
   - Open individual DISHA records
   - Support Home / Back / New Meeting / Refresh
   ============================================================ */

"use strict";

console.log("DISHA Meeting Register JS Loaded...");


/* ============================================================
   CONSTANTS
   ============================================================ */

const DISHA_COLLECTION = "dishaMeetings";


/* ============================================================
   GLOBAL DATA
   ============================================================ */

let dishaMeetings = [];

let filteredMeetings = [];


/* ============================================================
   PAGE INITIALIZATION
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "Initializing DISHA Meeting Register..."
        );

        registerEvents();

        await loadDISHAmeetings();

<<<<<<< HEAD
        initializeDISHAFinancialYearFilter();
        applyDISHAFinancialYear();
=======
        applyURLFilter();
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604

    }
);


/* ============================================================
   FIRESTORE DATABASE
   ============================================================ */

function getFirestoreDB() {

    if (window.db) {

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


/* ============================================================
   EVENT REGISTRATION
   ============================================================ */

function registerEvents() {
<<<<<<< HEAD
    const btnWhatsApp = document.getElementById("btnWhatsApp");
    if (btnWhatsApp) btnWhatsApp.addEventListener("click", async () => {
        const visible = document.querySelector("tbody")?.innerText || "";
        await window.FMSWhatsAppService?.compose({
            module:"DISHA",
            title:"DISHA Register Message",
            defaultMessage:`DISHA Register Update\nStatus as on: ${new Date().toLocaleDateString("en-IN")}\n\n${visible.slice(0,2800)}\n\nPlease type or edit your custom message.`,
            message:(m)=>typeof showMessage==="function" ? showMessage("info",m) : typeof showRTIMessage==="function" ? showRTIMessage(m,"info") : typeof showDishaMessage==="function" ? showDishaMessage(m,"info") : null
        });
    });



    const btnNewMeeting =
        document.getElementById("btnNew") ||
        document.getElementById("btnNewMeeting");
=======

    const btnNewMeeting =
        document.getElementById(
            "btnNewMeeting"
        );
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604


    const btnRefresh =
        document.getElementById(
            "btnRefresh"
        );


    const btnBack =
<<<<<<< HEAD
        document.getElementById("btnBack") ||
        document.getElementById("btnBackToDISHA");
=======
        document.getElementById(
            "btnBackToDISHA"
        );
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604


    const btnHome =
        document.getElementById(
            "btnHome"
        );


    const btnSearch =
        document.getElementById(
            "btnSearch"
        );


    /* --------------------------------------------------------
       NEW MEETING
    -------------------------------------------------------- */

    if (btnNewMeeting) {

        btnNewMeeting.addEventListener(
            "click",
            function () {

                window.location.href =
                    "disha.html";

            }
        );

    }


    /* --------------------------------------------------------
       REFRESH
    -------------------------------------------------------- */

    if (btnRefresh) {

        btnRefresh.addEventListener(
            "click",
            async function () {

                await loadDISHAmeetings();

                applyURLFilter();

            }
        );

    }


    /* --------------------------------------------------------
       BACK TO DISHA
    -------------------------------------------------------- */

    if (btnBack) {

        btnBack.addEventListener(
            "click",
            function () {

                window.location.href =
                    "disha.html";

            }
        );

    }


    /* --------------------------------------------------------
       HOME
    -------------------------------------------------------- */

    if (btnHome) {

        btnHome.addEventListener(
            "click",
            function () {

                window.location.href =
<<<<<<< HEAD
                    "../../pages/module-dashboard.html?module=disha";
=======
                    "../../index.html";
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604

            }
        );

    }


    /* --------------------------------------------------------
       SEARCH
    -------------------------------------------------------- */

    if (btnSearch) {

        btnSearch.addEventListener(
            "click",
            function () {

                applySearch();

            }
        );

    }

}


/* ============================================================
   LOAD FIRESTORE RECORDS
   ============================================================ */

async function loadDISHAmeetings() {

    const db =
        getFirestoreDB();


    if (!db) {

        console.error(
            "Firestore is not initialized."
        );

        return;

    }


    try {

        const snapshot =
            await db
                .collection(
                    DISHA_COLLECTION
                )
                .get();


        dishaMeetings = [];


        snapshot.forEach(
            function (doc) {

                dishaMeetings.push({

                    id: doc.id,

                    ...doc.data()

                });

            }
        );


        console.log(
            "DISHA meetings loaded:",
            dishaMeetings
        );


        /* Update FY summary cards */

        updateSummaryCards(
            dishaMeetings
        );


        /* Default table */

        filteredMeetings =
            [...dishaMeetings];


        renderRegisterTable(
            filteredMeetings
        );

    }

    catch (error) {

        console.error(
            "Error loading DISHA meetings:",
            error
        );


        showError(
            "Unable to load DISHA meeting records."
        );

    }

}


/* ============================================================
<<<<<<< HEAD
   FINANCIAL YEAR SELECTOR
============================================================ */
function initializeDISHAFinancialYearFilter(){
 const el=document.getElementById("financialYear");
 if(!el || !window.FMSFY) return;
 const options=FMSFY.getFYOptions(dishaMeetings,["dateOfMeeting"]);
 const current=FMSFY.getCurrentFY();
 el.innerHTML=options.map(f=>`<option value="${f}" ${f===current?"selected":""}>${f}</option>`).join("");
 el.onchange=applyDISHAFinancialYear;
}
function getSelectedDISHAFYRecords(){
 const fy=document.getElementById("financialYear")?.value || FMSFY?.getCurrentFY();
 return FMSFY ? FMSFY.filterFY(dishaMeetings,fy,["dateOfMeeting"]) : dishaMeetings.filter(isCurrentFinancialYear);
}
function applyDISHAFinancialYear(){
 filteredMeetings=getSelectedDISHAFYRecords();
 applyURLFilter();
}

=======
   CURRENT FINANCIAL YEAR
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

function parseDate(
    value
) {

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


    /* Firestore timestamp object */

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


    /* Firestore internal timestamp */

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


    /* JavaScript Date */

    if (
        value instanceof Date
    ) {

        return value;

    }


    const text =
        String(
            value
        ).trim();


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
        new Date(
            text
        );


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
   FORMAT DATE
   ============================================================ */

function formatDate(
    value
) {

    const date =
        parseDate(
            value
        );


    if (!date) {

        return "";

    }


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


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


>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604
/* ============================================================
   CURRENT FINANCIAL YEAR CHECK
   ============================================================ */

function isCurrentFinancialYear(
    meeting
) {

    const meetingDate =
        parseDate(
            meeting.dateOfMeeting
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


    if (
        currentMonth >= 4
    ) {

        fyStartYear =
            currentYear;

    }
    else {

        fyStartYear =
            currentYear - 1;

    }


    const fyStart =
        new Date(
            fyStartYear,
            3,
            1,
            0,
            0,
            0,
            0
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
   NORMALIZE TEXT
   ============================================================ */

function normalize(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase();

}


/* ============================================================
   PoM OVERDUE
   ============================================================ */

function isPOMOverdue(
    meeting
) {

    const uploaded =
        normalize(
            meeting.pomUploaded
        );


    if (
        uploaded === "yes"
    ) {

        return false;

    }


    const dueDate =
        parseDate(
            meeting.pomDueDate
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
        dueDate < today
    );

}


/* ============================================================
   SUMMARY CARDS
   ============================================================ */
/* ============================================================
   SUMMARY CARDS
   ============================================================ */

function updateSummaryCards(records) {

    console.log("Updating DISHA Summary Cards...");

    // ---------------------------------------------------------
    // CURRENT FINANCIAL YEAR RECORDS
    // ---------------------------------------------------------

    const currentFYRecords =
        records.filter(isCurrentFinancialYear);

    // ---------------------------------------------------------
    // MEETING COUNTS
    // ---------------------------------------------------------

    const total =
        currentFYRecords.length;

    const held =
        currentFYRecords.filter(
            record =>
                normalize(
                    record.statusOfMeeting
                ) === "held"
        ).length;

    const toBeHeld =
        currentFYRecords.filter(
            record =>
                normalize(
                    record.statusOfMeeting
                ) === "to be held"
        ).length;

    const postponed =
        currentFYRecords.filter(
            record =>
                normalize(
                    record.statusOfMeeting
                ) === "postponed"
        ).length;

    // ---------------------------------------------------------
    // PoM COUNTS
    // ---------------------------------------------------------

    const uploaded =
        currentFYRecords.filter(
            record =>
                normalize(
                    record.pomUploaded
                ) === "yes"
        ).length;

    const awaiting =
        currentFYRecords.filter(
            record =>
                normalize(
                    record.pomUploaded
                ) === "no"
        ).length;

    const overdue =
        currentFYRecords.filter(
            isPOMOverdue
        ).length;

    // ---------------------------------------------------------
    // UPDATE HTML SUMMARY CARDS
    // IMPORTANT:
    // These IDs MUST match disha-register.html
    // ---------------------------------------------------------

    // Total Meetings
    setElementText(
        "totalRecords",
        total
    );

    // PoM Awaiting Upload
    setElementText(
        "pomPending",
        awaiting
    );

    // PoM Overdue
    setElementText(
        "pomOverdue",
        overdue
    );

    // ---------------------------------------------------------
    // OPTIONAL ADDITIONAL ELEMENTS
    // If these exist on another version of the HTML,
    // they will also be updated safely.
    // ---------------------------------------------------------

    setElementText(
        "meetingsHeld",
        held
    );

    setElementText(
        "meetingsToBeHeld",
        toBeHeld
    );

    setElementText(
        "meetingsPostponed",
        postponed
    );

    setElementText(
        "pomUploaded",
        uploaded
    );

    // ---------------------------------------------------------
    // CONSOLE VERIFICATION
    // ---------------------------------------------------------

    console.log(
        "DISHA SUMMARY:",
        {
            financialYear:
                getCurrentFinancialYear(),

            totalMeetings:
                total,

            meetingsHeld:
                held,

            meetingsToBeHeld:
                toBeHeld,

            meetingsPostponed:
                postponed,

            pomUploaded:
                uploaded,

            pomAwaitingUpload:
                awaiting,

            pomOverdue:
                overdue
        }
    );
}


/* ============================================================
   URL FILTER
   ============================================================ */

function applyURLFilter() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const filter =
        normalize(
            params.get(
                "filter"
            )
        );


    console.log(
        "DISHA register URL filter:",
        filter || null
    );


    /*
     * No filter:
     * Show all records.
     */

    if (!filter) {
<<<<<<< HEAD
        filteredMeetings = getSelectedDISHAFYRecords();
        renderRegisterTable(filteredMeetings);
        return;
=======

        filteredMeetings =
            [...dishaMeetings];


        renderRegisterTable(
            filteredMeetings
        );


        return;

>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604
    }


    /*
     * Daily Status Report
     * filters are always based
     * on the current Financial Year.
     */

    const currentFYRecords =
<<<<<<< HEAD
        getSelectedDISHAFYRecords();
=======
        dishaMeetings.filter(
            isCurrentFinancialYear
        );
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604


    switch (
        filter
    ) {


        /* ----------------------------------------------------
<<<<<<< HEAD
           DASHBOARD CARD ALIASES
        ---------------------------------------------------- */
        case "pom-pending":
        case "awaiting":
            filteredMeetings = currentFYRecords.filter(r => !/yes|uploaded|completed/i.test(String(r.pomUploaded || r.pomStatus || "")));
            break;
        case "pom-overdue":
        case "overdue":
            filteredMeetings = currentFYRecords.filter(isPOMOverdue);
            break;
        case "upcoming":
        case "tobeheld":
            filteredMeetings = currentFYRecords.filter(r => {
                const d=parseDate(r.proposedDateOfMeeting || r.dateOfMeeting);
                return d && d >= new Date();
            });
            break;
        case "circulation":
            filteredMeetings = currentFYRecords.filter(r => /under circulation|circulation/i.test(String(r.statusOfFile||r.status||"")));
            break;

        /* ----------------------------------------------------
=======
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604
           TOTAL MEETINGS
        ---------------------------------------------------- */

        case "total":

            filteredMeetings =
                [
                    ...currentFYRecords
                ];

            break;


        /* ----------------------------------------------------
           MEETINGS HELD
        ---------------------------------------------------- */

        case "held":

            filteredMeetings =
                currentFYRecords.filter(
                    function (record) {

                        return (
                            normalize(
                                record.statusOfMeeting
                            ) === "held"
                        );

                    }
                );

            break;


        /* ----------------------------------------------------
<<<<<<< HEAD
=======
           MEETINGS TO BE HELD
        ---------------------------------------------------- */

        case "tobeheld":

            filteredMeetings =
                currentFYRecords.filter(
                    function (record) {

                        return (
                            normalize(
                                record.statusOfMeeting
                            ) === "to be held"
                        );

                    }
                );

            break;


        /* ----------------------------------------------------
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604
           POSTPONED
        ---------------------------------------------------- */

        case "postponed":

            filteredMeetings =
                currentFYRecords.filter(
                    function (record) {

                        return (
                            normalize(
                                record.statusOfMeeting
                            ) === "postponed"
                        );

                    }
                );

            break;


        /* ----------------------------------------------------
           PoM UPLOADED
        ---------------------------------------------------- */

        case "uploaded":

            filteredMeetings =
                currentFYRecords.filter(
                    function (record) {

                        return (
                            normalize(
                                record.pomUploaded
                            ) === "yes"
                        );

                    }
                );

            break;


        /* ----------------------------------------------------
<<<<<<< HEAD
=======
           PoM AWAITING
        ---------------------------------------------------- */

        case "awaiting":

            filteredMeetings =
                currentFYRecords.filter(
                    function (record) {

                        return (
                            normalize(
                                record.pomUploaded
                            ) === "no"
                        );

                    }
                );

            break;


        /* ----------------------------------------------------
           PoM OVERDUE
        ---------------------------------------------------- */

        case "overdue":

            filteredMeetings =
                currentFYRecords.filter(
                    isPOMOverdue
                );

            break;


        /* ----------------------------------------------------
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604
           DEFAULT
        ---------------------------------------------------- */

        default:

            filteredMeetings =
                [
                    ...dishaMeetings
                ];

            break;

    }


    renderRegisterTable(
        filteredMeetings
    );

}


/* ============================================================
   SEARCH
   ============================================================ */

function applySearch() {

    const districtInput =
        document.getElementById(
            "searchDistrict"
        );


    const meetingFrom =
<<<<<<< HEAD
        document.getElementById("searchFromDate") ||
        document.getElementById("searchMeetingFrom");


    const meetingTo =
        document.getElementById("searchToDate") ||
        document.getElementById("searchMeetingTo");
=======
        document.getElementById(
            "searchMeetingFrom"
        );


    const meetingTo =
        document.getElementById(
            "searchMeetingTo"
        );
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604


    const district =
        normalize(
            districtInput
                ? districtInput.value
                : ""
        );


    const fromDate =
        meetingFrom
            ? parseDate(
                meetingFrom.value
            )
            : null;


    const toDate =
        meetingTo
            ? parseDate(
                meetingTo.value
            )
            : null;


    filteredMeetings =
        dishaMeetings.filter(
            function (meeting) {

                const meetingDate =
                    parseDate(
                        meeting.dateOfMeeting
                    );


                /*
                 * District
                 */

                if (
                    district &&
                    !normalize(
                        meeting.district
                    ).includes(
                        district
                    )
                ) {

                    return false;

                }


                /*
                 * From date
                 */

                if (
                    fromDate &&
                    meetingDate &&
                    meetingDate < fromDate
                ) {

                    return false;

                }


                /*
                 * To date
                 */

                if (
                    toDate &&
                    meetingDate &&
                    meetingDate > toDate
                ) {

                    return false;

                }


                return true;

            }
        );


    renderRegisterTable(
        filteredMeetings
    );

}


/* ============================================================
   RENDER REGISTER TABLE
   ============================================================ */

function renderRegisterTable(
    records
) {

    let tbody =
        document.getElementById(
<<<<<<< HEAD
            "registerBody"
=======
            "dishaRegisterBody"
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604
        );


    /*
     * Fallback:
     * Find first table tbody.
     */

    if (!tbody) {

        const table =
            document.querySelector(
                "table"
            );


        if (table) {

            tbody =
                table.querySelector(
                    "tbody"
                );

        }

    }


    if (!tbody) {

        console.error(
            "DISHA Register table tbody not found."
        );

        return;

    }


    tbody.innerHTML = "";


    /*
     * No records
     */

    if (
        !records ||
        records.length === 0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td
                colspan="9"
                class="text-center text-muted py-4">

                No DISHA meetings found.

            </td>

        `;


        tbody.appendChild(
            row
        );


        updateRecordCount(
            0
        );


        return;

    }


    /*
     * Sort newest meeting first.
     */

    const sortedRecords =
        [
            ...records
        ].sort(
            function (a, b) {

                const dateA =
                    parseDate(
                        a.dateOfMeeting
                    );


                const dateB =
                    parseDate(
                        b.dateOfMeeting
                    );


                if (
                    !dateA &&
                    !dateB
                ) {

                    return 0;

                }


                if (!dateA) {

                    return 1;

                }


                if (!dateB) {

                    return -1;

                }


                return (
                    dateB -
                    dateA
                );

            }
        );


    /*
     * Render records.
     */

    sortedRecords.forEach(
        function (meeting) {

            const row =
                document.createElement(
                    "tr"
                );


            const overdue =
                isPOMOverdue(
                    meeting
                );


            const pomStatus =
                normalize(
                    meeting.pomUploaded
                );


            let pomBadge;


            if (
                pomStatus === "yes"
            ) {

                pomBadge = `

                    <span
                        class="badge bg-success">

                        Yes

                    </span>

                `;

            }

            else if (
                overdue
            ) {

                pomBadge = `

                    <span
                        class="badge bg-danger">

                        Overdue

                    </span>

                `;

            }

            else {

                pomBadge = `

                    <span
                        class="badge bg-warning text-dark">

                        No

                    </span>

                `;

            }


            row.innerHTML = `

                <td>
                    ${safe(
                        meeting.slNo
                    )}
                </td>


                <td>
                    ${safe(
                        meeting.district
                    )}
                </td>


                <td>
                    ${formatDate(
                        meeting.dateOfMeeting
                    )}
                </td>


                <td>
                    ${formatDate(
                        meeting.pomDueDate
                    )}
                </td>


                <td>
                    ${pomBadge}
                </td>


                <td class="text-end">
                    ₹${formatAmount(
                        meeting.meetingExpenditure
                    )}
                </td>


                <td>
                    ${safe(
                        meeting.statusOfBills
                    )}
                </td>


                <td>
                    ${safe(
                        meeting.statusOfMeeting
                    )}
                </td>


                <td>

                    <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        onclick="openDISHARecord('${safeJS(
                            meeting.id
                        )}')">

                        <i
                            class="bi bi-folder2-open">
                        </i>

                        Open

                    </button>

                </td>

            `;


            tbody.appendChild(
                row
            );

        }
    );


    updateRecordCount(
        sortedRecords.length
    );

}


/* ============================================================
   OPEN DISHA RECORD
   ============================================================ */

function openDISHARecord(
    id
) {

    if (!id) {

        return;

    }


    window.location.href =
        "disha.html?id=" +
        encodeURIComponent(
            id
        );

}


/* ============================================================
   NEW DISHA MEETING
   ============================================================ */

function newDISHAmeeting() {

    window.location.href =
        "disha.html";

}


/* ============================================================
   RECORD COUNT
   ============================================================ */

function updateRecordCount(
    count
) {

    const element =
        document.getElementById(
            "recordCount"
        );


    if (element) {

        element.textContent =
            "Records: " +
            count;

    }

}


/* ============================================================
   SAFE HTML TEXT
   ============================================================ */

function safe(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(
        value
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ============================================================
   SAFE JAVASCRIPT VALUE
   ============================================================ */

function safeJS(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        )
        .replace(
            /\r?\n/g,
            "\\n"
        );

}


/* ============================================================
   FORMAT AMOUNT
   ============================================================ */

function formatAmount(
    value
) {

    const amount =
        Number(
            value
        ) || 0;


    return amount.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


/* ============================================================
   SET ELEMENT TEXT
   ============================================================ */

function setElementText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* ============================================================
   ERROR
   ============================================================ */

function showError(
    message
) {

    console.error(
        message
    );

}

/* ============================================================
   SUMMARY CARD FILTER
   ============================================================ */

function openSummaryFilter(filter) {

    if (!filter) {
        return;
    }

    console.log(
        "Opening DISHA summary filter:",
        filter
    );

    window.location.href =
        "disha-register.html?filter=" +
        encodeURIComponent(filter);
}

/* ============================================================
   GLOBAL FUNCTIONS
   ============================================================ */

window.openDISHARecord =
    openDISHARecord;

window.newDISHAmeeting =
    newDISHAmeeting;

window.applySearch =
    applySearch;

window.openSummaryFilter =
    openSummaryFilter;


/* ============================================================
   END OF FILE
   ============================================================ */

console.log(
    "DISHA Meeting Register Ready."
);

/* ============================================================
   READY
   ============================================================ */

console.log(
    "DISHA Meeting Register Ready."
);