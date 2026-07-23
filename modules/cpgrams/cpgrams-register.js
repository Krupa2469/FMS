/******************************************************************************
 * File        : cpgrams-register.js
 * Module      : CPGRAMS Register
 * Description : Register Controller
 * Version     : 2.0
 * Developer   : Lekha Technologies
 ******************************************************************************/

"use strict";

/*===========================================================================
    Global Variables
===========================================================================*/

let registerData = [];

let filteredData = [];

let currentPage = 1;

const RECORDS_PER_PAGE = 10;

/*===========================================================================
    Page Load
===========================================================================*/

document.addEventListener(
    "DOMContentLoaded",
    initializeRegister
);

/*===========================================================================
    Initialize Register
===========================================================================*/

function initializeRegister() {

    loadFilters();

    loadRegister();

    registerEvents();

}

/*===========================================================================
    Load Register
===========================================================================*/

function loadRegister() {

    registerData = getAllRecords();

    filteredData = [...registerData];

    updateRecordCount();

    displayRecords();

}

/*===========================================================================
    Display Records
===========================================================================*/

function displayRecords() {

    const tbody =
        document.getElementById("registerBody");

    tbody.innerHTML = "";

    const start =
        (currentPage - 1) * RECORDS_PER_PAGE;

    const end =
        start + RECORDS_PER_PAGE;

    const pageData =
        filteredData.slice(start, end);

    pageData.forEach((record, index) => {

        const row =
            tbody.insertRow();

        row.innerHTML = `

<td>${start + index + 1}</td>

<td>${record.fileNumber}</td>

<td>${record.grievanceNumber}</td>

<td>${record.dateReceived}</td>

<td>${record.complainantName}</td>

<td>${record.district}</td>

<td>${record.subject}</td>

<td>${record.finalStatus}</td>

<td>

<button
class="btn btn-sm btn-primary"
onclick="editRecord(${record.id})">

Edit

</button>

<button
class="btn btn-sm btn-danger"
onclick="removeRecord(${record.id})">

Delete

</button>

</td>

`;

    });

    createPagination();

}

/*===========================================================================
    Record Count
===========================================================================*/

/*===========================================================================
    Update Summary Cards
===========================================================================*/

function updateRecordCount() {

    const total = filteredData.length;

    // Existing Label
    const recordCount = document.getElementById("recordCount");
    if (recordCount) {
        recordCount.textContent = total;
    }

    // Dashboard Cards
    const lblTotalRecords = document.getElementById("lblTotalRecords");
    const lblPendingRecords = document.getElementById("lblPendingRecords");
    const lblDisposedRecords = document.getElementById("lblDisposedRecords");
    const lblOverdueRecords = document.getElementById("lblOverdueRecords");

    let pending = 0;
    let disposed = 0;
    let overdue = 0;

    filteredData.forEach(record => {

        const status = (record.finalStatus || "").toLowerCase();

        if (status === "disposed") {
            disposed++;
        } else {
            pending++;
        }

        if (record.dueDate) {

            const dueDate = new Date(record.dueDate);

            if (
                dueDate < new Date() &&
                status !== "disposed"
            ) {
                overdue++;
            }

        }

    });

    if (lblTotalRecords)
        lblTotalRecords.textContent = total;

    if (lblPendingRecords)
        lblPendingRecords.textContent = pending;

    if (lblDisposedRecords)
        lblDisposedRecords.textContent = disposed;

    if (lblOverdueRecords)
        lblOverdueRecords.textContent = overdue;

}

/*===========================================================================
    Register Events
===========================================================================*/

function registerEvents() {

    // Search
    document
        .getElementById("btnSearch")
        .addEventListener("click", applyFilters);

    document
        .getElementById("txtSearch")
        .addEventListener("keyup", applyFilters);

    // Filters
    document
        .getElementById("filterDistrict")
        .addEventListener("change", applyFilters);

    document
        .getElementById("filterStatus")
        .addEventListener("change", applyFilters);

    document
        .getElementById("filterPriority")
        .addEventListener("change", applyFilters);

    // Toolbar Buttons
    document
        .getElementById("btnRefresh")
        .addEventListener("click", loadRegister);

    document
        .getElementById("btnNew")
        .addEventListener("click", newRecord);

    document
        .getElementById("btnPrint")
        .addEventListener("click", printRegister);

    document
        .getElementById("btnExport")
        .addEventListener("click", exportRegister);

    document
        .getElementById("btnHome")
        .addEventListener("click", goHome);

}

/*===========================================================================
    Load Filter Dropdowns
===========================================================================*/

/*===========================================================================
    Load Filter Dropdowns
===========================================================================*/

