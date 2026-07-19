/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : navigation.js
    Version     : 1.0.0
    Description : Navigation Controller
==========================================================*/

"use strict";

/*==========================================================
OPEN MODULE
==========================================================*/

function openModule(moduleName)
{
    switch(moduleName)
    {
        case "moduleA":
            window.location.href = "pages/moduleA.html";
            break;

        case "rti":
            window.location.href = "pages/rti.html";
            break;

        case "disha":
            window.location.href = "pages/disha.html";
            break;

        default:
            alert("Module not available.");
    }
}


/*==========================================================
OPEN MASTERS
==========================================================*/

function openMasters()
{
    window.location.href = "masters/index.html";
}


/*==========================================================
OPEN REPORTS
==========================================================*/

function openReports()
{
    window.location.href = "reports/index.html";
}


/*==========================================================
OPEN UTILITIES
==========================================================*/

function openUtilities()
{
    window.location.href = "pages/utilities.html";
}


/*==========================================================
GO TO HOME PAGE
==========================================================*/

function goHome()
{
    window.location.href = "../index.html";
}


/*==========================================================
GO BACK
==========================================================*/

function goBack()
{
    window.history.back();
}


/*==========================================================
REFRESH CURRENT PAGE
==========================================================*/

function refreshPage()
{
    location.reload();
}


/*==========================================================
LOGOUT
Reserved for Future Version
==========================================================*/

function logout()
{
    alert("Login module will be implemented in a future version.");
}


/*==========================================================
END OF FILE
==========================================================*/