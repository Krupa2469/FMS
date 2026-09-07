/******************************************************************
 * classification-engine.js
 * Enterprise Parser V2
 * CPGRAMS Intelligent Classification Engine
 ******************************************************************/

console.log("Classification Engine V2 Loaded");


/*---------------------------------------------------------------
    MAIN CLASSIFICATION
----------------------------------------------------------------*/

function classifyGrievance(data) {

    const text = [
        data.subject || "",
        data.grievanceDescription || "",
        data.category || "",
        data.department || ""
    ]
        .join(" ")
        .toUpperCase();


    const category =
        classifyCategory(text);

    const nature =
        classifyNature(text);

    const priority =
        classifyPriority(text);


    return {

        category: category,

        nature: nature,

        priority: priority

    };
}


/*---------------------------------------------------------------
    CATEGORY CLASSIFICATION
----------------------------------------------------------------*/

function classifyCategory(text) {

    const rules = [

        {
            category: "MGNREGS",
            keywords: [
                "MGNREGS",
                "MGNREGA",
                "NREGA",
                "EMPLOYMENT GUARANTEE",
                "WAGES",
                "WAGE",
                "LABOUR PAYMENT",
                "LABOR PAYMENT",
                "JOB CARD",
                "WORKERS",
                "WORKER"
            ]
        },

        {
            category: "Roads",
            keywords: [
                "ROAD",
                "ROADS",
                "ROAD REPAIR",
                "ROAD DAMAGE",
                "ROAD CONSTRUCTION"
            ]
        },

        {
            category: "Drinking Water",
            keywords: [
                "DRINKING WATER",
                "WATER SUPPLY",
                "SAFE WATER",
                "WATER PIPELINE",
                "WATER SHORTAGE"
            ]
        },

        {
            category: "Pensions",
            keywords: [
                "PENSION",
                "PENSIONS",
                "OLD AGE PENSION",
                "DISABILITY PENSION",
                "WIDOW PENSION"
            ]
        },

        {
            category: "Housing",
            keywords: [
                "HOUSING",
                "HOUSE",
                "HOUSE CONSTRUCTION",
                "DWELLING"
            ]
        },

        {
            category: "PMAY",
            keywords: [
                "PMAY",
                "PMAY-G",
                "PRADHAN MANTRI AWAS"
            ]
        },

        {
            category: "Drainage",
            keywords: [
                "DRAINAGE",
                "DRAIN",
                "SEWERAGE",
                "SEWER"
            ]
        },

        {
            category: "Electricity",
            keywords: [
                "ELECTRICITY",
                "POWER SUPPLY",
                "CURRENT",
                "POWER CUT",
                "ELECTRICAL"
            ]
        }

    ];


    for (const rule of rules) {

        for (const keyword of rule.keywords) {

            if (text.includes(keyword)) {

                return rule.category;

            }

        }

    }


    return "Others";
}


/*---------------------------------------------------------------
    NATURE CLASSIFICATION
----------------------------------------------------------------*/

function classifyNature(text) {

    const communityKeywords = [

        "VILLAGE",
        "VILLAGES",
        "COMMUNITY",
        "ROAD",
        "ROADS",
        "PUBLIC",
        "COLONY",
        "HABITATION",
        "LOCALITY",
        "WATER SUPPLY",
        "DRAINAGE",
        "STREET",
        "STREETS"
    ];


    for (const keyword of communityKeywords) {

        if (text.includes(keyword)) {

            return "Community";

        }

    }


    return "Individual";
}


/*---------------------------------------------------------------
    PRIORITY CLASSIFICATION
----------------------------------------------------------------*/

function classifyPriority(text) {

    const veryUrgentKeywords = [

        "VERY URGENT",
        "IMMEDIATELY",
        "LIFE THREAT",
        "LIFE THREATENING",
        "CRITICAL",
        "EMERGENCY"
    ];


    for (const keyword of veryUrgentKeywords) {

        if (text.includes(keyword)) {

            return "Very Urgent";

        }

    }


    const urgentKeywords = [

        "URGENT",
        "URGENTLY",
        "IMMEDIATE ATTENTION",
        "PRIORITY"
    ];


    for (const keyword of urgentKeywords) {

        if (text.includes(keyword)) {

            return "Urgent";

        }

    }


    return "Normal";
}


/*---------------------------------------------------------------
    EXPORT
----------------------------------------------------------------*/

window.classifyGrievance =
    classifyGrievance;

window.classifyCategory =
    classifyCategory;

window.classifyNature =
    classifyNature;

window.classifyPriority =
    classifyPriority;