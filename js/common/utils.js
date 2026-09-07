"use strict";

/*=========================================================
UTILS.JS
Common Utility Functions
Version : 1.0
=========================================================*/

//=========================================================
// DATE FUNCTIONS
//=========================================================

function formatDate(date) {

    if (!date) return "";

    return new Date(date)
        .toISOString()
        .split("T")[0];

}

function formatDisplayDate(date) {

    if (!date) return "";

    return new Date(date)
        .toLocaleDateString("en-IN");

}

function addDays(date, days) {

    const d = new Date(date);

    d.setDate(d.getDate() + days);

    return formatDate(d);

}

function today() {

    return formatDate(new Date());

}

//=========================================================
// STRING FUNCTIONS
//=========================================================

function capitalize(text) {

    if (!text) return "";

    return text.replace(/\b\w/g, c => c.toUpperCase());

}

function trimText(text) {

    return (text || "").trim();

}

function isEmpty(value) {

    return value === null ||

           value === undefined ||

           value === "";

}

//=========================================================
// NUMBER FUNCTIONS
//=========================================================

function onlyNumbers(text) {

    return (text || "").replace(/\D/g, "");

}

function randomNumber(length = 6) {

    return Math.floor(

        Math.random() *

        Math.pow(10, length)

    );

}

//=========================================================
// ID GENERATION
//=========================================================

function generateId(prefix) {

    const now = new Date();

    return `${prefix}${

        now.getFullYear()

    }${

        String(now.getMonth() + 1).padStart(2, "0")

    }${

        String(now.getDate()).padStart(2, "0")

    }${

        Date.now()

    }`;

}

//=========================================================
// MESSAGE
//=========================================================

function showMessage(message, type = "success") {

    const area = document.getElementById("messageArea");

    if (!area) return;

    area.innerHTML =
        `<div class="alert alert-${type} alert-dismissible fade show">
            ${message}
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

    const messageArea = document.getElementById("messageArea");

    if (!messageArea) {
        return;
    }

    messageArea.innerHTML = "";
    messageArea.style.display = "none";

}

//=========================================================
// LOADING
//=========================================================

function showLoading() {

    const overlay =

        document.getElementById("loadingOverlay");

    if (!overlay) return;

    overlay.classList.remove("d-none");

    overlay.classList.add("d-flex");

}

function hideLoading() {

    const overlay =

        document.getElementById("loadingOverlay");

    if (!overlay) return;

    overlay.classList.remove("d-flex");

    overlay.classList.add("d-none");

}

//=========================================================
// FORM FUNCTIONS
//=========================================================

function clearForm(formId) {

    document

        .getElementById(formId)

        .reset();

}

function enableForm(formId) {

    document

        .querySelectorAll(

            "#" + formId +

            " input,#" + formId +

            " select,#" + formId +

            " textarea"

        )

        .forEach(c => c.disabled = false);

}

function disableForm(formId) {

    document

        .querySelectorAll(

            "#" + formId +

            " input,#" + formId +

            " select,#" + formId +

            " textarea"

        )

        .forEach(c => c.disabled = true);

}

//=========================================================
// DROPDOWNS
//=========================================================

function fillDropdown(id, items, firstText = "Select") {

    const ddl = document.getElementById(id);

    ddl.innerHTML = "";

    ddl.appendChild(

        new Option(firstText, "")

    );

    items.forEach(item => {

        ddl.appendChild(

            new Option(item, item)

        );

    });

}

//=========================================================
// CONFIRMATION
//=========================================================

function confirmAction(message = "Are you sure?") {

    return confirm(message);

}

//=========================================================
// PRINT
//=========================================================

function printPage() {

    window.print();

}

//=========================================================
// EXPORTS
//=========================================================

window.formatDate = formatDate;

window.formatDisplayDate = formatDisplayDate;

window.addDays = addDays;

window.today = today;

window.capitalize = capitalize;

window.trimText = trimText;

window.isEmpty = isEmpty;

window.onlyNumbers = onlyNumbers;

window.randomNumber = randomNumber;

window.generateId = generateId;

window.showMessage = showMessage;

window.showLoading = showLoading;

window.hideLoading = hideLoading;

window.clearForm = clearForm;

window.enableForm = enableForm;

window.disableForm = disableForm;

window.fillDropdown = fillDropdown;

window.confirmDelete = confirmDelete;

window.printPage = printPage;