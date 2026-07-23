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