function loadFilters() {

    // District
    if (typeof loadDistricts === "function") {
        loadDistricts("filterDistrict");
    }
    else if (typeof loadDistrictDropdown === "function") {
        loadDistrictDropdown("filterDistrict");
    }

    // Status
    if (typeof loadStatus === "function") {
        loadStatus("filterStatus");
    }
    else if (typeof loadStatusDropdown === "function") {
        loadStatusDropdown("filterStatus");
    }

    // Priority
    if (typeof loadPriorities === "function") {
        loadPriorities("filterPriority");
    }
    else if (typeof loadPriorityDropdown === "function") {
        loadPriorityDropdown("filterPriority");
    }

}

/*===========================================================================
    Apply Filters
===========================================================================*/

function applyFilters() {

    const search =
        document
            .getElementById("txtSearch")
            .value
            .toLowerCase()
            .trim();

    const district =
        document
            .getElementById("filterDistrict")
            .value;

    const status =
        document
            .getElementById("filterStatus")
            .value;

    const priority =
        document
            .getElementById("filterPriority")
            .value;

    filteredData = registerData.filter(record => {

        const matchesSearch =

            search === "" ||

            (record.fileNumber || "")
                .toLowerCase()
                .includes(search) ||

            (record.grievanceNumber || "")
                .toLowerCase()
                .includes(search) ||

            (record.complainantName || "")
                .toLowerCase()
                .includes(search) ||

            (record.subject || "")
                .toLowerCase()
                .includes(search);

        const matchesDistrict =
            district === "" ||
            record.district === district;

        const matchesStatus =
            status === "" ||
            record.finalStatus === status;

        const matchesPriority =
            priority === "" ||
            record.priority === priority;

        return (

            matchesSearch &&
            matchesDistrict &&
            matchesStatus &&
            matchesPriority

        );

    });

    currentPage = 1;

    updateRecordCount();

    displayRecords();

}

/*===========================================================================
    Refresh Register
===========================================================================*/

function refreshRegister() {

    loadRegister();

}/*===========================================================================
    Edit Record
===========================================================================*/

function editRecord(id) {

    window.location.href =
        "cpgrams.html?id=" + id;

}

/*===========================================================================
    Delete Record
===========================================================================*/

function removeRecord(id) {

    if (!confirm("Are you sure you want to delete this record?"))
        return;

    let records = getAllRecords();

    records = records.filter(record => record.id != id);

    saveAllRecords(records);

    loadRegister();

}

/*===========================================================================
    Create Pagination
===========================================================================*/

function createPagination() {

    const pagination =
        document.getElementById("pagination");

    pagination.innerHTML = "";

    const totalPages =
        Math.ceil(filteredData.length / RECORDS_PER_PAGE);

    if (totalPages <= 1)
        return;

    // Previous Button

    let li = document.createElement("li");

    li.className =
        "page-item " +
        (currentPage === 1 ? "disabled" : "");

    li.innerHTML =

        `<a class="page-link" href="#">Previous</a>`;

    li.onclick = function () {

        if (currentPage > 1) {

            currentPage--;

            displayRecords();

        }

    };

    pagination.appendChild(li);

    // Page Numbers

    for (let i = 1; i <= totalPages; i++) {

        li = document.createElement("li");

        li.className =
            "page-item " +
            (i === currentPage ? "active" : "");

        li.innerHTML =
            `<a class="page-link" href="#">${i}</a>`;

        li.onclick = function () {

            currentPage = i;

            displayRecords();

        };

        pagination.appendChild(li);

    }

    // Next Button

    li = document.createElement("li");

    li.className =
        "page-item " +
        (currentPage === totalPages ? "disabled" : "");

    li.innerHTML =
        `<a class="page-link" href="#">Next</a>`;

    li.onclick = function () {

        if (currentPage < totalPages) {

            currentPage++;

            displayRecords();

        }

    };

    pagination.appendChild(li);

}

/*===========================================================================
    Print Register
===========================================================================*/

function printRegister() {

    window.print();

}

/*===========================================================================
    Export Register (CSV)
===========================================================================*/

function exportRegister() {

    if (filteredData.length === 0) {

        alert("No records available.");

        return;

    }

    const headers = [

        "File Number",
        "Grievance Number",
        "Date Received",
        "Complainant",
        "District",
        "Subject",
        "Status"

    ];

    const rows = filteredData.map(record => [

        record.fileNumber,
        record.grievanceNumber,
        record.dateReceived,
        record.complainantName,
        record.district,
        record.subject,
        record.finalStatus

    ]);

    let csv =
        headers.join(",") + "\n";

    rows.forEach(row => {

        csv += row.map(value =>

            `"${value ?? ""}"`

        ).join(",") + "\n";

    });

    const blob =
        new Blob([csv], {
            type: "text/csv;charset=utf-8;"
        });

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "CPGRAMS_Register.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}

/*===========================================================================
    New Record
===========================================================================*/

function newRecord() {
    window.location.href = "cpgrams.html";
}

/*===========================================================================
    Home
===========================================================================*/

function goHome() {
    window.location.href = "../../pages/dashboard.html";
}

/*===========================================================================
    End of File
===========================================================================*/