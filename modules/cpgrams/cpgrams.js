/*==========================================================
 FILE MANAGEMENT SYSTEM (FMS)
 Module      : CPGRAMS
 File        : cpgrams.js
 Version     : 5.1
 Developer   : Lekha Technologies
 Description : CPGRAMS Controller
==========================================================*/

"use strict";

/*==========================================================
 GLOBAL VARIABLES
==========================================================*/

let currentDocumentId = null;
let currentGrievance = null;

let editMode = false;
let formDirty = false;

/*==========================================================
 REPOSITORY SERVICES
==========================================================*/

async function saveGrievanceToDatabase(grievance) {

    return await createRecord(grievance);

}

async function updateGrievanceToDatabase(id, grievance) {

    return await updateRecord(id, grievance);

}

async function deleteGrievanceFromDatabase(id) {
    
     return await deleteRecord(id);

}

async function getGrievance(documentId) {

    return await getDocument(documentId);

}

async function getAllGrievances() {

    return await getActiveRecords();

}

<<<<<<< HEAD
async function checkDuplicateGrievanceNumber(grievanceNumber, excludeId = null) {

    return await grievanceExists(grievanceNumber, excludeId);
=======
async function checkDuplicateGrievanceNumber(grievanceNumber) {

    return await grievanceExists(grievanceNumber);
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604

}

/*==========================================================
 INITIALIZATION
==========================================================*/

document.addEventListener(
    "DOMContentLoaded",
    initializePage
);

async function initializePage() {

    try {

        console.clear();

        console.log("CPGRAMS Version 5.1 Initializing...");

        registerButtonEvents();

        registerFieldEvents();

        registerAttachmentEvents();

        await loadMasterData();

        checkPageMode();

        console.log("CPGRAMS Ready.");

    }
    catch (error) {

        console.error(error);

        showMessage(
            "danger",
            error.message
        );

    }

}

/*==========================================================
 PAGE MODE
==========================================================*/

function checkPageMode() {

    const params =
        new URLSearchParams(window.location.search);

    const mode =
        params.get("mode") || "new";

    switch (mode) {

        case "new":

            clearForm();
            break;

        case "edit":

            loadSelectedGrievance();
            break;

        case "view":

            loadSelectedGrievance();
            makeReadOnly();
            break;

        default:

            clearForm();

    }

}

/*==========================================================
 LOAD EDIT RECORD
==========================================================*/

async function loadSelectedGrievance() {

    const data =
        sessionStorage.getItem(
            "selectedGrievance"
        );

    if (!data)
        return;

    currentGrievance =
        JSON.parse(data);

        console.log("Session Data:", currentGrievance);
console.log("Current Document ID:", currentGrievance.id);

    currentDocumentId =
        currentGrievance.id;

    console.log("Loaded currentDocumentId:", currentDocumentId);

    editMode = true;

    enableEditing();

    populateForm(
        currentGrievance
    );

    await loadAttachments(currentDocumentId);

    refreshButtons();

}

/*==========================================================
 BUTTON EVENTS
==========================================================*/

function registerButtonEvents() {

    document.getElementById("btnNew")?.addEventListener("click", clearForm);

    document.getElementById("btnSave")?.addEventListener("click", saveGrievance);

    document.getElementById("btnUpdate")?.addEventListener("click", updateGrievance);

    document.getElementById("btnDelete")?.addEventListener("click", confirmDelete);

    document.getElementById("btnRegister")?.addEventListener("click", openRegister);

    document.getElementById("btnDashboard")?.addEventListener("click", openDashboard);

    document.getElementById("btnPrint")?.addEventListener("click", printGrievance);
<<<<<<< HEAD
    document.getElementById("btnWhatsApp")?.addEventListener("click", async function () {
        await window.FMSWhatsAppService?.compose({
            module:"CPGRAMS",
            title:"CPGRAMS Grievance Message",
            defaultMessage:`CPGRAMS Update
Grievance No: ${document.getElementById("grievanceNumber")?.value||""}
Subject: ${document.getElementById("subject")?.value||""}
Status: ${document.getElementById("currentStatus")?.value||document.getElementById("finalStatus")?.value||""}

Please type or edit your custom message.`,
            message:(m,t)=>showMessage(t||"info",m)
        });
    });

=======

>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604
    document.getElementById("btnHome")?.addEventListener("click", goHome);

}

/*==========================================================
 FIELD EVENTS
==========================================================*/

function registerFieldEvents() {

    document.getElementById("district")
        ?.addEventListener("change", districtChanged);

    document.getElementById("mandal")
        ?.addEventListener("change", mandalChanged);

    document.querySelectorAll(
        "#cpgramsForm input,#cpgramsForm textarea,#cpgramsForm select"
    ).forEach(control => {

        control.addEventListener("input", markDirty);

    });
<<<<<<< HEAD

    // Validate the Grievance Number as soon as the user leaves the field.
    // Save/Update also performs the final duplicate check.
    document.getElementById("grievanceNumber")?.addEventListener("blur", async function () {
        const value = this.value.trim();
        this.classList.remove("is-invalid", "is-valid");
        if (!value) return;
        try {
            const duplicate = await checkDuplicateGrievanceNumber(
                value,
                editMode ? currentDocumentId : null
            );
            if (duplicate) {
                this.classList.add("is-invalid");
                showMessage("warning", "This Grievance Number already exists. Please enter a unique Grievance Number.");
            } else {
                this.classList.add("is-valid");
            }
        } catch (error) {
            console.error("Grievance Number validation failed:", error);
            showMessage("danger", "Unable to validate the Grievance Number. Please try again before saving.");
        }
    });
=======
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604

}

/*==========================================================
 LOAD MASTER DATA
==========================================================*/

async function loadMasterData() {

    try {

        await loadDistricts();

        await loadPriorities();

        loadOfficers(
            "assignedOfficer"
        );

        loadSections(
            "section"
        );

    }
    catch (error) {

        console.error(error);

    }

}
/*==========================================================
 FORM HELPERS
==========================================================*/

function getControl(id) {

    return document.getElementById(id);

}

function getControlValue(id) {

    const control = getControl(id);

    return control
        ? control.value.trim()
        : "";

}

function setControlValue(id, value) {

    const control = getControl(id);

    if (control)
        control.value = value ?? "";

}

function clearDropdown(id, caption = "Select") {

    const ddl = getControl(id);

    if (!ddl)
        return;

    ddl.innerHTML =
        `<option value="">${caption}</option>`;

}

/*==========================================================
 MARK FORM DIRTY
==========================================================*/

function markDirty() {

    formDirty = true;

}

/*==========================================================
 RESET EDIT MODE
==========================================================*/

function resetEditMode() {

    currentDocumentId = null;

    currentGrievance = null;

    editMode = false;

    formDirty = false;

}

/*==========================================================
 GENERATE GRIEVANCE ID
==========================================================*/

function generateGrievanceId() {

    const now = new Date();

    const id =
        "CPG-" +
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") +
        "-" +
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0") +
<<<<<<< HEAD
        String(now.getSeconds()).padStart(2, "0") +
        String(now.getMilliseconds()).padStart(3, "0");
=======
        String(now.getSeconds()).padStart(2, "0");
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604

    setControlValue(
        "grievanceId",
        id
    );

}

/*==========================================================
ENABLE EDIT MODE
==========================================================*/

function enableEditing() {

    document
        .querySelectorAll(
            "#cpgramsForm input, #cpgramsForm textarea, #cpgramsForm select"
        )
        .forEach(control => {

            control.disabled = false;

        });

    getControl("btnSave").style.display = "";

    getControl("btnUpdate").style.display = "";

    getControl("btnDelete").style.display = "";

}

editRecord()

/*==========================================================
 CLEAR FORM
==========================================================*/

function clearForm() {

    const form =
        getControl("cpgramsForm");

    if (form)
        form.reset();

    resetEditMode();

    enableEditing();

    refreshButtons();

    generateGrievanceId();

    calculateDueDateFromDisplay("");

    clearMessage?.();

    attachmentList = [];

    renderAttachments();

    getControl(
        "grievanceNumber"
    )?.focus();

}

/*==========================================================
 POPULATE FORM
==========================================================*/

function populateForm(grievance) {

    if (!grievance)
        return;

    Object.keys(grievance)
        .forEach(key => {

            const control =
                getControl(key);

            if (control) {

                control.value =
                    grievance[key] ?? "";

            }

        });

    calculateDueDateFromDisplay("");

<<<<<<< HEAD
    if (window.FMSOfficeProcessing) {
        window.FMSOfficeProcessing.populateOfficeProcessing(grievance);
    }

=======
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604
    attachmentList =
    grievance.attachments || [];

    renderAttachments();
}

/*==========================================================
READ ONLY MODE
==========================================================*/

function makeReadOnly() {

    document
        .querySelectorAll(
            "#cpgramsForm input, #cpgramsForm textarea, #cpgramsForm select"
        )
        .forEach(control => {

            control.disabled = true;

        });

    getControl("btnSave").style.display = "none";
    getControl("btnUpdate").style.display = "none";
    getControl("btnDelete").style.display = "none";

}

/*==========================================================
 CALCULATE DUE DATE
==========================================================*/

function calculateDueDate() {

    const receivedControl =
        document.getElementById("dateReceived");

    const dueControl =
        document.getElementById("dueDate");

    if (!receivedControl || !dueControl)
        return;

    if (!receivedControl.value) {

        dueControl.value = "";

        return;
    }

    const dueDate = new Date(receivedControl.value);

    // CPGRAMS = 21 days
    dueDate.setDate(dueDate.getDate() + 21);

    const yyyy = dueDate.getFullYear();

    const mm = String(dueDate.getMonth() + 1)
        .padStart(2, "0");

    const dd = String(dueDate.getDate())
        .padStart(2, "0");

    dueControl.value = `${yyyy}-${mm}-${dd}`;

    console.log(
        "Due Date Calculated:",
        dueControl.value
    );

}

/*==========================================================
 DISTRICT CHANGED
==========================================================*/

async function districtChanged() {

    const district =
        getControlValue(
            "district"
        );

    clearDropdown(
        "mandal",
        "Select Mandal"
    );

    clearDropdown(
        "village",
        "Select Village"
    );

    if (!district)
        return;

    await loadMandals(
        district
    );

}

/*==========================================================
 MANDAL CHANGED
==========================================================*/

async function mandalChanged() {

    const district =
        getControlValue(
            "district"
        );

    const mandal =
        getControlValue(
            "mandal"
        );

    clearDropdown(
        "village",
        "Select Village"
    );

    if (
        !district ||
        !mandal
    )
        return;

    await loadVillages(
        district,
        mandal
    );

}

/*==========================================================
 HYBRID VALUE
==========================================================*/

function getHybridValue(
    dropdownId,
    manualId
) {

    const manual =
        getControlValue(
            manualId
        );

    if (manual !== "")
        return manual;

    return getControlValue(
        dropdownId
    );

}

/*==========================================================
 BUILD OBJECT
==========================================================*/

function buildGrievanceObject() {

    const grievance = {};

    document
        .querySelectorAll(
            "#cpgramsForm input,#cpgramsForm select,#cpgramsForm textarea"
        )
        .forEach(control => {

            grievance[
                control.id
            ] = control.value.trim();

        });

    grievance.district =
        getHybridValue(
            "district",
            "districtManual"
        );

    grievance.mandal =
        getHybridValue(
            "mandal",
            "mandalManual"
        );

    grievance.village =
        getHybridValue(
            "village",
            "villageManual"
        );

<<<<<<< HEAD
    grievance.grievanceNumberNormalized = String(grievance.grievanceNumber || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");

=======
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604
    grievance.updatedOn =
        new Date();

    grievance.version =
<<<<<<< HEAD
        "5.2";
=======
        "5.1";
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604

    return grievance;

}
/*==========================================================
 VALIDATION
==========================================================*/

function validateForm() {

    clearMessage?.();

    const requiredFields = [

        ["grievanceNumber", "Grievance Number"],
        ["dateReceived", "Date Received"],
        ["complainantName", "Complainant Name"],
        ["subject", "Subject"],
        ["grievanceDescription", "Grievance Description"]

    ];

    for (const field of requiredFields) {

        const control = getControl(field[0]);

        if (!control)
            continue;

        if (control.value.trim() === "") {

            showMessage(
                "warning",
                field[1] + " is required."
            );

            control.focus();

            return false;

        }

    }

    if (!validateMobile())
        return false;

    return true;

}

/*==========================================================
 MOBILE VALIDATION
==========================================================*/

function validateMobile() {

    const mobile =
        getControlValue("mobileNumber");

    if (mobile === "")
        return true;

    if (!/^[0-9]{10}$/.test(mobile)) {

        showMessage(
            "warning",
            "Mobile Number should contain exactly 10 digits."
        );

        getControl("mobileNumber").focus();

        return false;

    }

    return true;

}

/*==========================================================
 DUPLICATE CHECK
==========================================================*/

async function validateDuplicate() {

    const grievanceNumber =
        getControlValue(
            "grievanceNumber"
        );

    if (!grievanceNumber)
        return true;

    const exists =
        await checkDuplicateGrievanceNumber(
<<<<<<< HEAD
            grievanceNumber,
            editMode ? currentDocumentId : null
        );

    if (exists) {
=======
            grievanceNumber
        );

    if (
        exists &&
        !editMode
    ) {
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604

        showMessage(
            "warning",
            "Grievance Number already exists."
        );

        getControl(
            "grievanceNumber"
        ).focus();

        return false;

    }

    return true;

}

/*==========================================================
 SAVE
==========================================================*/

async function saveGrievance() {

    console.log("Save button clicked");

    try {

        if (!validateForm())
            return;

        if (!await validateDuplicate())
            return;

        showLoading?.();

        let grievance = buildGrievanceObject();

        grievance.createdOn = new Date();

        console.log("Saving...", grievance);

        const result = await saveGrievanceToDatabase(grievance);

        hideLoading?.();

        console.log("Firestore returned", result);

        if (!result.success) {

            showMessage?.(
                "danger",
                result.message || "Unable to save."
            );

            return;

        }

        currentDocumentId = result.data.id;

        editMode = true;

        formDirty = false;

        refreshButtons();

        console.log("Saved Successfully");

        if (typeof showMessage === "function") {

            showMessage(
                "success",
                "Grievance saved successfully."
            );

        } else {

            alert("Grievance saved successfully.");

        }

    }
    catch (error) {

        hideLoading?.();

        console.error(error);

        alert(error.message);

    }

}

/*==========================================================
 UPDATE
==========================================================*/

async function updateGrievance() {

console.log("Before update currentDocumentId:", currentDocumentId);    

    try {

        if (!currentDocumentId) {

            showMessage(
                "warning",
                "Please open a grievance before updating."
            );

            return;

        }

        if (!validateForm())
            return;

<<<<<<< HEAD
        if (!await validateDuplicate())
            return;

        showLoading?.();

        let grievance =
            buildGrievanceObject();

        const result =
            await updateGrievanceToDatabase(
                currentDocumentId,
                grievance
            );

=======
        showLoading?.();

        let grievance =
            buildGrievanceObject();

        const result =
            await updateGrievanceToDatabase(
                currentDocumentId,
                grievance
            );

>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604
        hideLoading?.();

        if (!result.success) {

            showMessage(
                "danger",
                result.message
            );

            return;

        }

        formDirty = false;

        showMessage(
            "success",
            "Grievance updated successfully."
        );

        sessionStorage.removeItem(
    "selectedGrievance"
);
    }
    catch (error) {

        hideLoading?.();

        console.error(error);

        showMessage(
            "danger",
            error.message
        );

    }

}

/*==========================================================
 DELETE
==========================================================*/

async function deleteGrievance() {

    try {

        if (!currentDocumentId) {

            showMessage(
                "warning",
                "No grievance selected."
            );

            return;

        }

        showLoading?.();

        const result =
            await deleteGrievanceFromDatabase(
                currentDocumentId
            );

        hideLoading?.();

        if (!result.success) {

            showMessage(
                "danger",
                result.message
            );

            return;

        }

        showMessage(
            "success",
            "Grievance deleted successfully."
        );

        clearForm();

        refreshButtons();

    }
    catch (error) {

        hideLoading?.();

        console.error(error);

        showMessage(
            "danger",
            error.message
        );

    }

}

/*==========================================================
 DELETE CONFIRMATION
==========================================================*/

function confirmDelete() {

    if (!currentDocumentId) {

        showMessage(
            "warning",
            "No grievance selected."
        );

        return;

    }

    if (
        !confirm(
            "Are you sure you want to delete this grievance?"
        )
    ) {

        return;

    }

    deleteGrievance();

}
/*==========================================================
 NAVIGATION
==========================================================*/

function openRegister() {

    if (checkUnsavedChanges())
        return;

    window.location.href =
        "cpgrams-register.html";

}

function openDashboard() {

    if (checkUnsavedChanges())
        return;

    window.location.href =
<<<<<<< HEAD
        "../../pages/module-dashboard.html?module=cpgrams";
=======
        "../../pages/dashboard.html";
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604

}

function goHome() {

    if (checkUnsavedChanges())
        return;

    window.location.href =
<<<<<<< HEAD
        "../../pages/module-dashboard.html?module=cpgrams";
=======
        "../../index.html";
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604

}

/*==========================================================
 PRINT
==========================================================*/

function printGrievance() {

    window.print();

}

/*==========================================================
 LOAD RECORD FROM DATABASE
==========================================================*/

async function loadGrievance(documentId) {

    try {

        showLoading?.();

        const result =
            await getGrievance(documentId);

        hideLoading?.();

        if (!result.success) {

            showMessage(
                "danger",
                result.message
            );

            return;

        }

        currentDocumentId =
            documentId;

        currentGrievance =
            result.data;

        editMode = true;

        populateForm(result.data);

    }
    catch (error) {

        hideLoading?.();

        console.error(error);

        showMessage(
            "danger",
            error.message
        );

    }

}

/*==========================================================
 UNSAVED CHANGES
==========================================================*/

function checkUnsavedChanges() {

    if (!formDirty)
        return false;

    return !confirm(
        "You have unsaved changes. Continue?"
    );

}

window.addEventListener(
    "beforeunload",
    function (event) {

        if (!formDirty)
            return;

        event.preventDefault();

        event.returnValue = "";

    }
);

/*==========================================================
 ENABLE / DISABLE BUTTONS
==========================================================*/

function refreshButtons() {

    const saveButton =
        getControl("btnSave");

    const updateButton =
        getControl("btnUpdate");

    const deleteButton =
        getControl("btnDelete");

    if (editMode) {

        if (saveButton)
            saveButton.disabled = true;

        if (updateButton)
            updateButton.disabled = false;

        if (deleteButton)
            deleteButton.disabled = false;

    }
    else {

        if (saveButton)
            saveButton.disabled = false;

        if (updateButton)
            updateButton.disabled = true;

        if (deleteButton)
            deleteButton.disabled = true;

    }

}

/*==========================================================
 MESSAGE HELPERS
==========================================================*/

function showSuccess(message) {

    showMessage?.(
        "success",
        message
    );

}

function showWarning(message) {

    showMessage?.(
        "warning",
        message
    );

}

function showError(message) {

    showMessage?.(
        "danger",
        message
    );

}

/*==========================================================
 DEVELOPMENT LOGGER
==========================================================*/

function log(...args) {
    console.log(...args);
}

/*==========================================================
 INITIAL BUTTON STATE
==========================================================*/

document.addEventListener(
    "DOMContentLoaded",
    function () {

        refreshButtons();

    }
);

/* ============================================================
   DATE RECEIVED CALENDAR PICKER
   ============================================================ */

function initializeDateReceivedPicker() {

    const dateInput =
        document.getElementById("dateReceived");

    const picker =
        document.getElementById("dateReceivedPicker");

    const button =
        document.getElementById(
            "dateReceivedPickerButton"
        );

    if (!dateInput || !picker || !button) {

        console.warn(
            "Date Received picker controls not found."
        );

        return;
    }


    /* ---------------------------------------------------------
       OPEN CALENDAR
       --------------------------------------------------------- */

    button.addEventListener("click", function () {

        /*
         * If current value is DD/MM/YYYY,
         * convert it to YYYY-MM-DD.
         */

        const value =
            dateInput.value.trim();

        if (
            /^\d{2}\/\d{2}\/\d{4}$/.test(value)
        ) {

            const parts =
                value.split("/");

            const dd = parts[0];
            const mm = parts[1];
            const yyyy = parts[2];

            picker.value =
                `${yyyy}-${mm}-${dd}`;
        }

        /*
         * Make the native date picker visible temporarily.
         * This is more reliable in Edge.
         */

        picker.style.position = "fixed";
        picker.style.left = "50%";
        picker.style.top = "50%";
        picker.style.width = "1px";
        picker.style.height = "1px";
        picker.style.opacity = "0.01";
        picker.style.zIndex = "99999";
        picker.style.pointerEvents = "auto";


        try {

            if (
                typeof picker.showPicker ===
                "function"
            ) {

                picker.showPicker();

            } else {

                picker.click();
            }

        } catch (error) {

            console.error(
                "Calendar open error:",
                error
            );

            picker.click();
        }
    });


    /* ---------------------------------------------------------
       DATE SELECTED
       --------------------------------------------------------- */

    picker.addEventListener(
        "change",
        function () {

            if (!this.value) {
                return;
            }

            const parts =
                this.value.split("-");

            const yyyy = parts[0];
            const mm = parts[1];
            const dd = parts[2];


            /*
             * Display DD/MM/YYYY
             */

            dateInput.value =
                `${dd}/${mm}/${yyyy}`;


            /*
             * Calculate Due Date
             */

            calculateDueDateFromDisplay(
                dateInput.value
            );


            /*
             * Hide picker again
             */

            this.style.position =
                "absolute";

            this.style.left =
                "-9999px";

            this.style.width =
                "1px";

            this.style.height =
                "1px";

            this.style.opacity =
                "0";

            this.style.pointerEvents =
                "none";
        }
    );


    /* ---------------------------------------------------------
       MANUAL ENTRY
       --------------------------------------------------------- */

    dateInput.addEventListener(
        "change",
        function () {

            const value =
                this.value.trim();

            if (!value) {
                return;
            }

            if (
                !/^\d{2}\/\d{2}\/\d{4}$/.test(value)
            ) {

                alert(
                    "Please enter Date Received in DD/MM/YYYY format."
                );

                this.value = "";

                return;
            }

            calculateDueDateFromDisplay(
                value
            );
        }
    );

}


/* ============================================================
   CALCULATE CPGRAMS DUE DATE
   ============================================================ */

function calculateDueDateFromDisplay(
    dateValue
) {

    if (!dateValue) {
        return;
    }


    const parts =
        dateValue.split("/");


    if (parts.length !== 3) {
        return;
    }


    const dd =
        parseInt(parts[0], 10);

    const mm =
        parseInt(parts[1], 10);

    const yyyy =
        parseInt(parts[2], 10);


    const receivedDate =
        new Date(
            yyyy,
            mm - 1,
            dd
        );


    if (
        isNaN(
            receivedDate.getTime()
        )
    ) {
        return;
    }


    /* CPGRAMS = 21 days */

    receivedDate.setDate(
        receivedDate.getDate() + 21
    );


    const dueDD =
        String(
            receivedDate.getDate()
        ).padStart(2, "0");

    const dueMM =
        String(
            receivedDate.getMonth() + 1
        ).padStart(2, "0");

    const dueYYYY =
        receivedDate.getFullYear();


    const dueDate =
        document.getElementById(
            "dueDate"
        );


    if (dueDate) {

        dueDate.value =
            `${dueDD}/${dueMM}/${dueYYYY}`;
    }


    console.log(
        "Date Received:",
        dateValue
    );

    console.log(
        "Due Date:",
        dueDate
            ? dueDate.value
            : ""
    );
}


/* ============================================================
   START
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeDateReceivedPicker();

    }
);