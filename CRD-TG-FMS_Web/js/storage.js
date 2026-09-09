/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : storage.js
    Version     : 1.0.0
    Description : Data Storage Layer
==========================================================*/

"use strict";

/*==========================================================
SAVE DATA
==========================================================*/

function saveData(storageKey, data)
{
    localStorage.setItem(storageKey, JSON.stringify(data));
}


/*==========================================================
GET DATA
==========================================================*/

function getData(storageKey)
{
    const data = localStorage.getItem(storageKey);

    if (data === null)
    {
        return [];
    }

    return JSON.parse(data);
}


/*==========================================================
DELETE DATA
==========================================================*/

function deleteData(storageKey)
{
    localStorage.removeItem(storageKey);
}


/*==========================================================
CLEAR ALL DATA
==========================================================*/

function clearAllData()
{
    localStorage.clear();
}


/*==========================================================
ADD RECORD
==========================================================*/

function addRecord(storageKey, record)
{
    let records = getData(storageKey);

    records.push(record);

    saveData(storageKey, records);
}


/*==========================================================
UPDATE RECORD
==========================================================*/

function updateRecord(storageKey, index, record)
{
    let records = getData(storageKey);

    if (index >= 0 && index < records.length)
    {
        records[index] = record;

        saveData(storageKey, records);
    }
}


/*==========================================================
DELETE RECORD
==========================================================*/

function deleteRecord(storageKey, index)
{
    let records = getData(storageKey);

    if (index >= 0 && index < records.length)
    {
        records.splice(index, 1);

        saveData(storageKey, records);
    }
}


/*==========================================================
GET RECORD BY INDEX
==========================================================*/

function getRecord(storageKey, index)
{
    let records = getData(storageKey);

    if (index >= 0 && index < records.length)
    {
        return records[index];
    }

    return null;
}


/*==========================================================
GET RECORD COUNT
==========================================================*/

function getRecordCount(storageKey)
{
    return getData(storageKey).length;
}


/*==========================================================
CHECK STORAGE
==========================================================*/

function storageExists(storageKey)
{
    return localStorage.getItem(storageKey) !== null;
}


/*==========================================================
EXPORT DATA
==========================================================*/

function exportData(storageKey)
{
    return JSON.stringify(getData(storageKey), null, 4);
}


/*==========================================================
IMPORT DATA
==========================================================*/

function importData(storageKey, jsonData)
{
    try
    {
        const records = JSON.parse(jsonData);

        saveData(storageKey, records);

        return true;
    }
    catch
    {
        return false;
    }
}


/*==========================================================
END OF FILE
==========================================================*/