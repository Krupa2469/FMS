/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : dashboard-recent.js
    Version     : 1.0.0
==========================================================*/

"use strict";

/*==========================================================
LOAD RECENT FILES
==========================================================*/

function loadRecentFiles()
{
    const tbody = document.getElementById("recentFiles");

    if(!tbody)
    {
        return;
    }

    tbody.innerHTML = "";

    let records = getData(STORAGE_KEYS.CPGRAMS);

    if(records.length === 0)
    {
        const row = tbody.insertRow();

        const cell = row.insertCell();

        cell.colSpan = 5;

        cell.className = "text-center text-muted";

        cell.innerHTML = "No files available.";

        return;
    }

    records = [...records].reverse();

    records.slice(0,10).forEach(function(record)
    {
        const row = tbody.insertRow();

        row.style.cursor = "pointer";

        row.onclick = function()
        {
            openFile(record.id);
        };

        row.insertCell().innerHTML = record.id;

        row.insertCell().innerHTML = record.dateReceived;

        row.insertCell().innerHTML = record.subject;

        row.insertCell().innerHTML = record.district;

        row.insertCell().innerHTML = record.status;
    });
}

/*==========================================================
OPEN FILE
==========================================================*/

function openFile(fileNumber)
{
    localStorage.setItem(
        "CPGRAMS_OPEN_FILE",
        fileNumber
    );

    window.location.href =
        "../modules/cpgrams/cpgrams.html";
}