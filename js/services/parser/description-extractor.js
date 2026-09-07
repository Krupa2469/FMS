/******************************************************************
 * description-extractor.js
 * Enterprise Parser V2
 * CPGRAMS Multi-Layout Description Extractor
 * Version 2.2
 ******************************************************************/

console.log("Description Extractor V2.2 Loaded");


/*---------------------------------------------------------------
    MAIN DESCRIPTION EXTRACTOR
---------------------------------------------------------------*/
function extractDescription(text) {

    if (!text)
        return "";

    const source =
        normalizeDescriptionText(text);

    if (!source)
        return "";


    /*-----------------------------------------------------------
        STEP 1
        CPGRAMS labelled description

        Important:
        PDF.js may return:

        Grievance description Namaste sir sir...

        on the SAME line.

        Therefore we must NOT depend on newline characters.
    -----------------------------------------------------------*/

    const labelledPatterns = [

        /Grievance\s+Description\s*:?\s*(.+?)(?=\s+(?:Name\s+of\s+Department|Department\s*,?\s*Govt\.?|Department\s+Name|Category|Status|Action\s+Taken|ATR\s+(?:Received|Awaited))\b)/is,

        /Grievance\s+Details\s*:?\s*(.+?)(?=\s+(?:Name\s+of\s+Department|Department\s*,?\s*Govt\.?|Department\s+Name|Category|Status|Action\s+Taken|ATR\s+(?:Received|Awaited))\b)/is,

        /Complaint\s+Details\s*:?\s*(.+?)(?=\s+(?:Name\s+of\s+Department|Department\s*,?\s*Govt\.?|Department\s+Name|Category|Status|Action\s+Taken|ATR\s+(?:Received|Awaited))\b)/is,

        /Complaint\s+Description\s*:?\s*(.+?)(?=\s+(?:Name\s+of\s+Department|Department\s*,?\s*Govt\.?|Department\s+Name|Category|Status|Action\s+Taken|ATR\s+(?:Received|Awaited))\b)/is,

        /Description\s*:?\s*(.+?)(?=\s+(?:Name\s+of\s+Department|Department\s*,?\s*Govt\.?|Department\s+Name|Category|Status|Action\s+Taken|ATR\s+(?:Received|Awaited))\b)/is

    ];


    for (const pattern of labelledPatterns) {

        const match =
            source.match(pattern);

        if (match && match[1]) {

            const description =
                cleanDescription(match[1]);

            if (
                isGoodDescription(
                    description
                )
            ) {

                console.log(
                    "Description found using labelled pattern"
                );

                return limitDescription(
                    description
                );

            }

        }

    }


    /*-----------------------------------------------------------
        STEP 2
        CPGRAMS narrative format

        Example:

        The grievance of Sri Jai Prakash Rapoli is related to...

        OR

        The complaint of ...
    -----------------------------------------------------------*/

    const narrativePatterns = [

        /(?:The\s+grievance\s+of|The\s+grievance\s+relates\s+to)\b/i,

        /(?:The\s+complaint\s+of|The\s+complaint\s+relates\s+to)\b/i,

        /(?:The\s+applicant\s+has\s+stated|The\s+applicant\s+submitted)\b/i,

        /(?:The\s+petitioner\s+has\s+stated|The\s+petitioner\s+submitted)\b/i,

        /(?:It\s+is\s+submitted\s+that)\b/i,

        /(?:The\s+applicant\s+has\s+requested)\b/i

    ];


    let startIndex = -1;


    for (
        const pattern of narrativePatterns
    ) {

        const match =
            source.match(pattern);

        if (match) {

            startIndex =
                match.index;

            break;

        }

    }


    if (startIndex !== -1) {

        const narrative =
            extractNarrativeBlock(
                source,
                startIndex
            );

        if (
            isGoodDescription(
                narrative
            )
        ) {

            console.log(
                "Description found using narrative pattern"
            );

            return limitDescription(
                narrative
            );

        }

    }


    /*-----------------------------------------------------------
        STEP 3
        Generic fallback
    -----------------------------------------------------------*/

    const fallback =
        extractFallbackDescription(
            source
        );


    if (
        isGoodDescription(
            fallback
        )
    ) {

        console.log(
            "Description found using fallback pattern"
        );

        return limitDescription(
            fallback
        );

    }


    console.warn(
        "Description could not be extracted"
    );

    return "";

}


