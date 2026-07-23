/******************************************************************************
 * FILE MANAGEMENT SYSTEM (FMS)
 * Module      : CPGRAMS
 * File        : cpgrams-crud.js
 * Version     : 3.0
 * Developer   : Lekha Technologies
 *
 * Description:
 * Business Logic Layer
 ******************************************************************************/

"use strict";

/******************************************************************************
 * Save Record
 ******************************************************************************/

function saveRecord() {

    if (!validateForm())
        return;

    const record = getFormData();

    if (isDuplicateGrievanceNumber(record.grievanceNumber)) {

        alert("Grievance Number already exists.");

        document.getElementById("grievanceNumber").focus();

        return;
    }

    record.createdOn = new Date().toISOString();

    currentRecordId = addCPGRAMSRecord(record);

    generateFileNumber();

    updateButtonState(true);

    alert("Record saved successfully.");

}

/******************************************************************************
 * Update Record
 ******************************************************************************/

function updateRecord() {

    if (!validateForm())
        return;

    if (currentRecordId == null) {

        alert("Please select a record.");

        return;

    }

    const record = getFormData();

    record.id = currentRecordId;

    if (isDuplicateGrievanceNumber(record.grievanceNumber, currentRecordId)) {

        alert("Grievance Number already exists.");

        return;

    }

    updateCPGRAMSRecord(record);

    alert("Record updated successfully.");

}

/******************************************************************************
 * Delete Record
 ******************************************************************************/

function deleteRecord() {

    if (currentRecordId == null) {

        alert("Please select a record.");

        return;

    }

    if (!confirm("Delete this record?"))
        return;

    deleteCPGRAMSRecord(currentRecordId);

    newRecord();

    alert("Record deleted successfully.");

}

/******************************************************************************
 * Open Existing Record
 ******************************************************************************/

function openRecord(id) {

    const record = getRecordById(id);

    if (!record) {

        alert("Record not found.");

        return;

    }

    loadRecord(record);

}

/******************************************************************************
 * Get All Records
 ******************************************************************************/

function getRecords() {

    return getAllRecords();

}