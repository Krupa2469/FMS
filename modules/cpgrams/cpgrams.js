/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    Module      : CPGRAMS
    File        : cpgrams.js
    Version     : 1.0.0
==========================================================*/

"use strict";

/*==========================================================
PAGE LOAD
==========================================================*/

document.addEventListener("DOMContentLoaded", initializeCPGRAMS);

/*==========================================================
INITIALIZE
==========================================================*/

function initializeCPGRAMS()
{
    generateNewFile();

    setToday("dateReceived");

    calculateDueDate();

    setValue("status","Under Circulation");

    if(getElement("atrReceived"))
        setValue("atrReceived","No");

    if(getElement("disposed"))
        setValue("disposed","No");

    toggleATRDate();

    toggleDisposedDate();

    attachEvents();
}

/*==========================================================
ATTACH EVENTS
==========================================================*/

function attachEvents()
{
    const dateReceived = getElement("dateReceived");

    if(dateReceived)
    {
        dateReceived.addEventListener("change",calculateDueDate);
    }

    const atr = getElement("atrReceived");

    if(atr)
    {
        atr.addEventListener("change",toggleATRDate);
    }

    const disposed = getElement("disposed");

    if(disposed)
    {
        disposed.addEventListener("change",toggleDisposedDate);
    }
}

/*==========================================================
GENERATE FILE NUMBER
==========================================================*/

function generateNewFile()
{
    setValue(
        "fileNumber",
        generateFileNumber("CPG")
    );
}

/*==========================================================
CALCULATE DUE DATE
==========================================================*/

function calculateDueDate()
{
    const received = getValue("dateReceived");

    if(received=="")
        return;

    const due = addDays(received,
        APP_CONFIG.CPGRAMS_DUE_DAYS);

    setValue(
        "dueDate",
        due.toISOString().split("T")[0]
    );
}

/*==========================================================
ATR DATE ENABLE/DISABLE
==========================================================*/

function toggleATRDate()
{
    const value = getValue("atrReceived");

    if(!getElement("atrReceivedDate"))
        return;

    if(value=="Yes")
    {
        enableControl("atrReceivedDate");
    }
    else
    {
        clearValue("atrReceivedDate");

        disableControl("atrReceivedDate");
    }
}

/*==========================================================
DISPOSED DATE ENABLE/DISABLE
==========================================================*/

function toggleDisposedDate()
{
    const value = getValue("disposed");

    if(!getElement("disposedDate"))
        return;

    if(value=="Yes")
    {
        enableControl("disposedDate");

        setValue("status","Disposed");
    }
    else
    {
        clearValue("disposedDate");

        disableControl("disposedDate");

        setValue(
            "status",
            "Under Circulation"
        );
    }
}

/*==========================================================
SAVE
==========================================================*/

function saveCPGRAMS()
{
    if(!validateCPGRAMS())
        return;

    const record =
    {
        id : getValue("fileNumber"),

        grievanceNo : getValue("grievanceNumber"),

        dateReceived : getValue("dateReceived"),

        complainantName : getValue("complainantName"),

        district : getValue("district"),

        mandal : getValue("mandal"),

        village : getValue("village"),

        subject : getValue("subject"),

        description : getValue("description"),

        assignedTo : getValue("assignedTo"),

        dueDate : getValue("dueDate"),

        status : getValue("status"),

        atrReceived : getValue("atrReceived"),

        atrReceivedDate : getValue("atrReceivedDate"),

        disposed : getValue("disposed"),

        disposedDate : getValue("disposedDate"),

        remarks : getValue("remarks"),

        createdOn : new Date().toISOString(),

        modifiedOn : new Date().toISOString()
    };

    addRecord(
        STORAGE_KEYS.CPGRAMS,
        record
    );

    alert("Record Saved Successfully.");

    clearForm("cpgramsForm");

    generateNewFile();

    setToday("dateReceived");

    calculateDueDate();

    setValue(
        "status",
        "Under Circulation"
    );
}

/*==========================================================
VALIDATION
==========================================================*/

function validateCPGRAMS()
{
    if(!validateRequired(
        "grievanceNumber",
        "Grievance Number"))
        return false;

    if(!validateRequired(
        "dateReceived",
        "Date Received"))
        return false;

    if(!validateRequired(
        "complainantName",
        "Complainant Name"))
        return false;

    if(!validateRequired(
        "district",
        "District"))
        return false;

    if(!validateRequired(
        "subject",
        "Subject"))
        return false;

    return true;
}

/*==========================================================
NEW RECORD
==========================================================*/

function newCPGRAMS()
{
    clearForm("cpgramsForm");

    generateNewFile();

    setToday("dateReceived");

    calculateDueDate();

    setValue(
        "status",
        "Under Circulation"
    );
}

/*==========================================================
END OF FILE
==========================================================*/