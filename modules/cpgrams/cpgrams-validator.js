/*==========================================================
  CPGRAMS MODULE
  File        : cpgrams-validator.js
  Version     : 4.0
  Description : Validation Functions
==========================================================*/

"use strict";

//==========================================================
// REQUIRED FIELD VALIDATION
//==========================================================

function validateRequired(controlId, fieldName) {

    const control = document.getElementById(controlId);

    if (!control)
        return false;

    const value = control.value.trim();

    if (value === "") {

        showMessage(

            fieldName + " is required.",

            "warning"

        );

        control.focus();

        return false;

    }

    return true;

}

//==========================================================
// MOBILE NUMBER VALIDATION
//==========================================================

function validateMobile(controlId) {

    const mobile =
        document.getElementById(controlId).value.trim();

    if (mobile === "")
        return true;

    const pattern = /^[6-9][0-9]{9}$/;

    if (!pattern.test(mobile)) {

        showMessage(

            "Enter a valid 10-digit Mobile Number.",

            "warning"

        );

        document
            .getElementById(controlId)
            .focus();

        return false;

    }

    return true;

}

//==========================================================
// EMAIL VALIDATION
//==========================================================

function validateEmail(controlId) {

    const email =
        document.getElementById(controlId);

    if (!email)
        return true;

    const value = email.value.trim();

    if (value === "")
        return true;

    const pattern =
        /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

    if (!pattern.test(value)) {

        showMessage(

            "Invalid Email Address.",

            "warning"

        );

        email.focus();

        return false;

    }

    return true;

}

//==========================================================
// DATE VALIDATION
//==========================================================

function validateDate(controlId, fieldName) {

    const control =
        document.getElementById(controlId);

    const value =
        control.value;

    if (value === "") {

        showMessage(

            fieldName + " is required.",

            "warning"

        );

        control.focus();

        return false;

    }

    return true;

}

//==========================================================
// FUTURE DATE VALIDATION
//==========================================================

function validateFutureDate(controlId, fieldName) {

    const value =
        document
            .getElementById(controlId)
            .value;

    if (value === "")
        return true;

    const entered =
        new Date(value);

    const today =
        new Date();

    today.setHours(0,0,0,0);

    if (entered > today) {

        showMessage(

            fieldName +
            " cannot be a future date.",

            "warning"

        );

        document
            .getElementById(controlId)
            .focus();

        return false;

    }

    return true;

}

//==========================================================
// LENGTH VALIDATION
//==========================================================

function validateLength(controlId, maxLength, fieldName) {

    const value =
        document
            .getElementById(controlId)
            .value
            .trim();

    if (value.length > maxLength) {

        showMessage(

            fieldName +
            " exceeds maximum length.",

            "warning"

        );

        document
            .getElementById(controlId)
            .focus();

        return false;

    }

    return true;

}

//==========================================================
// NUMERIC VALIDATION
//==========================================================

function validateNumeric(controlId, fieldName) {

    const value =
        document
            .getElementById(controlId)
            .value
            .trim();

    if (value === "")
        return true;

    if (isNaN(value)) {

        showMessage(

            fieldName +
            " must be numeric.",

            "warning"

        );

        document
            .getElementById(controlId)
            .focus();

        return false;

    }

    return true;

}

//==========================================================
// DROPDOWN VALIDATION
//==========================================================

function validateDropdown(controlId, fieldName) {

    const value =
        document
            .getElementById(controlId)
            .value;

    if (value === "") {

        showMessage(

            "Select " + fieldName,

            "warning"

        );

        document
            .getElementById(controlId)
            .focus();

        return false;

    }

    return true;

}

//==========================================================
// DATE RANGE VALIDATION
//==========================================================

function validateDateRange(fromControlId, toControlId, fromField, toField) {

    const fromDate =
        document.getElementById(fromControlId).value;

    const toDate =
        document.getElementById(toControlId).value;

    if (fromDate === "" || toDate === "")
        return true;

    if (new Date(toDate) < new Date(fromDate)) {

        showMessage(

            toField + " cannot be earlier than " + fromField + ".",

            "warning"

        );

        document.getElementById(toControlId).focus();

        return false;

    }

    return true;

}

//==========================================================
// DUE DATE VALIDATION
//==========================================================

function validateDueDate() {

    const received =
        document.getElementById("dateReceived").value;

    const due =
        document.getElementById("dueDate").value;

    if (received === "" || due === "")
        return true;

    const expected =
        new Date(received);

    expected.setDate(expected.getDate() + 21);

    const actual =
        new Date(due);

    if (expected.toDateString() !== actual.toDateString()) {

        showMessage(

            "Due Date should be 21 days from Date Received.",

            "warning"

        );

        document.getElementById("dueDate").focus();

        return false;

    }

    return true;

}

//==========================================================
// ATTACHMENT COUNT VALIDATION
//==========================================================

function validateAttachmentCount() {

    const value =
        Number(document.getElementById("attachmentCount").value);

    if (value < 0) {

        showMessage(

            "Attachment Count cannot be negative.",

            "warning"

        );

        document.getElementById("attachmentCount").focus();

        return false;

    }

    return true;

}

//==========================================================
// DUPLICATE GRIEVANCE NUMBER
//==========================================================

async function validateDuplicateGrievanceNumber() {

    const grievanceNumber =
        document.getElementById("grievanceNumber").value.trim();

    if (grievanceNumber === "")
        return false;

    if (typeof grievanceExists !== "function")
        return true;

    const exists =
        await grievanceExists(grievanceNumber);

    if (exists) {

        showMessage(

            "Grievance Number already exists.",

            "warning"

        );

        document.getElementById("grievanceNumber").focus();

        return false;

    }

    return true;

}

//==========================================================
// BUSINESS RULE VALIDATION
//==========================================================

async function validateCPGRAMS() {

    if (!validateRequired(
        "grievanceNumber",
        "Grievance Number"))
        return false;

    if (!validateDate(
        "dateReceived",
        "Date Received"))
        return false;

    if (!validateRequired(
        "complainantName",
        "Complainant Name"))
        return false;

    if (!validateRequired(
        "subject",
        "Subject"))
        return false;

    if (!validateDropdown(
        "district",
        "District"))
        return false;

    if (!validateDropdown(
        "mandal",
        "Mandal"))
        return false;

    if (!validateDropdown(
        "village",
        "Village"))
        return false;

    if (!validateMobile(
        "mobileNumber"))
        return false;

    if (!validateFutureDate(
        "dateReceived",
        "Date Received"))
        return false;

    if (!validateFutureDate(
        "dateArised",
        "Date Arised"))
        return false;

    if (!validateDueDate())
        return false;

    if (!validateAttachmentCount())
        return false;

    if (!validateDateRange(
        "dateReceived",
        "disposalDate",
        "Date Received",
        "Disposal Date"))
        return false;

    if (!editMode) {

        if (!await validateDuplicateGrievanceNumber())
            return false;

    }

    return true;

}

//==========================================================
// RESET VALIDATION
//==========================================================

function resetValidation() {

    document
        .querySelectorAll(".is-invalid")
        .forEach(control => {

            control.classList.remove("is-invalid");

        });

}

//==========================================================
// EXPORT TO WINDOW
//==========================================================

window.validateCPGRAMS = validateCPGRAMS;

window.resetValidation = resetValidation;

window.validateRequired = validateRequired;

window.validateMobile = validateMobile;

window.validateDropdown = validateDropdown;

//==========================================================
// END OF FILE
//==========================================================