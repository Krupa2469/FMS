/******************************************************************
 * field-extractor.js
 * Enterprise Parser V2
 * CPGRAMS / PMOPG / DORLD / DARPG
 *
 * Lekha Technologies
 ******************************************************************/

"use strict";

console.log("Field Extractor V2 Loaded");


/*---------------------------------------------------------------
    MAIN EXTRACTION
----------------------------------------------------------------*/

function extractFields(text, layout) {

    console.log(
        "Extracting fields from :",
        layout ? layout.name : "UNKNOWN"
    );

    if (!text) {
        return {};
    }

    const layoutName =
        layout && layout.name
            ? layout.name
            : "GENERIC_LAYOUT";

    switch (layoutName) {

        case "PMOPG_LAYOUT":
            return extractPMOPG(text);

        case "DORLD_LAYOUT":
            return extractDORLD(text);

        case "DARPG_LAYOUT":
            return extractDARPG(text);

        case "CPGRAMS_LAYOUT":
            return extractCPGRAMS(text);

        default:
            return extractGeneric(text);
    }
}


/*---------------------------------------------------------------
    COMMON EXTRACTION
----------------------------------------------------------------*/

function extractCommonFields(text) {

    const dateReceived =
        typeof extractDateReceived === "function"
            ? extractDateReceived(text)
            : "";

let dueDate = "";

if (dateReceived) {

    const received = new Date(dateReceived);

    if (!isNaN(received.getTime())) {

        received.setDate(
            received.getDate() + 21
        );

        const yyyy =
            received.getFullYear();

        const mm =
            String(received.getMonth() + 1)
                .padStart(2, "0");

        const dd =
            String(received.getDate())
                .padStart(2, "0");

        dueDate =
            `${yyyy}-${mm}-${dd}`;
    }
}
    return {

        grievanceNumber:
            typeof extractRegistrationNumber === "function"
                ? extractRegistrationNumber(text)
                : "",

        dateReceived:
            dateReceived,

        dueDate:
            dueDate,

        complainantName:
            typeof extractComplainantName === "function"
                ? extractComplainantName(text)
                : "",

        mobile:
            typeof extractMobile === "function"
                ? extractMobile(text)
                : "",

        email:
            typeof extractEmail === "function"
                ? extractEmail(text)
                : "",

        address:
            typeof extractAddress === "function"
                ? extractAddress(text)
                : "",

        district:
            typeof extractDistrict === "function"
                ? extractDistrict(text)
                : "",

        mandal:
            typeof extractMandal === "function"
                ? extractMandal(text)
                : "",

        village:
            typeof extractVillage === "function"
                ? extractVillage(text)
                : "",

        state:
            typeof extractState === "function"
                ? extractState(text)
                : "",

        department:
            typeof extractDepartment === "function"
                ? extractDepartment(text)
                : "",

        category:
            extractCategoryV2(text),

        nature:
            extractNatureV2(text),

        priority:
            extractPriorityV2(text),

        subject:
            typeof extractSubject === "function"
                ? extractSubject(text)
                : "",

        grievanceDescription:
            typeof extractDescription === "function"
                ? extractDescription(text)
                : ""
    };
}


/*---------------------------------------------------------------
    PMOPG
----------------------------------------------------------------*/

function extractPMOPG(text) {

    return extractCommonFields(text);
}


/*---------------------------------------------------------------
    DORLD
----------------------------------------------------------------*/

function extractDORLD(text) {

    return extractCommonFields(text);
}


/*---------------------------------------------------------------
    DARPG
----------------------------------------------------------------*/

function extractDARPG(text) {

    return extractCommonFields(text);
}


/*---------------------------------------------------------------
    CPGRAMS
----------------------------------------------------------------*/

function extractCPGRAMS(text) {

    const result =
        extractCommonFields(text);

    console.log(
        "CPGRAMS extracted fields:",
        result
    );

    return result;
}


/*---------------------------------------------------------------
    GENERIC
----------------------------------------------------------------*/

function extractGeneric(text) {

    return extractCommonFields(text);
}


/*---------------------------------------------------------------
    CATEGORY
----------------------------------------------------------------*/

