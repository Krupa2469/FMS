/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    Module      : CPGRAMS
    File        : cpgrams-register.js
    Version     : 1.0.0
==========================================================*/

"use strict";

document.addEventListener("DOMContentLoaded", function ()
{
    loadRegister();
});

/*==========================================================
LOAD REGISTER
==========================================================*/

function loadRegister()
{
    const tbody = document.getElementById("registerBody");

    const searchBox = document.getElementById("searchText");

    const search = searchBox ? searchBox.value.toLowerCase().trim() : "";

    tbody.innerHTML = "";

    const records = getData(STORAGE_KEYS.CPGRAMS);

    let slNo = 1;

    records.forEach(function(record, index)
    {
        const text =
            (
                record.id +
                record.grievanceNo +
                record.complainantName +
                record.district +
                record.assignedTo +
                record.status
            ).toLowerCase();

        if(search !== "" && !text.includes(search))
        {
            return;
        }

        const row = tbody.insertRow();

        row.insertCell().innerHTML = slNo++;

        row.insertCell().innerHTML = record.id;

        row.insertCell().innerHTML = record.grievanceNo;

        row.insertCell().innerHTML = record.dateReceived;

        row.insertCell().innerHTML = record.complainantName;

        row.insertCell().innerHTML = record.district;

        row.insertCell().innerHTML = record.assignedTo;

        row.insertCell().innerHTML = record.status;

        row.insertCell().innerHTML =
        `
            <button class="btn btn-sm btn-primary"
                    onclick="editRecord(${index})">
                    Edit
            </button>

            <button class="btn btn-sm btn-danger"
                    onclick="deleteRecordFromRegister(${index})">
                    Delete
            </button>
        `;
    });

    updateRecordCount(slNo - 1);
}

/*==========================================================
EDIT RECORD
==========================================================*/

function editRecord(index)
{
    localStorage.setItem("CPGRAMS_EDIT_INDEX", index);

    window.location.href = "cpgrams.html";
}

/*==========================================================
DELETE RECORD
==========================================================*/

function deleteRecordFromRegister(index)
{
    if(!confirm("Are you sure you want to delete this record?"))
    {
        return;
    }

    deleteRecord(STORAGE_KEYS.CPGRAMS, index);

    loadRegister();
}

/*==========================================================
RECORD COUNT
==========================================================*/

function updateRecordCount(count)
{
    let counter = document.getElementById("recordCount");

    if(counter)
    {
        counter.innerHTML = "Total Records : " + count;
    }
}

/*==========================================================
REFRESH
==========================================================*/

function refreshRegister()
{
    document.getElementById("searchText").value = "";

    loadRegister();
}

/*==========================================================
END OF FILE
==========================================================*/