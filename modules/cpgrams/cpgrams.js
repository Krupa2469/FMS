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
let suppressUnsavedNavigationWarning = true;

function stopFormButtonNavigation(event) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
}


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

async function checkDuplicateGrievanceNumber(grievanceNumber, excludeId = null) {

    return await grievanceExists(grievanceNumber, excludeId);

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

        console.log("GRIEVANCES Version 5.3 Initializing...");

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

    const bindToolbarButton = (id, handler) => {
        const button = document.getElementById(id);
        if (!button) return;
        button.setAttribute("type", "button");
        button.addEventListener("click", function (event) {
            stopFormButtonNavigation(event);
            handler(event);
        });
    };

    bindToolbarButton("btnNew", clearForm);
    bindToolbarButton("btnSave", saveGrievance);
    bindToolbarButton("btnUpdate", updateGrievance);
    bindToolbarButton("btnDelete", confirmDelete);
    bindToolbarButton("btnRegister", openRegister);
    bindToolbarButton("btnDashboard", openDashboard);
    bindToolbarButton("btnPrint", printGrievance);
    bindToolbarButton("btnHome", goHome);

    const form = document.getElementById("cpgramsForm");
    if (form && !form.dataset.submitGuardBound) {
        form.dataset.submitGuardBound = "1";
        form.addEventListener("submit", function (event) {
            event.preventDefault();
        });
    }

    bindToolbarButton("btnWhatsApp", async function () {
        await window.FMSWhatsAppService?.compose({
            module:"GRIEVANCES",
            title:"Grievance Message",
            defaultMessage:`Grievance Update
Reference: ${document.getElementById("grievanceNumber")?.value || ((document.getElementById("questionType")?.value||"") + (document.getElementById("questionSerialNo")?.value ? " #"+document.getElementById("questionSerialNo").value : ""))}
Subject / Question: ${document.getElementById("subject")?.value||document.getElementById("question")?.value||""}
Status: ${document.getElementById("currentStatus")?.value||document.getElementById("questionFileStatus")?.value||document.getElementById("finalStatus")?.value||""}

Please type or edit your custom message.`,
            message:(m,t)=>showMessage(t||"info",m)
        });
    });

}

/*==========================================================
 FIELD EVENTS
==========================================================*/

function registerFieldEvents() {

    document.getElementById("grievanceType")
        ?.addEventListener("change", function () {
            updateGrievanceFormLayout();
            markDirty();
        });

    document.getElementById("questionType")
        ?.addEventListener("change", function () {
            const type = this.value || "LAQ";
            const grievanceType = document.getElementById("grievanceType");
            if (grievanceType) grievanceType.value = type;
            updateGrievanceFormLayout();
            window.FMSGrievanceWorkspace?.syncContext?.();
            markDirty();
        });

    document.getElementById("district")
        ?.addEventListener("change", districtChanged);

    document.getElementById("mandal")
        ?.addEventListener("change", mandalChanged);

    document.querySelectorAll(
        "#cpgramsForm input,#cpgramsForm textarea,#cpgramsForm select"
    ).forEach(control => {

        control.addEventListener("input", markDirty);

    });

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

}

/*==========================================================
 LOAD MASTER DATA
==========================================================*/

async function loadMasterData() {

    try {

        await loadDistricts();

        loadOfficers(
            "assignedOfficer"
        );

        loadOfficers(
            "answerFurnishedBy"
        );

        await loadSections(
            "section"
        );

        await loadSections(
            "questionConcernedSection"
        );

    }
    catch (error) {

        console.error(error);

    }

}
/*==========================================================
 DYNAMIC GRIEVANCE TYPE FORM
==========================================================*/

const QUESTION_GRIEVANCE_TYPES = new Set(["LAQ", "LCQ"]);

function isCPGRAMSType(type = getSelectedGrievanceType()) {
    const v = String(type || "").trim().toUpperCase();
    return v === "CPGRAMS" || v === "GRIEVANCES"; // legacy GRIEVANCES records remain compatible
}

function getSelectedGrievanceType() {
    return String(getControlValue("grievanceType") || "").trim();
}

function isQuestionGrievanceType(type = getSelectedGrievanceType()) {
    return QUESTION_GRIEVANCE_TYPES.has(String(type || "").toUpperCase());
}