function extractCategoryV2(text) {

    if (!text) {
        return "Others";
    }

    const upper =
        text.toUpperCase();

    const categories = [

        {
            keywords: [
                "MGNREGS",
                "MGNREGA",
                "NREGA",
                "SALARIES",
                "SALARY",
                "WAGES",
                "PENDING WAGES",
                "PENDING SALARIES"
            ],
            value: "MGNREGS"
        },

        {
            keywords: [
                "DRINKING WATER",
                "WATER SUPPLY",
                "SAFE DRINKING WATER"
            ],
            value: "Drinking Water"
        },

        {
            keywords: [
                "ROAD",
                "ROADS",
                "ROAD WORK",
                "ROAD REPAIR"
            ],
            value: "Roads"
        },

        {
            keywords: [
                "DRAINAGE",
                "DRAIN",
                "DRAINS"
            ],
            value: "Drainage"
        },

        {
            keywords: [
                "PENSION",
                "PENSIONS",
                "OLD AGE PENSION",
                "WIDOW PENSION"
            ],
            value: "Pensions"
        },

        {
            keywords: [
                "HOUSING",
                "HOUSE CONSTRUCTION",
                "HOUSE",
                "DWELLING"
            ],
            value: "Housing"
        },

        {
            keywords: [
                "PMAY",
                "PRADHAN MANTRI AWAAS"
            ],
            value: "PMAY"
        },

        {
            keywords: [
                "ELECTRICITY",
                "POWER SUPPLY",
                "CURRENT SUPPLY"
            ],
            value: "Electricity"
        },

        {
            keywords: [
                "SANITATION",
                "TOILET",
                "TOILETS"
            ],
            value: "Sanitation"
        },

        {
            keywords: [
                "AGRICULTURE",
                "FARMER",
                "FARMERS",
                "CROP",
                "CROPS"
            ],
            value: "Agriculture"
        },

        {
            keywords: [
                "REVENUE",
                "LAND",
                "LAND RECORD",
                "LAND RECORDS"
            ],
            value: "Revenue"
        },

        {
            keywords: [
                "EDUCATION",
                "SCHOOL",
                "SCHOOLS",
                "TEACHER",
                "TEACHERS"
            ],
            value: "Education"
        },

        {
            keywords: [
                "HEALTH",
                "HOSPITAL",
                "HOSPITALS",
                "MEDICAL",
                "HEALTHCARE"
            ],
            value: "Health"
        }
    ];


    for (const item of categories) {

        for (const keyword of item.keywords) {

            if (upper.includes(keyword)) {

                console.log(
                    "Category detected:",
                    item.value,
                    "from keyword:",
                    keyword
                );

                return item.value;
            }
        }
    }


    return "Others";
}


/*---------------------------------------------------------------
    NATURE OF GRIEVANCE
----------------------------------------------------------------*/

function extractNatureV2(text) {

    if (!text) {
        return "Individual";
    }

    const upper =
        text.toUpperCase();


    /*
        Community / public indicators
    */

    if (
        upper.includes("VILLAGE") ||
        upper.includes("ROAD") ||
        upper.includes("ROADS") ||
        upper.includes("COMMUNITY") ||
        upper.includes("PUBLIC") ||
        upper.includes("ALL VILLAGERS") ||
        upper.includes("VILLAGERS") ||
        upper.includes("GENERAL PUBLIC") ||
        upper.includes("LOCAL RESIDENTS")
    ) {

        return "Community";
    }


    return "Individual";
}


/*---------------------------------------------------------------
    PRIORITY
----------------------------------------------------------------*/

function extractPriorityV2(text) {

    if (!text) {
        return "Normal";
    }

    const upper =
        text.toUpperCase();


    /*
        Very Urgent must be checked first.
    */

    if (
        upper.includes("VERY URGENT") ||
        upper.includes("IMMEDIATELY") ||
        upper.includes("MOST URGENT") ||
        upper.includes("TOP PRIORITY")
    ) {

        return "Very Urgent";
    }


    /*
        Urgent indicators
    */

    if (
        upper.includes("URGENT") ||
        upper.includes("EMERGENCY") ||
        upper.includes("EMERGENCY CASE") ||
        upper.includes("URGENTLY")
    ) {

        return "Urgent";
    }


    return "Normal";
}


/*---------------------------------------------------------------
    EXPORT
----------------------------------------------------------------*/

window.extractFields =
    extractFields;

console.log(
    "Enterprise Parser V2 Field Extractor Ready"
);