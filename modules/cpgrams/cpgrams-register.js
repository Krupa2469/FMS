"use strict";

/*==========================================================
 CPGRAMS REGISTER CONTROLLER
 Version : 5.0
==========================================================*/

/*==========================================================
 GLOBAL VARIABLES
==========================================================*/

let grievanceList = [];
let filteredList = [];

let currentPage = 1;

const pageSize = 25;

let selectedDocumentId = null;

/*==========================================================
 INITIALIZATION
==========================================================*/

document.addEventListener(
    "DOMContentLoaded",
    initialize
);

/*==========================================================
 INITIALIZE PAGE
==========================================================*/

async function initialize() {

    try {

        showLoading();

        registerEvents();

        await loadRegister();

        await loadDashboardSummary();

        loadDistricts();
        initializeFinancialYearFilter();
        applyURLFilter();

        console.log(
            "CPGRAMS Register Version 5 Loaded."
        );

    }
    catch (error) {

        console.error(error);

        showMessage(
            "danger",
            error.message
        );

    }
    finally {

        hideLoading();

    }

}

/*==========================================================
 REGISTER EVENTS
==========================================================*/

function registerEvents() {
    const btnWhatsApp = document.getElementById("btnWhatsApp");
    if (btnWhatsApp) btnWhatsApp.addEventListener("click", async () => {
        const visible = document.querySelector("tbody")?.innerText || "";
        await window.FMSWhatsAppService?.compose({
            module:"CPGRAMS",
            title:"CPGRAMS Register Message",
            defaultMessage:`CPGRAMS Register Update\nStatus as on: ${new Date().toLocaleDateString("en-IN")}\n\n${visible.slice(0,2800)}\n\nPlease type or edit your custom message.`,
            message:(m)=>typeof showMessage==="function" ? showMessage("info",m) : typeof showRTIMessage==="function" ? showRTIMessage(m,"info") : typeof showDishaMessage==="function" ? showDishaMessage(m,"info") : null
        });
    });



    // Toolbar

    bindClick("btnRefresh", refreshRegister);
    bindClick("btnRefreshData", refreshRegister);
    bindChange("financialYear", applyFinancialYearFilter);

    bindClick("btnNew", openNewGrievance);

    bindClick("btnHome", goHome);

    bindClick("btnDashboard", openDashboard);

    bindClick("btnPrint", printRegister);

    // Search

    bindClick("btnSearch", searchRecords);

    bindChange("searchDistrict", searchRecords);

    bindChange("searchStatus", searchRecords);

    bindKeyUp(
        "searchGrievanceNumber",
        searchRecords
    );

    // Advanced Search

    bindChange("searchCategory", searchRecords);

    bindChange("searchPriority", searchRecords);

    bindChange("fromDate", searchRecords);

    bindChange("toDate", searchRecords);

    // Pagination

    bindClick("btnFirst", firstPage);

    bindClick("btnPrevious", previousPage);

    bindClick("btnNext", nextPage);

    bindClick("btnLast", lastPage);

    // Export

    bindClick("btnExcel", exportExcel);

    bindClick("btnPDF", exportPDF);

    bindClick("btnPrintRegister", printRegister);

    // Delete

    bindClick(
        "btnConfirmDelete",
        deleteSelectedRecord
    );

}

/*==========================================================
 SAFE EVENT HELPERS
==========================================================*/

function bindClick(id, handler) {

    const element =
        document.getElementById(id);

    if (element)
        element.addEventListener(
            "click",
            handler
        );

}

function bindChange(id, handler) {

    const element =
        document.getElementById(id);

    if (element)
        element.addEventListener(
            "change",
            handler
        );

}

function bindKeyUp(id, handler) {

    const element =
        document.getElementById(id);

    if (element)
        element.addEventListener(
            "keyup",
            handler
        );

}

/*==========================================================
 LOAD REGISTER
==========================================================*/

