"use strict";

//=========================================================
// CPGRAMS REGISTER CONTROLLER
// Version : 4.0
//=========================================================

//---------------------------------------------------------
// GLOBAL VARIABLES
//---------------------------------------------------------

let grievanceList = [];

let filteredList = [];

let currentPage = 1;

const pageSize = 25;

let selectedDocumentId = null;

let lastDocument = null;

//---------------------------------------------------------
// INITIALIZATION
//---------------------------------------------------------

document.addEventListener("DOMContentLoaded", initialize);

//---------------------------------------------------------
// INITIALIZE PAGE
//---------------------------------------------------------

async function initialize() {

    try {

        showLoading();

        registerEvents();

        await loadRegister();

        await loadDashboardSummary();

        await loadDistricts();

        console.log("CPGRAMS Register Loaded.");

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

//---------------------------------------------------------
// REGISTER EVENTS
//---------------------------------------------------------

function registerEvents() {

    //-----------------------------------------------------
    // Toolbar
    //-----------------------------------------------------

    document
        .getElementById("btnRefresh")
        .addEventListener("click", refreshRegister);

    document
        .getElementById("btnNew")
        .addEventListener("click", openNewGrievance);

    document
        .getElementById("btnHome")
        .addEventListener("click", goHome);

    document
        .getElementById("btnDashboard")
        .addEventListener("click", openDashboard);

    document
        .getElementById("btnPrint")
        .addEventListener("click", printRegister);

    //-----------------------------------------------------
    // Search
    //-----------------------------------------------------

    document
        .getElementById("btnSearch")
        .addEventListener("click", searchRecords);

    document
        .getElementById("searchGrievanceNumber")
        .addEventListener("keyup", searchRecords);

    document
        .getElementById("searchDistrict")
        .addEventListener("change", searchRecords);

    document
        .getElementById("searchStatus")
        .addEventListener("change", searchRecords);

    //-----------------------------------------------------
    // Advanced Search
    //-----------------------------------------------------

    document
        .getElementById("searchCategory")
        .addEventListener("change", searchRecords);

    document
        .getElementById("searchPriority")
        .addEventListener("change", searchRecords);

    document
        .getElementById("fromDate")
        .addEventListener("change", searchRecords);

    document
        .getElementById("toDate")
        .addEventListener("change", searchRecords);

    //-----------------------------------------------------
    // Pagination
    //-----------------------------------------------------

    document
        .getElementById("btnNext")
        .addEventListener("click", nextPage);

    document
        .getElementById("btnPrevious")
        .addEventListener("click", previousPage);

    document
        .getElementById("btnFirst")
        .addEventListener("click", firstPage);

    document
        .getElementById("btnLast")
        .addEventListener("click", lastPage);

    //-----------------------------------------------------
    // Export
    //-----------------------------------------------------

    document
        .getElementById("btnExcel")
        .addEventListener("click", exportExcel);

    document
        .getElementById("btnPDF")
        .addEventListener("click", exportPDF);

    document
        .getElementById("btnPrintRegister")
        .addEventListener("click", printRegister);

    //-----------------------------------------------------
    // Delete
    //-----------------------------------------------------

    document
        .getElementById("btnConfirmDelete")
        .addEventListener("click", deleteRecord);

}
//=========================================================
// LOAD REGISTER
//=========================================================

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

        grievanceList = result.data || [];

        filteredList = [...grievanceList];

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

//=========================================================
// RENDER REGISTER TABLE
//=========================================================

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

        const row = document.createElement("tr");

        row.innerHTML = `

        <td>${serialNo++}</td>

        <td>${item.grievanceId || ""}</td>

        <td>${item.grievanceNumber || ""}</td>

        <td>${item.dateReceived || ""}</td>

        <td>${item.complainantName || ""}</td>

        <td>${item.district || ""}</td>

        <td>${item.subject || ""}</td>

        <td>${item.currentStatus || ""}</td>

        <td>${item.dueDate || ""}</td>

        <td>${item.priority || ""}</td>

        <td>${item.finalStatus || ""}</td>

        <td>

            <button
                class="btn btn-sm btn-primary"

                onclick="openRecord('${item.id}')">

                View

            </button>

        </td>

        `;

        tbody.appendChild(row);

    }

}

