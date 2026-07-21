/******************************************************************************
 * Initialize CPGRAMS
 ******************************************************************************/

document.addEventListener("DOMContentLoaded", initializeCPGRAMS);

const CPGRAMS_DUE_DAYS = 21;
let currentRecordId = null;

function initializeCPGRAMS() {

    generateFileNumber();

    setDefaultDates();

    loadMasterData();

    registerEvents();

    clearValidation();

    loadRecordFromURL();

}

/******************************************************************************
 * Load Record From URL
 ******************************************************************************/

function loadRecordFromURL() {

    const params = new URLSearchParams(window.location.search);

    const id = params.get("id");

    if (!id)
        return;

    const record = getRecordById(Number(id));

    if (!record)
        return;

    loadRecord(record);

}


/*===========================================================================
    Register Events
===========================================================================*/

function registerEvents() {

    // Date Received Change
    document
        .getElementById("dateReceived")
        .addEventListener("change", calculateDueDate);

    // District -> Mandal
    document
        .getElementById("district")
        .addEventListener("change", districtChanged);

    // Mandal -> Village
    document
        .getElementById("mandal")
        .addEventListener("change", mandalChanged);

    // Buttons
    document
        .getElementById("btnSave")
        .addEventListener("click", saveRecord);

    document
        .getElementById("btnUpdate")
        .addEventListener("click", updateRecord);

    document
        .getElementById("btnDelete")
        .addEventListener("click", deleteRecord);

    document
        .getElementById("btnClear")
        .addEventListener("click", clearForm);

}

/*===========================================================================
    District Changed
===========================================================================*/

function districtChanged() {

    const district =
        document.getElementById("district").value;

    loadMandals(district);

    // Clear village list
    clearVillageDropdown();

}

/*===========================================================================
    Mandal Changed
===========================================================================*/

function mandalChanged() {

    const district =
        document.getElementById("district").value;

    const mandal =
        document.getElementById("mandal").value;

    loadVillages(district, mandal);

}

/*===========================================================================
    Clear Village Dropdown
===========================================================================*/

function clearVillageDropdown() {

    const village =
        document.getElementById("village");

    village.innerHTML =
        '<option value="">-- Select Village --</option>';

}

/*===========================================================================
    Clear Form
===========================================================================*/

function clearForm() {

    if (!confirm("Clear all entered data?"))
        return;

    document
        .getElementById("cpgramsForm")
        .reset();

    currentRecordId = null;

    generateFileNumber();

    setDefaultDates();

    loadMasterData();

    clearValidation();

}

/*===========================================================================
    Form Validation
===========================================================================*/

function validateForm() {

    clearValidation();

    let valid = true;

    if (isBlank("grievanceNumber"))
        valid = false;

    if (isBlank("complainantName"))
        valid = false;

    if (isBlank("district"))
        valid = false;

    if (isBlank("subject"))
        valid = false;

    if (isBlank("category"))
        valid = false;

    if (isBlank("description"))
        valid = false;

    if (isBlank("assignedOfficer"))
        valid = false;

    if (!valid) {

        alert("Please fill all mandatory fields.");

    }

    return valid;

}

/*===========================================================================
    Clear Validation
===========================================================================*/

function clearValidation() {

    document
        .querySelectorAll(".is-invalid")
        .forEach(control => {

            control.classList.remove("is-invalid");

        });

}

/*===========================================================================
    Check Blank Field
===========================================================================*/

function isBlank(id) {

    const control =
        document.getElementById(id);

    if (!control)
        return false;

    if (control.value.trim() === "") {

        control.classList.add("is-invalid");

        return true;

    }

    return false;

}

/******************************************************************************
 * Load Record Into Form
 ******************************************************************************/

