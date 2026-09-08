/*    FILE MANAGEMENT SYSTEM (FMS)

   Module    : RTI
   File      : rti-register.js
   Version   : 4.1
   Developer : Lekha Technologies

   Purpose:
   RTI Application Register

   Firestore Collection:
   rtiApplications

   IMPORTANT:
   Firebase is initialized by the common FMS
   firebase-config / firebase-bootstrap.
   This file only uses the global Firestore db.
   ============================================================ */

"use strict";

console.log("======================================");
console.log("RTI REGISTER JS LOADED");
console.log("======================================");


/* ============================================================
   CONFIGURATION
   ============================================================ */

const RTI_COLLECTION = "rtiApplications";




function getRTIRegisterDB() {
    try {
        if (typeof window.getFMSFirestore === "function") {
            const shared = window.getFMSFirestore();
            if (shared) return shared;
        }
    } catch (e) {
        console.warn("Shared Firestore accessor failed:", e);
    }
    if (window.fmsFirebase && window.fmsFirebase.db) return window.fmsFirebase.db;
    if (window.db) return window.db;
    if (typeof db !== "undefined" && db) return db;
    if (typeof firebase !== "undefined" && firebase.firestore) return firebase.firestore();
    return null;
}

/* ============================================================
   GLOBAL DATA
   ============================================================ */

let rtiRecords = [];

let displayedRecords = [];


/* ============================================================
   PAGE INITIALIZATION
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Initializing RTI Register..."
        );

        initializeRTIRegister();

    }
);


/* ============================================================
   INITIALIZE
   ============================================================ */

async function initializeRTIRegister() {

    try {

        /*
         * Firebase must already be initialized
         * by the common FMS Firebase bootstrap.
         */

        if (
            typeof db === "undefined" ||
            !db
        ) {

            throw new Error(
                "Firebase Firestore database is not initialized."
            );

        }


        await loadRTIRecordsFromFirestore();

        const btnWhatsApp = document.getElementById("btnWhatsApp");
        if (btnWhatsApp && !btnWhatsApp.dataset.bound) {
            btnWhatsApp.dataset.bound = "1";
            btnWhatsApp.addEventListener("click", async () => {
                try {
                    if (!window.FMSWhatsAppService?.compose) throw new Error("WhatsApp service is not loaded.");
                    const visible = document.querySelector("tbody")?.innerText || "";
                    await window.FMSWhatsAppService.compose({
                        module:"RTI",
                        title:"RTI Register Message",
                        defaultMessage:`RTI Register Update\nStatus as on: ${new Date().toLocaleDateString("en-IN")}\n\n${visible.slice(0,2800)}\n\nPlease type or edit your custom message.`,
                        message:(m)=>showError(m)
                    });
                } catch (e) {
                    showError("Unable to open WhatsApp composer: " + e.message);
                }
            });
        }

        processURLFilter();


        console.log(
            "RTI Register Ready."
        );

    }
    catch (error) {

        console.error(
            "RTI Register Initialization Error:",
            error
        );

        showError(
            "Unable to load RTI applications. " +
            error.message
        );

    }

}


/* ============================================================
   LOAD RTI RECORDS FROM FIRESTORE
   ============================================================ */

