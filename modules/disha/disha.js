/******************************************************************
 * FILE MANAGEMENT SYSTEM (FMS)
 *
 * Module    : DISHA
 * File      : disha.js
 * Version   : 2.0 - FIRESTORE
 * Developer : Lekha Technologies
 *
 * Storage:
 * Firebase Firestore
 *
 * Collection:
 * dishaMeetings
 ******************************************************************/

"use strict";

console.log("DISHA Firestore Module V2 Loaded");


/* ================================================================
   FIRESTORE COLLECTION
================================================================ */

const DISHA_COLLECTION = "dishaMeetings";


/* ================================================================
   CURRENT RECORD
================================================================ */

let currentRecordId = null;


/* ================================================================
   INITIALIZE
================================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeDISHA
);


async function initializeDISHA() {

    console.log(
        "Initializing DISHA Firestore Module..."
    );

    registerEvents();

    try {
        const readyDb = window.FMSCrud?.waitForDb ? await window.FMSCrud.waitForDb() : (window.db || (typeof db!=="undefined" ? db : null));
        if (readyDb && window.FMSDishaDataSync?.sync) await window.FMSDishaDataSync.sync(readyDb);
    } catch (e) { console.warn("DISHA source-data sync skipped:", e); }

    const requestedId =
        getRequestedRecordId();

    if (requestedId) {

        await loadRecordById(
            requestedId
        );

    } else {

        prepareNewRecord();

    }

    await refreshDishaHomeWorkspace();

}



/* ================================================================
   AUTO PARSE DISHA DOCUMENT ON FILE SELECTION
================================================================ */

function dishaGetValue(id) {
    return String(document.getElementById(id)?.value || "").trim();
}

function dishaFillField(id, value, isDate = false) {
    if (value === null || value === undefined || String(value).trim() === "") return;
    if (dishaGetValue(id)) return;
    if (isDate) setDateControlValue(id, value);
    else setControlValue(id, value);
}

async function parseSelectedDishaDocument() {
    const input = document.getElementById("fmsAttachmentFile");
    const file = input?.files?.[0];
    if (!file) return;

    const status = document.getElementById("dishaAttachmentParseStatus");
    if (status) status.textContent = `Selected: ${file.name}. Parsing and normalising text...`;

    if (!window.FMSDocumentEngine || typeof window.FMSDocumentEngine.parse !== "function") {
        if (status) status.textContent = "Document parser is not available. The file can still be uploaded after saving.";
        return;
    }

    try {
        const result = await window.FMSDocumentEngine.parse({file, module: "DISHA", precision: "accurate", normalize: true});
        const fields = result?.fields || {};
        const text = String(result?.text || fields.rawText || "").trim();

        dishaFillField("district", fields.district);
        dishaFillField("dateOfMeeting", fields.dateOfMeeting, true);
        dishaFillField("pomUploaded", fields.pomUploaded);
        dishaFillField("pomUploadDate", fields.pomUploadDate, true);
        dishaFillField("meetingExpenditure", fields.meetingExpenditure);
        dishaFillField("statusOfBills", fields.statusOfBills);
        dishaFillField("billsSubmittedCRD", fields.billsSubmittedCRD, true);
        dishaFillField("billsForwardedMoRD", fields.billsForwardedMoRD, true);
        dishaFillField("proposedDateOfMeeting", fields.proposedDateOfMeeting, true);
        dishaFillField("statusOfMeeting", fields.statusOfMeeting);
        dishaFillField("officeFileNo", fields.officeFileNo || fields.fileNo || fields.fileNumber);
        dishaFillField("officeDateArised", fields.officeDateArised, true);
        dishaFillField("officeSubject", fields.officeSubject || fields.subject);
        dishaFillField("officeCommunicationType", fields.officeCommunicationType || fields.communicationType);
        dishaFillField("officeLetterAddressedTo", fields.officeLetterAddressedTo || fields.letterAddressedTo);
        dishaFillField("officeStatus", fields.officeStatus || fields.fileStatus);
        dishaFillField("remarks", fields.remarks || (text.length < 1000 ? text : ""));

        updateDISHAStatus();
        if (status) status.textContent = `Parsed: ${file.name}. Review fields and click Save / Update. The attachment will upload after the record is saved.`;
        showMessage("Document parsed and matching DISHA fields populated. Review before saving.", "success");
    } catch (error) {
        console.error("DISHA document parse error", error);
        if (status) status.textContent = "Unable to parse this document. You can still upload it after saving.";
        showMessage("Unable to parse document: " + (error.message || error), "warning");
    }
}

