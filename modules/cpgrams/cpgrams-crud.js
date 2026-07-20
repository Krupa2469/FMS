/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    Module      : CPGRAMS
    File        : cpgrams-crud.js
    Version     : 1.0.0
==========================================================*/

"use strict";

let editIndex = -1;

/*==========================================================
SAVE / UPDATE
==========================================================*/

function saveCPGRAMS()
{
    if (!validateCPGRAMS())
    {
        return;
    }

    const record =
    {
        id               : getValue("fileNumber"),
        grievanceNo      : getValue("grievanceNumber"),
        dateReceived     : getValue("dateReceived"),
        complainantName  : getValue("complainantName"),
        district         : getValue("district"),
        mandal           : getValue("mandal"),
        village          : getValue("village"),
        subject          : getValue("subject"),
        description      : getValue("description"),
        assignedTo       : getValue("assignedTo"),
        dueDate          : getValue("dueDate"),
        status           : getValue("status"),
        atrReceived      : getValue("atrReceived"),
        atrReceivedDate  : getValue("atrReceivedDate"),
        disposed         : getValue("disposed"),
        disposedDate     : getValue("disposedDate"),
        remarks          : getValue("remarks"),
        modifiedOn       : new Date().toISOString()
    };

    if(editIndex === -1)
    {
        record.createdOn = new Date().toISOString();

        addRecord(STORAGE_KEYS.CPGRAMS, record);

        alert("Record Saved Successfully.");
    }
    else
    {
        const records = getData(STORAGE_KEYS.CPGRAMS);

        record.createdOn = records[editIndex].createdOn;

        updateRecord(STORAGE_KEYS.CPGRAMS, editIndex, record);

        alert("Record Updated Successfully.");

        editIndex = -1;
    }

    newCPGRAMS();
}

/*==========================================================
LOAD RECORD FOR EDIT
==========================================================*/

function loadRecord(index)
{
    const records = getData(STORAGE_KEYS.CPGRAMS);

    if(index < 0 || index >= records.length)
    {
        return;
    }

    const record = records[index];

    editIndex = index;

    setValue("fileNumber", record.id);
    setValue("grievanceNumber", record.grievanceNo);
    setValue("dateReceived", record.dateReceived);
    setValue("complainantName", record.complainantName);
    setValue("district", record.district);
    setValue("mandal", record.mandal);
    setValue("village", record.village);
    setValue("subject", record.subject);
    setValue("description", record.description);
    setValue("assignedTo", record.assignedTo);
    setValue("dueDate", record.dueDate);
    setValue("status", record.status);
    setValue("atrReceived", record.atrReceived);
    setValue("atrReceivedDate", record.atrReceivedDate);
    setValue("disposed", record.disposed);
    setValue("disposedDate", record.disposedDate);
    setValue("remarks", record.remarks);

    toggleATRDate();

    toggleDisposedDate();
}

/*==========================================================
DELETE RECORD
==========================================================*/

function deleteCurrentRecord()
{
    if(editIndex === -1)
    {
        alert("Please load a record first.");

        return;
    }

    if(!confirm("Delete this record?"))
    {
        return;
    }

    deleteRecord(STORAGE_KEYS.CPGRAMS, editIndex);

    alert("Record Deleted Successfully.");

    editIndex = -1;

    newCPGRAMS();
}