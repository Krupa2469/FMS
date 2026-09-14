/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : common.js
    Version     : 1.0.0
    Description : Common Utility Functions
==========================================================*/

"use strict";
console.log("Common.js Loaded");

/*==========================================================
GET ELEMENT
==========================================================*/

function getElement(id)
{
    return document.getElementById(id);
}

/*==========================================================
SET VALUE
==========================================================*/

function setValue(id, value)
{
    const element = getElement(id);

    if (element)
    {
        element.value = value;
    }
}

/*==========================================================
GET VALUE
==========================================================*/

function getValue(id)
{
    const element = getElement(id);

    if (element)
    {
        return element.value.trim();
    }

    return "";
}

/*==========================================================
CLEAR VALUE
==========================================================*/

function clearValue(id)
{
    const element = getElement(id);

    if (element)
    {
        element.value = "";
    }
}

/*==========================================================
CLEAR FORM
==========================================================*/

function clearForm(formId)
{
    const form = getElement(formId);

    if (form)
    {
        form.reset();
    }
}

/*==========================================================
ENABLE CONTROL
==========================================================*/

function enableControl(id)
{
    const element = getElement(id);

    if (element)
    {
        element.disabled = false;
    }
}

/*==========================================================
DISABLE CONTROL
==========================================================*/

function disableControl(id)
{
    const element = getElement(id);

    if (element)
    {
        element.disabled = true;
    }
}

/*==========================================================
SET FOCUS
==========================================================*/

function setFocus(id)
{
    const element = getElement(id);

    if (element)
    {
        element.focus();
    }
}

/******************************************************************************
 * Set Default Dates
 ******************************************************************************/
function setDefaultDates() {

    const today = new Date().toISOString().split("T")[0];

    const dateReceived = document.getElementById("dateReceived");
    if (dateReceived && !dateReceived.value) {
        dateReceived.value = today;
    }

    calculateDueDate();

}

/******************************************************************************
 * Calculate Due Date
 ******************************************************************************/
function calculateDueDate() {

    const receivedEl = document.getElementById("dateReceived");
    const dueEl = document.getElementById("dueDate");
    const received = receivedEl ? String(receivedEl.value || "").trim() : "";

    if (!received || !dueEl) return;

    let dueValue = "";
    if (window.FMSRecordPolicy && typeof window.FMSRecordPolicy.addDays === "function") {
        dueValue = window.FMSRecordPolicy.addDays(received, CPGRAMS_DUE_DAYS, "dmy");
    } else {
        let m = received.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2}|\d{4})$/);
        let due = null;
        if (m) {
            const y = m[3].length === 2 ? Number("20" + m[3]) : Number(m[3]);
            due = new Date(y, Number(m[2]) - 1, Number(m[1]));
        } else {
            due = new Date(received);
        }
        if (due && !Number.isNaN(due.getTime())) {
            due.setDate(due.getDate() + CPGRAMS_DUE_DAYS);
            dueValue = `${String(due.getDate()).padStart(2,"0")}/${String(due.getMonth()+1).padStart(2,"0")}/${due.getFullYear()}`;
        }
    }

    dueEl.value = dueValue;
}

/*==========================================================
TODAY
==========================================================*/

function today()
{
    return new Date().toISOString().split("T")[0];
}

/*==========================================================
SET TODAY
==========================================================*/

function setToday(id)
{
    setValue(id, today());
}

console.log("Common.js Loaded");

/*==========================================================
LOADING OVERLAY
==========================================================*/

function showLoading() {

    const overlay = document.getElementById("loadingOverlay");

    if (overlay) {
        overlay.style.display = "flex";
    }

}

function hideLoading() {

    const overlay = document.getElementById("loadingOverlay");

    if (overlay) {
        overlay.style.display = "none";
    }

}

/*==========================================================
MESSAGE AREA
==========================================================*/

function showMessage(message, type = "success") {

    // Accept both call styles used across this app:
    // showMessage("Saved", "success") and showMessage("success", "Saved").
    const validTypes = new Set(["success", "danger", "warning", "info", "primary", "secondary", "light", "dark"]);
    let finalMessage = message;
    let finalType = type || "success";

    if (validTypes.has(String(message || "").toLowerCase()) && typeof type !== "undefined") {
        finalType = String(message).toLowerCase();
        finalMessage = type;
    }

    const area = document.getElementById("actionMessageArea") || document.getElementById("messageArea");

    if (!area) {
        console.log(finalType + ":", finalMessage);
        return;
    }

    area.style.display = "";
    area.innerHTML =
        `<div class="alert alert-${finalType} alert-dismissible fade show">
            ${finalMessage}
            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="alert">
            </button>
        </div>`;

    setTimeout(() => {
        area.innerHTML = "";
    }, 5000);

}

function clearMessage() {

    [document.getElementById("actionMessageArea"), document.getElementById("messageArea")].forEach(function(area) {
        if (!area) return;
        area.innerHTML = "";
        area.style.display = "none";
    });

}

/*==========================================================
CONFIRM ACTION
==========================================================*/

function confirmAction(message) {

    return window.confirm(message);

}

/*==========================================================
TOAST
==========================================================*/

function showToast(message) {

    showMessage(message, "success");

}

/*==========================================================
END OF FILE
==========================================================*/