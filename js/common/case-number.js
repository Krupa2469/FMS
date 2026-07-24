/******************************************************************************
 * FILE MANAGEMENT SYSTEM (FMS)
 * File        : case-number.js
 * Version     : 3.1
 * Developer   : Lekha Technologies
 *
 * Description :
 * Generic Case Number Generator
 ******************************************************************************/

"use strict";

const COUNTERS_COLLECTION = "counters";

const MODULE_PREFIX = {
    CPGRAMS: "CRD/CPG",
    RTI: "CRD/RTI",
    PRAJAVANI: "CRD/PRJ",
    DISHA: "CRD/DSH"
};



/******************************************************************************
 * Generate Case Number
 ******************************************************************************/

async function generateCaseNumber(moduleName) {

    if (!MODULE_PREFIX[moduleName]) {
        throw new Error("Unknown module: " + moduleName);
    }

    const year = new Date().getFullYear();

    const timestamp = Date.now().toString().slice(-6);

    return `${MODULE_PREFIX[moduleName]}/${year}/${timestamp}`;

}