function updateGrievanceFormLayout() {
    const type = getSelectedGrievanceType();
    const normalized = type.toUpperCase();
    const hasType = Boolean(normalized);
    const questionMode = hasType && isQuestionGrievanceType(normalized);
    const cpgramsMode = isCPGRAMSType(normalized);
    const prajavaniMode = normalized === "PRAJAVANI";
    const otherMode = hasType && !questionMode && !cpgramsMode;

    getControl("standardSection1Card")?.classList.toggle("d-none", !hasType || questionMode);
    getControl("questionEntryCard")?.classList.toggle("d-none", !questionMode);
    getControl("sharedSection2Card")?.classList.toggle("d-none", !hasType || questionMode);
    getControl("sharedSection3Card")?.classList.toggle("d-none", !hasType || questionMode);
    getControl("workflowClosureCard")?.classList.toggle("d-none", !hasType || questionMode);
    getControl("sharedSection4Card")?.classList.toggle("d-none", !hasType);

    document.querySelectorAll(".grievances-only-field").forEach(function (el) {
        el.classList.toggle("d-none", !cpgramsMode);
    });
    document.querySelectorAll(".cpgrams-workflow-field").forEach(function (el) {
        el.classList.toggle("d-none", !cpgramsMode);
    });
    document.querySelectorAll(".other-grievance-workflow-field").forEach(function (el) {
        el.classList.toggle("d-none", !otherMode);
    });
    document.querySelectorAll(".prajavani-workflow-field").forEach(function (el) {
        el.classList.toggle("d-none", !prajavaniMode);
    });

    const due = getControl("dueDate");
    if (due) {
        due.readOnly = !questionMode;
        due.placeholder = questionMode ? "" : "Auto calculated";
    }

    if (questionMode) {
        const q = getControl("questionType");
        if (q && q.value !== normalized) q.value = normalized;
        const numberLabel = getControl("questionNumberLabel");
        if (numberLabel) numberLabel.innerHTML = `${normalized} No. <span class="text-danger">*</span>`;
        const numberInput = getControl("questionSerialNo");
        if (numberInput) {
            numberInput.setAttribute("aria-label", `${normalized} No.`);
            numberInput.placeholder = `Enter ${normalized} No.`;
        }
    }

    const label = getControl("selectedGrievanceFormLabel");
    if (label) {
        label.textContent = !hasType
            ? "Select a Grievance Type to load the Data Entry Form"
            : questionMode
                ? `${normalized} Question Data Entry Form`
                : `${type} Workflow Data Entry Form`;
    }

    const section4Title = getControl("section4Title");
    if (section4Title) {
        section4Title.textContent = questionMode ? "UPLOAD DOCUMENT" : "SECTION 5 : ATTACHMENTS";
    }

    if (hasType && !questionMode && getControlValue("dateReceived")) {
        calculateDueDateFromDisplay(getControlValue("dateReceived"));
    }
    updateWorkflowStagePreview();
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
        "GRV-" +
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") +
        "-" +
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0") +
        String(now.getSeconds()).padStart(2, "0") +
        String(now.getMilliseconds()).padStart(3, "0");

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

    updateGrievanceFormLayout();

    clearMessage?.();

    attachmentList = [];

    renderAttachments();

    getControl(
        "grievanceType"
    )?.focus();

}

/*==========================================================
 POPULATE FORM
==========================================================*/

