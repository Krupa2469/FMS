/******************************************************************
 * parser-utils.js
 * Enterprise Parser V2
 * Common Extraction Functions
 * Version 2.1
 ******************************************************************/

console.log("Parser Utils V2.1 Loaded");


/*---------------------------------------------------------------
    Normalize Text
---------------------------------------------------------------*/
function normalizeText(text) {

    if (!text) return "";

    return text
        .replace(/\r/g, "")
        .replace(/\t/g, " ")
        .replace(/\u00A0/g, " ")
        .replace(/[ ]+/g, " ")
        .replace(/\n{2,}/g, "\n")
        .trim();
}


/*---------------------------------------------------------------
    Registration Number
---------------------------------------------------------------*/
function extractRegistrationNumber(text) {

    if (!text) return "";

    const patterns = [

        /(PMOPG\s*\/\s*[A-Z]\s*\/\s*\d{4}\s*\/\s*\d+)/i,

        /(DORLD\s*\/\s*[A-Z]\s*\/\s*\d{4}\s*\/\s*\d+)/i,

        /(DARPG\s*\/\s*[A-Z]\s*\/\s*\d{4}\s*\/\s*\d+)/i,

        /(GOI\s*\/\s*[A-Z]\s*\/\s*\d{4}\s*\/\s*\d+)/i,

        /(CPGRAMS\s*\/\s*[A-Z]\s*\/\s*\d{4}\s*\/\s*\d+)/i

    ];

    for (const pattern of patterns) {

        const match = text.match(pattern);

        if (match) {

            return match[1]
                .replace(/\s+/g, "")
                .trim();

        }

    }

    return "";
}


/*---------------------------------------------------------------
    Date Pattern
---------------------------------------------------------------*/
function isDateString(value) {

    if (!value) return false;

    return /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(value);

}


/*---------------------------------------------------------------
    Date Received
---------------------------------------------------------------*/
function extractDateReceived(text) {

    if (!text) return "";

    const patterns = [

        /Date\s+of\s+Receipt\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,

        /Date\s+Received\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,

        /Received\s+On\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,

        /Registration\s+Date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,

        /Date\s+of\s+Registration\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,

        /Date\s+of\s+Complaint\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i

    ];


    /*-----------------------------------------------------------
        First preference: labelled date
    -----------------------------------------------------------*/

    for (const pattern of patterns) {

        const match = text.match(pattern);

        if (match) {

            const converted =
                convertDate(match[1]);

            if (converted)
                return converted;

        }

    }


    /*-----------------------------------------------------------
        Fallback
        Use first valid date only when no labelled date exists.
    -----------------------------------------------------------*/

    const dates = text.match(
        /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g
    );

    if (dates && dates.length > 0) {

        for (const date of dates) {

            const converted =
                convertDate(date);

            if (converted)
                return converted;

        }

    }

    return "";
}


/*---------------------------------------------------------------
    Date Converter
    DD/MM/YYYY → YYYY-MM-DD
---------------------------------------------------------------*/
function convertDate(dateString) {

    if (!dateString)
        return "";

    const separator =
        dateString.includes("/")
            ? "/"
            : "-";

    const parts =
        dateString.split(separator);

    if (parts.length !== 3)
        return "";

    const day =
        parseInt(parts[0], 10);

    const month =
        parseInt(parts[1], 10);

    const year =
        parseInt(parts[2], 10);


    if (
        isNaN(day) ||
        isNaN(month) ||
        isNaN(year)
    ) {

        return "";

    }


    if (
        day < 1 ||
        day > 31 ||
        month < 1 ||
        month > 12 ||
        year < 1900
    ) {

        return "";

    }


    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

}


/*---------------------------------------------------------------
    Due Date
    CPGRAMS = 21 Days
---------------------------------------------------------------*/
function calculateCPGRAMSDueDate(receivedDate, days = 21) {

    if (!receivedDate)
        return "";

    const parts =
        receivedDate.split("-");

    if (parts.length !== 3)
        return "";

    const year =
        parseInt(parts[0], 10);

    const month =
        parseInt(parts[1], 10);

    const day =
        parseInt(parts[2], 10);


    if (
        isNaN(year) ||
        isNaN(month) ||
        isNaN(day)
    ) {

        return "";

    }


    /*-----------------------------------------------------------
        Use local date components.
        Avoid timezone/UTC conversion problems.
    -----------------------------------------------------------*/

    const due =
        new Date(
            year,
            month - 1,
            day
        );

    due.setDate(
        due.getDate() + days
    );


    const yyyy =
        due.getFullYear();

    const mm =
        String(
            due.getMonth() + 1
        ).padStart(2, "0");

    const dd =
        String(
            due.getDate()
        ).padStart(2, "0");


    const result =
        `${yyyy}-${mm}-${dd}`;


    console.log(
        "CPGRAMS Due Date:",
        receivedDate,
        "+",
        days,
        "days =",
        result
    );


    return result;

}


/*---------------------------------------------------------------
    Mobile
---------------------------------------------------------------*/
function extractMobile(text) {

    if (!text)
        return "";

    const match =
        text.match(
            /(?:\+91[\s-]?)?[6-9]\d{9}/
        );

    if (!match)
        return "";

    return match[0]
        .replace(/\+91/g, "")
        .replace(/[\s-]/g, "")
        .trim();

}


/*---------------------------------------------------------------
    Email
---------------------------------------------------------------*/
function extractEmail(text) {

    if (!text)
        return "";

    const match =
        text.match(
            /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
        );

    return match
        ? match[0].trim()
        : "";

}


/*---------------------------------------------------------------
    State
---------------------------------------------------------------*/
function extractState(text) {

    if (!text)
        return "";

    const states = [

        "Telangana",
        "Andhra Pradesh",
        "Karnataka",
        "Tamil Nadu",
        "Maharashtra",
        "Kerala",
        "Odisha"

    ];


    const upper =
        text.toUpperCase();


    for (const state of states) {

        if (
            upper.includes(
                state.toUpperCase()
            )
        ) {

            return state;

        }

    }

    return "";

}


/*---------------------------------------------------------------
    Browser Global Exports
---------------------------------------------------------------*/

window.normalizeText =
    normalizeText;

window.extractRegistrationNumber =
    extractRegistrationNumber;

window.extractDateReceived =
    extractDateReceived;

window.convertDate =
    convertDate;

window.calculateCPGRAMSDueDate =
    calculateDueDate;

window.extractMobile =
    extractMobile;

window.extractEmail =
    extractEmail;

window.extractState =
    extractState;