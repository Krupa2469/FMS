/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : validation.js
    Version     : 1.0.0
    Description : Common Validation Functions
==========================================================*/

"use strict";

/*==========================================================
CHECK EMPTY
==========================================================*/

function isEmpty(value)
{
    return value === null ||
           value === undefined ||
           value.toString().trim() === "";
}


/*==========================================================
REQUIRED FIELD
==========================================================*/

function validateRequired(id, fieldName)
{
    const value = getValue(id);

    if(isEmpty(value))
    {
        alert(fieldName + " is required.");

        setFocus(id);

        return false;
    }

    return true;
}


/*==========================================================
DATE VALIDATION
==========================================================*/

function validateDate(id, fieldName)
{
    const value = getValue(id);

    if(isEmpty(value))
    {
        return true;
    }

    if(isNaN(Date.parse(value)))
    {
        alert("Invalid " + fieldName + ".");

        setFocus(id);

        return false;
    }

    return true;
}


/*==========================================================
NUMBER VALIDATION
==========================================================*/

function validateNumber(id, fieldName)
{
    const value = getValue(id);

    if(isEmpty(value))
    {
        return true;
    }

    if(isNaN(value))
    {
        alert(fieldName + " must be numeric.");

        setFocus(id);

        return false;
    }

    return true;
}


/*==========================================================
POSITIVE NUMBER
==========================================================*/

function validatePositiveNumber(id, fieldName)
{
    const value = getValue(id);

    if(isEmpty(value))
    {
        return true;
    }

    if(Number(value) < 0)
    {
        alert(fieldName + " cannot be negative.");

        setFocus(id);

        return false;
    }

    return true;
}


/*==========================================================
EMAIL VALIDATION
==========================================================*/

function validateEmail(id)
{
    const value = getValue(id);

    if(isEmpty(value))
    {
        return true;
    }

    const pattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!pattern.test(value))
    {
        alert("Invalid Email Address.");

        setFocus(id);

        return false;
    }

    return true;
}


/*==========================================================
MOBILE VALIDATION
==========================================================*/

function validateMobile(id)
{
    const value = getValue(id);

    if(isEmpty(value))
    {
        return true;
    }

    const pattern = /^[6-9][0-9]{9}$/;

    if(!pattern.test(value))
    {
        alert("Invalid Mobile Number.");

        setFocus(id);

        return false;
    }

    return true;
}


/*==========================================================
PINCODE VALIDATION
==========================================================*/

function validatePincode(id)
{
    const value = getValue(id);

    if(isEmpty(value))
    {
        return true;
    }

    const pattern = /^[0-9]{6}$/;

    if(!pattern.test(value))
    {
        alert("Invalid PIN Code.");

        setFocus(id);

        return false;
    }

    return true;
}


/*==========================================================
MAX LENGTH
==========================================================*/

function validateMaxLength(id, length, fieldName)
{
    const value = getValue(id);

    if(value.length > length)
    {
        alert(fieldName + " cannot exceed " + length + " characters.");

        setFocus(id);

        return false;
    }

    return true;
}


/*==========================================================
MIN LENGTH
==========================================================*/

function validateMinLength(id, length, fieldName)
{
    const value = getValue(id);

    if(value.length < length)
    {
        alert(fieldName + " should contain at least " + length + " characters.");

        setFocus(id);

        return false;
    }

    return true;
}


/*==========================================================
VALIDATE FORM
==========================================================*/

function validateForm(validations)
{
    for(let validation of validations)
    {
        if(!validation())
        {
            return false;
        }
    }

    return true;
}

/*==========================================================
CPGRAMS VALIDATION
==========================================================*/

function validateCPGRAMS()
{
    if (!required("complainantName", "Please enter Complainant Name"))
        return false;

    if (!required("grievanceNumber", "Please enter Grievance Number"))
        return false;

    if (!required("subject", "Please enter Subject"))
        return false;

    if (!required("district", "Please select District"))
        return false;

    if (!required("description", "Please enter Description"))
        return false;

    return true;
}

/*==========================================================
REQUIRED FIELD
==========================================================*/

function required(id, message)
{
    const control = document.getElementById(id);

    if (!control)
        return false;

    if (control.value.trim() === "")
    {
        alert(message);

        control.focus();

        return false;
    }

    return true;
}

/*==========================================================
END OF FILE
==========================================================*/