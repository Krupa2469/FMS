/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : dashboard.js
    Version     : 1.0.0
==========================================================*/

"use strict";

document.addEventListener("DOMContentLoaded", initializeDashboard);

/*==========================================================
INITIALIZE
==========================================================*/

function initializeDashboard()
{
    loadStatistics();
    loadRecentFiles();
    loadSystemInformation();
    highlightOverdueFiles();
}

/*==========================================================
LOAD DASHBOARD STATISTICS
==========================================================*/

function loadStatistics()
{
    const records = getData(STORAGE_KEYS.CPGRAMS);

    const total = records.length;

    const pending = records.filter(record =>
        record.status === "Under Circulation"
    ).length;

    const disposed = records.filter(record =>
        record.status === "Disposed"
    ).length;

    const overdue = records.filter(record =>
    {
        if (!record.dueDate)
        {
            return false;
        }

        return new Date(record.dueDate) < new Date() &&
               record.status !== "Disposed";
    }).length;

    const today = new Date().toISOString().split("T")[0];

    const todayReceipts = records.filter(record =>
        record.dateReceived === today
    ).length;

    const todayDisposals = records.filter(record =>
        record.disposedDate === today
    ).length;

    setCardValue("totalFiles", total);

    setCardValue("pendingFiles", pending);

    setCardValue("disposedFiles", disposed);

    setCardValue("overdueFiles", overdue);

    setCardValue("todayReceipts", todayReceipts);

    setCardValue("todayDisposals", todayDisposals);
}

/*==========================================================
SET CARD VALUE
==========================================================*/

function setCardValue(id, value)
{
    const control = document.getElementById(id);

    if(control)
    {
        control.textContent = value;
    }
}

/*==========================================================
RECENT FILES
==========================================================*/



/*==========================================================
OPEN MODULE
==========================================================*/

function openModule(module) {
    switch (module) {
        case 'cpgrams':
            window.location.href = 'cpgrams.html';
            break;

        case 'prajavani':
            window.location.href = 'prajavani.html';
            break;

        case 'rti':
            window.location.href = 'rti.html';
            break;

        case 'reports':
            window.location.href = 'reports.html';
            break;

        default:
            alert('Module not found');
    }
}

/*==========================================================
QUICK ACTIONS
==========================================================*/

function newCPGRAMS()
{
    window.location.href =
        "../modules/cpgrams/cpgrams.html";
}

function openSearch()
{
    alert("Search Module - Coming Soon");
}

function openReports()
{
    alert("Reports Module - Coming Soon");
}

function openMasters()
{
    alert("Masters Module - Coming Soon");
}

/*==========================================================
REFRESH
==========================================================*/

function refreshDashboard()
{
    loadStatistics();

    loadRecentFiles();
}

document.addEventListener("DOMContentLoaded", function ()
{
    initializeDashboard();
});

/*==========================================================
SYSTEM INFORMATION
==========================================================*/

function loadSystemInformation()
{
    const records = getData(STORAGE_KEYS.CPGRAMS);

    document.getElementById("totalRecords").textContent =
        records.length;

    document.getElementById("appVersion").textContent =
        "1.0.0";
}

/*==========================================================
AUTO REFRESH DASHBOARD
==========================================================*/

function refreshDashboard()
{
    loadStatistics();
    loadRecentFiles();
    loadSystemInformation();
    highlightOverdueFiles();
}

/*==========================================================
AUTO REFRESH EVERY 30 SECONDS
==========================================================*/

setInterval(function ()
{
    refreshDashboard();
}, 30000);

/*==========================================================
HIGHLIGHT OVERDUE FILES
==========================================================*/

function highlightOverdueFiles()
{
    const rows = document.querySelectorAll("#recentFiles tr");

    rows.forEach(function(row)
    {
        const statusCell = row.cells[4];

        if (!statusCell) return;

        const status = statusCell.textContent.trim().toLowerCase();

        if (status === "overdue")
        {
            row.classList.add("table-danger");
        }
    });
}

/*==========================================================
END OF FILE
==========================================================*/