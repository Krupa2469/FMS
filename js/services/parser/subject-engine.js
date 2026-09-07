/******************************************************************
 * subject-engine.js
 * Enterprise Document Parser V2
 * CPGRAMS Smart Subject Engine
 * Version 2.2
 ******************************************************************/

console.log("Subject Engine V2.2 Loaded");


/*===============================================================
    BUILD SMART SUBJECT
================================================================*/

function buildSmartSubject(fields) {

    /*
     * Always make sure fields exists.
     */

    if (!fields) {
        return "General Public Grievance";
    }


    /*
     * Read fields safely.
     */

    const description =
        String(
            fields.grievanceDescription ||
            ""
        ).trim();


    const category =
        String(
            fields.category ||
            ""
        ).trim();


    const department =
        String(
            fields.department ||
            ""
        ).trim();


    const existingSubject =
        String(
            fields.subject ||
            ""
        ).trim();


    console.log(
        "========== SMART SUBJECT =========="
    );

    console.log(
        "Category:",
        category
    );

    console.log(
        "Department:",
        department
    );

    console.log(
        "Description:",
        description.substring(0, 200)
    );


    /*-----------------------------------------------------------
        STEP 1
        If a real subject already exists, use it.
    -----------------------------------------------------------*/

    if (
        existingSubject &&
        !isGenericSubject(existingSubject)
    ) {

        return cleanSubject(
            existingSubject
        );

    }


    /*-----------------------------------------------------------
        STEP 2
        Combine available information for classification.
    -----------------------------------------------------------*/

    const text =
        (
            category + " " +
            department + " " +
            description
        )
        .toLowerCase();


    /*===========================================================
        MGNREGS / MGNREGA
    ===========================================================*/

    if (
        text.includes("mgnregs") ||
        text.includes("mgnrega") ||
        text.includes("employment guarantee") ||
        text.includes("employment scheme") ||
        text.includes("100 days employment")
    ) {

        if (
            text.includes("wage") ||
            text.includes("wages") ||
            text.includes("salary") ||
            text.includes("payment") ||
            text.includes("200 rupee") ||
            text.includes("200 rupees") ||
            text.includes("150 rs") ||
            text.includes("160") ||
            text.includes("150")
        ) {

            return "MGNREGS Employment and Wage Issue";

        }


        return "MGNREGS Employment Issue";

    }


    /*===========================================================
        AGRICULTURE
    ===========================================================*/

    if (
        text.includes("agriculture") ||
        text.includes("agricultural") ||
        text.includes("farmer") ||
        text.includes("farmers") ||
        text.includes("crop") ||
        text.includes("cultivation")
    ) {

        return "Agricultural Related Grievance";

    }


    /*===========================================================
        ROAD
    ===========================================================*/

    if (
        text.includes("road") ||
        text.includes("roads") ||
        text.includes("road repair") ||
        text.includes("road construction")
    ) {

        return "Road Construction / Repair Issue";

    }


    /*===========================================================
        WATER
    ===========================================================*/

    if (
        text.includes("drinking water") ||
        text.includes("water supply") ||
        text.includes("water problem") ||
        text.includes("water connection")
    ) {

        return "Drinking Water Supply Issue";

    }


    /*===========================================================
        PENSION
    ===========================================================*/

    if (
        text.includes("pension") ||
        text.includes("old age pension") ||
        text.includes("social security pension") ||
        text.includes("pension payment")
    ) {

        return "Pension Related Grievance";

    }


    /*===========================================================
        HOUSING
    ===========================================================*/

    if (
        text.includes("housing") ||
        text.includes("house") ||
        text.includes("pmay") ||
        text.includes("indira awas")
    ) {

        return "Housing Related Grievance";

    }


    /*===========================================================
        ELECTRICITY
    ===========================================================*/

    if (
        text.includes("electricity") ||
        text.includes("electric connection") ||
        text.includes("power supply") ||
        text.includes("power problem")
    ) {

        return "Electricity Related Grievance";

    }


    /*===========================================================
        DRAINAGE
    ===========================================================*/

    if (
        text.includes("drainage") ||
        text.includes("drain") ||
        text.includes("sewerage")
    ) {

        return "Drainage Related Grievance";

    }


    /*===========================================================
        WAGES / SALARY
    ===========================================================*/

    if (
        text.includes("pending wages") ||
        text.includes("pending wage") ||
        text.includes("pending salary") ||
        text.includes("salary not paid") ||
        text.includes("wages not paid")
    ) {

        return "Pending Wages / Salary Issue";

    }


    /*===========================================================
        CATEGORY BASED SUBJECT
    ===========================================================*/

    if (
        category &&
        category.toLowerCase() !== "others" &&
        category.toLowerCase() !== "select category"
    ) {

        return cleanSubject(
            category +
            " Related Grievance"
        );

    }


    /*===========================================================
        DEPARTMENT BASED SUBJECT
    ===========================================================*/

    if (department) {

        return cleanSubject(
            department +
            " Related Grievance"
        );

    }


    /*===========================================================
        DESCRIPTION BASED FALLBACK
    ===========================================================*/

    const generatedSubject =
        generateSubjectFromDescription(
            description
        );


    if (generatedSubject) {

        return generatedSubject;

    }


    /*===========================================================
        FINAL FALLBACK
    ===========================================================*/

    return "General Public Grievance";

}


/*===============================================================
    CHECK GENERIC SUBJECT
================================================================*/

function isGenericSubject(subject) {

    if (!subject)
        return true;


    const value =
        String(subject)
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();


    const genericSubjects = [

        "general public grievance",

        "public grievance",

        "general grievance",

        "grievance",

        "complaint",

        "general complaint",

        "general issue",

        "undefined grievance",

        "undefined"

    ];


    return genericSubjects.includes(
        value
    );

}


/*===============================================================
    GENERATE SUBJECT FROM DESCRIPTION
================================================================*/

function generateSubjectFromDescription(
    description
) {

    if (!description)
        return "";


    let text =
        description
            .replace(/\s+/g, " ")
            .trim();


    if (!text)
        return "";


    /*
     * Remove common CPGRAMS narrative openings.
     */

    text =
        text.replace(
            /^the grievance of\s+/i,
            ""
        );


    text =
        text.replace(
            /^the complaint of\s+/i,
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


    /*
     * Take the first meaningful sentence.
     */

    const sentences =
        text.split(/[.!?]/);


    for (
        const sentence of sentences
    ) {

        const clean =
            sentence
                .replace(/\s+/g, " ")
                .trim();


        if (
            clean.length >= 20 &&
            clean.length <= 120
        ) {

            return cleanSubject(
                clean
            );

        }

    }


    return "";

}


/*===============================================================
    CLEAN SUBJECT
================================================================*/

function cleanSubject(
    subject
) {

    if (!subject)
        return "General Public Grievance";


    return String(subject)

        .replace(
            /\s+/g,
            " "
        )

        .replace(
            /^[-:;,.\s]+/,
            ""
        )

        .replace(
            /[-:;,.\s]+$/,
            ""
        )

        .trim()

        .substring(
            0,
            250
        );

}


/*===============================================================
    EXPORT
================================================================*/

window.buildSmartSubject =
    buildSmartSubject;

window.isGenericSubject =
    isGenericSubject;


console.log(
    "Subject Engine V2.2 Ready"
);