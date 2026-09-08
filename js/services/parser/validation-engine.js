/******************************************************************
 * validation-engine.js
 * Enterprise Parser V2
 * Validation Engine
 ******************************************************************/

console.log("Validation Engine Loaded");

/*---------------------------------------------------------------
    Validate Extracted Fields
---------------------------------------------------------------*/
function validateFields(fields) {

    const validation = {

        valid: true,

        score: 100,

        errors: [],

        warnings: []

    };

    /*-----------------------------------------------------------
        Mandatory Fields
    -----------------------------------------------------------*/

    validateRequired(
        fields.grievanceNumber,
        "Grievance Number",
        validation
    );

    validateRequired(
        fields.dateReceived,
        "Date Received",
        validation
    );

    validateRequired(
        fields.complainantName,
        "Complainant Name",
        validation
    );

    validateRequired(
        fields.grievanceDescription,
        "Grievance Description",
        validation
    );

    /*-----------------------------------------------------------
        Date Validation
    -----------------------------------------------------------*/

    if (fields.dateReceived) {

        if (!isValidDate(fields.dateReceived)) {

            validation.errors.push(
                "Invalid Date Received"
            );

            validation.score -= 15;

        }

    }

    /*-----------------------------------------------------------
        Email
    -----------------------------------------------------------*/

    if (fields.email &&
        !isValidEmail(fields.email)) {

        validation.warnings.push(
            "Email format appears invalid."
        );

        validation.score -= 5;

    }

    /*-----------------------------------------------------------
        Mobile
    -----------------------------------------------------------*/

    if (fields.mobile &&
        !isValidMobile(fields.mobile)) {

        validation.warnings.push(
            "Mobile number appears invalid."
        );

        validation.score -= 5;

    }

    validation.valid =
        validation.errors.length === 0;

    return validation;

}

/*---------------------------------------------------------------
    Required Field
---------------------------------------------------------------*/
function validateRequired(value, label, validation) {

    if (
        value === undefined ||
        value === null ||
        value.toString().trim() === ""
    ) {

        validation.errors.push(

            label + " is missing."

        );

        validation.score -= 20;

    }

}

/*---------------------------------------------------------------
    Date Validation
---------------------------------------------------------------*/
function isValidDate(date) {

    return /^\d{4}-\d{2}-\d{2}$/.test(date);

}

/*---------------------------------------------------------------
    Email Validation
---------------------------------------------------------------*/
function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}

/*---------------------------------------------------------------
    Mobile Validation
---------------------------------------------------------------*/
function isValidMobile(mobile) {

    return /^[6-9]\d{9}$/.test(mobile);

}

/*---------------------------------------------------------------
    Export
---------------------------------------------------------------*/

window.validateFields = validateFields;