async function saveNewSectionToMaster() {
    const input = document.getElementById("newOfficeSection");
    const name = String(input?.value || "").trim();
    if (!name) {
        showMessage("Please enter the new section name.", "warning");
        input?.focus();
        return;
    }
    try {
        const database = window.db || (typeof db !== "undefined" ? db : null) || window.fmsFirebase?.db;
        if (!database) throw new Error("Firestore is not ready.");
        const existing = await database.collection("sections").get();
        const duplicate = existing.docs.some(doc => String((doc.data() || {}).name || "").trim().toLowerCase() === name.toLowerCase() && (doc.data() || {}).active !== false);
        if (!duplicate) {
            await database.collection("sections").add({name, active: true, source: "DISHA Data Entry", createdOn: firebase.firestore.FieldValue.serverTimestamp(), modifiedOn: firebase.firestore.FieldValue.serverTimestamp()});
        }
        input.value = "";
        window.dispatchEvent(new CustomEvent("fmsMasterDataUpdated", {detail: {master: "sections", name}}));
        window.FMSMasterOptionLoader?.load?.();
        showMessage(duplicate ? "Section already exists in Section Master." : "Section saved to Section Master.", duplicate ? "info" : "success");
    } catch (error) {
        console.error("Section master save error", error);
        showMessage("Unable to save section: " + (error.message || error), "danger");
    }
}

/* ================================================================
   REGISTER EVENTS
================================================================ */

function registerEvents() {

    document
        .getElementById("dateOfMeeting")
        ?.addEventListener(
            "change",
            handleMeetingDateChange
        );


    document
        .getElementById("pomUploaded")
        ?.addEventListener(
            "change",
            updateDISHAStatus
        );


    document
        .getElementById("statusOfMeeting")
        ?.addEventListener(
            "change",
            updateDISHAStatus
        );


    document
        .getElementById("btnNew")
        ?.addEventListener(
            "click",
            prepareNewRecord
        );


    document
        .getElementById("btnSave")
        ?.addEventListener(
            "click",
            function(event){ event?.preventDefault?.(); saveRecord(event); }
        );


    document
        .getElementById("btnUpdate")
        ?.addEventListener(
            "click",
            function(event){ event?.preventDefault?.(); updateRecord(event); }
        );


    document
        .getElementById("btnDelete")
        ?.addEventListener(
            "click",
            function(event){ event?.preventDefault?.(); deleteRecord(event); }
        );


    document
        .getElementById("btnPrint")
        ?.addEventListener(
            "click",
            printRecord
        );


    document
        .getElementById("btnHome")
        ?.addEventListener(
            "click",
            goToHome
        );

        document
    .getElementById("btnRegister")
    ?.addEventListener(
        "click",
        goToRegister
    );

    document
        .getElementById("btnWhatsApp")
        ?.addEventListener(
            "click",
            shareDishaWhatsApp
        );

    if (window.FMSAttachmentService) {
        window.FMSDishaAttachmentUI =
            window.FMSAttachmentService.wireUI({
                module: "DISHA",
                inputId: "fmsAttachmentFile",
                buttonId: "fmsUploadAttachment",
                listId: "fmsAttachmentList",
                getRecordId: () => currentRecordId,
                message: showMessage
            });
    }

    document
        .getElementById("fmsAttachmentFile")
        ?.addEventListener("change", parseSelectedDishaDocument);

    document
        .getElementById("btnAddOfficeSection")
        ?.addEventListener("click", saveNewSectionToMaster);

}

/* ================================================================
   REGISTER
================================================================ */

function goToRegister() {

    window.location.href =
        "disha-register.html?fullscreen=1";

}

/* ================================================================
   NEW RECORD
================================================================ */

async function prepareNewRecord() {

    currentRecordId = null;

    clearForm();

    setNextSlNo();

    clearMessage();
    if (window.FMSDishaAttachmentUI?.refresh) {
        await window.FMSDishaAttachmentUI.refresh();
    }

    console.log(
        "New DISHA record prepared."
    );

}


/* ================================================================
   CLEAR FORM
================================================================ */

function clearForm() {

    const fields = [

        "district",
        "dateOfMeeting",
        "pomUploaded",
        "meetingExpenditure",
        "statusOfBills",
        "billsSubmittedCRD",
        "billsForwardedMoRD",
        "proposedDateOfMeeting",
        "statusOfMeeting",
        "remarks",
        "officeFileNo",
        "officeDateArised",
        "officeSubject",
        "officeCommunicationType",
        "officeLetterAddressedTo",
        "officeStatus",
        "newOfficeSection"

    ];


    fields.forEach(
        function (id) {

            const control =
                document.getElementById(id);

            if (!control)
                return;


            if (
                control.tagName ===
                "SELECT"
            ) {

                control.selectedIndex = 0;

            } else {

                control.value = "";

            }

        }
    );


    setElementText(
        "daysLeft",
        "-"
    );

    setElementText(
        "daysDelayed",
        "-"
    );

    setElementText(
        "pomStatus",
        "-"
    );

    setElementText(
        "meetingStatusSummary",
        "-"
    );

}


