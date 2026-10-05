/* ============================================================
   DISHA MEETING REGISTER
   File        : disha-register.js
   Version     : 2.0
   Project     : CRD-TG-FMS

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
const DISHA_FY_FIELDS = ["dateOfMeeting","meetingDate","proposedDateOfMeeting","date"];
const DISHA_DISTRICTS = [
  "Adilabad","Bhadradri Kothagudem","Hanumakonda","Hyderabad","Jagtial","Jangaon","Jayashankar Bhupalpally","Jogulamba Gadwal","Kamareddy","Karimnagar","Khammam","KB Asifabad","Mahabubabad","Mahabubnagar","Mancherial","Medak","Medchal-Malkajgiri","Mulugu","Nagarkurnool","Nalgonda","Narayanpet","Nirmal","Nizamabad","Peddapalli","Rajanna Sircilla","Rangareddy","Sangareddy","Siddipet","Suryapet","Vikarabad","Wanaparthy","Warangal","Yadadri Bhuvanagiri"
];

/* Local date parser: the register must not depend on another module exposing parseDate(). */
function parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value.toDate === "function") {
        const d = value.toDate();
        return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }
    if (value && value.seconds != null) {
        const d = new Date(Number(value.seconds) * 1000);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    const text = String(value).trim();
    let m = text.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    m = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}


/* Local display formatter: keeps the register self-contained. */
function formatDate(value) {
    const d = parseDate(value);
    if (!d) return "";
    return String(d.getDate()).padStart(2, "0") + "/" +
        String(d.getMonth() + 1).padStart(2, "0") + "/" +
        d.getFullYear();
}

/* Local FY helper: April-March financial year, e.g. 2026-27. */
function getCurrentFinancialYear(referenceDate = new Date()) {
    const d = parseDate(referenceDate) || new Date();
    const year = d.getFullYear();
    const startYear = (d.getMonth() + 1) >= 4 ? year : year - 1;
    return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}


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

        await syncDishaSourceData();
        await window.FMSRegisterMasterConfig?.ready?.(await waitForDISHADB());
        await loadDISHAmeetings();

        initializeDISHAFinancialYearFilter();
        applyDISHAFinancialYear();

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
        "The data service is temporarily unavailable. Please refresh and try again."
    );

    return null;

}


/* ============================================================
   EVENT REGISTRATION
   ============================================================ */

