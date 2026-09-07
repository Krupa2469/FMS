"use strict";

/*==========================================================
 FILE MANAGEMENT SYSTEM (FMS)
 Module : CPGRAMS
 File   : office-file-parser.js
 Version: 1.0
==========================================================*/

function parseOfficeFilePDF(text){

    text = normalizeOfficeText(text);

    const result = {};

    result.officeFileNo = extractOfficeFileNo(text);

    result.officeFileDate = extractOfficeFileDate(text);

    result.subject = extractSubject(text);

    result.letterNo = extractLetterNo(text);

    result.remarks = extractRemarks(text);

    result.currentStatus = determineStatus(result);

    console.table(result);

    return result;

}

function normalizeOfficeText(text) {

    if (!text)
        return "";

    return text

        .replace(/\r/g, "")

        .replace(/\t/g, " ")

        .replace(/[ ]+/g, " ")

        .replace(/\n{2,}/g, "\n")

        .trim();

}

function matchFirst(text, patterns) {

    for (const pattern of patterns) {

        const match = text.match(pattern);

        if (match && match[1]) {

            return match[1]

                .replace(/\s+/g, " ")

                .trim();

        }

    }

    return "";

}

function extractOfficeFileNo(text){

    return matchFirst(text,[

        /Office File No\.?\s*[:\-]?\s*(.+)/i,

        /File No\.?\s*[:\-]?\s*(.+)/i,

        /Rc\.?\s*No\.?\s*[:\-]?\s*(.+)/i,

        /Memo No\.?\s*[:\-]?\s*(.+)/i

    ]);

}

function extractOfficeFileDate(text){

    return matchFirst(text,[

        /Date\s*[:\-]?\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i,

        /Dated\s*[:\-]?\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i

    ]);

}

function extractSubject(text){

    return matchFirst(text,[

        /Subject\s*[:\-]?\s*(.+?)(?:\n|Reference|Ref)/is,

        /Sub\s*[:\-]?\s*(.+?)(?:\n|Reference)/is

    ]);

}

function extractLetterNo(text){

    return matchFirst(text,[

        /Reference\s*No\.?\s*[:\-]?\s*(.+)/i,

        /Letter\s*No\.?\s*[:\-]?\s*(.+)/i

    ]);

}

function extractRemarks(text){

    return matchFirst(text,[

        /Remarks\s*[:\-]?\s*(.+)/is,

        /Observation\s*[:\-]?\s*(.+)/is

    ]);

}

function determineStatus(data){

    if(data.actionTaken)
        return "Action Taken";

    if(data.letterNo)
        return "Correspondence Issued";

    if(data.officeFileNo)
        return "Under Process";

    return "Received";

}


