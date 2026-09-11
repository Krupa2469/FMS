/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : app.js
    Version     : 1.0.0
    Description : Application Controller
==========================================================*/

"use strict";

/*==========================================================
APPLICATION INFORMATION
==========================================================*/

const APP = {

    NAME: "File Management System",

    SHORT_NAME: "FMS",

    VERSION: "1.3.4",

    DEPARTMENT: "Office of the Commissioner, Rural Development",

    STATE: "Government of Telangana"

};


/*==========================================================
APPLICATION START
==========================================================*/

document.addEventListener("DOMContentLoaded", initializeApplication);


/*==========================================================
INITIALIZE APPLICATION
==========================================================*/

function initializeApplication()
{
    console.log("======================================");
    console.log(APP.NAME);
    console.log("Version : " + APP.VERSION);
    console.log("======================================");

    showCurrentYear();

    showVersion();
}


/*==========================================================
SHOW APPLICATION VERSION
==========================================================*/

function showVersion()
{
    const version = document.getElementById("appVersion");

    if (version)
    {
        version.textContent = APP.VERSION;
    }
}


/*==========================================================
SHOW CURRENT YEAR
==========================================================*/

function showCurrentYear()
{
    const year = document.getElementById("currentYear");

    if (year)
    {
        year.textContent = new Date().getFullYear();
    }
}


/*==========================================================
GET CURRENT DATE
==========================================================*/

function getCurrentDate()
{
    return new Date();
}


/*==========================================================
FORMAT DATE
Returns : DD-MM-YYYY
==========================================================*/

function formatDate(date)
{
    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");

    const month = String(d.getMonth() + 1).padStart(2, "0");

    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
}


/*==========================================================
ADD DAYS
==========================================================*/

function addDays(date, days)
{
    const d = new Date(date);

    d.setDate(d.getDate() + Number(days));

    return d;
}


/*==========================================================
GET DAYS DIFFERENCE
==========================================================*/

function getDaysDifference(startDate, endDate)
{
    const start = new Date(startDate);

    const end = new Date(endDate);

    const difference = end - start;

    return Math.floor(difference / (1000 * 60 * 60 * 24));
}


/*==========================================================
SHOW MESSAGE
==========================================================*/

function showMessage(message)
{
    alert(message);
}


/*==========================================================
CONFIRM ACTION
==========================================================*/

function confirmAction(message)
{
    return confirm(message);
}


/*==========================================================
END OF FILE
==========================================================*/