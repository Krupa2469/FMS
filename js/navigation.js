"use strict";

/*==========================================================
GO HOME
==========================================================*/

function goHome() {
    window.location.href = "../../index.html";
}

/*==========================================================
OPEN MODULE
==========================================================*/

function openModule(module) {

    const inPages = window.location.pathname.includes("/pages/");
    const base = inPages ? "../" : "";

    switch (module) {

        case "cpgrams":
            window.location.href = base + "modules/cpgrams/cpgrams.html";
            break;

        case "prajavani":
            window.location.href = base + "modules/prajavani/prajavani.html";
            break;

        case "rti":
            window.location.href = base + "modules/rti/rti.html";
            break;

        case "disha":
            window.location.href = base + "modules/disha/disha.html";
            break;

        default:
            alert("Module under development.");

    }
}