function registerEvents() {
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



    document.getElementById("btnExcel")?.addEventListener("click",()=>exportDISHARegister("excel"));
    document.getElementById("btnPDF")?.addEventListener("click",()=>exportDISHARegister("pdf"));
    document.getElementById("btnJPEG")?.addEventListener("click",()=>exportDISHARegister("jpeg"));
    document.getElementById("btnPrintRegister")?.addEventListener("click",()=>exportDISHARegister("print"));

    const btnNewMeeting =
        document.getElementById("btnNew") ||
        document.getElementById("btnNewMeeting");


    const btnRefresh =
        document.getElementById(
            "btnRefresh"
        );


    const btnBack =
        document.getElementById("btnBack") ||
        document.getElementById("btnBackToDISHA");


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
                    "disha.html";

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


async function waitForDISHADB() {
    let db = getFirestoreDB();
    if (db) return db;
    if (window.FMSCrud?.waitForDb) { try { db = await window.FMSCrud.waitForDb(); } catch (_) {} }
    if (db) return db;
    await new Promise(resolve => {
        let done=false; const finish=()=>{if(done)return;done=true;resolve();};
        window.addEventListener("fmsFirebaseReady", finish, {once:true});
        setTimeout(finish, 2500);
    });
    return getFirestoreDB();
}

async function syncDishaSourceData() {
    const db = await waitForDISHADB();
    if (!db || !window.FMSDishaDataSync?.sync) return;
    try { await window.FMSDishaDataSync.sync(db); }
    catch (e) { console.warn("DISHA source-data sync skipped:", e); }
}

/* ============================================================
   LOAD FIRESTORE RECORDS
   ============================================================ */

async function loadDISHAmeetings() {

    const db = await waitForDISHADB();


    if (!db) {

        console.error(
            "The data service is still loading. Please wait and try again."
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

                const data=doc.data()||{};
                if(data.active===false)return;
                dishaMeetings.push({id:doc.id,...data});

            }
        );

        dishaMeetings = mergeDishaSourceRows(dishaMeetings);

        console.log(
            "DISHA meetings loaded:",
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
   FINANCIAL YEAR SELECTOR
============================================================ */
function initializeDISHAFinancialYearFilter(){
 const el=document.getElementById("financialYear");
 if(!el || !window.FMSFY) return;
 const options=FMSFY.getFYOptions(dishaMeetings,DISHA_FY_FIELDS);
 const requestedFY=new URLSearchParams(location.search).get("fy");
 const current=requestedFY||FMSFY.getCurrentFY();
 el.innerHTML=`<option value="all">All Years</option>`+options.map(f=>`<option value="${f}" ${f===current?"selected":""}>${f}</option>`).join("");
 if(current==="all") el.value="all";
 el.onchange=applyDISHAFinancialYear;
}
function getDISHARecordFY(record){
 const d=parseDate(record?.dateOfMeeting || record?.meetingDate || record?.proposedDateOfMeeting || record?.date);
 if(d){const y=d.getMonth()>=3?d.getFullYear():d.getFullYear()-1;return `${y}-${String(y+1).slice(-2)}`;}
 return String(record?.financialYear || record?.fy || "").trim();
}
function getSelectedDISHAFYRecords(){
 const params=new URLSearchParams(location.search);
 const fy=params.get("fy") || document.getElementById("financialYear")?.value || FMSFY?.getCurrentFY() || getCurrentFinancialYear();
 const active=dishaMeetings.filter(r=>r.active!==false && r.deleted!==true);
 if(fy==="all") return active;
 return active.filter(r=>getDISHARecordFY(r)===fy);
}
function applyDISHAFinancialYear(){
 filteredMeetings=getSelectedDISHAFYRecords();
 updateSummaryCards(filteredMeetings);
 applyURLFilter();
}

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


    if (/yes|uploaded|completed/i.test(uploaded)) {
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

    const currentFYRecords=(records||[]).filter(record=>record.active!==false);

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




function isDishaFilePending(record) {
    const status = normalize(record?.officeStatus || record?.statusOfFile || record?.fileStatus || record?.status || "");
    return !/closed|disposed|completed/.test(status);
}
function isDishaMeetingHeld(record) {
    const status = normalize(record?.statusOfMeeting || record?.meetingStatus || "");
    if (status === "held" || status === "conducted") return true;
    if (/postponed|cancelled|to be held|upcoming/.test(status)) return false;
    const d = parseDate(record?.dateOfMeeting || record?.meetingDate || record?.proposedDateOfMeeting);
    if (!d) return false;
    const today = new Date(); today.setHours(23,59,59,999);
    return d <= today;
}

function mergeDishaSourceRows(records) {
    const out = [...(records || [])];
    const source = window.FMSDishaDataSync?.rows || [];
    const keyOf = r => window.FMSDishaDataSync?.key
        ? window.FMSDishaDataSync.key(r.district || r.nameOfDistrict, r.dateOfMeeting || r.meetingDate)
        : `${normalize(r.district || r.nameOfDistrict)}|${String(r.dateOfMeeting || r.meetingDate || "").slice(0,10)}`;
    const seen = new Set(out.map(keyOf));
    source.forEach((r,index) => {
        const k=keyOf(r);
        if (!seen.has(k)) { out.push({...r, slNo:Number(r.slNo || index+1), sourceFallback:true}); seen.add(k); }
    });
    return out;
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
        filteredMeetings = getSelectedDISHAFYRecords();
        renderRegisterTable(filteredMeetings);
        return;
    }


    /*
     * Daily Status Report
     * filters are always based
     * on the current Financial Year.
     */

    const scope = normalize(params.get("scope"));
    const currentFYRecords = scope === "all"
        ? (dishaMeetings || []).filter(record => record && record.active !== false && record.deleted !== true)
        : getSelectedDISHAFYRecords();


    switch (
        filter
    ) {


        /* ----------------------------------------------------
           DASHBOARD CARD ALIASES
        ---------------------------------------------------- */
        case "pom-not-uploaded":
            filteredMeetings = currentFYRecords.filter(r => !/yes|uploaded|completed/i.test(String(r.pomUploaded || r.pomStatus || "")));
            break;
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
                const meetingStatus=normalize(r.statusOfMeeting);
                const d=parseDate(r.proposedDateOfMeeting || r.dateOfMeeting);
                return meetingStatus === "to be held" || (!!d && d >= new Date() && meetingStatus !== "held" && meetingStatus !== "postponed");
            });
            break;
        case "file-pending":
        case "pending-files":
            filteredMeetings = currentFYRecords.filter(isDishaFilePending);
            break;
        case "circulation":
            filteredMeetings = currentFYRecords.filter(r => /under circulation|circulation/i.test(String(r.officeStatus||r.statusOfFile||r.fileStatus||r.status||"")));
            break;

        /* ----------------------------------------------------
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
                currentFYRecords.filter(isDishaMeetingHeld);

            break;


        /* ----------------------------------------------------
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

        case "pom-uploaded":
        case "uploaded":

            filteredMeetings =
                currentFYRecords.filter(
                    function (record) {

                        return /yes|uploaded|completed/i.test(String(record.pomUploaded || record.pomStatus || ""));

                    }
                );

            break;


        case "districts-conducted": {
            // One row per district, matching the dashboard's distinct-district count.
            const latestByDistrict = new Map();
            currentFYRecords.filter(isDishaMeetingHeld).forEach(record => {
                const district = String(record.district || record.nameOfDistrict || "").trim();
                if (!district) return;
                const key = normalize(district);
                const previous = latestByDistrict.get(key);
                const currentDate = parseDate(record.dateOfMeeting || record.meetingDate || record.proposedDateOfMeeting);
                const previousDate = previous && parseDate(previous.dateOfMeeting || previous.meetingDate || previous.proposedDateOfMeeting);
                if (!previous || (currentDate?.getTime?.() || 0) > (previousDate?.getTime?.() || 0)) latestByDistrict.set(key, record);
            });
            filteredMeetings = [...latestByDistrict.values()];
            break;
        }

        case "districts-no-meetings": {
            // These districts have no meeting document, so synthesize register rows from the 33-district master list.
            const conducted = new Set(
                currentFYRecords.filter(isDishaMeetingHeld)
                    .map(record => normalize(record.district || record.nameOfDistrict))
                    .filter(Boolean)
            );
            filteredMeetings = DISHA_DISTRICTS
                .filter(district => !conducted.has(normalize(district)))
                .map((district, index) => ({
                    id: "",
                    district,
                    dateOfMeeting: "",
                    pomUploaded: "",
                    statusOfBills: "",
                    remarks: "No meeting conducted in selected financial year",
                    syntheticNoMeeting: true,
                    slNo: index + 1
                }));
            break;
        }

        /* ----------------------------------------------------
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
        document.getElementById("searchFromDate") ||
        document.getElementById("searchMeetingFrom");


    const meetingTo =
        document.getElementById("searchToDate") ||
        document.getElementById("searchMeetingTo");


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
   REGISTER EXPORTS
============================================================ */
function getDISHAExportRows(){
    const rows=(filteredMeetings||[]).slice().sort((a,b)=>{
        const da=parseDate(a.dateOfMeeting||a.meetingDate||a.proposedDateOfMeeting||a.date);
        const db=parseDate(b.dateOfMeeting||b.meetingDate||b.proposedDateOfMeeting||b.date);
        return (db?.getTime?.()||0)-(da?.getTime?.()||0);
    });
    return rows.map((m,index)=>({
        sl:index+1,
        district:m.district||m.nameOfDistrict||"",
        dateOfMeeting:formatDate(m.dateOfMeeting),
        pomDueDate:formatDate(m.pomDueDate),
        pomUploaded:m.pomUploaded||m.pomStatus||"",
        meetingExpenditure:formatAmount(m.meetingExpenditure),
        statusOfBills:m.statusOfBills||"",
        statusOfMeeting:m.statusOfMeeting||"",
        officeStatus:m.officeStatus||""
    }));
}
const DISHA_EXPORT_COLUMNS=[
    {key:"sl",label:"Sl.No"},{key:"district",label:"District"},{key:"dateOfMeeting",label:"Date of Meeting"},{key:"pomDueDate",label:"PoM Due Date"},{key:"pomUploaded",label:"PoM Uploaded"},{key:"meetingExpenditure",label:"Meeting Expenditure"},{key:"statusOfBills",label:"Status of Bills"},{key:"statusOfMeeting",label:"Meeting Status"},{key:"officeStatus",label:"Office Status"}
];
async function exportDISHARegister(type){
    try{
        if(!window.FMSExportService) throw new Error("Export service is not loaded.");
        const f=new URLSearchParams(location.search).get("filter");
        const title=`DISHA Meeting Register${f?" - "+f.replace(/-/g," "):""}`;
        const opts={rows:getDISHAExportRows(),columns:DISHA_EXPORT_COLUMNS,title,filename:title};
        if(type==="excel")await FMSExportService.toExcel(opts);
        if(type==="pdf")await FMSExportService.toPDF(opts);
        if(type==="jpeg")await FMSExportService.toJPEG(opts);
        if(type==="print")await FMSExportService.printRows(opts);
    }catch(e){alert(e.message||e);}
}
window.exportDISHARegister=exportDISHARegister;

/* ============================================================
   RENDER REGISTER TABLE
   ============================================================ */

function getPomPendingRawDays(meeting) {
    const wf=window.FMSRecordPolicy?.workflow?.("disha",meeting)||{};
    if(wf.pomUploaded||String(meeting.pomUploaded||"").toLowerCase()==="yes") return null;
    const d=parseDate(meeting.dateOfMeeting||meeting.meetingDate||meeting.proposedDateOfMeeting); if(!d)return null;
    const today=new Date();today.setHours(0,0,0,0);d.setHours(0,0,0,0); return Math.floor((today-d)/86400000);
}
function formatPomPendingDuration(meeting) {
    const raw=getPomPendingRawDays(meeting); if(raw===null||raw<0)return "";
    const from=parseDate(meeting.dateOfMeeting||meeting.meetingDate||meeting.proposedDateOfMeeting),to=new Date();to.setHours(0,0,0,0);from.setHours(0,0,0,0);
    let years=to.getFullYear()-from.getFullYear(),anchor=new Date(from);anchor.setFullYear(from.getFullYear()+years);if(anchor>to){years--;anchor=new Date(from);anchor.setFullYear(from.getFullYear()+years);}
    let months=0;while(months<11){const n=new Date(anchor);n.setMonth(n.getMonth()+1);if(n>to)break;anchor=n;months++;}
    const days=Math.floor((to-anchor)/86400000),parts=[];if(years)parts.push(`${years} year${years===1?'':'s'}`);if(months)parts.push(`${months} month${months===1?'':'s'}`);if(days||!parts.length)parts.push(`${days} day${days===1?'':'s'}`);return parts.join(' ');
}
function getDishaAutomaticRemark(meeting) {
    const wf=window.FMSRecordPolicy?.workflow?.("disha",meeting)||{};if(wf.pomUploaded||String(meeting.pomUploaded||"").toLowerCase()==="yes")return meeting.remarks||"";
    const raw=getPomPendingRawDays(meeting);if(raw===null)return meeting.remarks||"";if(raw>0)return `PoM pending for ${raw} days`;if(raw<0)return `${Math.abs(raw)} days left for the meeting to be held`;return "Meeting is scheduled for today";
}
function getPomPendingDays(meeting){return formatPomPendingDuration(meeting);}

function renderRegisterTable(records) {
    let tbody = document.getElementById("registerBody") || document.querySelector("table tbody");
    if (!tbody) { console.error("DISHA Register table tbody not found."); return; }
    const headerRow = document.querySelector("thead tr");
    const filterName=normalize(new URLSearchParams(location.search).get("filter"));
    const filePendingView=filterName==="file-pending" || filterName==="pending-files";
    const fallbackColumns = filePendingView ? [
        ["district", "District"],
        ["officeFileNo", "File No."],
        ["officeStatus", "File Status"],
        ["dateOfMeeting", "Meeting Date"],
        ["remarks", "Remarks"]
    ] : [
        ["district", "District"],
        ["dateOfMeeting", "Meeting Date"],
        ["pomUploaded", "PoM Uploaded"],
        ["pomPendingDays", "PoM Pending Days"],
        ["statusOfBills", "Bills Status"],
        ["remarks", "Remarks"]
    ];
    const target=filePendingView?"disha-pending-files":"disha-meetings";
    const columns = window.FMSRegisterMasterConfig?.columnsFor?.(target,fallbackColumns) || fallbackColumns;
    if (headerRow) headerRow.innerHTML = `<th class="fms-serial-col" data-field="serial">S.No.</th>${columns.map(c=>`<th>${safe(c[1])}</th>`).join("")}<th>Action</th>`;
    tbody.innerHTML = "";
    if (!records || records.length === 0) {
        const emptyMessage=filePendingView?"No pending DISHA files found.":"No DISHA meetings found.";
        tbody.innerHTML = `<tr><td colspan="${columns.length + 2}" class="text-center text-muted py-4">${emptyMessage}</td></tr>`;
        updateRecordCount(0); return;
    }
    const sortedRecords = [...records].sort((a,b)=>{
        const da=parseDate(a.dateOfMeeting||a.meetingDate||a.proposedDateOfMeeting||a.date);
        const db=parseDate(b.dateOfMeeting||b.meetingDate||b.proposedDateOfMeeting||b.date);
        const dt=(db?.getTime?.()||0)-(da?.getTime?.()||0);
        if(dt!==0)return dt;
        return String(a.district||a.nameOfDistrict||"").localeCompare(String(b.district||b.nameOfDistrict||""),undefined,{sensitivity:"base"});
    });
    sortedRecords.forEach((meeting,index)=>{
        const wf=window.FMSRecordPolicy?.workflow?.("disha",meeting)||{};
        const val=key=>{
            if(key==="dateOfMeeting") return formatDate(meeting.dateOfMeeting||meeting.meetingDate||meeting.proposedDateOfMeeting);
            if(key==="pomUploaded") return (wf.pomUploaded||String(meeting.pomUploaded||"").toLowerCase()==="yes")?'<span class="badge bg-success">Yes</span>':'<span class="badge bg-warning text-dark">No</span>';
            if(key==="pomPendingDays"){const d=getPomPendingDays(meeting);return d===""?"-":safe(d);}
            if(key==="district") return safe(meeting.district||meeting.nameOfDistrict||"");
            if(key==="officeFileNo") return safe(meeting.officeFileNo||meeting.fileNo||meeting.fileNumber||"");
            if(key==="officeStatus") return safe(meeting.officeStatus||meeting.statusOfFile||meeting.fileStatus||meeting.status||"Pending");
            if(key==="remarks") return safe(getDishaAutomaticRemark(meeting));
            return safe(meeting[key]||"");
        };
        const row=document.createElement("tr");
        const actions = meeting.syntheticNoMeeting ? '<span class="text-muted">No meeting record</span>' : `<button type="button" class="btn btn-info btn-sm me-1" onclick="viewDISHARecord('${safeJS(meeting.id)}')"><i class="bi bi-eye"></i> View</button><button type="button" class="btn btn-warning btn-sm me-1" onclick="editDISHARecord('${safeJS(meeting.id)}')"><i class="bi bi-pencil-square"></i> Edit</button><button type="button" class="btn btn-danger btn-sm" onclick="deleteDISHARecordFromRegister('${safeJS(meeting.id)}')"><i class="bi bi-trash"></i> Delete</button>`;
        row.innerHTML=`<td class="fms-serial-col" data-field="serial">${index+1}</td>${columns.map(c=>`<td>${val(c[0])}</td>`).join("")}<td>${actions}</td>`;
        tbody.appendChild(row);
    });
    updateRecordCount(sortedRecords.length);
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
        "disha.html?mode=edit&fullscreenForm=1&id=" +
        encodeURIComponent(
            id
        );

}


/* ============================================================
   NEW DISHA MEETING
   ============================================================ */

function newDISHAmeeting() {

    window.location.href =
        "disha.html?mode=new&fullscreenForm=1";

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
        "disha-register.html?fullscreen=1&filter=" +
        encodeURIComponent(filter);
}

/* ============================================================
   GLOBAL FUNCTIONS
   ============================================================ */



function viewDISHARecord(id) {
    openDISHARecord(id);
}

function editDISHARecord(id) {
    openDISHARecord(id);
}

async function deleteDISHARecordFromRegister(id) {
    if (!id) return;
    window.location.href="disha.html?mode=delete&fullscreenForm=1&id="+encodeURIComponent(id);
    return;
    try {
        const result = window.FMSCrud ? await window.FMSCrud.softDelete(DISHA_COLLECTION, id) : null;
        if (!result) {
            const database = getFirestoreDB();
            if (!database) throw new Error("The data service is temporarily unavailable. Please refresh and try again.");
            const ts = firebase?.firestore?.FieldValue?.serverTimestamp?.() || new Date();
            await database.collection(DISHA_COLLECTION).doc(id).set({ active: false, deletedOn: ts, updatedAt: ts, updatedOn: ts }, { merge: true });
        } else if (!result.success) {
            throw new Error(result.message || "Delete failed.");
        }
        await loadDISHAmeetings();
        applyURLFilter();
    } catch (error) {
        console.error("Unable to delete DISHA record:", error);
        showError("Unable to delete DISHA record: " + (error.message || error));
    }
}


window.openDISHARecord =
    openDISHARecord;
window.viewDISHARecord = viewDISHARecord;
window.editDISHARecord = editDISHARecord;
window.deleteDISHARecordFromRegister = deleteDISHARecordFromRegister;

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