async function loadRegister() {

    try {

        showLoading();

        const result =
            await getActiveRecords(500);

        if (!result.success) {

            showMessage(
                "danger",
                result.message
            );

            return;

        }

        grievanceList =
    (result.data || []).filter(record => record.active !== false);

    console.log("========== Records Loaded ==========");

grievanceList.forEach((record, index) => {

    console.log(
        index + 1,
        record.id,
        record.grievanceNumber
    );

});

        initializeFinancialYearFilter();
        applyFinancialYearFilter();

        currentPage = 1;

        renderRegisterTable();

        updateRecordCount();

        updatePageInfo();

    }
    catch (error) {

        console.error(error);

        showMessage(
            "danger",
            error.message
        );

    }
    finally {

        hideLoading();

    }

}

/*==========================================================
 FINANCIAL YEAR FILTER
==========================================================*/
function initializeFinancialYearFilter() {
    const el = document.getElementById("financialYear");
    if (!el || !window.FMSFY) return;
    const options = FMSFY.getFYOptions(grievanceList, ["dateReceived", "dateArised"]);
    const current = FMSFY.getCurrentFY();
    el.innerHTML = options.map(f => `<option value="${f}" ${f === current ? "selected" : ""}>${f}</option>`).join("");
}

function applyFinancialYearFilter() {
    const fy = document.getElementById("financialYear")?.value || (window.FMSFY ? FMSFY.getCurrentFY() : "");
    const base = window.FMSFY ? FMSFY.filterFY(grievanceList, fy, ["dateReceived", "dateArised"]) : grievanceList;
    filteredList = base.slice();
    const filter = new URLSearchParams(location.search).get("filter");
    if (filter) {
        applyURLFilter();
        return;
    }
    currentPage = 1;
    renderRegisterTable();
    updateRecordCount();
    updatePageInfo();
}

/*==========================================================
 DASHBOARD CARD URL FILTER
==========================================================*/
function applyURLFilter(){
 const filter=new URLSearchParams(location.search).get("filter");
 const fy=document.getElementById("financialYear")?.value || FMSFY?.getCurrentFY();
 if(!filter){ applyFinancialYearFilter(); return; }
 const base=FMSFY ? FMSFY.filterFY(grievanceList,fy,["dateReceived","dateArised"]) : grievanceList;
 const today=new Date(); today.setHours(0,0,0,0);
 filteredList=base.filter(r=>{
   const st=String(r.currentStatus||r.statusOfFile||r.status||"").toLowerCase();
   const due=r.dueDate?new Date(r.dueDate):null; if(due) due.setHours(0,0,0,0);
   if(filter==="total") return true;
   if(filter==="pending") return !/closed|disposed|despatched|reply obtained/.test(st);
   if(filter==="circulation") return /under circulation|circulation/.test(st);
   if(filter==="closed") return /closed|disposed|despatched|reply obtained/.test(st);
   if(filter==="overdue") return due && due<today && !/closed|disposed|despatched|reply obtained/.test(st);
   if(filter==="due-today") return due && due.getTime()===today.getTime();
   return true;
 });
 currentPage=1; renderRegisterTable(); updateRecordCount(); updatePageInfo();
}

/*==========================================================
 LOAD DASHBOARD
==========================================================*/

async function loadDashboardSummary() {

    try {

        const result =
            await getDashboardSummary();

        if (!result.success)
            return;

        const summary =
            result.data;

        document.getElementById(
            "totalRecords"
        ).textContent =
            summary.total;

        document.getElementById(
            "pendingRecords"
        ).textContent =
            summary.pending;

        document.getElementById(
            "disposedRecords"
        ).textContent =
            summary.disposed;

        document.getElementById(
            "overdueRecords"
        ).textContent =
            summary.overdue;

    }
    catch (error) {

        console.error(error);

    }

}

/*==========================================================
 RENDER REGISTER TABLE
==========================================================*/

