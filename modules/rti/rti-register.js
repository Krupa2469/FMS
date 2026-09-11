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
const RTI_FY_FIELDS = ["applicationDate","dateReceived","date"];




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

        bindRTIExportButtons();

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

                const data=doc.data()||{};
                if(data.active===false)return;
                rtiRecords.push({id:doc.id,...data});

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

        window.loadRTIRecordsFromFirestore = loadRTIRecordsFromFirestore;


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
   FINANCIAL YEAR SELECTOR / FILTER HELPERS
   These helpers are intentionally global so URL-filter mode can use them.
============================================================ */
function initializeRTIFinancialYearFilter(){
    const el=document.getElementById("financialYear");
    if(!el || !window.FMSFY) return;
    const options=FMSFY.getFYOptions(rtiRecords,RTI_FY_FIELDS);
    const params=new URLSearchParams(location.search);
    const requestedFY=params.get("fy");
    const current=requestedFY || FMSFY.getCurrentFY();
    el.innerHTML=`<option value="all">All Years</option>`+options.map(f=>`<option value="${f}" ${f===current?"selected":""}>${f}</option>`).join("");
    if(current==="all") el.value="all"; else if(options.includes(current)) el.value=current;
    el.onchange=function(){
        const p=new URLSearchParams(location.search);
        p.set("fy",el.value);
        p.delete("filter");
        history.replaceState({},document.title,location.pathname+"?"+p.toString());
        applyRTIFYFilter();
    };
}
function getSelectedRTIFYRecords(){
    const params=new URLSearchParams(location.search);
    const fy=params.get("fy") || document.getElementById("financialYear")?.value || window.FMSFY?.getCurrentFY?.() || "";
    if(fy==="all") return rtiRecords.filter(r=>r.active!==false && r.deleted!==true);
    return window.FMSFY ? window.FMSFY.filterFY(rtiRecords,fy,RTI_FY_FIELDS) : getCurrentFYRecords();
}
function applyRTIFYFilter(){
    const records=getSelectedRTIFYRecords();
    displayedRecords=records;
    updateSummaryCards(records);
    renderRegister(records);
}
function newRTI(){ window.location.href="rti.html"; }
function loadRTIRecords(){ initializeRTIRegister(); }
function goBackToRTI(){ window.location.href="rti.html"; }
function goHome(){ window.location.href="../../index.html"; }
function openSummaryFilter(filterType){
    const params=new URLSearchParams();
    params.set("filter",filterType||"total");
    params.set("fullscreen","1");
    const fy=document.getElementById("financialYear")?.value || new URLSearchParams(location.search).get("fy") || window.FMSFY?.getCurrentFY?.();
    if(fy) params.set("fy",fy);
    window.location.href="rti-register.html?"+params.toString();
}
window.initializeRTIFinancialYearFilter=initializeRTIFinancialYearFilter;
window.getSelectedRTIFYRecords=getSelectedRTIFYRecords;
window.applyRTIFYFilter=applyRTIFYFilter;
window.newRTI=newRTI;
window.loadRTIRecords=loadRTIRecords;
window.goBackToRTI=goBackToRTI;
window.goHome=goHome;
window.openSummaryFilter=openSummaryFilter;

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
    if(window.FMSRecordPolicy){
        if(window.FMSRecordPolicy.closed("rti",record))return "completed";
        if(window.FMSRecordPolicy.overdue("rti",record))return "overdue";
        return "pending";
    }


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

