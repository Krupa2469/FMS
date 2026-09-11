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

    const requestedId =
        getRequestedRecordId();

    if (requestedId) {

        await loadRecordById(
            requestedId
        );

    } else {

        prepareNewRecord();

    }

    await loadRecords();

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
            saveRecord
        );


    document
        .getElementById("btnUpdate")
        ?.addEventListener(
            "click",
            updateRecord
        );


    document
        .getElementById("btnDelete")
        ?.addEventListener(
            "click",
            deleteRecord
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
        "pomDueDate",
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
        "officeReplySection",
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

        const records =
            await loadFirestoreRecords();


        let nextNumber = 1;


        if (records.length > 0) {

            const numbers =
                records
                    .map(
                        record =>
                            Number(
                                record.slNo
                            )
                    )
                    .filter(
                        number =>
                            !isNaN(number)
                    );


            if (numbers.length > 0) {

                nextNumber =
                    Math.max(
                        ...numbers
                    ) + 1;

            }

        }


        const slNo =
            document.getElementById(
                "slNo"
            );


        if (slNo) {

            slNo.value =
                nextNumber;

        }

    }
    catch (error) {

        console.error(
            "Unable to generate Sl. No.:",
            error
        );

    }

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
            "pomDueDate",
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
        "pomDueDate",
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
    recordId
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
        "disha.html?id=" +
        encodeURIComponent(
            recordId
        );

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
    data.pomDueDate = getPomDueDateInternal();
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

async function saveRecord() {

    try {

        const data =
            getFormData();


        if (
            !validateForm(
                data
            )
        ) {

            return;

        }


        if (
            typeof db ===
            "undefined"
        ) {

            throw new Error(
                "Firebase Firestore 'db' is not initialized."
            );

        }


        const record = {

            ...data,

            createdAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp(),

            updatedAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp()

        };


        const docRef =
            await db
                .collection(
                    DISHA_COLLECTION
                )
                .add(
                    record
                );


        currentRecordId =
            docRef.id;


        showMessage(
            "DISHA record saved successfully to Firestore.",
            "success"
        );


        console.log(
            "Firestore document ID:",
            docRef.id
        );


        /*
         * Important:
         * After saving, remain on the same
         * record so Update/Delete can work.
         */

        sessionStorage.setItem(
            "selectedDishaRecordId",
            docRef.id
        );


        updateDISHAStatus();
        if (window.FMSDishaAttachmentUI?.refresh) {
            await window.FMSDishaAttachmentUI.refresh();
        }

    }
    catch (error) {

        console.error(
            "DISHA Save Error:",
            error
        );


        showMessage(
            "Unable to save record: " +
            error.message,
            "danger"
        );

    }

}


/* ================================================================
   UPDATE
================================================================ */

async function updateRecord() {

    console.log(
        "Updating DISHA Firestore document:",
        currentRecordId
    );


    try {

        if (!currentRecordId) {

            showMessage(
                "Please select a saved record before updating.",
                "warning"
            );

            return;

        }


        const data =
            getFormData();


        if (
            !validateForm(
                data
            )
        ) {

            return;

        }


        if (
            typeof db ===
            "undefined"
        ) {

            throw new Error(
                "Firebase Firestore 'db' is not initialized."
            );

        }


        await db
            .collection(
                DISHA_COLLECTION
            )
            .doc(
                currentRecordId
            )
            .update({

                ...data,

                updatedAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });


        showMessage(
            "DISHA record updated successfully.",
            "success"
        );        if (window.FMSDishaAttachmentUI?.refresh) {
            await window.FMSDishaAttachmentUI.refresh();
        }


        console.log(
            "Updated Firestore document:",
            currentRecordId
        );

    }
    catch (error) {

        console.error(
            "DISHA Update Error:",
            error
        );


        showMessage(
            "Unable to update record: " +
            error.message,
            "danger"
        );

    }

}


/* ================================================================
   DELETE
================================================================ */

async function deleteRecord() {

    try {

        if (!currentRecordId) {

            showMessage(
                "Please select a saved record before deleting.",
                "warning"
            );

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to delete this DISHA record?"
            );


        if (!confirmed)
            return;


        if (
            typeof db ===
            "undefined"
        ) {

            throw new Error(
                "Firebase Firestore 'db' is not initialized."
            );

        }


        await db
            .collection(
                DISHA_COLLECTION
            )
            .doc(
                currentRecordId
            )
            .delete();


        sessionStorage.removeItem(
            "selectedDishaRecordId"
        );


        sessionStorage.removeItem(
            "selectedDishaMeeting"
        );


        showMessage(
            "DISHA record deleted successfully.",
            "success"
        );


        prepareNewRecord();


        await loadRecords();

    }
    catch (error) {

        console.error(
            "DISHA Delete Error:",
            error
        );


        showMessage(
            "Unable to delete record: " +
            error.message,
            "danger"
        );

    }

}


/* ================================================================
   LOAD ALL FIRESTORE RECORDS
================================================================ */

async function loadFirestoreRecords() {

    if (
        typeof db ===
        "undefined"
    ) {

        throw new Error(
            "Firebase Firestore 'db' is not initialized."
        );

    }


    const snapshot =
        await db
            .collection(
                DISHA_COLLECTION
            )
            .get();


    return snapshot.docs.map(
        function (doc) {

            return {

                id: doc.id,

                ...doc.data()

            };

        }
    );

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