function renderRegisterTable() {

    const tbody =
        document.getElementById("registerBody");

    tbody.innerHTML = "";

    if (filteredList.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="12"
                    class="text-center text-muted py-5">
                    No Records Available
                </td>
            </tr>
        `;

        return;

    }

    const start =
        (currentPage - 1) * pageSize;

    const end =
        Math.min(
            start + pageSize,
            filteredList.length
        );

    let serialNo = start + 1;

    for (let i = start; i < end; i++) {

        const item = filteredList[i];

        console.log(
    "Rendering:",
    item.id,
    item.grievanceNumber
);
    
        console.log(item);
    
        console.log("Firestore ID =", item.id);
        
        const row =
            document.createElement("tr");

        row.innerHTML = `

        <td>${serialNo++}</td>

        <td>${item.grievanceId ?? item.id ?? ""}</td>

        <td>${item.grievanceNumber ?? item.grievanceNo ?? item.registrationNumber ?? ""}</td>

        <td>${item.dateReceived ?? ""}</td>

        <td>${item.complainantName ?? ""}</td>

        <td>${item.district ?? ""}</td>

        <td>${item.subject ?? ""}</td>

        <td>${item.currentStatus ?? ""}</td>

        <td>${item.dueDate ?? ""}</td>

        <td>${item.priority ?? ""}</td>

        <td>${item.finalStatus ?? ""}</td>

       <td class="text-center">

    
       <button class="btn btn-sm btn-info"
        onclick="viewRecord('${item.id}')">
        <i class="fa fa-eye"></i>👁
    </button>

    <button class="btn btn-sm btn-warning"
        onclick="editRecord('${item.id}')">
        <i class="fa fa-edit"></i>
    ✏️</button>
    
    <button
        class="btn btn-danger btn-sm"
        onclick="alert('DELETE CLICKED'); deleteRecordFromGrid('${item.id}'); return false;">
        Delete
    🗑</button>
    
</td>
        

        `;

        tbody.appendChild(row);

    }

}

/*==========================================================
 RECORD COUNT
==========================================================*/

function updateRecordCount() {

    document.getElementById(
        "recordCount"
    ).textContent =
        `Total Records : ${filteredList.length}`;

}

/*==========================================================
 PAGE INFO
==========================================================*/

function updatePageInfo() {

    if (filteredList.length === 0) {

        document.getElementById(
            "pageInfo"
        ).textContent =
            "Showing 0 to 0 of 0 records";

        return;

    }

    const start =
        ((currentPage - 1) * pageSize) + 1;

    const end =
        Math.min(
            currentPage * pageSize,
            filteredList.length
        );

    document.getElementById(
        "pageInfo"
    ).textContent =
        `Showing ${start} to ${end} of ${filteredList.length} records`;

}

/*==========================================================
 SEARCH
==========================================================*/

function searchRecords() {

    const grievanceNumber =
        document.getElementById("searchGrievanceNumber")
        .value
        .trim()
        .toLowerCase();

    const district =
        document.getElementById("searchDistrict")
        .value
        .trim()
        .toLowerCase();

    const status =
        document.getElementById("searchStatus")
        .value
        .trim()
        .toLowerCase();

    const priority =
        document.getElementById("searchPriority")
        .value
        .trim()
        .toLowerCase();

    const category =
        document.getElementById("searchCategory")
        .value
        .trim()
        .toLowerCase();

    const fromDate = document.getElementById("fromDate")?.value || "";
    const toDate = document.getElementById("toDate")?.value || "";

    const baseList = FMSFY ? FMSFY.filterFY(grievanceList, document.getElementById("financialYear")?.value || FMSFY.getCurrentFY(), ["dateReceived","dateArised"]) : grievanceList;
    filteredList =
        baseList.filter(record => {

            if (
                grievanceNumber &&
                !(record.grievanceNumber || "")
                    .toLowerCase()
                    .includes(grievanceNumber)
            )
                return false;

            if (
                district &&
                (record.district || "")
                    .toLowerCase() !== district
            )
                return false;

            if (
                status &&
                (record.currentStatus || "")
                    .toLowerCase() !== status
            )
                return false;

            if (
                priority &&
                String(record.priority || record.priorityClassification || "")
                    .toLowerCase() !== priority
            )
                return false;

            if (
                category &&
                String(record.category || "")
                    .toLowerCase() !== category
            )
                return false;

            const recordDate = String(record.dateReceived || record.dateArised || "").slice(0, 10);
            if (fromDate && recordDate && recordDate < fromDate) return false;
            if (toDate && recordDate && recordDate > toDate) return false;

            return true;

        });

    currentPage = 1;

    renderRegisterTable();

    updateRecordCount();

    updatePageInfo();

}

/*==========================================================
EDIT RECORD
==========================================================*/

async function editRecord(documentId) {

    try {

        showLoading?.();

        const result =
            await getDocument(documentId);

        hideLoading?.();

        if (!result.success) {

            showMessage(
                "danger",
                result.message
            );

            return;

        }

      sessionStorage.setItem(
    "selectedGrievance",
    JSON.stringify({
        id: documentId,
        ...result.data
    })
);
        window.location.href =
            "cpgrams.html?mode=edit";

    }
    catch (error) {

        hideLoading?.();

        console.error(error);

        showMessage(
            "danger",
            error.message
        );

    }

}
/*==========================================================
 REFRESH
==========================================================*/

async function refreshRegister() {

    clearFilters();

    await loadRegister();

    await loadDashboardSummary();

    showMessage(
        "success",
        "Register refreshed successfully."
    );

}

/*==========================================================
 CLEAR FILTERS
==========================================================*/

function clearFilters() {

    [
        "searchGrievanceNumber",
        "searchDistrict",
        "searchStatus",
        "searchCategory",
        "searchPriority",
        "fromDate",
        "toDate"
    ].forEach(id => {

        const element =
            document.getElementById(id);

        if (element)
            element.value = "";

    });

    searchRecords();
}

/*==========================================================
 DISTRICT MASTER
==========================================================*/

function loadDistricts() {

    const dropdown =
        document.getElementById("searchDistrict");

    if (!dropdown)
        return;

    dropdown.innerHTML =
        '<option value="">All Districts</option>';

    const districts = [

        "Adilabad",
        "Bhadradri Kothagudem",
        "Hanamkonda",
        "Hyderabad",
        "Jagtial",
        "Jangaon",
        "Jayashankar Bhupalpally",
        "Jogulamba Gadwal",
        "Kamareddy",
        "Karimnagar",
        "Khammam",
        "Komaram Bheem Asifabad",
        "Mahabubabad",
        "Mahabubnagar",
        "Mancherial",
        "Medak",
        "Medchal Malkajgiri",
        "Mulugu",
        "Nagarkurnool",
        "Nalgonda",
        "Narayanpet",
        "Nirmal",
        "Nizamabad",
        "Peddapalli",
        "Rajanna Sircilla",
        "Rangareddy",
        "Sangareddy",
        "Siddipet",
        "Suryapet",
        "Vikarabad",
        "Wanaparthy",
        "Warangal",
        "Yadadri Bhuvanagiri"

    ];

    districts.sort();

    districts.forEach(district => {

        const option =
            document.createElement("option");

        option.value = district;

        option.textContent = district;

        dropdown.appendChild(option);

    });

}

/*==========================================================
 PAGINATION
==========================================================*/

function firstPage() {

    currentPage = 1;

    renderRegisterTable();

    updatePageInfo();

}

function previousPage() {

    if (currentPage > 1) {

        currentPage--;

        renderRegisterTable();

        updatePageInfo();

    }

}

function nextPage() {

    const totalPages =
        Math.ceil(filteredList.length / pageSize);

    if (currentPage < totalPages) {

        currentPage++;

        renderRegisterTable();

        updatePageInfo();

    }

}

function lastPage() {

    currentPage =
        Math.max(
            1,
            Math.ceil(filteredList.length / pageSize)
        );

    renderRegisterTable();

    updatePageInfo();

}

/*==========================================================
 OPEN RECORD
==========================================================*/

async function openRecord(documentId) {

    try {

        showLoading();

        selectedDocumentId = documentId;

        const result =
            await getDocument(documentId);

        if (!result.success) {

            showMessage(
                "danger",
                result.message
            );

            return;

        }

        sessionStorage.setItem(
            "selectedGrievance",
            JSON.stringify(result.data)
        );

        window.location.href = "cpgrams.html?mode=edit";

    }
    catch (error) {

        console.error(error);

        showMessage(
            "danger",
            error.message
        );

    }
    finally {

        hideLoading();

    }

}



/*==========================================================
VIEW RECORD
==========================================================*/

async function viewRecord(documentId) {

    try {

        showLoading?.();

        const result = await getDocument(documentId);

        console.log("Document ID passed:", documentId);
console.log("Repository result:", result);
console.log("Repository data:", result.data);

        hideLoading?.();

        if (!result.success) {

            showMessage(
                "danger",
                result.message
            );

            return;

        }

       sessionStorage.setItem(
    "selectedGrievance",
    JSON.stringify({
        id: documentId,
        ...result.data
    })
);

        window.location.href =
            "cpgrams.html?mode=view";

    }
    catch (error) {

        hideLoading?.();

        console.error(error);

        showMessage(
            "danger",
            error.message
        );

    }

}

async function deleteRecordFromGrid(id) {

    console.log("Delete button clicked");
    console.log("Document ID =", id);
    console.log("Delete ID received =", id);

    if (!confirm("Delete this grievance?"))
        return;

    if (!id) {

        console.error("Document ID is NULL");

        showMessage(
            "danger",
            "Document ID is missing."
        );

        return;

    }

    console.log("Calling deleteRecord()...");

    const result =
        await deleteRecord(id);

    console.log(result);

    if (result.success) {

        await loadRegister();

        await loadDashboardSummary();

        showMessage(
            "success",
            "Record deleted successfully."
        );

    }
    else {

        showMessage(
            "danger",
            result.message
        );

    }

}

/*==========================================================
 DELETE RECORD
==========================================================*/

async function deleteSelectedRecord() {

    if (!selectedDocumentId)
        return;

    try {

        showLoading();

        const result =
            await deleteRecord(
                selectedDocumentId
            );

        if (!result.success) {

            showMessage(
                "danger",
                result.message
            );

            return;

        }

        bootstrap.Modal
            .getInstance(
                document.getElementById(
                    "deleteModal"
                )
            )
            ?.hide();

        await loadRegister();

        await loadDashboardSummary();

        showMessage(
            "success",
            "Record deleted successfully."
        );

    }
    catch (error) {

        console.error(error);

        showMessage(
            "danger",
            error.message
        );

    }
    finally {

        hideLoading();

    }

}

/*==========================================================
 NAVIGATION
==========================================================*/

function openNewGrievance() {

    sessionStorage.removeItem("selectedGrievance");

    window.location.href = "cpgrams.html?mode=new";

}

function goHome() {

    window.location.href =
        "../../pages/module-dashboard.html?module=cpgrams";

}

function openDashboard() {

    window.location.href = "../../pages/dashboard.html";

}

/*==========================================================
 EXPORT
==========================================================*/

function exportExcel() {

    showMessage(
        "info",
        "Excel Export will be available in Version 5.1"
    );

}

function exportPDF() {

    showMessage(
        "info",
        "PDF Export will be available in Version 5.1"
    );

}

function printRegister() {

    window.print();

}

/*==========================================================
 LOADING
==========================================================*/

function showLoading() {

    const loader =
        document.getElementById(
            "loadingOverlay"
        );

    if (loader)
        loader.style.display = "flex";

}

function hideLoading() {

    const loader =
        document.getElementById(
            "loadingOverlay"
        );

    if (loader)
        loader.style.display = "none";

}

/*==========================================================
 MESSAGE
==========================================================*/

function showMessage(
    type,
    message
) {

    const alert =
        document.getElementById(
            "messageArea"
        );

    if (!alert) {

        console.log(message);

        return;

    }

    alert.className =
        `alert alert-${type}`;

    alert.textContent =
        message;

    alert.style.display =
        "block";

    setTimeout(() => {

        alert.style.display =
            "none";

    }, 3000);

}

/*==========================================================
 KEYBOARD SHORTCUTS
==========================================================*/

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "F5") {

            event.preventDefault();

            refreshRegister();

        }

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "n"
        ) {

            event.preventDefault();

            openNewGrievance();

        }

    }
);

/*==========================================================
 GLOBAL FUNCTIONS
==========================================================*/

window.refreshRegister =
    refreshRegister;

window.searchRecords =
    searchRecords;

window.openRecord =
    openRecord;

window.deleteSelectedRecord =
    deleteSelectedRecord;

window.viewRecord = viewRecord;

window.editRecord = editRecord;

window.deleteRecordFromGrid = deleteRecordFromGrid;