/*---------------------------------------------------------------
    EXTRACT NARRATIVE BLOCK
---------------------------------------------------------------*/
function extractNarrativeBlock(
    text,
    startIndex
) {

    let content =
        text.substring(
            startIndex
        );


    const endPatterns = [

        /\bCASE\s+REPORT\s+SENT\s+AND\s+DISPOSED\b/i,

        /\bCASE\s+REPORT\s+SENT\b/i,

        /\bCASE\s+DISPOSED\b/i,

        /\bDISPOSED\s+LOCALLY\b/i,

        /\bACTION\s+TAKEN\s+REPORT\b/i,

        /\bACTION\s+TAKEN\b/i,

        /\bATR\s+RECEIVED\b/i,

        /\bATR\s+AWAITED\b/i,

        /\bREPORT\s+SENT\b/i,

        /\bDepartment\s*,?\s*Govt\.?\s+of\s+Telangana\b/i,

        /\bPrint\b/i,

        /\bClose\b/i

    ];


    let endIndex =
        content.length;


    for (
        const pattern of endPatterns
    ) {

        const match =
            content.match(pattern);

        if (match) {

            endIndex =
                Math.min(
                    endIndex,
                    match.index
                );

        }

    }


    content =
        content.substring(
            0,
            endIndex
        );


    return cleanDescription(
        content
    );

}


/*---------------------------------------------------------------
    FALLBACK DESCRIPTION
---------------------------------------------------------------*/
function extractFallbackDescription(
    text
) {

    const patterns = [

        /Grievance\s*[:\-]\s*(.+?)(?=\s+(?:Department|Status|Category)\b)/is,

        /Complaint\s*[:\-]\s*(.+?)(?=\s+(?:Department|Status|Category)\b)/is,

        /Issue\s*[:\-]\s*(.+?)(?=\s+(?:Department|Status|Category)\b)/is,

        /Regarding\s*[:\-]\s*(.+?)(?=\s+(?:Department|Status|Category)\b)/is

    ];


    for (
        const pattern of patterns
    ) {

        const match =
            text.match(pattern);

        if (
            match &&
            match[1]
        ) {

            return cleanDescription(
                match[1]
            );

        }

    }


    return "";

}


/*---------------------------------------------------------------
    NORMALIZE DESCRIPTION TEXT
---------------------------------------------------------------*/
function normalizeDescriptionText(
    text
) {

    return text

        .replace(
            /\r/g,
            ""
        )

        .replace(
            /\t/g,
            " "
        )

        .replace(
            /\u00A0/g,
            " "
        )

        .replace(
            /[ ]{2,}/g,
            " "
        )

        .replace(
            /\n[ ]+/g,
            "\n"
        )

        .trim();

}


/*---------------------------------------------------------------
    CLEAN DESCRIPTION
---------------------------------------------------------------*/
function cleanDescription(
    text
) {

    if (!text)
        return "";

    return text

        .replace(
            /\r/g,
            " "
        )

        .replace(
            /\n+/g,
            " "
        )

        .replace(
            /\s+/g,
            " "
        )

        .replace(
            /^\s*(?:Grievance\s+Description|Description)\s*:?\s*/i,
            ""
        )

        .replace(
            /\s+\bPrint\b\s*$/i,
            ""
        )

        .replace(
            /\s+\bClose\b\s*$/i,
            ""
        )

        .trim();

}


/*---------------------------------------------------------------
    VALIDATE DESCRIPTION
---------------------------------------------------------------*/
function isGoodDescription(
    text
) {

    if (!text)
        return false;


    const value =
        text.trim();


    /*
     * Ignore very short values.
     * They are usually labels or PDF artefacts.
     */

    if (
        value.length < 30
    )
        return false;


    /*
     * Avoid metadata being treated
     * as the grievance description.
     */

    if (
        /^Department\s*:/i.test(value) ||

        /^Category\s*:/i.test(value) ||

        /^Status\s*:/i.test(value)
    ) {

        return false;

    }


    return true;

}


/*---------------------------------------------------------------
    LIMIT DESCRIPTION
---------------------------------------------------------------*/
function limitDescription(
    text
) {

    if (!text)
        return "";


    const MAX_LENGTH =
        5000;


    if (
        text.length <=
        MAX_LENGTH
    ) {

        return text;

    }


    return text
        .substring(
            0,
            MAX_LENGTH
        )
        .trim();

}


/*---------------------------------------------------------------
    EXPORT
---------------------------------------------------------------*/

window.extractDescription =
    extractDescription;