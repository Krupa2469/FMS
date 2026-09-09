/******************************************************************
 * ocr-engine.js
 * Intelligent OCR Engine
 * Version 1.0
 * Lekha Technologies
 ******************************************************************/

console.log("OCR Engine Loaded");

/*==============================================================
    OCR FROM IMAGE
==============================================================*/

async function recognizeImage(imageSource) {

    console.log("Starting OCR...");

    const result = await Tesseract.recognize(

        imageSource,

        "eng",

        {

            logger: m => {

                if (m.status === "recognizing text") {

                    console.log(

                        "OCR Progress :",

                        Math.round(m.progress * 100) + "%"

                    );

                }

            }

        }

    );

    return result.data.text;

}

/*==============================================================
    PDF PAGE TO CANVAS
==============================================================*/

async function renderPDFPage(page) {

    const viewport = page.getViewport({

        scale: 2.0

    });

    const canvas = document.createElement("canvas");

    const context = canvas.getContext("2d");

    canvas.width = viewport.width;

    canvas.height = viewport.height;

    await page.render({

        canvasContext: context,

        viewport: viewport

    }).promise;

    return canvas;

}

/*==============================================================
    OCR COMPLETE PDF
==============================================================*/

async function performOCR(pdf) {

    let completeText = "";

    console.log("OCR Started");

    for (

        let pageNo = 1;

        pageNo <= pdf.numPages;

        pageNo++

    ) {

        console.log(

            "OCR Page",

            pageNo,

            "of",

            pdf.numPages

        );

        const page =

            await pdf.getPage(pageNo);

        const canvas =

            await renderPDFPage(page);

        const text =

            await recognizeImage(canvas);

        completeText +=

            text + "\n\n";

    }

    console.log("OCR Finished");

    return completeText;

}

/*==============================================================
    EXPORT
==============================================================*/

window.performOCR = performOCR;