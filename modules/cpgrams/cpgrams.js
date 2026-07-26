/*==========================================================
  CPGRAMS MODULE
  File        : cpgrams.js
  Version     : 4.0
  Description : Controller for CPGRAMS Module
==========================================================*/

"use strict";

//==========================================================
// GLOBAL VARIABLES
//==========================================================

let currentDocumentId = null;
let editMode = false;
let selectedDocument = null;

//==========================================================
// PAGE INITIALIZATION
//==========================================================

document.addEventListener("DOMContentLoaded", initializePage);

//==========================================================
// INITIALIZE PAGE
//==========================================================

async function initializePage() {

    console.log("CPGRAMS Module Initializing...");

    registerButtonEvents();

    registerFieldEvents();

    clearForm();

    generateGrievanceId();

    await loadMasterData();

    console.log("CPGRAMS Module Loaded Successfully.");

}

//==========================================================
// REGISTER BUTTON EVENTS
//==========================================================

function registerButtonEvents() {

    document.getElementById("btnNew")
        .addEventListener("click", clearForm);

    document.getElementById("btnSave")
        .addEventListener("click", saveGrievance);

    document.getElementById("btnUpdate")
        .addEventListener("click", updateGrievance);

    document.getElementById("btnDelete")
        .addEventListener("click", confirmDelete);

    document.getElementById("btnRegister")
        .addEventListener("click", openRegister);

    document.getElementById("btnDashboard")
        .addEventListener("click", openDashboard);

    document.getElementById("btnPrint")
        .addEventListener("click", printGrievance);

    document.getElementById("btnHome")
        .addEventListener("click", goHome);

}

//==========================================================
// REGISTER FIELD EVENTS
//==========================================================

function registerFieldEvents() {

    document
        .getElementById("dateReceived")
        .addEventListener("change", calculateDueDate);

    document
        .getElementById("district")
        .addEventListener("change", districtChanged);

    document
        .getElementById("mandal")
        .addEventListener("change", mandalChanged);

}

//==========================================================
// GENERATE GRIEVANCE ID
//==========================================================

function generateGrievanceId() {

    const now = new Date();

    const yyyy = now.getFullYear();

    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const dd = String(now.getDate()).padStart(2, "0");

    const hh = String(now.getHours()).padStart(2, "0");

    const mi = String(now.getMinutes()).padStart(2, "0");

    const ss = String(now.getSeconds()).padStart(2, "0");

    const grievanceId =
        "CPG-" +
        yyyy +
        mm +
        dd +
        "-" +
        hh +
        mi +
        ss;

    document.getElementById("grievanceId").value =
        grievanceId;

}

//==========================================================
// CALCULATE DUE DATE
// CPGRAMS = 21 DAYS
//==========================================================

function calculateDueDate() {

    const receivedDate =
        document.getElementById("dateReceived").value;

    if (receivedDate === "")
        return;

    const dueDate =
        new Date(receivedDate);

    dueDate.setDate(dueDate.getDate() + 21);

    document.getElementById("dueDate").value =
        dueDate.toISOString().substring(0, 10);

}

//==========================================================
// LOAD MASTER DATA
//==========================================================

async function loadMasterData() {

    console.log("Loading Masters...");

    loadDistricts("district");

    loadPriorities("priority");

    loadOfficers("assignedOfficer");

    loadSections("section");

}

//==========================================================
// DISTRICT CHANGED
//==========================================================

async function districtChanged() {

    const district =
        document.getElementById("district").value;

    await loadMandals(district);

}

//==========================================================
// MANDAL CHANGED
//==========================================================

async function mandalChanged() {

    const district =
        document.getElementById("district").value;

    const mandal =
        document.getElementById("mandal").value;

    await loadVillages(district, mandal);

}

//==========================================================
// NEW RECORD
//==========================================================

function clearForm() {

    document
        .getElementById("cpgramsForm")
        .reset();

    currentDocumentId = null;

    editMode = false;

    selectedDocument = null;

    generateGrievanceId();

    document
        .getElementById("grievanceNumber")
        .focus();

}

//==========================================================
// PLACEHOLDER FUNCTIONS
// IMPLEMENTED IN NEXT PARTS
//==========================================================

async function saveGrievance() {

    console.log("Save Clicked");

}

async function updateGrievance() {

    console.log("Update Clicked");

}

function confirmDelete() {

    console.log("Delete Clicked");

}

function openRegister() {

    window.location.href =
        "cpgrams-register.html";

}

function openDashboard() {

    window.location.href =
        "../../dashboard/dashboard.html";

}

function printGrievance() {

    window.print();

}

function goHome() {

    window.location.href =
        "../../index.html";

}

//==========================================================
// UPDATE GRIEVANCE
//==========================================================

async function updateGrievance() {

    try {

        if (currentDocumentId == null) {

            showMessage(
                "Please load a grievance before updating.",
                "warning"
            );

            return;

        }

        if (!validateForm())
            return;

        showLoading();

        const grievance = buildGrievanceObject();

        grievance.updatedOn = new Date();

        const result = await updateRecord(
            currentDocumentId,
            grievance
        );

        hideLoading();

        if (result.success) {

            showMessage(
                "Grievance updated successfully.",
                "success"
            );

        }
        else {

            showMessage(
                result.message,
                "danger"
            );

        }

    }
    catch (error) {

        hideLoading();

        console.error(error);

        showMessage(
            error.message,
            "danger"
        );

    }

}

//==========================================================
// DELETE GRIEVANCE
//==========================================================