function renderRegister(records) {
    const tbody = document.getElementById("rtiRegisterBody");
    const recordCount = document.getElementById("recordCount");
    const headerRow = document.querySelector("thead tr");
    const columns = [
        ["applicationNumber", "RTI Application No."],
        ["applicationDate", "Application Date"],
        ["dueDate", "Due Date"],
        ["daysStatus", "Days Left / Overdue Days"],
        ["applicantName", "Applicant Name"],
        ["subject", "Subject"],
        ["concernedSection", "Concerned Section"],
        ["replyStatusView", "Reply Status"],
        ["replySentStatus", "Reply Sent Status"],
        ["workflowStage", "Present Workflow Stage"],
        ["finalStatusView", "Final Status"]
    ];
    if (headerRow) headerRow.innerHTML = `<th>Sl.No</th>${columns.map(c=>`<th>${escapeHTML(c[1])}</th>`).join("")}<th>Action</th>`;
    if (!tbody) return;
    if (recordCount) recordCount.textContent = `Records : ${records.length}`;
    tbody.innerHTML = "";
    if (!records.length) {
        tbody.innerHTML = `<tr><td colspan="${columns.length+2}" class="empty-message">No RTI applications found.</td></tr>`;
        return;
    }
    records.forEach(function(record,index){
        const wf = window.FMSRecordPolicy?.workflow?.("rti", record) || {};
        const value = key => {
            if (key === "applicationDate" || key === "dueDate") return formatDate(record[key]);
            if (key === "daysStatus") return wf.dueLabel || "";
            if (key === "subject") return escapeHTML(record.subject || record.officeSubject || record.informationSought || "-");
            if (key === "concernedSection") return escapeHTML(record.concernedSection || record.officeReplySection || record.officeReplyObtainedFrom || "-");
            if (key === "replyStatusView") return wf.replyReceived ? "Received" : "Awaited";
            if (key === "replySentStatus") return wf.replySent ? "Sent" : "Pending";
            if (key === "workflowStage") return escapeHTML(wf.stage || record.workflowStage || "RTI application received");
            if (key === "finalStatusView") return escapeHTML(wf.finalStatus || record.finalStatus || record.presentStatus || "Pending");
            return escapeHTML(record[key] || "-");
        };
        const tr=document.createElement("tr");
        tr.innerHTML = `<td>${index+1}</td>${columns.map(c=>`<td>${value(c[0])}</td>`).join("")}<td><button type="button" class="btn-open" onclick="viewRTIRecord('${escapeHTML(record.id)}')"><i class="fa-solid fa-eye"></i> View</button><button type="button" class="btn-open" style="background:#ffc107;color:#111;margin-left:4px;" onclick="editRTIRecord('${escapeHTML(record.id)}')"><i class="fa-solid fa-pen-to-square"></i> Edit</button><button type="button" class="btn-open" style="background:#dc3545;color:white;margin-left:4px;" onclick="deleteRTIRecordFromRegister('${escapeHTML(record.id)}')"><i class="fa-solid fa-trash"></i> Delete</button></td>`;
        tbody.appendChild(tr);
    });
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
                onclick="viewRTIRecord('${escapeHTML(record.id)}')"
            >
                <i class="fa-solid fa-eye"></i> View
            </button>

            <button
                type="button"
                class="btn-open"
                style="background:#ffc107;color:#111;margin-left:4px;"
                onclick="editRTIRecord('${escapeHTML(record.id)}')"
            >
                <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>

            <button
                type="button"
                class="btn-open"
                style="background:#dc3545;color:white;margin-left:4px;"
                onclick="deleteRTIRecordFromRegister('${escapeHTML(record.id)}')"
            >
                <i class="fa-solid fa-trash"></i> Delete
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
        "rti.html?mode=edit&fullscreenForm=1&id=" +
        encodeURIComponent(
            id
        );

}




function viewRTIRecord(id) {
    openRTIRecord(id);
}

function editRTIRecord(id) {
    openRTIRecord(id);
}

async function deleteRTIRecordFromRegister(id) {
    if (!id) return;
    if (!confirm("Delete this RTI application from the register?")) return;
    try {
        const database = getRTIRegisterDB();
        if (!database) throw new Error("Firebase Firestore is not available.");
        const ts = firebase?.firestore?.FieldValue?.serverTimestamp?.() || new Date();
        await database.collection(RTI_COLLECTION).doc(id).set({ active: false, deletedOn: ts, updatedOn: ts }, { merge: true });
        await loadRTIRecordsFromFirestore();
        processURLFilter();
    } catch (error) {
        console.error("Unable to delete RTI application:", error);
        showError("Unable to delete RTI application: " + (error.message || error));
    }
}


window.openRTIRecord =
    openRTIRecord;