function populateForm(grievance) {

    if (!grievance)
        return;

    if (!grievance.grievanceType) {
        const legacyQuestionType = String(grievance.questionType || "").toUpperCase();
        grievance.grievanceType = QUESTION_GRIEVANCE_TYPES.has(legacyQuestionType) ? legacyQuestionType : "CPGRAMS";
    }
    if (String(grievance.grievanceType).toUpperCase() === "GRIEVANCES") {
        grievance.grievanceType = "CPGRAMS";
    }

    Object.keys(grievance)
        .forEach(key => {

            const control =
                getControl(key);

            if (control) {

                control.value =
                    grievance[key] ?? "";

            }

        });

    if (isQuestionGrievanceType(grievance.grievanceType) && !getControlValue("questionType")) {
        setControlValue("questionType", String(grievance.grievanceType || "").toUpperCase());
    }

    updateGrievanceFormLayout();
    window.FMSGrievanceWorkspace?.syncContext?.();

    if (isCPGRAMSType(getSelectedGrievanceType()) && grievance.dateReceived) {
        calculateDueDateFromDisplay(String(grievance.dateReceived));
    }

    if (window.FMSOfficeProcessing) {
        window.FMSOfficeProcessing.populateOfficeProcessing(grievance);
    }

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
        .querySelectorAll("#cpgramsForm input,#cpgramsForm select,#cpgramsForm textarea")
        .forEach(control => {
            if (!control.id) return;
            if (control.type === "file") {
                if (control.files && control.files[0]) grievance[control.id + "Name"] = control.files[0].name;
                return;
            }
            grievance[control.id] = String(control.value || "").trim();
        });

    grievance.grievanceType = getSelectedGrievanceType();
    const grievanceType = String(grievance.grievanceType || "").trim();
    const questionMode = isQuestionGrievanceType(grievanceType);

    if (questionMode) {
        grievance.grievanceType = String(grievance.questionType || grievanceType).toUpperCase();
        grievance.dateReceived = grievance.questionReceivedDate || "";
        grievance.subject = grievance.question || "";
        grievance.grievanceDescription = grievance.question || "";
        grievance.section = grievance.questionConcernedSection || "";
        grievance.assignedOfficer = grievance.answerFurnishedBy || "";
        grievance.officeLetterAddressedTo = grievance.answerFurnishedTo || "";
        grievance.officeCommunicationType = grievance.questionCommunicationType || "";
        grievance.fileNumber = grievance.questionFileNumber || "";
        grievance.officeStatus = grievance.questionFileStatus || "";
        grievance.currentStatus = grievance.questionFileStatus || "";
        grievance.grievanceNumber = "";
        grievance.dueDate = "";
        grievance.complainantName = "";
        grievance.category = "";
        grievance.natureOfGrievance = "";
        grievance.priorityClassification = "";
    } else if (!isCPGRAMSType(grievanceType)) {
        grievance.grievanceNumber = grievance.referenceMemoNo || grievance.grievanceNumber || "";
        grievance.category = "";
        grievance.natureOfGrievance = "";
        grievance.priorityClassification = "";
        grievance.attachmentCount = "";
    }

    grievance.district = getHybridValue("district", "districtManual");
    grievance.mandal = getHybridValue("mandal", "mandalManual");
    grievance.village = getHybridValue("village", "villageManual");

    if (questionMode) grievance.section = grievance.questionConcernedSection || "";

    if (!questionMode && grievance.dateReceived && !grievance.dueDate) {
        const dueDays = isCPGRAMSType(grievanceType) ? 21 : 21;
        grievance.dueDate = window.FMSRecordPolicy?.addDays?.(grievance.dateReceived, dueDays, "dmy") || grievance.dueDate;
    }

    const workflow = window.FMSRecordPolicy?.workflow?.("cpgrams", grievance) || {};
    grievance.workflowStage = workflow.stage || "Grievance Received";
    grievance.presentWorkflowStage = grievance.workflowStage;
    if (workflow.finalStatus && !grievance.finalStatus) grievance.finalStatus = workflow.finalStatus;
    grievance.daysStatus = workflow.dueLabel || "";

    grievance.grievanceNumberNormalized = String(grievance.grievanceNumber || grievance.registrationNumber || "")
        .trim().toUpperCase().replace(/\s+/g, "");
    grievance.updatedOn = new Date();
    grievance.version = "5.5";
    return grievance;
}
/*==========================================================
 VALIDATION
==========================================================*/

