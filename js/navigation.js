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
            window.location.href = base + "pages/module-dashboard.html?module=cpgrams";
            break;

        case "prajavani":
            window.location.href = base + "modules/prajavani/prajavani.html";
            break;

        case "rti":
            window.location.href = base + "pages/module-dashboard.html?module=rti";
            break;

        case "disha":
            window.location.href = base + "pages/module-dashboard.html?module=disha";
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
    window.location.href = root + "module-dashboard.html?module=" + encodeURIComponent(module);
}
