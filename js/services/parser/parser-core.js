/******************************************************************
 * parser-core.js
 * Enterprise Document Parser V2
 * Phase 1
 ******************************************************************/

console.log("Parser Core V2 Loaded");

/*---------------------------------------------------------------
    Main Parser
---------------------------------------------------------------*/

function parseDocument(pdfText, module = "CPGRAMS") {

    if (!pdfText || pdfText.trim() === "") {

        throw new Error("Empty document.");

    }

    pdfText = normalizeText(pdfText);

    console.log("========== PARSER V2 ==========");

    /*-----------------------------------------------------------
        Detect Layout
    -----------------------------------------------------------*/

    const layout = detectLayout(pdfText, module);

    console.log("Detected Layout :", layout.name);

    /*-----------------------------------------------------------
        Extract Fields
        (Implemented in Phase 2)
    -----------------------------------------------------------*/

    const result = {

        module,

        layout: layout.name,

        rawText: pdfText,

       fields: extractFields(
            pdfText,
            layout
        ),

      
        confidence: {},

        keywords: [],

        warnings: []

    };

    result.fields.subject =
    buildSmartSubject(result.fields);

    result.validation =
    validateFields(result.fields);
    
    result.confidence =
    calculateConfidence(result.fields);

    result.keywords =
    extractKeywords(result.fields);

    console.table(result);

    return result;

}

/*---------------------------------------------------------------
    Export
---------------------------------------------------------------*/

window.parseDocument = parseDocument;