/* ================================================================
   SET NEXT SL NO
================================================================ */

async function setNextSlNo() {
    try {
        const records = await loadFirestoreRecords();
        const active = records.filter(r => r.active !== false && r.deleted !== true);
        const slNo = document.getElementById("slNo");
        if (slNo) slNo.value = active.length + 1;
    } catch (error) {
        console.error("Unable to generate dynamic Sl. No.:", error);
    }
}

function sortDishaForDynamicSl(records) {
    return [...(records || [])].filter(r => r.active !== false && r.deleted !== true)
      .sort((a,b) => String(b.dateOfMeeting || b.meetingDate || "").localeCompare(String(a.dateOfMeeting || a.meetingDate || "")));
}
async function setDynamicSlNoForRecord(recordId) {
    const records = sortDishaForDynamicSl(await loadFirestoreRecords());
    const index = records.findIndex(r => String(r.id || "") === String(recordId || ""));
    const el = document.getElementById("slNo");
    if (el && index >= 0) el.value = index + 1;
}


/* ================================================================
   MEETING DATE CHANGE
================================================================ */

function handleMeetingDateChange() {

    const dateValue =
        document.getElementById(
            "dateOfMeeting"
        )?.value;


    if (!dateValue) {

        setControlValue(
                ""
        );

        setElementText(
            "daysLeft",
            "-"
        );

        setElementText(
            "daysDelayed",
            "-"
        );

        return;

    }


    calculatePomDueDate(
        dateValue
    );

    updateDISHAStatus();

}


/* ================================================================
   CALCULATE POM DUE DATE
================================================================ */

