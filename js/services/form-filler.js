/******************************************************************
 * form-filler.js
 * CPGRAMS Enterprise Parser V2
 * Form Auto-Fill Engine
 * Version 2.3
 ******************************************************************/

console.log("Form Filler V2.3 Loaded");


/*===============================================================
    SET VALUE
================================================================*/

function setValue(id, value) {

    if (
        value === undefined ||
        value === null
    ) {
        return;
    }


    const control =
        document.getElementById(id);


    if (!control) {

        console.warn(
            "Control not found:",
            id
        );

        return;

    }


    control.value = value;

}


/*===============================================================
    DATE FORMAT
================================================================*/

/*
 * Parser stores dates as:
 *
 * YYYY-MM-DD
 *
 * The HTML date input requires:
 *
 * YYYY-MM-DD
 *
 * Therefore we keep the internal value unchanged.
 */
function formatDateForInput(dateValue) {

    if (!dateValue) {
        return "";
    }

    // YYYY-MM-DD → DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {

        const parts = dateValue.split("-");

        const yyyy = parts[0];
        const mm = parts[1];
        const dd = parts[2];

        return `${dd}/${mm}/${yyyy}`;
    }

    // Already DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
        return dateValue;
    }

    return dateValue;
}

/*===============================================================
    FILL CPGRAMS FORM
================================================================*/

function fillCPGRAMSForm(data) {

    console.log(
        "========== AUTO FILL START =========="
    );

    console.table(data);


    /*===========================================================
        SECTION 1
    ===========================================================*/


    /*
     * Grievance Number
     */

    setValue(
        "grievanceNumber",
        data.grievanceNumber
    );


    /*
     * Date Received
     */

    // Date Received
// Native date input requires YYYY-MM-DD
setValue(
    "dateReceived",
    formatDateForDisplay(
        data.dateReceived
    )
);

function formatDateForDisplay(dateValue) {

    if (!dateValue) {
        return "";
    }

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {

        const parts =
            dateValue.split("-");

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // Already DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {

        return dateValue;
    }

    return dateValue;
}
// Due Date

// Display as DD/MM/YYYY
setValue(
    "dueDate",
    formatDateForInput(
        data.dueDate
    )
);

    /*
     * Priority
     */

    if (data.priority) {

        setValue(
            "priority",
            data.priority
        );

    }


    /*
     * Subject
     */

    setValue(
        "subject",
        data.subject
    );


    /*
     * Grievance Description
     */

    setValue(
        "grievanceDescription",
        data.grievanceDescription
    );


    /*
     * Category
     */

    setValue(
        "category",
        data.category
    );


    /*
     * Nature of Grievance
     */

    setValue(
        "natureOfGrievance",
        data.nature
    );


    /*
     * Priority Classification
     */

    setValue(
        "priorityClassification",
        data.priority
    );


    /*
     * Attachment Count
     */

    if (
        document.getElementById(
            "attachmentCount"
        )
    ) {

        setValue(
            "attachmentCount",
            1
        );

    }


    /*===========================================================
        SECTION 2
    ===========================================================*/


    /*
     * Complainant Name
     */

    setValue(
        "complainantName",
        data.complainantName
    );


    /*
     * Mobile Number
     */

    setValue(
        "mobileNumber",
        data.mobile
    );


    /*
     * Email
     */

    setValue(
        "email",
        data.email
    );


    /*
     * District
     */

    setValue(
        "districtManual",
        data.district
    );


    /*
     * Address
     */

    setValue(
        "address",
        data.address
    );


    /*===========================================================
        SECTION 3
    ===========================================================*/


    /*
     * Office File Subject
     */

    setValue(
        "officeSubject",
        data.subject
    );


    /*
     * Department
     */

    setValue(
        "Department",
        data.department
    );


    /*
     * Section
     */

    setValue(
        "Section",
        data.section
    );


    /*===========================================================
        FINAL LOG
    ===========================================================*/

    console.log(
        "Category:",
        data.category
    );

    console.log(
        "Nature:",
        data.nature
    );

    console.log(
        "Priority:",
        data.priority
    );

    console.log(
        "Subject:",
        data.subject
    );

    console.log(
        "Form Auto Filled Successfully"
    );

}


/*===============================================================
    EXPORT
================================================================*/

window.fillCPGRAMSForm =
    fillCPGRAMSForm;

window.setValue =
    setValue;

window.formatDateForInput =
    formatDateForInput;