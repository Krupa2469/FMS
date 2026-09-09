/******************************************************************
 * name-extractor.js
 * Enterprise Parser V2
 * Name Extraction Engine
 * Version 2.1
 ******************************************************************/

console.log("Name Extractor V2.1 Loaded");


/*---------------------------------------------------------------
    Extract Complainant / Applicant Name
---------------------------------------------------------------*/
function extractComplainantName(text) {

    if (!text)
        return "";

    /*
     * CPGRAMS PDF commonly produces:
     *
     * Name Narendra Ganapa Date of receipt 04/09/2015
     *
     * The old parser was capturing:
     * Narendra Ganapa Date of receipt
     *
     * This version stops the name at the next field label.
     */

    const patterns = [

        /Name\s*[:\-]?\s*([A-Za-z][A-Za-z .]{2,80}?)(?=\s+(?:Date\s+of\s+receipt|Address|Mobile(?:\s+No\.?)?|Email|District|State|Pin(?:\s+Code)?|Grievance\s+Description)\b)/i,

        /Complainant\s*[:\-]?\s*([A-Za-z][A-Za-z .]{2,80}?)(?=\s+(?:Date\s+of\s+receipt|Address|Mobile(?:\s+No\.?)?|Email|District|State|Pin(?:\s+Code)?|Grievance\s+Description)\b)/i,

        /Applicant\s*[:\-]?\s*([A-Za-z][A-Za-z .]{2,80}?)(?=\s+(?:Date\s+of\s+receipt|Address|Mobile(?:\s+No\.?)?|Email|District|State|Pin(?:\s+Code)?|Grievance\s+Description)\b)/i,

        /Petitioner\s*[:\-]?\s*([A-Za-z][A-Za-z .]{2,80}?)(?=\s+(?:Date\s+of\s+receipt|Address|Mobile(?:\s+No\.?)?|Email|District|State|Pin(?:\s+Code)?|Grievance\s+Description)\b)/i,

        /The\s+grievance\s+of\s+Shri\s+([A-Za-z][A-Za-z .]{2,80}?)(?=\s+(?:Date\s+of\s+receipt|Address|Mobile|Email|District)\b)/i,

        /The\s+grievance\s+of\s+Smt\.?\s+([A-Za-z][A-Za-z .]{2,80}?)(?=\s+(?:Date\s+of\s+receipt|Address|Mobile|Email|District)\b)/i,

        /The\s+grievance\s+of\s+Sri\s+([A-Za-z][A-Za-z .]{2,80}?)(?=\s+(?:Date\s+of\s+receipt|Address|Mobile|Email|District)\b)/i

    ];


    for (const pattern of patterns) {

        const match = text.match(pattern);

        if (match) {

            const name =
                cleanPersonName(match[1]);

            if (isGoodPersonName(name))
                return name;

        }

    }


    return "";
}


/*---------------------------------------------------------------
    Name Cleaner
---------------------------------------------------------------*/
function cleanPersonName(name) {

    if (!name)
        return "";

    return name

        .replace(/\s+/g, " ")

        .replace(
            /\bDate\s+of\s+receipt\b.*$/i,
            ""
        )

        .replace(
            /\bAddress\b.*$/i,
            ""
        )

        .replace(
            /\bMobile(?:\s+No\.?)?\b.*$/i,
            ""
        )

        .replace(
            /\bEmail\b.*$/i,
            ""
        )

        .replace(
            /\bDistrict\b.*$/i,
            ""
        )

        .replace(
            /\bState\b.*$/i,
            ""
        )

        .replace(
            /\bPin(?:\s+Code)?\b.*$/i,
            ""
        )

        .trim();

}


/*---------------------------------------------------------------
    Validate Person Name
---------------------------------------------------------------*/
function isGoodPersonName(name) {

    if (!name)
        return false;

    if (
        name.length < 3 ||
        name.length > 80
    )
        return false;


    /*
     * Do not accept a name containing
     * another field label.
     */

    if (
        /\b(?:Date|Address|Mobile|Email|District|State|Pin)\b/i
            .test(name)
    )
        return false;


    /*
     * Name must contain alphabetic characters.
     */

    if (!/[A-Za-z]/.test(name))
        return false;


    return true;

}


/*---------------------------------------------------------------
    Officer Name
---------------------------------------------------------------*/
function extractOfficerName(text) {

    const patterns = [

        /Officer\s*[:\-]?\s*(.*)/i,

        /PIO\s*[:\-]?\s*(.*)/i,

        /Commissioner\s*[:\-]?\s*(.*)/i

    ];


    for (const pattern of patterns) {

        const match =
            text.match(pattern);

        if (match)
            return cleanPersonName(match[1]);

    }


    return "";

}


/*---------------------------------------------------------------
    EXPORT
---------------------------------------------------------------*/

window.extractComplainantName =
    extractComplainantName;

window.extractOfficerName =
    extractOfficerName;