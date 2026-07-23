/******************************************************************************
 * FILE MANAGEMENT SYSTEM (FMS)
 * CPGRAMS SERVICE
 *
 * Version : 3.0
 * Developer : Lekha Technologies
 *
 * Purpose
 * --------
 * Database Access Layer for CPGRAMS
 *
 * Currently:
 *      Local Storage
 *
 * Future:
 *      Firestore
 ******************************************************************************/

"use strict";

const STORAGE_KEYS = {

    CPGRAMS: "CPGRAMS_RECORDS"

};

/******************************************************************************
 * Get All Records
 ******************************************************************************/

function getAllRecords()
{
    return getData(STORAGE_KEYS.CPGRAMS);
}

/******************************************************************************
 * Save All Records
 ******************************************************************************/

function saveAllRecords(records)
{
    saveData(STORAGE_KEYS.CPGRAMS, records);
}

/******************************************************************************
 * Get Record By ID
 ******************************************************************************/

function getRecordById(id)
{
    const records = getAllRecords();

    return records.find(r => r.id === id) || null;
}

/******************************************************************************
 * Generate Next Record ID
 ******************************************************************************/

function getNextId()
{
    const records = getAllRecords();

    if(records.length === 0)
        return 1;

    return Math.max(...records.map(r => r.id || 0)) + 1;
}

/******************************************************************************
 * Add Record
 ******************************************************************************/

function addCPGRAMSRecord(record)
{
    const records = getAllRecords();

    record.id = getNextId();

    records.push(record);

    saveAllRecords(records);

    return record.id;
}

/******************************************************************************
 * Update Record
 ******************************************************************************/

function updateCPGRAMSRecord(record)
{
    const records = getAllRecords();

    const index =
        records.findIndex(r => r.id === record.id);

    if(index === -1)
        return false;

    records[index] = record;

    saveAllRecords(records);

    return true;
}

/******************************************************************************
 * Delete Record
 ******************************************************************************/

function deleteCPGRAMSRecord(id)
{
    let records = getAllRecords();

    records =
        records.filter(r => r.id !== id);

    saveAllRecords(records);
}

/******************************************************************************
 * Duplicate Grievance Number Check
 ******************************************************************************/

function isDuplicateGrievanceNumber(grievanceNumber, currentId = null)
{
    const records = getAllRecords();

    return records.some(record =>
    {
        if(currentId !== null && record.id === currentId)
            return false;

        return record.grievanceNumber === grievanceNumber;

    });
}