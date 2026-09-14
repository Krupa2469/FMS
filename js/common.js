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

    const received = document.getElementById("dateReceived").value;

    if (!received) return;

    const due = new Date(received);
    due.setDate(due.getDate() + CPGRAMS_DUE_DAYS);

    document.getElementById("dueDate").value =
        due.toISOString().split("T")[0];
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

    const area = document.getElementById("messageArea");

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

    const area = document.getElementById("messageArea");

    if (!area) return;

    area.innerHTML = "";
    area.style.display = "none";

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