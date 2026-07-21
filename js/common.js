/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : common.js
    Version     : 1.0.0
    Description : Common Utility Functions
==========================================================*/

"use strict";

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
END OF FILE
==========================================================*/