//=========================================================
// LOAD DASHBOARD SUMMARY
//=========================================================

async function loadDashboardSummary() {

    try {

        const result =
            await getDashboardSummary();

        if (!result.success) {

            return;

        }

        document.getElementById(
            "totalRecords"
        ).textContent =
            result.total;

        document.getElementById(
            "pendingRecords"
        ).textContent =
            result.pending;

        document.getElementById(
            "disposedRecords"
        ).textContent =
            result.disposed;

        document.getElementById(
            "overdueRecords"
        ).textContent =
            result.overdue;

    }
    catch (error) {

        console.error(error);

    }

}

//=========================================================
// UPDATE RECORD COUNT
//=========================================================

function updateRecordCount() {

    document.getElementById(
        "recordCount"
    ).textContent =
        `Total Records : ${filteredList.length}`;

}

//=========================================================
// UPDATE PAGE INFORMATION
//=========================================================

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
//=========================================================
// SEARCH RECORDS
//=========================================================

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

    const category =
        document.getElementById("searchCategory")
            .value
            .trim()
            .toLowerCase();

    const priority =
        document.getElementById("searchPriority")
            .value
            .trim()
            .toLowerCase();

    const fromDate =
        document.getElementById("fromDate").value;

    const toDate =
        document.getElementById("toDate").value;

    filteredList = grievanceList.filter(record => {

        const grievanceMatch =
            !grievanceNumber ||
            (record.grievanceNumber || "")
                .toLowerCase()
                .includes(grievanceNumber);

        const districtMatch =
            !district ||
            (record.district || "")
                .toLowerCase() === district;

        const statusMatch =
            !status ||
            (record.currentStatus || "")
                .toLowerCase() === status;

        const categoryMatch =
            !category ||
            (record.category || "")
                .toLowerCase() === category;

        const priorityMatch =
            !priority ||
            (record.priority || "")
                .toLowerCase() === priority;

        let dateMatch = true;

        if (fromDate && record.dateReceived) {

            dateMatch =
                record.dateReceived >= fromDate;

        }

        if (dateMatch &&
            toDate &&
            record.dateReceived) {

            dateMatch =
                record.dateReceived <= toDate;

        }

        return grievanceMatch &&
               districtMatch &&
               statusMatch &&
               categoryMatch &&
               priorityMatch &&
               dateMatch;

    });

    currentPage = 1;

    renderRegisterTable();

    updateRecordCount();

    updatePageInfo();

}

//=========================================================
// REFRESH REGISTER
//=========================================================

async function refreshRegister() {

    clearFilters();

    await loadRegister();

    await loadDashboardSummary();

    showMessage(
        "success",
        "Register refreshed successfully."
    );

}

//=========================================================
// CLEAR FILTERS
//=========================================================

function clearFilters() {

    document.getElementById("searchGrievanceNumber").value = "";

    document.getElementById("searchDistrict").value = "";

    document.getElementById("searchStatus").value = "";

    document.getElementById("searchCategory").value = "";

    document.getElementById("searchPriority").value = "";

    document.getElementById("fromDate").value = "";

    document.getElementById("toDate").value = "";

}

//=========================================================
// LOAD DISTRICTS
//=========================================================

async function loadDistricts() {

    const districtDropdown =
        document.getElementById("searchDistrict");

    districtDropdown.innerHTML =
        '<option value="">All Districts</option>';

    const districts = [

        "Adilabad",
        "Bhadradri Kothagudem",
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
        "Hanamkonda",
        "Yadadri Bhuvanagiri"

    ];

    districts.sort().forEach(district => {

        const option =
            document.createElement("option");

        option.value = district;

        option.textContent = district;

        districtDropdown.appendChild(option);

    });

}
//=========================================================
// PAGINATION
//=========================================================

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

