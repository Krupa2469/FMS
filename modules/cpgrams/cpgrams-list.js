/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    Module      : CPGRAMS
    File        : cpgrams-list.js
    Version     : 1.0.0
    Description : CPGRAMS Register
==========================================================*/

"use strict";

/*==========================================================
PAGE LOAD
==========================================================*/

document.addEventListener("DOMContentLoaded", initializePage);

/*==========================================================
INITIALIZE
==========================================================*/

function initializePage()
{
    loadRecords();
}

/*==========================================================
LOAD RECORDS
==========================================================*/

function loadRecords()
{
    const records = getData(STORAGE_KEYS.CPGRAMS);

    displayRecords(records);
}

/*==========================================================
DISPLAY RECORDS
==========================================================*/

function displayRecords(records)
{
    const table = document.getElementById("recordTable");

    table.innerHTML = "";

    if(records.length === 0)
    {
        table.innerHTML =
        `<tr>
            <td colspan="9" class="text-center">
                No Records Found
            </td>
        </tr>`;

        return;
    }

    records.forEach(function(record,index)
    {
        table.innerHTML += `

        <tr>

            <td>${index+1}</td>

            <td>${record.id}</td>

            <td>${record.grievanceNo}</td>

            <td>${record.complainantName}</td>

            <td>${record.district}</td>

            <td>${record.dateReceived}</td>

            <td>${record.dueDate}</td>

            <td>${record.status}</td>

            <td>

                <button
                    class="btn btn-sm btn-primary"
                    onclick="editRecord(${index})">

                    Edit

                </button>

                <button
                    class="btn btn-sm btn-danger"
                    onclick="deleteCPGRAMS(${index})">

                    Delete

                </button>

            </td>

        </tr>

        `;
    });

}

/*==========================================================
SEARCH
==========================================================*/

function searchRecords()
{
    let records =
        getData(STORAGE_KEYS.CPGRAMS);

    const fileNo =
        document.getElementById("searchFileNo")
        .value
        .toLowerCase();

    const grievanceNo =
        document.getElementById("searchGrievanceNo")
        .value
        .toLowerCase();

    const district =
        document.getElementById("searchDistrict")
        .value
        .toLowerCase();

    const status =
        document.getElementById("searchStatus")
        .value
        .toLowerCase();

    records =
        records.filter(function(record)
        {

            return (

                (fileNo=="" ||
                 record.id.toLowerCase().includes(fileNo))

                &&

                (grievanceNo=="" ||
                 record.grievanceNo.toLowerCase().includes(grievanceNo))

                &&

                (district=="" ||
                 record.district.toLowerCase()==district)

                &&

                (status=="" ||
                 record.status.toLowerCase()==status)

            );

        });

    displayRecords(records);

}

/*==========================================================
EDIT
==========================================================*/

function editRecord(index)
{
    localStorage.setItem(
        "CPGRAMS_EDIT_INDEX",
        index
    );

    window.location.href =
        "cpgrams.html";

}

/*==========================================================
DELETE
==========================================================*/

function deleteCPGRAMS(index)
{
    if(confirm("Delete this record?"))
    {
        deleteRecord(
            STORAGE_KEYS.CPGRAMS,
            index
        );

        loadRecords();
    }
}

/*==========================================================
END OF FILE
==========================================================*/