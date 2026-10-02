/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : app.js
    Version     : 1.10.2
    Description : Application Controller
==========================================================*/

"use strict";

/*==========================================================
APPLICATION INFORMATION
==========================================================*/

const APP = {

    NAME: "File Management System",

    SHORT_NAME: "FMS",

    VERSION: "1.10.2",

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
    installProductionMessageFilter();
    showCurrentYear();
    showVersion();
    applyProductionTooltips();
}



/*==========================================================
PRODUCTION USER MESSAGES AND TOOLTIPS
==========================================================*/
function productionMessage(message)
{
    const text = String(message == null ? "" : message);
    if (!text) return "Please try again.";
    if (/firebase|firestore|sdk|rest fallback|crud|database is not initialized|database is not ready/i.test(text))
        return "The data service is temporarily unavailable. Please check your connection, refresh the page and try again.";
    if (/parser is not available|parsing failed|ocr/i.test(text))
        return "Automatic document reading is unavailable right now. You can continue by entering the details manually.";
    if (/module under development/i.test(text))
        return "This feature is not available yet.";
    if (/technical|internal error/i.test(text))
        return "Something went wrong while completing this action. Please try again.";
    return text;
}
function installProductionMessageFilter()
{
    if (window.__fmsProductionMessageFilterInstalled) return;
    window.__fmsProductionMessageFilterInstalled = true;
    const nativeAlert = window.alert.bind(window);
    window.alert = function(message){ nativeAlert(productionMessage(message)); };
    window.FMSProductionMessage = productionMessage;
}
function applyProductionTooltips()
{
    document.querySelectorAll("button,a,input,select,textarea").forEach(function(el){
        if (el.title) return;
        const label = String(el.getAttribute("aria-label") || el.textContent || el.placeholder || "").trim().replace(/\s+/g," ");
        if (label && label.length <= 90) el.title = label;
    });
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
