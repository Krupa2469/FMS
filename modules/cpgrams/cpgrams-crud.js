/******************************************************************************
 * File        : cpgrams-crud.js
 * Module      : CPGRAMS
 * Description : CRUD Operations
 * Version     : 2.0
 * Developer   : Lekha Technologies
 ******************************************************************************/

"use strict";

/*===========================================================================
    Storage Key
===========================================================================*/

const STORAGE_KEY = "CPGRAMS_RECORDS";

/*===========================================================================
    Save Record
===========================================================================*/

function saveRecord() {

    if (!validateForm())
        return;

    const record = getFormData();

    const records = getAllRecords();

    // Duplicate Check

    const duplicate = records.find(r =>
        r.grievanceNumber === record.grievanceNumber
    );

    if (duplicate) {

        alert("Grievance Number already exists.");

        return;

    }

    record.id = Date.now();

    record.createdOn = new Date().toISOString();

    records.push(record);

    saveAllRecords(records);

    alert("Record saved successfully.");

    currentRecordId = record.id;

    updateButtonState(true);

}

/*===========================================================================
    Get All Records
===========================================================================*/

function getAllRecords() {

    const data = localStorage.getItem(STORAGE_KEY);

    if (!data)
        return [];

    return JSON.parse(data);

}

/*===========================================================================
    Save All Records
===========================================================================*/

function saveAllRecords(records) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(records)
    );

}

/*===========================================================================
    Get Record By ID
===========================================================================*/

function getRecordById(id) {

    const records = getAllRecords();

    return records.find(r => r.id == id);

}

/*===========================================================================
    Update Record
===========================================================================*/

function updateRecord() {

    if (!validateForm())
        return;

    if (currentRecordId == null) {

        alert("Please select a record to update.");

        return;

    }

    const records = getAllRecords();

    const index = records.findIndex(r => r.id == currentRecordId);

    if (index === -1) {

        alert("Record not found.");

        return;

    }

    const record = getFormData();

    record.id = currentRecordId;

    record.createdOn = records[index].createdOn;

<<<<<<< HEAD
    newCPGRAMS();
}
/*==========================================================
CREATE RECORD OBJECT
==========================================================*/

function createRecord()
{
    return {

        id: document.getElementById("fileNumber").value,

        grievanceNumber: document.getElementById("grievanceNumber").value,

        dateReceived: document.getElementById("dateReceived").value,

        dueDate: document.getElementById("dueDate").value,

        priority: document.getElementById("priority").value,

        status: document.getElementById("status").value,

        complainantName: document.getElementById("complainantName").value,

        mobileNumber: document.getElementById("mobileNumber").value,

        email: document.getElementById("email").value,

        district: document.getElementById("district").value,

        mandal: document.getElementById("mandal").value,

        village: document.getElementById("village").value,

        subject: document.getElementById("subject").value,

        category: document.getElementById("category").value,

        description: document.getElementById("description").value,

        source: document.getElementById("source").value,

        assignedOfficer: document.getElementById("assignedOfficer").value,

        section: document.getElementById("section").value,

        atrReceived: document.getElementById("atrReceived").value,

        atrDate: document.getElementById("atrDate").value,

        disposedDate: document.getElementById("disposedDate").value,

        finalStatus: document.getElementById("finalStatus").value,

        remarks: document.getElementById("remarks").value

    };
}

/*==========================================================
CHECK DUPLICATE GRIEVANCE NUMBER
==========================================================*/

function isDuplicateGrievanceNumber(grievanceNumber, currentFileNumber = "")
{
    const records = getData(STORAGE_KEYS.CPGRAMS);

    return records.some(record =>
        record.grievanceNumber.trim().toUpperCase() ===
            grievanceNumber.trim().toUpperCase()
        &&
        record.id !== currentFileNumber
    );
}



function saveRecord()
{
    if (!validateCPGRAMS())
        return;

    const grievanceNumber =
        document.getElementById("grievanceNumber").value;

    if (isDuplicateGrievanceNumber(grievanceNumber))
    {
        alert("Grievance Number already exists.");

        document.getElementById("grievanceNumber").focus();

        return;
    }

    // Existing save logic starts here...
}

const fileNumber =
    document.getElementById("fileNumber").value;

const grievanceNumber =
    document.getElementById("grievanceNumber").value;

if (isDuplicateGrievanceNumber(grievanceNumber, fileNumber))
{
    alert("Another record already uses this Grievance Number.");

    return;
}

function deleteRecord()
{
    if(!confirm("Delete this record?"))
        return;

    let records = getData(STORAGE_KEYS.CPGRAMS);

    const id = document.getElementById("fileNumber").value;

    records = records.filter(r => r.id !== id);

    saveData(STORAGE_KEYS.CPGRAMS, records);

    alert("Record deleted.");

    clearForm();

    generateFileNumber();
}