async function loadRTIRecordsFromFirestore() {

    console.log(
        "Loading RTI applications from Firestore..."
    );


    const database = getRTIRegisterDB();

    if (!database) {
        throw new Error("Firebase Firestore is not available.");
    }


    try {

        const snapshot =
            await database
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
            rtiRecords
        );


        /*
         * Latest applications first.
         */

        rtiRecords.sort(
            function (a, b) {

                const dateA =
                    getDateValue(
                        a.applicationDate
                    );

                const dateB =
                    getDateValue(
                        b.applicationDate
                    );


                if (!dateA && !dateB) {
                    return 0;
                }

                if (!dateA) {
                    return 1;
                }

                if (!dateB) {
                    return -1;
                }


                return dateB - dateA;

            }
        );


        /*
         * Initially display
         * current financial year records.
         */

        initializeRTIFinancialYearFilter();
        displayedRecords =
            getSelectedRTIFYRecords();


        updateSummaryCards(
            displayedRecords
        );


        renderRegister(
            displayedRecords
        );


        /*
         * Make function available
         * to rti-register.html.
         */

        /* ============================================================
   FINANCIAL YEAR SELECTOR
============================================================ */
function initializeRTIFinancialYearFilter(){
 const el=document.getElementById("financialYear");
 if(!el || !window.FMSFY) return;
 const options=FMSFY.getFYOptions(rtiRecords,["applicationDate"]);
 const requestedFY=new URLSearchParams(location.search).get("fy");
 const current=requestedFY||FMSFY.getCurrentFY();
 el.innerHTML=options.map(f=>`<option value="${f}" ${f===current?"selected":""}>${f}</option>`).join("");
 el.addEventListener("change", function(){ applyRTIFYFilter(); });
}
function getSelectedRTIFYRecords(){
 const fy=document.getElementById("financialYear")?.value || FMSFY?.getCurrentFY();
 return FMSFY ? FMSFY.filterFY(rtiRecords,fy,["applicationDate"]) : getCurrentFYRecords();
}
function applyRTIFYFilter(){
 const records=getSelectedRTIFYRecords();
 displayedRecords=records;
 updateSummaryCards(records);
 renderRegister(records);
 const params=new URLSearchParams(location.search);
 params.delete("filter");
 history.replaceState({},document.title,location.pathname+(params.toString()?"?"+params.toString():""));
}
/* ============================================================
   FINANCIAL YEAR SELECTOR
============================================================ */
/* ============================================================
   REGISTER PAGE NAVIGATION / ACTIONS
============================================================ */

function newRTI() {
    window.location.href = "rti.html";
}

function loadRTIRecords() {
    initializeRTIRegister();
}

function goBackToRTI() {
    window.location.href = "rti.html";
}

function goHome() {
    window.location.href = "rti.html";
}

function openSummaryFilter(filterType) {
    openRTIRegisterFilter(filterType);
}

window.newRTI = newRTI;
window.loadRTIRecords = loadRTIRecords;
window.goBackToRTI = goBackToRTI;
window.goHome = goHome;
window.openSummaryFilter = openSummaryFilter;

window.loadRTIRecordsFromFirestore =
            loadRTIRecordsFromFirestore;


        console.log(
            "Current FY RTI records:",
            displayedRecords
        );

    }
    catch (error) {

        console.error(
            "Error loading RTI applications:",
            error
        );

        showError(
            "Unable to load RTI applications from Firestore."
        );

        throw error;

    }

}


/* ============================================================
   CURRENT FINANCIAL YEAR
   Indian FY = 1 April to 31 March
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
   GET CURRENT FY RECORDS
   ============================================================ */

function getCurrentFYRecords() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        today.getMonth() + 1;


    let startYear;


    if (month >= 4) {

        startYear = year;

    }
    else {

        startYear =
            year - 1;

    }


    const startDate =
        new Date(
            startYear,
            3,
            1,
            0,
            0,
            0,
            0
        );


    const endDate =
        new Date(
            startYear + 1,
            2,
            31,
            23,
            59,
            59,
            999
        );


    return rtiRecords.filter(
        function (record) {

            const applicationDate =
                getDateValue(
                    record.applicationDate
                );


            if (!applicationDate) {

                return false;

            }


            return (
                applicationDate >= startDate &&
                applicationDate <= endDate
            );

        }
    );

}

/* ============================================================
   UPDATE SUMMARY CARDS
   ============================================================ */

