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