function calculatePomDueDate(
    meetingDate
) {

    if (!meetingDate)
        return "";


    const date =
        new Date(
            meetingDate +
            "T00:00:00"
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    /*
     * PoM Upload Due Date
     * = Date of Meeting + 30 Days
     */

    date.setDate(
        date.getDate() + 30
    );


    const yyyy =
        date.getFullYear();


    const mm =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const dd =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    const dueDate =
        `${yyyy}-${mm}-${dd}`;


    setDateControlValue(
        dueDate
    );


    return dueDate;

}


/* ================================================================
   DISHA STATUS
================================================================ */

function updateDISHAStatus() {
    const meetingDate = document.getElementById("dateOfMeeting")?.value || "";
    const pomUploaded = document.getElementById("pomUploaded")?.value || "";
    const meetingStatus = document.getElementById("statusOfMeeting")?.value || "";
    setElementText("meetingStatusSummary", meetingStatus || "-");
    if (String(pomUploaded).toLowerCase() === "yes") {
        setElementText("pomStatus", "Yes");
        setElementText("daysLeft", "Yes");
        setElementText("daysDelayed", "0");
        return;
    }
    const meeting = window.FMSRecordPolicy?.parseDate?.(meetingDate) || parseFlexibleDate(meetingDate);
    if (!meeting || isNaN(meeting.getTime())) {
        setElementText("pomStatus", pomUploaded || "No");
        setElementText("daysLeft", "-");
        setElementText("daysDelayed", "-");
        return;
    }
    const days = window.FMSRecordPolicy?.diffDays?.(meeting, new Date());
    const elapsed = days == null ? 0 : Math.max(days, 0);
    setElementText("pomStatus", "No");
    setElementText("daysLeft", `${elapsed} day(s) elapsed`);
    setElementText("daysDelayed", elapsed);
}


/* ================================================================
   RECORD ID FROM URL / SESSION
================================================================ */

function getRequestedRecordId() {

    try {

        const params =
            new URLSearchParams(
                window.location.search
            );


        const urlId =
            params.get("id") ||
            params.get("recordId") ||
            params.get("docId");


        if (urlId)
            return urlId;


        const idKeys = [

            "selectedDishaRecordId",
            "selectedDishaMeetingId",
            "dishaRecordId",
            "selectedRecordId"

        ];


        for (
            const key of idKeys
        ) {

            const value =
                sessionStorage.getItem(
                    key
                );


            if (!value)
                continue;


            try {

                const parsed =
                    JSON.parse(
                        value
                    );


                if (
                    parsed &&
                    typeof parsed ===
                    "object"
                ) {

                    return (
                        parsed.id ||
                        parsed.documentId ||
                        parsed.recordId ||
                        parsed.firestoreId ||
                        null
                    );

                }

            }
            catch (_) {

                return value;

            }

        }


        /*
         * Compatibility with the existing
         * selectedDishaMeeting object.
         */

        const objectKeys = [

            "selectedDishaMeeting",
            "selectedDishaRecord"

        ];


        for (
            const key of objectKeys
        ) {

            const value =
                sessionStorage.getItem(
                    key
                );


            if (!value)
                continue;


            try {

                const parsed =
                    JSON.parse(
                        value
                    );


                if (
                    parsed &&
                    typeof parsed ===
                    "object"
                ) {

                    return (
                        parsed.id ||
                        parsed.documentId ||
                        parsed.recordId ||
                        parsed.firestoreId ||
                        null
                    );

                }

            }
            catch (_) {

                continue;

            }

        }

    }
    catch (error) {

        console.error(
            "Unable to determine requested DISHA record:",
            error
        );

    }


    return null;

}


/* ================================================================
   OPEN DISHA RECORD
================================================================ */

function openDishaRecord(
    recordId,
    mode = "view"
) {

    if (!recordId) {

        showMessage(
            "Unable to open DISHA record.",
            "danger"
        );

        return;

    }


    sessionStorage.setItem(
        "selectedDishaRecordId",
        recordId
    );


    window.location.href =
        "disha.html?mode=" + encodeURIComponent(mode) + "&fullscreenForm=1&id=" +
        encodeURIComponent(
            recordId
        ) + "&fy=" + encodeURIComponent(selectedDishaWorkspaceFY());

}


/* ================================================================
   LOAD ONE FIRESTORE RECORD
================================================================ */

async function loadRecordById(
    recordId
) {

    try {

        if (!recordId)
            return false;


        if (
            typeof db ===
            "undefined"
        ) {

            throw new Error(
                "Firebase Firestore 'db' is not initialized."
            );

        }


        console.log(
            "Loading DISHA Firestore document:",
            recordId
        );


        const doc =
            await db
                .collection(
                    DISHA_COLLECTION
                )
                .doc(
                    recordId
                )
                .get();


        if (!doc.exists) {

            showMessage(
                "The selected DISHA record was not found.",
                "warning"
            );

            prepareNewRecord();

            return false;

        }


        const record = {

            id: doc.id,

            ...doc.data()

        };


        currentRecordId =
            doc.id;


        populateForm(
            record
        );
        await setDynamicSlNoForRecord(doc.id);


        showMessage(
            "DISHA record loaded successfully.",
            "success"
        );


        console.log(
            "DISHA record loaded:",
            record
        );


        return true;

    }
    catch (error) {

        console.error(
            "DISHA Load Record Error:",
            error
        );


        showMessage(
            "Unable to load DISHA record: " +
            error.message,
            "danger"
        );


        return false;

    }

}


/* ================================================================
   POPULATE FORM
================================================================ */

function populateForm(record) {
    if (!record) return;
    Object.keys(record).forEach(key => {
        const element = document.getElementById(key);
        if (!element || element.type === "file") return;
        if ((key || "").toLowerCase().includes("date") || key === "pomDueDate") setDateControlValue(key, record[key]);
        else setControlValue(key, record[key]);
    });
    if (record.district) setControlValue("district", record.district);
    if (window.FMSOfficeProcessing) window.FMSOfficeProcessing.populateOfficeProcessing(record);
    updateDISHAStatus();
}


/* ================================================================
   FORM DATA
================================================================ */

function getFormData() {
    const data = {};
    document.querySelectorAll("input,select,textarea").forEach(el => {
        if (!el.id || el.type === "file") return;
        const formArea = el.closest("form") || el.closest(".container-fluid") || document.body;
        if (!document.body.contains(formArea)) return;
        data[el.id] = String(el.value || "").trim();
    });
    data.slNo = Number(data.slNo || 0);
    data.meetingExpenditure = Number(data.meetingExpenditure || 0);
    const workflow = window.FMSRecordPolicy?.workflow?.("disha", data) || {};
    data.workflowStage = workflow.stage || "Meeting recorded";
    data.pomDisplay = workflow.pomDisplay || "";
    return data;
}


/* ================================================================
   INTERNAL POM DATE
================================================================ */

function getPomDueDateInternal() {

    const meetingDate =
        document.getElementById(
            "dateOfMeeting"
        )?.value;


    if (!meetingDate)
        return "";


    const date =
        new Date(
            meetingDate +
            "T00:00:00"
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    date.setDate(
        date.getDate() + 30
    );


    const yyyy =
        date.getFullYear();


    const mm =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const dd =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${yyyy}-${mm}-${dd}`
    );

}


function normalizeDishaDistrict(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

async function validateUniqueDistrictMeetingDate(data, excludeId) {
    const district = normalizeDishaDistrict(data?.district);
    const meetingDate = String(data?.dateOfMeeting || "").slice(0,10);
    if (!district || !meetingDate) return true;
    const fireDb = window.db || (typeof db !== "undefined" ? db : null) || (window.FMSCrud?.waitForDb ? await window.FMSCrud.waitForDb() : null);
    if (!fireDb) return true;
    const snapshot = await fireDb.collection(DISHA_COLLECTION).get();
    let duplicate = false;
    snapshot.forEach(doc => {
        if (excludeId && doc.id === excludeId) return;
        const r = doc.data() || {};
        if (r.active === false || r.deleted === true) return;
        const sameDistrict = normalizeDishaDistrict(r.district || r.nameOfDistrict) === district;
        const sameDate = String(r.dateOfMeeting || r.meetingDate || "").slice(0,10) === meetingDate;
        if (sameDistrict && sameDate) duplicate = true;
    });
    if (duplicate) showMessage("A DISHA meeting for the same District and Meeting Date already exists.", "danger");
    return !duplicate;
}

/* ================================================================
   VALIDATE
================================================================ */

function validateForm(
    data
) {

    if (!data.district) {

        showMessage(
            "Please select the District.",
            "danger"
        );

        return false;

    }


    if (!data.dateOfMeeting) {

        showMessage(
            "Please select Date of Meeting.",
            "danger"
        );

        return false;

    }


    return true;

}


/* ================================================================
   SAVE
================================================================ */

async function saveRecord(event) {

    event?.preventDefault?.();

    try {

        const data = getFormData();

        if (!validateForm(data)) return false;
        if (!(await validateUniqueDistrictMeetingDate(data, null))) return false;

        const result = window.FMSCrud
            ? await window.FMSCrud.create(DISHA_COLLECTION, data)
            : await db.collection(DISHA_COLLECTION).add({
                ...data,
                active: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(ref => ({success:true, id:ref.id, data:{id:ref.id}})).catch(e => ({success:false, message:e.message||String(e)}));

        if (!result.success) throw new Error(result.message || "Unable to save DISHA record.");

        const savedId = result.id || result.data?.id;
        console.log("DISHA Firestore document saved:", savedId);

        sessionStorage.removeItem("selectedDishaRecordId");
        sessionStorage.removeItem("selectedDishaMeeting");
        currentRecordId = null;

        showMessage("DISHA record saved successfully. Form cleared for new entry.", "success");
        await prepareNewRecord();
        await refreshDishaHomeWorkspace();
        window.FMSInlineDashboard?.refresh?.();
        window.FMSFormFocus?.completeCrud?.();
        return true;

    }
    catch (error) {

        console.error("DISHA Save Error:", error);
        showMessage("Unable to save record: " + (error.message || error), "danger");
        return false;

    }

}

/* ================================================================
   UPDATE
================================================================ */

async function updateRecord(event) {

    event?.preventDefault?.();

    console.log("Updating DISHA Firestore document:", currentRecordId);

    try {

        if (!currentRecordId) {
            showMessage("Please select a saved record before updating.", "warning");
            return false;
        }

        const data = getFormData();
        if (!validateForm(data)) return false;
        if (!(await validateUniqueDistrictMeetingDate(data, currentRecordId))) return false;

        const result = window.FMSCrud
            ? await window.FMSCrud.update(DISHA_COLLECTION, currentRecordId, data)
            : await db.collection(DISHA_COLLECTION).doc(currentRecordId).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => ({success:true})).catch(e => ({success:false, message:e.message||String(e)}));

        if (!result.success) throw new Error(result.message || "Unable to update DISHA record.");

        showMessage("DISHA record updated successfully.", "success");
        sessionStorage.removeItem("selectedDishaRecordId");
        sessionStorage.removeItem("selectedDishaMeeting");
        currentRecordId = null;
        clearForm();
        window.FMSDateUI?.refreshDisplays?.();
        if (window.FMSDishaAttachmentUI?.refresh) await window.FMSDishaAttachmentUI.refresh();
        await refreshDishaHomeWorkspace();
        window.FMSInlineDashboard?.refresh?.();
        window.FMSFormFocus?.completeCrud?.();
        return true;

    }
    catch (error) {

        console.error("DISHA Update Error:", error);
        showMessage("Unable to update record: " + (error.message || error), "danger");
        return false;

    }

}

/* ================================================================
   DELETE
================================================================ */

async function deleteRecord(event) {

    event?.preventDefault?.();

    try {

        if (!currentRecordId) {
            showMessage("Please select a saved record before deleting.", "warning");
            return false;
        }

        if (!confirm("Are you sure you want to delete this DISHA record?")) return false;

        const result = window.FMSCrud
            ? await window.FMSCrud.softDelete(DISHA_COLLECTION, currentRecordId)
            : await db.collection(DISHA_COLLECTION).doc(currentRecordId).update({
                active:false,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => ({success:true})).catch(e => ({success:false, message:e.message||String(e)}));

        if (!result.success) throw new Error(result.message || "Unable to delete DISHA record.");

        sessionStorage.removeItem("selectedDishaRecordId");
        sessionStorage.removeItem("selectedDishaMeeting");
        currentRecordId = null;

        showMessage("DISHA record deleted successfully.", "success");
        await prepareNewRecord();
        await refreshDishaHomeWorkspace();
        window.FMSInlineDashboard?.refresh?.();
        window.FMSFormFocus?.completeCrud?.();
        return true;

    }
    catch (error) {

        console.error("DISHA Delete Error:", error);
        showMessage("Unable to delete record: " + (error.message || error), "danger");
        return false;

    }

}

/* ================================================================
   LOAD ALL FIRESTORE RECORDS
================================================================ */

async function loadFirestoreRecords() {

    const fireDb = window.db || (window.FMSCrud?.waitForDb ? await window.FMSCrud.waitForDb() : null);
    if (!fireDb) throw new Error("Firebase Firestore 'db' is not initialized.");

    const snapshot =
        await fireDb
            .collection(
                DISHA_COLLECTION
            )
            .get();


    const firestoreRows = snapshot.docs.map(function (doc) {
        return { id: doc.id, ...doc.data() };
    });
    const sourceRows = window.FMSDishaDataSync?.rows || [];
    const keyOf = r => window.FMSDishaDataSync?.key
        ? window.FMSDishaDataSync.key(r.district || r.nameOfDistrict, r.dateOfMeeting || r.meetingDate)
        : `${String(r.district || r.nameOfDistrict || "").trim().toLowerCase()}|${String(r.dateOfMeeting || r.meetingDate || "").slice(0,10)}`;
    const seen = new Set(firestoreRows.map(keyOf));
    sourceRows.forEach((r,index) => {
        const k=keyOf(r);
        if (!seen.has(k)) { firestoreRows.push({...r, slNo:Number(r.slNo || index+1), sourceFallback:true}); seen.add(k); }
    });
    return firestoreRows;

}


/* ================================================================
   LOAD RECORDS
================================================================ */

async function loadRecords() {

    try {

        const records =
            await loadFirestoreRecords();


        console.log(
            "DISHA Firestore records:",
            records
        );


        return records;

    }
    catch (error) {

        console.error(
            "DISHA Load Error:",
            error
        );


        return [];

    }

}



/* ================================================================
   DISHA HOME REGISTER
================================================================ */
function dishaHomeEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function dishaHomeDate(value) {
    if (!value) return "";
    if (value && typeof value.toDate === "function") value = value.toDate();
    const d = value instanceof Date ? value : new Date(String(value).slice(0,10) + "T00:00:00");
    if (Number.isNaN(d.getTime())) return dishaHomeEscape(value);
    return d.toLocaleDateString("en-GB");
}
function dishaHomeMeetingDate(record) {
    const raw = record.dateOfMeeting || record.meetingDate || record.proposedDateOfMeeting;
    if (!raw) return null;
    if (raw && typeof raw.toDate === "function") { const d=raw.toDate(); d.setHours(0,0,0,0); return d; }
    const text=String(raw).trim();
    let d;
    const gb=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (gb) d=new Date(+gb[3],+gb[2]-1,+gb[1]); else d=new Date(text.slice(0,10)+"T00:00:00");
    if (Number.isNaN(d.getTime())) return null; d.setHours(0,0,0,0); return d;
}
function dishaHomePendingRawDays(record) {
    if (/yes|uploaded|completed/i.test(String(record.pomUploaded || ""))) return null;
    const d=dishaHomeMeetingDate(record); if(!d) return null;
    const today=new Date(); today.setHours(0,0,0,0);
    return Math.floor((today-d)/86400000);
}
function dishaElapsedYMD(fromDate,toDate) {
    let years=toDate.getFullYear()-fromDate.getFullYear();
    let anchor=new Date(fromDate); anchor.setFullYear(fromDate.getFullYear()+years);
    if(anchor>toDate){years--;anchor=new Date(fromDate);anchor.setFullYear(fromDate.getFullYear()+years);}
    let months=0; while(months<11){const n=new Date(anchor);n.setMonth(n.getMonth()+1);if(n>toDate)break;anchor=n;months++;}
    const days=Math.floor((toDate-anchor)/86400000);
    const parts=[]; if(years)parts.push(`${years} year${years===1?'':'s'}`); if(months)parts.push(`${months} month${months===1?'':'s'}`); if(days||!parts.length)parts.push(`${days} day${days===1?'':'s'}`); return parts.join(' ');
}
function dishaHomePendingDays(record) {
    const days=dishaHomePendingRawDays(record); if(days===null || days<0) return "-";
    const d=dishaHomeMeetingDate(record), today=new Date(); today.setHours(0,0,0,0);
    return dishaElapsedYMD(d,today);
}
function dishaHomeRemarks(record) {
    if (/yes|uploaded|completed/i.test(String(record.pomUploaded || ""))) return record.remarks || "";
    const days=dishaHomePendingRawDays(record); if(days===null) return record.remarks || "";
    if(days>0) return `PoM pending for ${days} days`;
    if(days<0) return `${Math.abs(days)} days left for the meeting to be held`;
    return "Meeting is scheduled for today";
}
function dishaRecordFY(record) {
    const raw = record.dateOfMeeting || record.meetingDate || record.proposedDateOfMeeting || record.date;
    const d = raw && typeof raw.toDate === "function" ? raw.toDate() : raw ? new Date(String(raw).slice(0,10) + "T00:00:00") : null;
    if (d && !Number.isNaN(d.getTime())) { const y=d.getMonth()>=3?d.getFullYear():d.getFullYear()-1; return `${y}-${String(y+1).slice(-2)}`; }
    return String(record.financialYear || record.fy || "").trim();
}
function currentDishaFY() { const d=new Date(), y=d.getMonth()>=3?d.getFullYear():d.getFullYear()-1; return `${y}-${String(y+1).slice(-2)}`; }
function selectedDishaWorkspaceFY() { return document.getElementById("dishaWorkspaceFY")?.value || new URLSearchParams(location.search).get("fy") || currentDishaFY(); }
function initDishaWorkspaceFY(records) {
    const el=document.getElementById("dishaWorkspaceFY"); if(!el) return;
    const fys=[...new Set((records||[]).map(dishaRecordFY).filter(Boolean))].sort().reverse();
    const wanted=new URLSearchParams(location.search).get("fy") || currentDishaFY();
    el.innerHTML=fys.map(f=>`<option value="${f}">${f}</option>`).join("");
    if(!fys.includes(wanted)){const o=document.createElement("option");o.value=wanted;o.textContent=wanted;el.prepend(o);}
    el.value=wanted;
    el.onchange=()=>{const u=new URL(location.href);u.searchParams.set("fy",el.value);history.replaceState(null,"",u);renderDishaHomeRegister(records);window.FMSInlineDashboard?.refresh?.();};
}
function renderDishaHomeRegister(records) {
    const body = document.getElementById("dishaHomeRegisterBody");
    if (!body) return;
    const fy = selectedDishaWorkspaceFY();
    const active = (records || []).filter(r => r.active !== false && r.deleted !== true && dishaRecordFY(r) === fy)
      .sort((a,b) => {
          const pa = dishaHomePendingRawDays(a);
          const pb = dishaHomePendingRawDays(b);
          const aPending = Number.isFinite(pa) && pa >= 0;
          const bPending = Number.isFinite(pb) && pb >= 0;
          if (aPending !== bPending) return aPending ? -1 : 1;
          if (aPending && pa !== pb) return pb - pa;
          const districtCompare = String(a.district || a.nameOfDistrict || "").localeCompare(String(b.district || b.nameOfDistrict || ""), undefined, {sensitivity:"base"});
          if (districtCompare !== 0) return districtCompare;
          const da = a.dateOfMeeting || a.meetingDate || a.proposedDateOfMeeting || "";
          const db = b.dateOfMeeting || b.meetingDate || b.proposedDateOfMeeting || "";
          return String(db).localeCompare(String(da));
      });
    document.getElementById("dishaHomeRecordCount").textContent = `Records: ${active.length}`;
    if (!active.length) {
        body.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No DISHA meetings found.</td></tr>';
        return;
    }
    body.innerHTML = active.map((r,i) => {
        const id = dishaHomeEscape(r.id || "");
        const uploaded = /yes|uploaded|completed/i.test(String(r.pomUploaded || ""));
        return `<tr><td>${i+1}</td><td>${dishaHomeEscape(r.district || r.nameOfDistrict || "")}</td><td>${dishaHomeDate(r.dateOfMeeting || r.meetingDate)}</td><td>${uploaded ? "Yes" : "No"}</td><td>${dishaHomePendingDays(r)}</td><td>${dishaHomeEscape(r.statusOfBills || r.billsStatus || "")}</td><td>${dishaHomeEscape(dishaHomeRemarks(r))}</td><td class="text-nowrap"><button type="button" class="btn btn-info btn-sm me-1" onclick="openDishaRecord('${id}','view')">View</button><button type="button" class="btn btn-warning btn-sm me-1" onclick="openDishaRecord('${id}','edit')">Edit</button><button type="button" class="btn btn-danger btn-sm" onclick="deleteDishaHomeRecord('${id}')">Delete</button></td></tr>`;
    }).join("");
}
async function refreshDishaHomeWorkspace() {
    const records = await loadRecords();
    initDishaWorkspaceFY(records);
    renderDishaHomeRegister(records);
    return records;
}
async function deleteDishaHomeRecord(id) {
    if (!id) return;
    window.location.href = "disha.html?mode=delete&fullscreenForm=1&id=" + encodeURIComponent(id) + "&fy=" + encodeURIComponent(selectedDishaWorkspaceFY());
}
window.deleteDishaHomeRecord = deleteDishaHomeRecord;

/* ================================================================
   DATE HELPERS
================================================================ */

function normalizeDateValue(
    value
) {

    if (!value)
        return "";


    if (
        typeof value ===
        "object" &&
        typeof value.toDate ===
        "function"
    ) {

        value =
            value.toDate();

    }


    if (
        value instanceof Date
    ) {

        if (
            isNaN(
                value.getTime()
            )
        ) {

            return "";

        }


        return (
            value.getFullYear() +
            "-" +
            String(
                value.getMonth() + 1
            ).padStart(
                2,
                "0"
            ) +
            "-" +
            String(
                value.getDate()
            ).padStart(
                2,
                "0"
            )
        );

    }


    const text =
        String(
            value
        ).trim();


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            text
        )
    ) {

        return text;

    }


    if (
        /^\d{2}\/\d{2}\/\d{4}$/.test(
            text
        )
    ) {

        const parts =
            text.split("/");


        return (
            parts[2] +
            "-" +
            parts[1] +
            "-" +
            parts[0]
        );

    }


    return text;

}


function parseFlexibleDate(
    value
) {

    const normalized =
        normalizeDateValue(
            value
        );


    if (!normalized)
        return null;


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            normalized
        )
    ) {

        return new Date(
            normalized +
            "T00:00:00"
        );

    }


    const parsed =
        new Date(
            normalized
        );


    return isNaN(
        parsed.getTime()
    )
        ? null
        : parsed;

}


function setDateControlValue(
    id,
    value
) {

    const control =
        document.getElementById(
            id
        );


    if (!control)
        return;


    const normalized =
        normalizeDateValue(
            value
        );


    control.value =
        normalized || "";

}


/* ================================================================
   GENERAL HELPERS
================================================================ */

function setControlValue(
    id,
    value
) {

    const control =
        document.getElementById(
            id
        );


    if (!control)
        return;


    control.value =
        value === null ||
        value === undefined
            ? ""
            : String(value);

}


function setElementText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* ================================================================
   PRINT
================================================================ */

function printRecord() {

    window.print();

}


/* ================================================================
   WHATSAPP
================================================================ */

async function shareDishaWhatsApp() {
    if (!window.FMSWhatsAppService) return;

    await window.FMSWhatsAppService.share({
        module: "DISHA",
        title: "DISHA Meeting Report",
        fields: [
            {id:"slNo",label:"Sl. No."},
            {id:"district",label:"District"},
            {id:"dateOfMeeting",label:"Date of Meeting"},
            {id:"pomDueDate",label:"PoM Due Date"},
            {id:"pomUploaded",label:"PoM Uploaded"},
            {id:"meetingExpenditure",label:"Meeting Expenditure"},
            {id:"statusOfBills",label:"Status of Bills"},
            {id:"billsSubmittedCRD",label:"Bills Submitted to CRD"},
            {id:"billsForwardedMoRD",label:"Bills Forwarded to MoRD"},
            {id:"proposedDateOfMeeting",label:"Proposed Date of Meeting"},
            {id:"statusOfMeeting",label:"Status of Meeting"},
            {id:"remarks",label:"Remarks"}
        ],
        element: document.querySelector(".container-fluid") || document.body,
        message: (msg)=>showMessage(msg,"info")
    });
}

/* ================================================================
   HOME
================================================================ */

function goToHome() {
    window.location.href = "../../index.html";
}


/* ================================================================
   MESSAGE
================================================================ */

function showMessage(
    message,
    type = "info"
) {

    const element =
        document.getElementById(
            "dishaMessage"
        );


    if (!element) {

        console.log(
            message
        );

        return;

    }


    element.innerHTML = `

        <div class="alert alert-${type}">

            ${message}

        </div>

    `;


    setTimeout(
        function () {

            element.innerHTML = "";

        },
        4000
    );

}


function clearMessage() {

    const element =
        document.getElementById(
            "dishaMessage"
        );


    if (element) {

        element.innerHTML =
            "";

    }

}

window.FMSDISHACRUDActions = { save: saveRecord, update: updateRecord, delete: deleteRecord, clear: prepareNewRecord };