//=========================================================
// OPEN RECORD
//=========================================================

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

        const record = result.data;

        const tbody =
            document.getElementById("recordDetails");

        tbody.innerHTML = "";

        Object.entries(record).forEach(([key, value]) => {

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <th style="width:35%">
                    ${formatFieldName(key)}
                </th>
                <td>
                    ${value ?? ""}
                </td>
            `;

            tbody.appendChild(row);

        });

        const modal =
            new bootstrap.Modal(
                document.getElementById("recordModal")
            );

        modal.show();

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

//=========================================================
// OPEN SELECTED RECORD
//=========================================================

function openSelectedRecord() {

    if (!selectedDocumentId) {

        return;

    }

    window.location.href =
        `cpgrams.html?id=${selectedDocumentId}`;

}

//=========================================================
// DELETE RECORD
//=========================================================

async function deleteRecord() {

    if (!selectedDocumentId) {

        return;

    }

    try {

        showLoading();

        const result =
            await deleteRecord(selectedDocumentId);

        if (!result.success) {

            showMessage(
                "danger",
                result.message
            );

            return;

        }

        bootstrap.Modal
            .getInstance(
                document.getElementById("deleteModal")
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

//=========================================================
// NAVIGATION
//=========================================================

function openNewGrievance() {

    window.location.href =
        "cpgrams.html";

}

function openDashboard() {

    window.location.href =
        "../../dashboard.html";

}

function goHome() {

    window.location.href =
        "../../index.html";

}

//=========================================================
// FORMAT FIELD NAME
//=========================================================

function formatFieldName(fieldName) {

    return fieldName

        .replace(/([A-Z])/g, " $1")

        .replace(/^./, text => text.toUpperCase());

}
//=========================================================
// LOADING INDICATOR
//=========================================================

function showLoading() {

    const overlay =
        document.getElementById("loadingOverlay");

    if (overlay) {

        overlay.classList.remove("d-none");

        overlay.classList.add("d-flex");

    }

}

function hideLoading() {

    const overlay =
        document.getElementById("loadingOverlay");

    if (overlay) {

        overlay.classList.remove("d-flex");

        overlay.classList.add("d-none");

    }

}

//=========================================================
// MESSAGE
//=========================================================

function showMessage(type, message) {

    const area =
        document.getElementById("messageArea");

    if (!area) return;

    area.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show">

            ${message}

            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="alert">
            </button>

        </div>
    `;

    setTimeout(() => {

        area.innerHTML = "";

    }, 5000);

}

//=========================================================
// EXPORT TO EXCEL
//=========================================================

function exportExcel() {

    alert(
        "Excel Export will be implemented in Version 4.1."
    );

}

//=========================================================
// EXPORT TO PDF
//=========================================================

function exportPDF() {

    alert(
        "PDF Export will be implemented in Version 4.1."
    );

}

//=========================================================
// PRINT REGISTER
//=========================================================

function printRegister() {

    window.print();

}

//=========================================================
// KEYBOARD SHORTCUTS
//=========================================================

document.addEventListener("keydown", function (event) {

    if (event.ctrlKey && event.key === "f") {

        event.preventDefault();

        document
            .getElementById("searchGrievanceNumber")
            ?.focus();

    }

    if (event.key === "F5") {

        event.preventDefault();

        refreshRegister();

    }

});

//=========================================================
// DEBUG
//=========================================================

function debugRegister() {

    console.log("Total Records :", grievanceList.length);

    console.log("Filtered Records :", filteredList.length);

    console.log("Current Page :", currentPage);

}

//=========================================================
// EXPORT FUNCTIONS
//=========================================================

window.openRecord = openRecord;

window.debugRegister = debugRegister;

window.refreshRegister = refreshRegister;

//=========================================================
// END OF FILE
//=========================================================