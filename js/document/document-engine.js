/* =========================================================
   FMS CENTRAL DOCUMENT ENGINE
   Version 2.0

   Purpose:
   - Common document processing entry point
   - Used by RTI, CPGRAMS, DISHA and other FMS modules
   - PDF text extraction
   - Automatic scanned-PDF detection
   - OCR fallback using Tesseract.js
   - Module-specific parser routing

   Lekha Technologies
   ========================================================= */

(function () {

    "use strict";

    console.log("========================================");
    console.log("FMS CENTRAL DOCUMENT ENGINE");
    console.log("Version 2.0");
    console.log("========================================");


    /* =====================================================
       ENGINE STATUS
    ===================================================== */

    const DocumentEngine = {

        version: "2.0",

        ready: false,

        OCR_THRESHOLD: 100,


        /* =================================================
           INITIALIZE
        ================================================= */

        init: function () {

            console.log(
                "FMS Document Engine Initializing..."
            );

            this.ready = true;

            console.log(
                "FMS Document Engine Ready."
            );

            return true;
        },


        /* =================================================
           CHECK READY
        ================================================= */

        isReady: function () {

            return this.ready;
        },


        /* =================================================
           MAIN PARSE FUNCTION
        ================================================= */

        async parse(options = {}) {

            console.log(
                "----------------------------------------"
            );

            console.log(
                "FMS Document Engine: Parse requested"
            );

            console.log(
                "----------------------------------------"
            );


            /* ---------------------------------------------
               Validate file
            --------------------------------------------- */

            const file = options.file;

            if (!file) {

                throw new Error(
                    "No document file was supplied."
                );

            }


            /* ---------------------------------------------
               Module
            --------------------------------------------- */

            const moduleName =
                String(
                    options.module || "GENERIC"
                ).toUpperCase();


            console.log(
                "Module:",
                moduleName
            );

            console.log(
                "File:",
                file.name
            );

            console.log(
                "Type:",
                file.type
            );

            console.log(
                "Size:",
                file.size
            );


            /* ---------------------------------------------
               Basic result structure
            --------------------------------------------- */

            const result = {

                success: false,

                module:
                    moduleName,

                fileName:
                    file.name,

                fileType:
                    file.type,

                fileSize:
                    file.size,

                text: "",

                fields: {},

                confidence: {},

                documentType:
                    "unknown",

                extractionMethod:
                    "",

                ocrUsed:
                    false,

                error:
                    null
            };


            try {

                /* -----------------------------------------
                   STEP 1
                   Extract text
                ----------------------------------------- */

                const extraction =
                    await this.extractText(file);


                result.text =
                    extraction.text || "";


                result.extractionMethod =
                    extraction.method || "";


                result.ocrUsed =
                    extraction.ocrUsed || false;


                console.log(
                    "Extracted text length:",
                    result.text.length
                );


                console.log(
                    "Extraction method:",
                    result.extractionMethod
                );


                console.log(
                    "OCR used:",
                    result.ocrUsed
                );


                /* -----------------------------------------
                   STEP 2
                   Normalize text
                ----------------------------------------- */

                result.text =
                    this.normalizeText(
                        result.text
                    );


                console.log(
                    "Normalized text length:",
                    result.text.length
                );


                /* -----------------------------------------
                   STEP 3
                   Identify document
                ----------------------------------------- */

                result.documentType =
                    this.classifyDocument(
                        result.text,
                        moduleName
                    );


                console.log(
                    "Document type:",
                    result.documentType
                );


                /* -----------------------------------------
                   STEP 4
                   Module parser
                ----------------------------------------- */

                result.fields =
                    await this.parseModule(
                        moduleName,
                        result.text
                    );


                /* -----------------------------------------
                   STEP 5
                   Successful result
                ----------------------------------------- */

                result.success = true;


                console.log(
                    "Document processing completed."
                );


                console.log(
                    "Result:",
                    result
                );


                return result;

            }

            catch (error) {

                console.error(
                    "FMS Document Engine Error:",
                    error
                );


                result.success = false;


                result.error =
                    error.message ||
                    String(error);


                return result;
            }
        },


        /* =================================================
           EXTRACT TEXT
        ================================================= */

        async extractText(file) {

            console.log(
                "Document Engine: Extracting text..."
            );


            /* ---------------------------------------------
               PDF
            --------------------------------------------- */

            if (
                file.type === "application/pdf" ||
                file.name
                    .toLowerCase()
                    .endsWith(".pdf")
            ) {

                return await this.extractPDFText(
                    file
                );

            }


            /* ---------------------------------------------
               Plain text
            --------------------------------------------- */

            if (
                file.type === "text/plain" ||
                file.name
                    .toLowerCase()
                    .endsWith(".txt")
            ) {

                return {

                    text:
                        await file.text(),

                    method:
                        "TEXT",

                    ocrUsed:
                        false
                };

            }


            /* ---------------------------------------------
               Unsupported
            --------------------------------------------- */

            throw new Error(
                "Unsupported document type: " +
                file.name
            );
        },


        /* =================================================
           PDF TEXT EXTRACTION
        ================================================= */

        async extractPDFText(file) {

            console.log(
                "PDF document detected."
            );


            /* ---------------------------------------------
               Check PDF.js
            --------------------------------------------- */

            if (
                typeof pdfjsLib ===
                "undefined"
            ) {

                throw new Error(
                    "PDF.js is not loaded."
                );

            }


            /* ---------------------------------------------
               Check worker
            --------------------------------------------- */

            if (
                pdfjsLib.GlobalWorkerOptions &&
                !pdfjsLib.GlobalWorkerOptions.workerSrc
            ) {

                pdfjsLib.GlobalWorkerOptions.workerSrc =
                    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

            }


            /* ---------------------------------------------
               Read PDF
            --------------------------------------------- */

            const buffer =
                await file.arrayBuffer();


            const loadingTask =
                pdfjsLib.getDocument({
                    data: buffer
                });


            const pdf =
                await loadingTask.promise;


            console.log(
                "PDF pages:",
                pdf.numPages
            );


            let completeText = "";


            /* ---------------------------------------------
               Extract text from every page
            --------------------------------------------- */

            for (
                let pageNo = 1;
                pageNo <= pdf.numPages;
                pageNo++
            ) {

                console.log(
                    "Reading PDF page:",
                    pageNo
                );


                const page =
                    await pdf.getPage(
                        pageNo
                    );


                const textContent =
                    await page.getTextContent();


                const pageText =
                    textContent.items
                        .map(
                            item =>
                                item.str || ""
                        )
                        .join(" ");


                completeText +=
                    pageText +
                    "\n\n";
            }


            console.log(
                "PDF text extraction completed."
            );


            console.log(
                "Extracted text length:",
                completeText.length
            );


            /* ---------------------------------------------
               SCANNED PDF DETECTION
            --------------------------------------------- */

            if (
                completeText
                    .trim()
                    .length <
                this.OCR_THRESHOLD
            ) {

                console.warn(
                    "Scanned PDF detected."
                );


                console.log(
                    "Starting OCR..."
                );


                const ocrText =
                    await this.performPDFOCR(
                        pdf
                    );


                return {

                    text:
                        ocrText,

                    method:
                        "OCR",

                    ocrUsed:
                        true
                };

            }


            /* ---------------------------------------------
               DIGITAL PDF
            --------------------------------------------- */

            console.log(
                "Digital PDF detected."
            );


            return {

                text:
                    completeText,

                method:
                    "PDF_TEXT",

                ocrUsed:
                    false
            };
        },


        /* =================================================
           OCR ENGINE
        ================================================= */

        async performPDFOCR(pdf) {

            console.log(
                "========================================"
            );

            console.log(
                "FMS PDF OCR ENGINE"
            );

            console.log(
                "========================================"
            );


            /* ---------------------------------------------
               Check Tesseract
            --------------------------------------------- */

            if (
                typeof Tesseract ===
                "undefined"
            ) {

                throw new Error(
                    "Tesseract.js is not loaded. OCR cannot continue."
                );

            }


            let completeOCRText = "";


            /* ---------------------------------------------
               Process each PDF page
            --------------------------------------------- */

            for (
                let pageNo = 1;
                pageNo <= pdf.numPages;
                pageNo++
            ) {

                console.log(
                    "OCR processing page:",
                    pageNo,
                    "of",
                    pdf.numPages
                );


                const page =
                    await pdf.getPage(
                        pageNo
                    );


                /* -----------------------------------------
                   Render PDF page to canvas
                ----------------------------------------- */

                const viewport =
                    page.getViewport({
                        scale: 2.0
                    });


                const canvas =
                    document.createElement(
                        "canvas"
                    );


                const context =
                    canvas.getContext(
                        "2d"
                    );


                canvas.width =
                    viewport.width;


                canvas.height =
                    viewport.height;


                await page.render({

                    canvasContext:
                        context,

                    viewport:
                        viewport

                }).promise;


                console.log(
                    "PDF page rendered:",
                    pageNo
                );


                /* -----------------------------------------
                   Tesseract OCR
                ----------------------------------------- */

                const result =
                    await Tesseract.recognize(

                        canvas,

                        "eng",

                        {

                            logger:
                                function (
                                    message
                                ) {

                                    if (
                                        message.status
                                    ) {

                                        console.log(
                                            "OCR:",
                                            message.status,
                                            message.progress
                                        );

                                    }

                                }
                        }
                    );


                const pageText =
                    result &&
                    result.data &&
                    result.data.text
                        ? result.data.text
                        : "";


                console.log(
                    "OCR text length for page",
                    pageNo,
                    ":",
                    pageText.length
                );


                completeOCRText +=
                    pageText +
                    "\n\n";


                /* -----------------------------------------
                   Release canvas memory
                ----------------------------------------- */

                canvas.width = 1;

                canvas.height = 1;
            }


            console.log(
                "OCR completed."
            );


            console.log(
                "Total OCR text length:",
                completeOCRText.length
            );


            if (
                !completeOCRText.trim()
            ) {

                throw new Error(
                    "OCR completed but no text could be extracted from the PDF."
                );

            }


            return completeOCRText;
        },


        /* =================================================
           NORMALIZE TEXT
        ================================================= */

        normalizeText: function (text) {

            if (!text) {

                return "";
            }


            return String(text)

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
                    /\n{3,}/g,
                    "\n\n"
                )

                .trim();
        },


        /* =================================================
           DOCUMENT CLASSIFICATION
        ================================================= */

        classifyDocument: function (
            text,
            moduleName
        ) {

            const source =
                String(text || "")
                    .toLowerCase();


            /* ---------------------------------------------
               Explicit module
            --------------------------------------------- */

            if (
                moduleName &&
                moduleName !== "GENERIC"
            ) {

                return moduleName;
            }


            /* ---------------------------------------------
               CPGRAMS
            --------------------------------------------- */

            if (

                source.includes(
                    "cpgrams"
                )

                ||

                source.includes(
                    "centralised public grievance"
                )

                ||

                source.includes(
                    "grievance registration"
                )

            ) {

                return "CPGRAMS";
            }


            /* ---------------------------------------------
               RTI
            --------------------------------------------- */

            if (

                source.includes(
                    "right to information"
                )

                ||

                source.includes(
                    "right to information act"
                )

                ||

                source.includes(
                    "rti application"
                )

            ) {

                return "RTI";
            }


            /* ---------------------------------------------
               DISHA
            --------------------------------------------- */

            if (

                source.includes(
                    "disha"
                )

                ||

                source.includes(
                    "district development coordination"
                )

            ) {

                return "DISHA";
            }


            return "UNKNOWN";
        },


        /* =================================================
           MODULE PARSER ROUTER
        ================================================= */

        async parseModule(
            moduleName,
            text
        ) {

            console.log(
                "Routing document to:",
                moduleName
            );


            switch (
                moduleName
            ) {


                case "CPGRAMS":

                    return this.parseCPGRAMS(
                        text
                    );


                case "RTI":

                    return this.parseRTI(
                        text
                    );


                case "DISHA":

                    return this.parseDISHA(
                        text
                    );


                default:

                    return {

                        rawText:
                            text
                    };
            }
        },


        /* =================================================
           CPGRAMS PARSER
        ================================================= */

        parseCPGRAMS: function (
            text
        ) {

            console.log(
                "CPGRAMS parser routing..."
            );


            /* ---------------------------------------------
               Existing parser
            --------------------------------------------- */

            if (
                typeof parseCPGRAMSPDF ===
                "function"
            ) {

                try {

                    return parseCPGRAMSPDF(
                        text
                    );

                }

                catch (error) {

                    console.warn(
                        "CPGRAMS parser error:",
                        error
                    );

                }
            }


            console.log(
                "CPGRAMS parser not connected."
            );


            return {

                rawText:
                    text
            };
        },


        /* =================================================
           RTI PARSER
        ================================================= */

        parseRTI: function (
            text
        ) {

            console.log(
                "RTI parser routing..."
            );


            /* ---------------------------------------------
               Future RTI parser connection point
            --------------------------------------------- */

            if (
                typeof parseRTIDocument ===
                "function"
            ) {

                try {

                    return parseRTIDocument(
                        text
                    );

                }

                catch (error) {

                    console.warn(
                        "RTI parser error:",
                        error
                    );

                }
            }


            return {

                rawText:
                    text
            };
        },


        /* =================================================
           DISHA PARSER
        ================================================= */

        parseDISHA: function (
            text
        ) {

            console.log(
                "DISHA parser routing..."
            );


            return {

                rawText:
                    text
            };
        }

    };


    /* =====================================================
       INITIALIZE
    ===================================================== */

    DocumentEngine.init();


    /* =====================================================
       GLOBAL ACCESS
    ===================================================== */
/* =====================================================
   BACKWARD COMPATIBILITY
   Existing FMS modules use FMSDocumentEngine
===================================================== */

window.DocumentEngine =
    DocumentEngine;

window.FMSDocumentEngine =
    DocumentEngine;

/*
 * Existing modules expect:
 * FMSDocumentEngine.extractTextFromPDF(file)
 *
 * Central Engine V2 uses:
 * DocumentEngine.extractText(file)
 *
 * Provide compatibility wrapper.
 */

DocumentEngine.extractTextFromPDF =
    async function (file) {

        const result =
            await DocumentEngine.extractText(file);

        return result.text || "";
    };


console.log(
    "FMS Central Document Engine Loaded."
);

console.log(
    "FMSDocumentEngine compatibility interface ready."
);

})();