function loadRecord(record)
{
    document.getElementById("fileNumber").value = record.id;
    document.getElementById("grievanceNumber").value = record.grievanceNumber;
    document.getElementById("dateReceived").value = record.dateReceived;
    document.getElementById("dueDate").value = record.dueDate;
    document.getElementById("priority").value = record.priority;
    document.getElementById("status").value = record.status;

    document.getElementById("complainantName").value = record.complainantName;
    document.getElementById("mobileNumber").value = record.mobileNumber;
    document.getElementById("email").value = record.email;

    document.getElementById("district").value = record.district;
    document.getElementById("mandal").value = record.mandal;
    document.getElementById("village").value = record.village;

    document.getElementById("subject").value = record.subject;
    document.getElementById("category").value = record.category;
    document.getElementById("description").value = record.description;
    document.getElementById("source").value = record.source;

    document.getElementById("assignedOfficer").value = record.assignedOfficer;
    document.getElementById("section").value = record.section;
    document.getElementById("atrReceived").value = record.atrReceived;
    document.getElementById("atrDate").value = record.atrDate;
    document.getElementById("disposedDate").value = record.disposedDate;
    document.getElementById("finalStatus").value = record.finalStatus;
    document.getElementById("remarks").value = record.remarks;
}
=======
    record.modifiedOn = new Date().toISOString();

    records[index] = record;

    saveAllRecords(records);

    alert("Record updated successfully.");

}

/*===========================================================================
    Delete Record
===========================================================================*/

function deleteRecord() {

    if (currentRecordId == null) {

        alert("Please select a record.");

        return;

    }

    if (!confirm("Are you sure you want to delete this record?"))
        return;

    let records = getAllRecords();

    records = records.filter(r => r.id != currentRecordId);

    saveAllRecords(records);

    alert("Record deleted successfully.");

    newRecord();

}

/*===========================================================================
    Search Record By Grievance Number
===========================================================================*/

function searchRecord(grievanceNumber) {

    const records = getAllRecords();

    return records.find(r =>
        r.grievanceNumber === grievanceNumber
    );

}

/*===========================================================================
    Load Record By ID
===========================================================================*/

function loadRecordById(id) {

    const record = getRecordById(id);

    if (!record) {

        alert("Record not found.");

        return;

    }

    loadRecord(record);

}

/*===========================================================================
    Get Total Records
===========================================================================*/

function getRecordCount() {

    return getAllRecords().length;

}

/*===========================================================================
    Check Duplicate Grievance Number
===========================================================================*/

function grievanceExists(grievanceNumber) {

    const records = getAllRecords();

    return records.some(r =>
        r.grievanceNumber === grievanceNumber &&
        r.id != currentRecordId
    );

}

/*===========================================================================
    Refresh Register
===========================================================================*/

function refreshRegister() {

    if (typeof loadRegister === "function") {

        loadRegister();

    }

}

/*===========================================================================
    Save and Refresh
===========================================================================*/

function saveAndRefresh() {

    saveRecord();

    refreshRegister();

}

/*===========================================================================
    Update and Refresh
===========================================================================*/

function updateAndRefresh() {

    updateRecord();

    refreshRegister();

}

/*===========================================================================
    Delete and Refresh
===========================================================================*/

function deleteAndRefresh() {

    deleteRecord();

    refreshRegister();

}

/*===========================================================================
    Get Records By Status
===========================================================================*/

function getRecordsByStatus(status) {

    return getAllRecords().filter(record =>
        record.status === status
    );

}

/*===========================================================================
    Get Records By District
===========================================================================*/

function getRecordsByDistrict(district) {

    return getAllRecords().filter(record =>
        record.district === district
    );

}

/*===========================================================================
    Get Pending Records
===========================================================================*/

function getPendingRecords() {

    return getAllRecords().filter(record =>
        record.finalStatus !== "Disposed" &&
        record.finalStatus !== "Closed"
    );

}

/*===========================================================================
    Get Overdue Records
===========================================================================*/

function getOverdueRecords() {

    const today = new Date();

    return getAllRecords().filter(record => {

        if (!record.dueDate)
            return false;

        if (
            record.finalStatus === "Disposed" ||
            record.finalStatus === "Closed"
        )
            return false;

        return new Date(record.dueDate) < today;

    });

}

/*===========================================================================
    Search Records
===========================================================================*/

function searchRecords(searchText) {

    searchText = searchText.toLowerCase().trim();

    return getAllRecords().filter(record =>

        (record.fileNumber || "").toLowerCase().includes(searchText) ||

        (record.grievanceNumber || "").toLowerCase().includes(searchText) ||

        (record.complainantName || "").toLowerCase().includes(searchText) ||

        (record.subject || "").toLowerCase().includes(searchText) ||

        (record.district || "").toLowerCase().includes(searchText)

    );

}

/*===========================================================================
    Sort Records
===========================================================================*/

function sortRecords(records, field) {

    return records.sort((a, b) => {

        const valueA = (a[field] || "").toString().toLowerCase();

        const valueB = (b[field] || "").toString().toLowerCase();

        if (valueA < valueB)
            return -1;

        if (valueA > valueB)
            return 1;

        return 0;

    });

}

/*===========================================================================
    Export Records
===========================================================================*/

function exportRecords() {

    return JSON.stringify(
        getAllRecords(),
        null,
        2
    );

}

/*===========================================================================
    Import Records
===========================================================================*/

function importRecords(jsonData) {

    try {

        const records = JSON.parse(jsonData);

        if (!Array.isArray(records)) {

            alert("Invalid import file.");

            return false;

        }

        saveAllRecords(records);

        alert("Records imported successfully.");

        return true;

    }
    catch (error) {

        console.error(error);

        alert("Unable to import records.");

        return false;

    }

}

/*===========================================================================
    Clear All Records
===========================================================================*/

function clearAllRecords() {

    if (!confirm("Delete ALL CPGRAMS records?"))
        return;

    localStorage.removeItem(STORAGE_KEY);

    alert("All records deleted.");

    newRecord();

    refreshRegister();

}

/*===========================================================================
    End of File
===========================================================================*/
>>>>>>> f2f75a3bba0165089da376c7b25e05c934a78b19
