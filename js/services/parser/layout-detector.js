/******************************************************************
 * layout-detector.js
 * Layout Detection Engine
 ******************************************************************/

console.log("Layout Detector Loaded");

/*---------------------------------------------------------------
    Detect PDF Layout
---------------------------------------------------------------*/

function detectLayout(text, module) {

    const upper = text.toUpperCase();

    /*-----------------------------------------------------------
        CPGRAMS
    -----------------------------------------------------------*/

    if (upper.includes("PMOPG"))
        return {
            name: "PMOPG_LAYOUT"
        };

    if (upper.includes("DORLD"))
        return {
            name: "DORLD_LAYOUT"
        };

    if (upper.includes("DARPG"))
        return {
            name: "DARPG_LAYOUT"
        };

    if (upper.includes("CPGRAMS"))
        return {
            name: "CPGRAMS_LAYOUT"
        };

    /*-----------------------------------------------------------
        Office File
    -----------------------------------------------------------*/

    if (upper.includes("MEMO"))
        return {
            name: "OFFICE_MEMO_LAYOUT"
        };

    /*-----------------------------------------------------------
        ATR
    -----------------------------------------------------------*/

    if (
        upper.includes("ACTION TAKEN REPORT") ||
        upper.includes("ATR")
    )
        return {
            name: "ATR_LAYOUT"
        };

    /*-----------------------------------------------------------
        RTI
    -----------------------------------------------------------*/

    if (
        module === "RTI" ||
        upper.includes("RIGHT TO INFORMATION")
    )
        return {
            name: "RTI_LAYOUT"
        };

    /*-----------------------------------------------------------
        DISHA
    -----------------------------------------------------------*/

    if (
        module === "DISHA" ||
        upper.includes("DISTRICT DEVELOPMENT")
    )
        return {
            name: "DISHA_LAYOUT"
        };

    /*-----------------------------------------------------------
        Scanned PDF
    -----------------------------------------------------------*/

    if (text.length < 300)
        return {
            name: "SCANNED_LAYOUT"
        };

    return {
        name: "UNKNOWN_LAYOUT"
    };

}

/*---------------------------------------------------------------
    Export
---------------------------------------------------------------*/

window.detectLayout = detectLayout;