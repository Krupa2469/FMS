/******************************************************************
 * smart-subject.js
 * Enterprise Document Parser V2
 * Smart Subject Engine
 ******************************************************************/

console.log("Smart Subject Engine Loaded");

/*===============================================================
    MAIN SMART SUBJECT ENGINE
================================================================*/

function buildSmartSubject(fields) {

    if (!fields)
        return "General Public Grievance";

    const description =
        String(fields.grievanceDescription || "").trim();

    const category =
        String(fields.category || "").trim();

    const department =
        String(fields.department || "").trim();

    /*-----------------------------------------------------------
        1. Use meaningful extracted subject if available
    -----------------------------------------------------------*/

    const existingSubject =
        String(fields.subject || "").trim();

    if (
        existingSubject &&
        !isGenericSubject(existingSubject)
    ) {
        return cleanSubject(existingSubject);
    }

    /*-----------------------------------------------------------
        2. Build subject from grievance description
    -----------------------------------------------------------*/

    const text =
        (
            category + " " +
            department + " " +
            description
        ).toLowerCase();

    /*-----------------------------------------------------------
        MGNREGS / Employment / Wages
    -----------------------------------------------------------*/

    if (
        text.includes("mgnregs") ||
        text.includes("mgnrega") ||
        text.includes("employment guarantee") ||
        text.includes("100 days employment") ||
        text.includes("daily employment") ||
        text.includes("wages")
    ) {

        if (
            text.includes("wage") ||
            text.includes("salary") ||
            text.includes("payment")
        ) {
            return "MGNREGS Employment and Wage Issue";
        }

        return "MGNREGS Employment Issue";
    }

    /*-----------------------------------------------------------
        Roads
    -----------------------------------------------------------*/

    if (
        text.includes("road") ||
        text.includes("roads") ||
        text.includes("repair of road") ||
        text.includes("road construction")
    ) {
        return "Road Construction / Repair Issue";
    }

    /*-----------------------------------------------------------
        Drinking Water
    -----------------------------------------------------------*/

    if (
        text.includes("drinking water") ||
        text.includes("water supply") ||
        text.includes("water problem")
    ) {
        return "Drinking Water Supply Issue";
    }

    /*-----------------------------------------------------------
        Pensions
    -----------------------------------------------------------*/

    if (
        text.includes("pension") ||
        text.includes("old age pension") ||
        text.includes("social security pension")
    ) {
        return "Pension Related Grievance";
    }

    /*-----------------------------------------------------------
        Housing
    -----------------------------------------------------------*/

    if (
        text.includes("housing") ||
        text.includes("house") ||
        text.includes("pmay") ||
        text.includes("indira awas")
    ) {
        return "Housing Related Grievance";
    }

    /*-----------------------------------------------------------
        Electricity
    -----------------------------------------------------------*/

    if (
        text.includes("electricity") ||
        text.includes("power supply") ||
        text.includes("electric connection")
    ) {
        return "Electricity Related Grievance";
    }

    /*-----------------------------------------------------------
        Drainage
    -----------------------------------------------------------*/

    if (
        text.includes("drainage") ||
        text.includes("drain") ||
        text.includes("sewerage")
    ) {
        return "Drainage Related Grievance";
    }

    /*-----------------------------------------------------------
        Agricultural Issue
    -----------------------------------------------------------*/

    if (
        text.includes("agriculture") ||
        text.includes("agricultural") ||
        text.includes("farmer") ||
        text.includes("crop") ||
        text.includes("cultivation")
    ) {
        return "Agricultural Related Grievance";
    }

    /*-----------------------------------------------------------
        If category is available
    -----------------------------------------------------------*/

    if (
        category &&
        category.toLowerCase() !== "others"
    ) {
        return category + " Related Grievance";
    }

    /*-----------------------------------------------------------
        Department based fallback
    -----------------------------------------------------------*/

    if (department) {
        return department + " Related Grievance";
    }

    /*-----------------------------------------------------------
        Description based fallback
    -----------------------------------------------------------*/

    const generated =
        generateSubjectFromDescription(description);

    if (generated)
        return generated;

    /*-----------------------------------------------------------
        Final fallback
    -----------------------------------------------------------*/

    return "General Public Grievance";
}


/*===============================================================
    GENERIC SUBJECT CHECK
================================================================*/

function isGenericSubject(subject) {

    const genericSubjects = [
        "general public grievance",
        "public grievance",
        "general grievance",
        "grievance",
        "complaint",
        "general complaint",
        "general issue"
    ];

    const normalized =
        subject
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

    return genericSubjects.includes(normalized);
}


/*===============================================================
    DESCRIPTION BASED SUBJECT
================================================================*/

function generateSubjectFromDescription(description) {

    if (!description)
        return "";

    let text =
        description
            .replace(/\s+/g, " ")
            .trim();

    if (!text)
        return "";

    /*-----------------------------------------------------------
        Remove common narrative openings
    -----------------------------------------------------------*/

    text =
        text.replace(
            /^the grievance of\s+(?:shri|smt\.?|sri)?\s*/i,
            ""
        );

    text =
        text.replace(
            /^the complaint of\s+(?:shri|smt\.?|sri)?\s*/i,
            ""
        );

    text =
        text.replace(
            /^the applicant has stated\s+/i,
            ""
        );

    text =
        text.replace(
            /^the applicant submitted\s+/i,
            ""
        );

    text =
        text.replace(
            /^the petitioner has stated\s+/i,
            ""
        );

    text =
        text.replace(
            /^it is submitted that\s+/i,
            ""
        );

    /*-----------------------------------------------------------
        Take first meaningful sentence
    -----------------------------------------------------------*/

    const sentences =
        text.split(/[.!?]/);

    for (const sentence of sentences) {

        const clean =
            sentence
                .replace(/\s+/g, " ")
                .trim();

        if (
            clean.length >= 15 &&
            clean.length <= 140
        ) {
            return makeTitleStyle(clean);
        }
    }

    return "";
}


/*===============================================================
    CLEAN SUBJECT
================================================================*/

function cleanSubject(subject) {

    if (!subject)
        return "General Public Grievance";

    return subject
        .replace(/\s+/g, " ")
        .replace(/^[-:;,.\s]+/, "")
        .replace(/[-:;,.\s]+$/, "")
        .trim()
        .substring(0, 250);
}


/*===============================================================
    TITLE STYLE
================================================================*/

function makeTitleStyle(text) {

    text =
        text
            .replace(/\s+/g, " ")
            .trim();

    if (!text)
        return "";

    /*-----------------------------------------------------------
        Avoid excessively long subject
    -----------------------------------------------------------*/

    if (text.length > 120) {
        text =
            text.substring(0, 120);

        const lastSpace =
            text.lastIndexOf(" ");

        if (lastSpace > 60)
            text =
                text.substring(0, lastSpace);
    }

    /*-----------------------------------------------------------
        Add grievance wording where appropriate
    -----------------------------------------------------------*/

    return cleanSubject(text);
}


/*===============================================================
    EXPORT
================================================================*/

window.buildSmartSubject =
    buildSmartSubject;

window.isGenericSubject =
    isGenericSubject;

console.log("Smart Subject Engine Ready");