function updateSummaryCards(records) {

    const total = records.length;

    let pending = 0;
    let overdue = 0;
    let completed = 0;


    /* ========================================================
       CALCULATE STATUS COUNTS
       ======================================================== */

    records.forEach(record => {

        const status =
            calculateRTIStatus(record);


        /* OVERDUE */

        if (status === "overdue") {
            overdue++;
        }


        /* PENDING */

        if (
            status === "pending" ||
            status === "overdue"
        ) {
            pending++;
        }


        /* COMPLETED / DISPOSED */

        if (status === "completed") {
            completed++;
        }

    });


    /* ========================================================
       GET SUMMARY ELEMENTS
       ======================================================== */

    const totalElement =
        document.getElementById(
            "totalApplications"
        );


    const pendingElement =
        document.getElementById(
            "pendingApplications"
        );


    const overdueElement =
        document.getElementById(
            "overdueApplications"
        );


    const completedElement =
        document.getElementById(
            "completedApplications"
        );


    /* ========================================================
       UPDATE TOTAL
       ======================================================== */

    if (totalElement) {

        totalElement.textContent =
            total;

    }


    /* ========================================================
       UPDATE PENDING
       ======================================================== */

    if (pendingElement) {

        pendingElement.textContent =
            pending;

    }


    /* ========================================================
       UPDATE OVERDUE
       ======================================================== */

    if (overdueElement) {

        overdueElement.textContent =
            overdue;

    }


    /* ========================================================
       UPDATE COMPLETED / DISPOSED
       ======================================================== */

    if (completedElement) {

        completedElement.textContent =
            completed;

    }


    /* ========================================================
       CONSOLE SUMMARY
       ======================================================== */

    console.log(
        "RTI SUMMARY:",
        {
            financialYear:
                getCurrentFinancialYear(),

            totalApplications:
                total,

            pendingApplications:
                pending,

            overdueApplications:
                overdue,

            completedApplications:
                completed
        }
    );

}



/* ============================================================
   CALCULATE RTI STATUS
   ============================================================ */