async function deleteGrievance() {

    try {

        if (currentDocumentId == null) {

            showMessage(
                "No grievance selected.",
                "warning"
            );

            return;

        }

        showLoading();

        const result =
            await deleteRecord(currentDocumentId);

        hideLoading();

        if (result.success) {

            showMessage(
                "Grievance deleted successfully.",
                "success"
            );

            clearForm();

        }
        else {

            showMessage(
                result.message,
                "danger"
            );

        }

    }
    catch (error) {

        hideLoading();

        console.error(error);

        showMessage(
            error.message,
            "danger"
        );

    }

}

//==========================================================
// DELETE CONFIRMATION
//==========================================================

function confirmDelete() {

    const modal = new bootstrap.Modal(
        document.getElementById("deleteModal")
    );

    modal.show();

    document.getElementById("confirmDelete").onclick =
        async function () {

            modal.hide();

            await deleteGrievance();

        };

}

//==========================================================
// SEARCH GRIEVANCE
//==========================================================

async function searchGrievance(documentId) {

    try {

        showLoading();

        const result =
            await getRecord(documentId);

        hideLoading();

        if (!result.success) {

            showMessage(
                result.message,
                "warning"
            );

            return;

        }

        currentDocumentId = documentId;

        editMode = true;

        selectedDocument = result.data;

        populateForm(result.data);

    }
    catch (error) {

        hideLoading();

        console.error(error);

        showMessage(
            error.message,
            "danger"
        );

    }

}

//==========================================================
// POPULATE FORM
//==========================================================

async function populateForm(data) {

    document.getElementById("grievanceId").value =
        data.grievanceId || "";

    document.getElementById("grievanceNumber").value =
        data.grievanceNumber || "";

    document.getElementById("dateReceived").value =
        data.dateReceived || "";

    calculateDueDate();

    document.getElementById("priority").value =
        data.priority || "";

    document.getElementById("complainantName").value =
        data.complainantName || "";

    document.getElementById("mobileNumber").value =
        data.mobileNumber || "";

    document.getElementById("gender").value =
        data.gender || "";

    document.getElementById("district").value =
        data.district || "";

    await districtChanged();

    document.getElementById("mandal").value =
        data.mandal || "";

    await mandalChanged();

    document.getElementById("village").value =
        data.village || "";

    document.getElementById("address").value =
        data.address || "";

    document.getElementById("preferredContact").value =
        data.preferredContact || "";

    document.getElementById("subject").value =
        data.subject || "";

    document.getElementById("category").value =
        data.category || "";

    document.getElementById("grievanceDescription").value =
        data.grievanceDescription || "";

    document.getElementById("source").value =
        data.source || "";

    document.getElementById("natureOfGrievance").value =
        data.natureOfGrievance || "";

    document.getElementById("priorityClassification").value =
        data.priorityClassification || "";

    document.getElementById("attachmentCount").value =
        data.attachmentCount || 0;

    document.getElementById("fileNumber").value =
        data.fileNumber || "";

    document.getElementById("dateArised").value =
        data.dateArised || "";

    document.getElementById("officeSubject").value =
        data.officeSubject || "";

    document.getElementById("assignedOfficer").value =
        data.assignedOfficer || "";

    document.getElementById("section").value =
        data.section || "";

    document.getElementById("fileLocation").value =
        data.fileLocation || "";

    document.getElementById("dateAssigned").value =
        data.dateAssigned || "";

    document.getElementById("currentStatus").value =
        data.currentStatus || "";

    document.getElementById("finalStatus").value =
        data.finalStatus || "";

    document.getElementById("atrReceived").value =
        data.atrReceived || "";

    document.getElementById("atrDate").value =
        data.atrDate || "";

    document.getElementById("atrDueDate").value =
        data.atrDueDate || "";

    document.getElementById("disposalDate").value =
        data.disposalDate || "";

    document.getElementById("fileClosed").value =
        data.fileClosed || "";

    document.getElementById("remarks").value =
        data.remarks || "";

}

//==========================================================
// LOAD DISTRICTS
//==========================================================

async function loadDistricts() {

    const district =
        document.getElementById("district");

    district.innerHTML =
        '<option value="">Select District</option>';

    if (typeof DISTRICTS === "undefined")
        return;

    DISTRICTS.forEach(name => {

        district.innerHTML +=
            `<option value="${name}">
                ${name}
             </option>`;

    });

}

//==========================================================
// LOAD MANDALS
//==========================================================



//==========================================================
// LOAD VILLAGES
//==========================================================



//==========================================================
// ENABLE/DISABLE FORM
//==========================================================

function setFormEnabled(enabled) {

    document
        .querySelectorAll("#cpgramsForm input, #cpgramsForm select, #cpgramsForm textarea")
        .forEach(control => {

            if (control.id !== "grievanceId") {

                control.disabled = !enabled;

            }

        });

}

//==========================================================
// CLEAR MESSAGE AREA
//==========================================================

function clearMessage() {

    document
        .getElementById("messageArea")
        .innerHTML = "";

}

//==========================================================
// FORMAT MOBILE NUMBER
//==========================================================

function formatMobileNumber() {

    const mobile =
        document.getElementById("mobileNumber");

    mobile.value =
        mobile.value.replace(/\D/g, "");

    if (mobile.value.length > 10) {

        mobile.value =
            mobile.value.substring(0, 10);

    }

}

//==========================================================
// FORM DIRTY CHECK
//==========================================================

function isFormDirty() {

    return true;

}

//==========================================================
// RESET EDIT MODE
//==========================================================

function resetEditMode() {

    currentDocumentId = null;

    editMode = false;

    selectedDocument = null;

}

//==========================================================
// EXPORT CURRENT OBJECT
//==========================================================

function getCurrentGrievance() {

    return buildGrievanceObject();

}

//==========================================================
// DEBUG
//==========================================================

function debugForm() {

    console.table(getCurrentGrievance());

}

window.debugForm = debugForm;

//==========================================================
// END OF FILE
//==========================================================