/******************************************************************************
 * FILE MANAGEMENT SYSTEM (FMS)
 * File        : admin-master.js
 * Version     : 3.0
 * Developer   : Lekha Technologies
 *
 * Description :
 * Master Data Administration Controller
 ******************************************************************************/

"use strict";

/******************************************************************************
 * Initialize
 ******************************************************************************/

document.addEventListener("DOMContentLoaded", initializeAdmin);

function initializeAdmin() {

    registerEvents();

}

/******************************************************************************
 * Register Events
 ******************************************************************************/

function registerEvents() {

    bind("btnDistricts",      openDistrictMaster);
    bind("btnMandals",        openMandalMaster);
    bind("btnVillages",       openVillageMaster);

    bind("btnDepartments",    openDepartmentMaster);
    bind("btnSections",       openSectionMaster);
    bind("btnOfficers",       openOfficerMaster);
    bind("btnDesignations",   openDesignationMaster);

    bind("btnCategories",     openCategoryMaster);
    bind("btnSources",        openSourceMaster);
    bind("btnPriority",       openPriorityMaster);
    bind("btnStatus",         openStatusMaster);

    bind("btnFileLocations",  openFileLocationMaster);

    bind("btnImportExcel",    importMasterData);
    bind("btnExportExcel",    exportMasterData);

}

/******************************************************************************
 * Button Binding Helper
 ******************************************************************************/

function bind(id, handler) {

    const control = document.getElementById(id);

    if (control) {

        control.addEventListener("click", handler);

    }

}

/******************************************************************************
 * Navigation
 ******************************************************************************/

function openDistrictMaster() {
    window.location.href = "district-master.html";
}

function openMandalMaster() {
    window.location.href = "mandal-master.html";
}

function openVillageMaster() {
    window.location.href = "village-master.html";
}

function openDepartmentMaster() {
    window.location.href = "department-master.html";
}

function openSectionMaster() {
    window.location.href = "section-master.html";
}

function openOfficerMaster() {
    window.location.href = "officer-master.html";
}

function openDesignationMaster() {
    window.location.href = "designation-master.html";
}

function openCategoryMaster() {
    window.location.href = "category-master.html";
}

function openSourceMaster() {
    window.location.href = "source-master.html";
}

function openPriorityMaster() {
    window.location.href = "priority-master.html";
}

function openStatusMaster() {
    window.location.href = "status-master.html";
}

function openFileLocationMaster() {
    window.location.href = "filelocation-master.html";
}

/******************************************************************************
 * Import
 ******************************************************************************/

function importMasterData() {

    alert("Excel Import Module - Coming Soon");

}

/******************************************************************************
 * Export
 ******************************************************************************/

function exportMasterData() {

    alert("Excel Export Module - Coming Soon");

}