function calculateRTIStatus(
    record
) {

    const presentStatus =
        String(
            record.presentStatus || ""
        )
        .trim()
        .toLowerCase();


    /*
     * Completed / disposed statuses.
     */

    const completedStatuses = [

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


    if (
        completedStatuses.includes(
            presentStatus
        )
    ) {

        return "completed";

    }


    const dueDate =
        getDateValue(
            record.dueDate
        );


    if (!dueDate) {

        return "pending";

    }


    const today =
        startOfDay(
            new Date()
        );


    const due =
        startOfDay(
            dueDate
        );


    if (
        today > due
    ) {

        return "overdue";

    }


    return "pending";

}


/* ============================================================
   RENDER REGISTER
   ============================================================ */

function renderRegister(
    records
) {

    const tbody =
        document.getElementById(
            "rtiRegisterBody"
        );


    const recordCount =
        document.getElementById(
            "recordCount"
        );


    if (!tbody) {

        console.error(
            "rtiRegisterBody not found."
        );

        return;

    }


    if (recordCount) {

        recordCount.textContent =
            `Records : ${records.length}`;

    }


    tbody.innerHTML = "";


    if (!records.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="empty-message"
                >
                    No RTI applications found.
                </td>

            </tr>

        `;

        return;

    }


    records.forEach(
        function (record, index) {

            const row =
                createRegisterRow(
                    record,
                    index
                );


            tbody.appendChild(
                row
            );

        }
    );

}


/* ============================================================
   CREATE REGISTER ROW
   ============================================================ */

function createRegisterRow(
    record,
    index
) {

    const tr =
        document.createElement(
            "tr"
        );


    const status =
        calculateRTIStatus(
            record
        );


    const statusHTML =
        getStatusHTML(
            status
        );


    tr.innerHTML = `

        <td>
            ${index + 1}
        </td>

        <td>
            ${escapeHTML(
                record.applicationNumber || "-"
            )}
        </td>

        <td>
            ${formatDate(
                record.applicationDate
            )}
        </td>

        <td>
            ${formatDate(
                record.dueDate
            )}
        </td>

        <td>
            ${escapeHTML(
                record.applicantName || "-"
            )}
        </td>

        <td>
            ${escapeHTML(
                record.district || "-"
            )}
        </td>

        <td>
            ${escapeHTML(
                record.assignedTo || "-"
            )}
        </td>

        <td>
            ${statusHTML}
        </td>

        <td>

            <button
                type="button"
                class="btn-open"
                onclick="openRTIRecord('${escapeHTML(record.id)}')"
            >

                <i class="fa-solid fa-folder-open"></i>

                Open

            </button>

        </td>

    `;


    return tr;

}


/* ============================================================
   STATUS HTML
   ============================================================ */

function getStatusHTML(
    status
) {

    if (
        status === "overdue"
    ) {

        return `

            <span
                class="status-badge status-overdue"
            >
                Overdue
            </span>

        `;

    }


    if (
        status === "completed"
    ) {

        return `

            <span
                class="status-badge status-completed"
            >
                Completed
            </span>

        `;

    }


    return `

        <span
            class="status-badge status-pending"
        >
            Pending
        </span>

    `;

}


/* ============================================================
   OPEN RTI RECORD
   ============================================================ */

function openRTIRecord(
    id
) {

    if (!id) {

        return;

    }


    console.log(
        "Opening RTI record:",
        id
    );


    window.location.href =
        "rti.html?id=" +
        encodeURIComponent(
            id
        );

}


window.openRTIRecord =
    openRTIRecord;


/* ============================================================
   SEARCH RTI RECORDS
   ============================================================ */

function performRTISearch() {

    const applicationNumber =
        getInputValue(
            "searchApplicationNumber"
        );


    const applicantName =
        getInputValue(
            "searchApplicantName"
        );


    const district =
        getInputValue(
            "searchDistrict"
        );


    /*
     * Search starts with
     * current FY records.
     */

    let records =
        getCurrentFYRecords();


    if (applicationNumber) {

        records =
            records.filter(
                function (record) {

                    return String(
                        record.applicationNumber || ""
                    )
                    .toLowerCase()
                    .includes(
                        applicationNumber
                    );

                }
            );

    }


    if (applicantName) {

        records =
            records.filter(
                function (record) {

                    return String(
                        record.applicantName || ""
                    )
                    .toLowerCase()
                    .includes(
                        applicantName
                    );

                }
            );

    }


    if (district) {

        records =
            records.filter(
                function (record) {

                    return String(
                        record.district || ""
                    )
                    .toLowerCase()
                    .includes(
                        district
                    );

                }
            );

    }


    displayedRecords =
        records;


    updateSummaryCards(
        records
    );


    renderRegister(
        records
    );


    console.log(
        "RTI Search Result:",
        records
    );

}


window.performRTISearch =
    performRTISearch;


/* ============================================================
   CLEAR SEARCH
   ============================================================ */

function clearRTISearch() {

    displayedRecords =
        getCurrentFYRecords();


    updateSummaryCards(
        displayedRecords
    );


    renderRegister(
        displayedRecords
    );


    console.log(
        "RTI search cleared."
    );

}


window.clearRTISearch =
    clearRTISearch;


/* ============================================================
   SUMMARY FILTER
   ============================================================ */
function processURLFilter() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const filter =
        params.get(
            "filter"
        );


    console.log(
        "RTI register URL filter:",
        filter
    );


    if (!filter) {

        return;

    }


    /*
     * IMPORTANT:
     * Always get ALL current FY records.
     * Summary cards must use these records,
     * NOT the filtered records.
     */

    const records =
        getSelectedRTIFYRecords();


    let filtered =
        records;


    /*
     * TOTAL
     */

    if (
        filter === "total"
    ) {

        filtered =
            records;

    }


    /*
     * PENDING
     */

    else if (
        filter === "pending"
    ) {

        filtered =
            records.filter(
                function (record) {

                    const status =
                        calculateRTIStatus(
                            record
                        );


                    return (
                        status === "pending" ||
                        status === "overdue"
                    );

                }
            );

    }


    /*
     * OVERDUE
     */

    else if (
        filter === "overdue"
    ) {

        filtered =
            records.filter(
                function (record) {

                    return (
                        calculateRTIStatus(
                            record
                        ) === "overdue"
                    );

                }
            );

    }


    /*
     * COMPLETED / DISPOSED
     */

    else if (filter === "circulation") {
        filtered = records.filter(record => /under circulation|circulation/i.test([record.statusOfFile,record.currentStatus,record.presentStatus,record.officeStatus,record.status].map(v=>String(v||"")).join(" | ")));
    }

    else if (filter === "due-today") {
        const today=new Date(); today.setHours(0,0,0,0);
        filtered=records.filter(record=>{
            const d=getDateValue(record.dueDate);
            if(!d || Number.isNaN(d.getTime())) return false;
            d.setHours(0,0,0,0);
            return d.getTime()===today.getTime() && calculateRTIStatus(record)!=="completed";
        });
    }

    else if (
        filter === "completed" ||
        filter === "disposed" ||
        filter === "closed"
    ) {

        filtered =
            records.filter(
                function (record) {

                    return (
                        calculateRTIStatus(
                            record
                        ) === "completed"
                    );

                }
            );

    }


    /*
     * Store only the filtered records
     * for displaying the register table.
     */

    displayedRecords =
        filtered;


    /*
     * IMPORTANT:
     * Summary cards MUST always show
     * the complete RTI summary.
     */

    updateSummaryCards(
        records
    );


    /*
     * Only the register table is filtered.
     */

    renderRegister(
        filtered
    );
    /* Keep the filter and FY in the URL while filtered mode is active. */

}


/* ============================================================
   DATE UTILITIES
   ============================================================ */

function getDateValue(
    value
) {

    if (!value) {

        return null;

    }


    /*
     * Firestore Timestamp.
     */

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        return value.toDate();

    }


    /*
     * JavaScript Date.
     */

    if (
        value instanceof Date
    ) {

        return value;

    }


    /*
     * Firestore timestamp-like object.
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
     * YYYY-MM-DD.
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
     * General date parsing.
     */

    const parsed =
        new Date(value);


    if (
        !isNaN(
            parsed.getTime()
        )
    ) {

        return parsed;

    }


    return null;

}


/* ============================================================
   FORMAT DATE
   ============================================================ */

function formatDate(
    value
) {

    const date =
        getDateValue(
            value
        );


    if (!date) {

        return "-";

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
        `${day}/${month}/${year}`
    );

}


/* ============================================================
   START OF DAY
   ============================================================ */

function startOfDay(
    date
) {

    const result =
        new Date(
            date
        );


    result.setHours(
        0,
        0,
        0,
        0
    );


    return result;

}


/* ============================================================
   INPUT VALUE
   ============================================================ */

function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    )
    .trim()
    .toLowerCase();

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
   ERROR MESSAGE
   ============================================================ */

function showError(
    message
) {

    const tbody =
        document.getElementById(
            "rtiRegisterBody"
        );


    if (!tbody) {

        return;

    }


    tbody.innerHTML = `

        <tr>

            <td
                colspan="9"
                class="empty-message"
                style="color:#dc3545;"
            >

                <i
                    class="fa-solid
                    fa-triangle-exclamation"
                ></i>

                ${escapeHTML(
                    message
                )}

            </td>

        </tr>

    `;

}


/* ============================================================
   EXPOSE FUNCTIONS
   ============================================================ */

window.loadRTIRecordsFromFirestore =
    loadRTIRecordsFromFirestore;

window.performRTISearch =
    performRTISearch;

window.clearRTISearch =
    clearRTISearch;

window.openRTIRecord =
    openRTIRecord;


/* ============================================================
   END
   ============================================================ */

console.log(
    "RTI Register JS Ready."
);