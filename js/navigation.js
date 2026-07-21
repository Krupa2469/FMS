/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : navigation.js
    Version     : 1.0.0
==========================================================*/

"use strict";

/*==========================================================
GO HOME
==========================================================*/

function goHome()
{
    window.location.href = "../../index.html";
}

/*==========================================================
OPEN MODULE
==========================================================*/

function openModule(module)
{
    switch (module) {

    case "cpgrams":
        window.location.href = "modules/cpgrams/cpgrams.html";
        break;

    case "rti":
        window.location.href = "modules/rti/rti.html";
        break;

    case "disha":
        window.location.href = "modules/disha/disha.html";
        break;

    case "prajavani":
        window.location.href = "modules/prajavani/prajavani.html";
        break;

    default:
        alert("Module under development.");
}
}