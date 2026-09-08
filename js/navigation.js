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

/* ==========================================================
   HOME PAGE SERVICES
========================================================== */
function openMasters() {
    window.location.href = "pages/admin/master-management.html";
}

function openReports() {
    window.location.href = "pages/reports.html";
}

function openUtilities() {
    window.location.href = "pages/utilities.html";
}

function openModuleDashboard(module) {
    const root = window.location.pathname.includes("/pages/") ? "" : "pages/";
    const routes={cpgrams:"../modules/cpgrams/cpgrams.html",rti:"../modules/rti/rti.html",disha:"../modules/disha/disha.html"};
    window.location.href = routes[module] || "../index.html";
}