function loadRecord(record) {

    if (!record) return;

    currentRecordId = record.id;

    setValue("fileNumber", record.fileNumber);
    setValue("grievanceNumber", record.grievanceNumber);
    setValue("dateReceived", record.dateReceived);
    setValue("dueDate", record.dueDate);
    setValue("priority", record.priority);
    setValue("status", record.status);

    setValue("complainantName", record.complainantName);
    setValue("mobileNumber", record.mobileNumber);
    setValue("email", record.email);
    setValue("district", record.district);

    // Populate Mandals after District
    if (typeof districtChanged === "function") {
        districtChanged();
    }

    setValue("mandal", record.mandal);

    // Populate Villages after Mandal
    if (typeof mandalChanged === "function") {
        mandalChanged();
    }

    setValue("village", record.village);

    setValue("address", record.address);
    setValue("aadhaarNumber", record.aadhaarNumber);
    setValue("gender", record.gender);
    setValue("occupation", record.occupation);
    setValue("preferredContact", record.preferredContact);

    setValue("subject", record.subject);
    setValue("category", record.category);
    setValue("description", record.description);
    setValue("source", record.source);
    setValue("natureOfGrievance", record.natureOfGrievance);
    setValue("priorityClassification", record.priorityClassification);
    setValue("attachmentCount", record.attachmentCount);

    setValue("assignedOfficer", record.assignedOfficer);
    setValue("section", record.section);
    setValue("fileLocation", record.fileLocation);
    setValue("dateAssigned", record.dateAssigned);
    setValue("atrReceived", record.atrReceived);
    setValue("atrDate", record.atrDate);
    setValue("atrDueDate", record.atrDueDate);
    setValue("finalStatus", record.finalStatus);
    setValue("disposedDate", record.disposedDate);
    setValue("fileClosed", record.fileClosed);
    setValue("remarks", record.remarks);

    if (typeof calculateDueDate === "function") {
        calculateDueDate();
    }

    if (typeof updateButtonState === "function") {
        updateButtonState(true);
    }

}

/*===========================================================================
    Set Control Value
===========================================================================*/

function setValue(id, value) {

    const control = document.getElementById(id);

    if (!control)
        return;

    control.value = value || "";

}

/*===========================================================================
    Button State
===========================================================================*/

function updateButtonState(editMode) {

    document.getElementById("btnSave").disabled = editMode;

    document.getElementById("btnUpdate").disabled = !editMode;

    document.getElementById("btnDelete").disabled = !editMode;

}

/*===========================================================================
    New Record Mode
===========================================================================*/

function newRecord() {

    currentRecordId = null;

    clearForm();

    updateButtonState(false);

}

/*===========================================================================
    Read Complete Form
===========================================================================*/

function getFormData() {

    return {

        id: currentRecordId,

        // File Information
        fileNumber: value("fileNumber"),
        grievanceNumber: value("grievanceNumber"),
        dateReceived: value("dateReceived"),
        dueDate: value("dueDate"),
        priority: value("priority"),
        status: value("status"),

        // Complainant
        complainantName: value("complainantName"),
        mobileNumber: value("mobileNumber"),
        email: value("email"),
        address: value("address"),
        district: value("district"),
        mandal: value("mandal"),
        village: value("village"),
        aadhaarNumber: value("aadhaarNumber"),
        gender: value("gender"),
        occupation: value("occupation"),
        preferredContact: value("preferredContact"),

        // Grievance
        subject: value("subject"),
        category: value("category"),
        description: value("description"),
        source: value("source"),
        natureOfGrievance: value("natureOfGrievance"),
        priorityClassification: value("priorityClassification"),
        attachmentCount: value("attachmentCount"),

        // Office
        assignedOfficer: value("assignedOfficer"),
        section: value("section"),
        fileLocation: value("fileLocation"),
        dateAssigned: value("dateAssigned"),
        atrReceived: value("atrReceived"),
        atrDate: value("atrDate"),
        atrDueDate: value("atrDueDate"),
        finalStatus: value("finalStatus"),
        disposedDate: value("disposedDate"),
        fileClosed: value("fileClosed"),
        remarks: value("remarks")

    };

}

/*===========================================================================
    Read Control Value
===========================================================================*/

function value(id) {

    const control = document.getElementById(id);

    return control ? control.value.trim() : "";

}

/*===========================================================================
    End of File
===========================================================================*/