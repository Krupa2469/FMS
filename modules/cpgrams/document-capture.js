/******************************************************************
 * document-capture.js
 * CPGRAMS Auto Document Reader
 * Version 5.0
 *
 * IMPORTANT:
 * Uses the CPGRAMS parser + classification engine
 * before sending data to the form filler.
 ******************************************************************/

console.log("======================================");
console.log("CPGRAMS DOCUMENT CAPTURE V5.0 LOADED");
console.log("======================================");


/*===============================================================
    REGISTER FILE EVENT
================================================================*/

window.addEventListener(
    "DOMContentLoaded",
    registerDocumentCaptureEvents
);


function registerDocumentCaptureEvents() {

    console.log(
        "Registering Document Capture Events..."
    );


    const fileInput =
        document.getElementById(
            "fileDocument"
        );


    if (!fileInput) {

        console.error(
            "fileDocument control not found."
        );

        return;
    }


    /*
     * Prevent duplicate event registration
     */

    fileInput.removeEventListener(
        "change",
        captureDocument
    );


    fileInput.addEventListener(
        "change",
        captureDocument
    );


    console.log(
        "Document Capture Ready."
    );

}


/*===============================================================
    CAPTURE DOCUMENT
================================================================*/

async function captureDocument(event) {

    console.log(
        "========== CAPTURE START =========="
    );


    const file =
        event.target.files[0];


    if (!file) {

        console.log(
            "No file selected."
        );

        return;
    }


    console.log(
        "Selected File:",
        file.name
    );


    try {

        /*=======================================================
            STEP 1
            READ PDF
        =======================================================*/

        const buffer =
            await file.arrayBuffer();


        const loadingTask =
            pdfjsLib.getDocument({
                data: buffer
            });


        const pdf =
            await loadingTask.promise;


        console.log(
            "Total Pages:",
            pdf.numPages
        );


        /*=======================================================
            STEP 2
            EXTRACT PDF TEXT
        =======================================================*/

        let completeText = "";


        for (
            let pageNo = 1;
            pageNo <= pdf.numPages;
            pageNo++
        ) {

            const page =
                await pdf.getPage(pageNo);


            const textContent =
                await page.getTextContent();


            const pageText =
                textContent.items
                    .map(item => item.str)
                    .join(" ");


            completeText +=
                pageText + "\n";
        }


        console.log(
            "PDF Text Length:",
            completeText.length
        );


        /*=======================================================
            STEP 3
            OCR FALLBACK
        =======================================================*/

        if (
            completeText.trim().length < 100
        ) {

            console.log(
                "Scanned PDF detected."
            );


            if (
                typeof performOCR ===
                "function"
            ) {

                completeText =
                    await performOCR(pdf);

            } else {

                throw new Error(
                    "OCR engine is not available."
                );

            }

        }


        console.log(
            "========== EXTRACTED PDF TEXT =========="
        );

        console.log(
            completeText
        );


        /*=======================================================
            STEP 4
            CPGRAMS PARSER
        =======================================================*/

   if (typeof parseDocument === "function") {

    const parsed = parseDocument(
        completeText,
        "CPGRAMS"
    );

    data = parsed.fields;

} else {

    data = parseCPGRAMSPDF(completeText);

}


        /*=======================================================
            STEP 5
            INTELLIGENT CLASSIFICATION
        =======================================================*/

        if (
            typeof classifyGrievance ===
            "function"
        ) {

            const classification =
                classifyGrievance(
                    data
                );


            console.log(
                "========== CLASSIFICATION =========="
            );

            console.table(
                classification
            );


            /*
             * Add classification values
             * to parsed data
             */

            Object.assign(
                data,
                classification
            );

        } else {

            console.warn(
                "Classification engine not loaded."
            );

        }


        /*=======================================================
            STEP 6
            SMART SUBJECT
        =======================================================*/

        if (
            typeof buildSmartSubject ===
            "function"
        ) {

            data.subject =
                buildSmartSubject(
                    data
                );

        }


        /*=======================================================
            STEP 7
            ENSURE CLASSIFICATION VALUES
        =======================================================*/

        console.log(
            "========== FINAL CLASSIFICATION =========="
        );


        console.log(
            "Category:",
            data.category
        );


        console.log(
            "Nature:",
            data.nature
        );


        console.log(
            "Priority:",
            data.priority
        );


        console.log(
            "Subject:",
            data.subject
        );


        /*=======================================================
            STEP 8
            FORM FILLER
        =======================================================*/

        if (
            typeof fillCPGRAMSForm !==
            "function"
        ) {

            throw new Error(
                "CPGRAMS form filler is not loaded."
            );

        }


        fillCPGRAMSForm(
            data
        );


        /*=======================================================
            STEP 9
            FINAL DATA
        =======================================================*/

        console.log(
            "========== FINAL DATA =========="
        );


        console.table(
            data
        );


        console.log(
            "========== CAPTURE COMPLETE =========="
        );


        alert(
            "CPGRAMS document imported successfully."
        );

    }


    catch (error) {

        console.error(
            "CPGRAMS Document Import Error:",
            error
        );


        alert(
            "Document import failed:\n\n" +
            error.message
        );

    }

}

/* =========================================================
   DATE RECEIVED - CALENDAR PICKER
   Display format: dd/mm/yyyy
   Internal calendar format: yyyy-mm-dd
   ========================================================= */

function initializeDateReceivedPicker() {

    const dateReceived =
        document.getElementById("dateReceived");

    const datePicker =
        document.getElementById("dateReceivedPicker");

    const pickerButton =
        document.getElementById("dateReceivedPickerButton");

    if (!dateReceived || !datePicker || !pickerButton) {
        console.warn("Date Received picker controls not found.");
        return;
    }

    /* Open native calendar */

    pickerButton.addEventListener("click", function () {

        try {

            if (typeof datePicker.showPicker === "function") {

                datePicker.showPicker();

            } else {

                datePicker.focus();
                datePicker.click();

            }

        } catch (error) {

            console.warn(
                "Unable to open calendar:",
                error
            );

        }

    });


    /* When date is selected */

    datePicker.addEventListener("change", function () {

        if (!this.value) {
            return;
        }

        const selectedDate = this.value;

        console.log(
            "Calendar Date Selected:",
            selectedDate
        );

        /* yyyy-mm-dd → dd/mm/yyyy */

        const parts = selectedDate.split("-");

        if (parts.length !== 3) {
            return;
        }

        const yyyy = parts[0];
        const mm = parts[1];
        const dd = parts[2];

        dateReceived.value =
            `${dd}/${mm}/${yyyy}`;


        /* Calculate Due Date */

        calculateDueDateFromReceived(selectedDate);

    });

}


/* =========================================================
   CALCULATE CPGRAMS DUE DATE
   Date Received + 21 days
   ========================================================= */

function calculateDueDateFromReceived(receivedDate) {

    const dueDateControl =
        document.getElementById("dueDate");

    if (!dueDateControl || !receivedDate) {
        return;
    }

    const date = new Date(
        receivedDate + "T00:00:00"
    );

    if (isNaN(date.getTime())) {
        return;
    }

    /* CPGRAMS = 21 days */

    date.setDate(
        date.getDate() + 21
    );


    const yyyy =
        date.getFullYear();

    const mm =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const dd =
        String(date.getDate())
            .padStart(2, "0");


    dueDateControl.value =
        `${dd}/${mm}/${yyyy}`;


    console.log(
        "CPGRAMS Due Date:",
        dueDateControl.value
    );

}

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeDateReceivedPicker();

    }
);

/*===============================================================
    EXPORT
================================================================*/

window.captureDocument =
    captureDocument;