window.viewRTIRecord = viewRTIRecord;
window.editRTIRecord = editRTIRecord;
window.deleteRTIRecordFromRegister = deleteRTIRecordFromRegister;


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
    const params = new URLSearchParams(window.location.search);
    const filter = params.get("filter");
    if (!filter) return;
    const records = getSelectedRTIFYRecords();
    let filtered = records;
    filtered = records.filter(record => {
        const wf = window.FMSRecordPolicy?.workflow?.("rti", record) || {};
        const closed = window.FMSRecordPolicy?.closed?.("rti", record) || calculateRTIStatus(record) === "completed";
        if (filter === "total") return true;
        if (filter === "pending") return !closed;
        if (filter === "within-due") return window.FMSRecordPolicy?.withinDue?.("rti", record);
        if (filter === "due-today") return window.FMSRecordPolicy?.dueToday?.("rti", record);
        if (filter === "overdue") return window.FMSRecordPolicy?.overdue?.("rti", record);
        if (["completed","disposed","closed"].includes(filter)) return closed;
        if (filter === "sent-section") return wf.sentToSection;
        if (filter === "reply-awaited") return wf.sentToSection && !wf.replyReceived && !closed;
        if (filter === "reply-received") return wf.replyReceived;
        if (filter === "reply-sent") return wf.replySent;
        if (filter === "circulation") return window.FMSRecordPolicy?.circulation?.("rti", record);
        return true;
    });
    displayedRecords = filtered;
    updateSummaryCards(records);
    renderRegister(filtered);
}


/* ============================================================
   REGISTER EXPORTS
============================================================ */
function getRTIExportRows(){
    return (displayedRecords||[]).map((record,index)=>({
        sl:index+1,
        applicationNumber:record.applicationNumber||"",
        applicationDate:formatDate(record.applicationDate),
        dueDate:formatDate(record.dueDate),
        applicantName:record.applicantName||"",
        district:record.district||"",
        assignedTo:record.assignedTo||record.assignedOfficer||"",
        presentStatus:(()=>{const s=calculateRTIStatus(record);return s==="completed"?"Completed / Disposed":s==="overdue"?"Overdue":"Pending";})()
    }));
}
const RTI_EXPORT_COLUMNS=[
    {key:"sl",label:"Sl.No"},{key:"applicationNumber",label:"Application No."},{key:"applicationDate",label:"Application Date"},{key:"dueDate",label:"Due Date"},{key:"applicantName",label:"Applicant Name"},{key:"district",label:"District"},{key:"assignedTo",label:"Assigned To"},{key:"presentStatus",label:"Present Status"}
];
async function exportRTIRegister(type){
    try{
        if(!window.FMSExportService) throw new Error("Export service is not loaded.");
        const rows=getRTIExportRows();
        const filter=new URLSearchParams(location.search).get("filter");
        const title=`RTI Application Register${filter?" - "+filter.replace(/-/g," "):""}`;
        const opts={rows,columns:RTI_EXPORT_COLUMNS,title,filename:title};
        if(type==="excel") await FMSExportService.toExcel(opts);
        if(type==="pdf") await FMSExportService.toPDF(opts);
        if(type==="jpeg") await FMSExportService.toJPEG(opts);
        if(type==="print") await FMSExportService.printRows(opts);
    }catch(e){ alert(e.message||e); }
}
function bindRTIExportButtons(){
    document.getElementById("btnExcel")?.addEventListener("click",()=>exportRTIRegister("excel"));
    document.getElementById("btnPDF")?.addEventListener("click",()=>exportRTIRegister("pdf"));
    document.getElementById("btnJPEG")?.addEventListener("click",()=>exportRTIRegister("jpeg"));
    document.getElementById("btnPrintRegister")?.addEventListener("click",()=>exportRTIRegister("print"));
}
window.exportRTIRegister=exportRTIRegister;

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



function viewRTIRecord(id) {
    openRTIRecord(id);
}

function editRTIRecord(id) {
    openRTIRecord(id);
}

async function deleteRTIRecordFromRegister(id) {
    if (!id) return;
    if (!confirm("Delete this RTI application from the register?")) return;
    try {
        const database = getRTIRegisterDB();
        if (!database) throw new Error("Firebase Firestore is not available.");
        const ts = firebase?.firestore?.FieldValue?.serverTimestamp?.() || new Date();
        await database.collection(RTI_COLLECTION).doc(id).set({ active: false, deletedOn: ts, updatedOn: ts }, { merge: true });
        await loadRTIRecordsFromFirestore();
        processURLFilter();
    } catch (error) {
        console.error("Unable to delete RTI application:", error);
        showError("Unable to delete RTI application: " + (error.message || error));
    }
}


window.openRTIRecord =
    openRTIRecord;

window.viewRTIRecord = viewRTIRecord;
window.editRTIRecord = editRTIRecord;
window.deleteRTIRecordFromRegister = deleteRTIRecordFromRegister;


/* ============================================================
   END
   ============================================================ */

console.log(
    "RTI Register JS Ready."
);