function validateForm() {
    clearMessage?.();
    const type = getSelectedGrievanceType();

    if (!type) {
        showMessage("warning", "Grievance Type is required.");
        getControl("grievanceType")?.focus();
        return false;
    }

    let requiredFields;
    if (isQuestionGrievanceType(type)) {
        requiredFields = [
            ["questionSerialNo", `${String(type || "LAQ").toUpperCase()} No.`],
            ["questionType", "Question Type"],
            ["questionReceivedDate", "Received Date"],
            ["questionConcernedSection", "Concerned Section"],
            ["question", "Question"]
        ];
    } else if (isCPGRAMSType(type)) {
        requiredFields = [
            ["grievanceNumber", "Registration / Grievance No."],
            ["dateReceived", "Date Received"],
            ["complainantName", "Complainant Name"],
            ["district", "District"],
            ["subject", "Subject"],
            ["grievanceDescription", "Grievance Description"]
        ];
    } else {
        requiredFields = [
            ["dateReceived", "Date Received"],
            ["subject", "Subject"],
            ["grievanceDescription", "Grievance Description"]
        ];
    }

    for (const field of requiredFields) {
        const control = getControl(field[0]);
        if (!control) continue;
        if (String(control.value || "").trim() === "") {
            showMessage("warning", field[1] + " is required.");
            control.focus();
            return false;
        }
    }

    if (!isQuestionGrievanceType(type) && !validateMobile()) return false;
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

    if (!isCPGRAMSType(getSelectedGrievanceType()))
        return true;

    const grievanceNumber =
        getControlValue(
            "grievanceNumber"
        );

    if (!grievanceNumber)
        return true;

    const exists =
        await checkDuplicateGrievanceNumber(
            grievanceNumber,
            editMode ? currentDocumentId : null
        );

    if (exists) {

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

async function saveGrievance(event) {

    stopFormButtonNavigation(event);

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
        window.FMSGrievanceWorkspace?.refresh?.();

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

async function updateGrievance(event) {

    stopFormButtonNavigation(event);

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

        hideLoading?.();

        if (!result.success) {

            showMessage(
                "danger",
                result.message
            );

            return;

        }

        formDirty = false;
        window.FMSGrievanceWorkspace?.refresh?.();

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
        window.FMSGrievanceWorkspace?.refresh?.();

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

function openRegister(event) {

    stopFormButtonNavigation(event);
    formDirty = false;

    const p = new URLSearchParams();
    const gt = getSelectedGrievanceType?.() || getControlValue("grievanceType") || "CPGRAMS";
    const fy = getControlValue("grievanceFinancialYear") || window.FMSRecordPolicy?.currentFY?.() || window.FMSFY?.getCurrentFY?.() || "";
    p.set("fullscreen", "1");
    if (gt) p.set("grievanceType", gt);
    if (fy) p.set("fy", fy);
    window.location.href = "cpgrams-register.html?" + p.toString();

}

function openDashboard() {
    document.getElementById("moduleDashboardPanel")?.scrollIntoView({behavior:"smooth",block:"start"});
}

function goHome(event) {
    stopFormButtonNavigation(event);
    formDirty = false;
    window.location.href = "../../index.html";
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

/*
 * The browser-native "Leave site?" prompt was disabled because it was
 * interrupting Save/Update and dashboard/register navigation. The app still
 * keeps formDirty for internal checks, but it no longer shows the confusing
 * native browser popup while users are saving or updating records.
 */
window.addEventListener(
    "beforeunload",
    function () {
        return;
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

function calculateDueDateFromDisplay(dateValue) {
    if (isQuestionGrievanceType(getSelectedGrievanceType())) return;
    if (!dateValue) return;
    const dueValue = window.FMSRecordPolicy?.addDays?.(dateValue, 21, "dmy");
    const dueDate = document.getElementById("dueDate");
    if (dueDate && dueValue) dueDate.value = dueValue;
    updateWorkflowStagePreview();
}




/* ============================================================
   WORKFLOW STAGE PREVIEW
   ============================================================ */
function updateWorkflowStagePreview() {
    const preview = getControl("workflowStagePreview");
    if (!preview || !window.FMSRecordPolicy) return;
    const data = {};
    document.querySelectorAll("#cpgramsForm input,#cpgramsForm select,#cpgramsForm textarea").forEach(control => {
        if (!control.id || control.type === "file") return;
        data[control.id] = String(control.value || "").trim();
    });
    data.grievanceType = getSelectedGrievanceType();
    const workflow = window.FMSRecordPolicy.workflow("cpgrams", data);
    preview.innerHTML = `Present Workflow Stage: <strong>${workflow.stage || "Grievance Received"}</strong>${workflow.dueLabel ? ` <span class="badge bg-secondary ms-2">${workflow.dueLabel}</span>` : ""}`;
}

document.addEventListener("DOMContentLoaded", function(){
    document.querySelectorAll("#cpgramsForm input,#cpgramsForm select,#cpgramsForm textarea").forEach(function(control){
        control.addEventListener("change", updateWorkflowStagePreview);
        control.addEventListener("input", updateWorkflowStagePreview);
    });
});

/* ============================================================
   START
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeDateReceivedPicker();

    }
);