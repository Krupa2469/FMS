/******************************************************************
 * CPGRAMS DOCUMENT CAPTURE
 * Version 6.1
 * Parses uploaded grievance documents and populates the CPGRAMS form.
 ******************************************************************/

"use strict";

console.log("CPGRAMS Document Capture V6.1 loaded");

function cpDocNormalizeText(value) {
    return String(value || "")
        .replace(/\r/g, "\n")
        .replace(/\u00a0/g, " ")
        .replace(/[\t ]+/g, " ")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function cpDocFirst(text, patterns) {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) return cpDocCleanField(match[1]);
    }
    return "";
}

function cpDocCleanField(value) {
    return String(value || "")
        .replace(/[|]+/g, " ")
        .replace(/\s+/g, " ")
        .replace(/^[:\-–—]+\s*/, "")
        .trim();
}

function cpDocDateToDMY(value) {
    if (!value) return "";
    const text = String(value).trim();
    let m = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (m) return `${String(m[1]).padStart(2,"0")}/${String(m[2]).padStart(2,"0")}/${m[3]}`;
    m = text.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
    if (m) return `${String(m[3]).padStart(2,"0")}/${String(m[2]).padStart(2,"0")}/${m[1]}`;
    return text;
}

function cpDocAddDaysDMY(value, days) {
    const dmy = cpDocDateToDMY(value);
    const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return "";
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    d.setDate(d.getDate() + Number(days || 0));
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function cpDocExtractLocalFields(rawText) {
    const text = cpDocNormalizeText(rawText);
    const oneLine = text.replace(/\n+/g, " ");
    const fields = {};

    fields.grievanceNumber = cpDocFirst(text, [
        /(?:Registration|Grievance|Reference|Diary)\s*(?:No\.?|Number)\s*[:\-]?\s*([A-Z0-9()\/._\-]+(?:\/[A-Z0-9._\-]+)*)/i,
        /\b((?:DORLD|DORD|DARPG|MOPRJ|MOPR|NREGA|RE7PG|MOLBR|PMOPG|CPGRAMS)\/[A-Z]\/[0-9]{4}\/[0-9]+)\b/i,
        /\b([A-Z]{2,8}\/[A-Z]\/[0-9]{4}\/[0-9]{4,})\b/i
    ]).toUpperCase();

    fields.dateReceived = cpDocDateToDMY(cpDocFirst(text, [
        /(?:Org\s*)?Received\s*Date\s*[:\-]?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
        /Date\s*of\s*(?:Receipt|Receiving|Received)\s*[:\-]?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
        /Received\s*on\s*[:\-]?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
        /\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})\b/
    ]));

    if (fields.dateReceived) fields.dueDate = cpDocAddDaysDMY(fields.dateReceived, 21);

    fields.complainantName = cpDocFirst(text, [
        /Complainant\s*Name\s*[:\-]?\s*([^\n]+)/i,
        /Applicant\s*Name\s*[:\-]?\s*([^\n]+)/i,
        /Name\s*[:\-]?\s*([^\n]+?)(?=\s+(?:Father|Address|Mobile|Phone|Email|District)\b|$)/i
    ]);

    fields.mobileNumber = cpDocFirst(oneLine, [/\b([6-9]\d{9})\b/]);
    fields.email = cpDocFirst(oneLine, [/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i]);

    fields.district = cpDocFirst(text, [
        /District\s*[:\-]?\s*([^\n,;]+)/i,
        /District\s+Name\s*[:\-]?\s*([^\n,;]+)/i
    ]);
    fields.mandal = cpDocFirst(text, [/Mandal\s*[:\-]?\s*([^\n,;]+)/i]);
    fields.village = cpDocFirst(text, [/Village\s*[:\-]?\s*([^\n,;]+)/i]);

    fields.subject = cpDocFirst(text, [
        /Subject\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:Description|Grievance\s*Description|Details|Complainant|Applicant|Address|District|Mobile|Relief|Prayer)\b|$)/i,
        /Brief\s*Subject\s*[:\-]?\s*([^\n]+)/i
    ]);

    fields.grievanceDescription = cpDocFirst(text, [
        /Grievance\s*Description\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:Relief|Prayer|Address|District|Remarks|Attachments?|Status|Action\s*Taken|Thanking|Yours)\b|$)/i,
        /Description\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:Relief|Prayer|Address|District|Remarks|Attachments?|Status|Action\s*Taken|Thanking|Yours)\b|$)/i,
        /Details\s*of\s*(?:the\s*)?Grievance\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:Relief|Prayer|Address|District|Remarks|Attachments?|Status|Action\s*Taken|Thanking|Yours)\b|$)/i
    ]);

    if (!fields.grievanceDescription && fields.subject) {
        fields.grievanceDescription = fields.subject;
    }

    fields.address = cpDocFirst(text, [
        /Address\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:Mobile|Phone|Email|District|Mandal|Village|Subject|Description)\b|$)/i
    ]);

    // Basic category suggestion from keywords; user can change it after review.
    const low = oneLine.toLowerCase();
    if (/salary|wage|payment|mgnrega|nrega/.test(low)) fields.category = "MGNREGS";
    else if (/road|roads/.test(low)) fields.category = "Roads";
    else if (/water|drinking water/.test(low)) fields.category = "Drinking Water";
    else if (/drain|drainage/.test(low)) fields.category = "Drainage";
    else if (/pension/.test(low)) fields.category = "Pensions";
    else if (/housing|house|pmay/.test(low)) fields.category = "Housing";
    else if (/electricity|power/.test(low)) fields.category = "Electricity";
    else if (/sanitation|garbage/.test(low)) fields.category = "Sanitation";

    return fields;
}

function cpDocMergeFields(engineFields, rawText) {
    const fallback = cpDocExtractLocalFields(rawText);
    const fields = { ...(fallback || {}), ...(engineFields || {}) };

    // Harmonise older parser key names to the current data-entry form IDs.
    if (!fields.mobileNumber && fields.mobile) fields.mobileNumber = fields.mobile;
    if (!fields.grievanceNumber && fields.registrationNumber) fields.grievanceNumber = fields.registrationNumber;
    if (!fields.grievanceDescription && fields.description) fields.grievanceDescription = fields.description;
    if (!fields.dateReceived && fields.receivedDate) fields.dateReceived = fields.receivedDate;
    if (fields.dateReceived) fields.dateReceived = cpDocDateToDMY(fields.dateReceived);
    if (!fields.dueDate && fields.dateReceived) fields.dueDate = cpDocAddDaysDMY(fields.dateReceived, 21);
    if (fields.dueDate) fields.dueDate = cpDocDateToDMY(fields.dueDate);
    return fields;
}

function fillCPGRAMSFromCentralResult(fields) {
    if (!window.FMSParserService) throw new Error("FMS Parser Service is not loaded.");

    const grievanceType = document.getElementById("grievanceType");
    if (grievanceType && !grievanceType.value) {
        grievanceType.value = "CPGRAMS";
        grievanceType.dispatchEvent(new Event("change", { bubbles: true }));
    }

    const mapping = {
        grievanceNumber:"grievanceNumber",
        dateReceived:"dateReceived",
        dueDate:"dueDate",
        subject:"subject",
        grievanceDescription:"grievanceDescription",
        category:"category",
        complainantName:"complainantName",
        mobileNumber:"mobileNumber",
        email:"email",
        district:"district",
        mandal:"mandal",
        village:"village",
        address:"address",
        fileNumber:"fileNumber",
        officeCommunicationType:"officeCommunicationType",
        officeLetterAddressedTo:"officeLetterAddressedTo",
        atrStatus:"atrStatus",
        currentStatus:"currentStatus",
        remarks:"remarks"
    };

    const changed = window.FMSParserService.fillFields(fields || {}, mapping, { onlyEmpty: true });

    [["district","districtManual"],["mandal","mandalManual"],["village","villageManual"]].forEach(([src,dst]) => {
        const value = fields?.[src];
        const master = document.getElementById(src);
        const fallback = document.getElementById(dst);
        if (value && fallback && !String(fallback.value || "").trim() && !String(master?.value || "").trim()) {
            fallback.value = value;
            changed.push(dst);
        }
    });

    if (fields?.dateReceived && typeof window.calculateDueDateFromDisplay === "function") {
        window.calculateDueDateFromDisplay(fields.dateReceived);
    }
    if (typeof window.updateGrievanceFormLayout === "function") window.updateGrievanceFormLayout();
    if (typeof window.updateWorkflowStagePreview === "function") window.updateWorkflowStagePreview();
    return changed;
}

async function cpDocExtractTextFallback(file) {
    if (!file) return "";
    if (file.type === "text/plain" || /\.(txt|csv)$/i.test(file.name || "")) return await file.text();
    if ((file.type === "application/pdf" || /\.pdf$/i.test(file.name || "")) && window.pdfjsLib) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages = [];
        for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const content = await page.getTextContent();
            pages.push(content.items.map(item => item.str || "").join(" "));
        }
        return pages.join("\n");
    }
    return "";
}


function cpDocToISODate(value) {
    const dmy = cpDocDateToDMY(value);
    const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return value || "";
}

function cpDocSetIfEmpty(id, value, changed) {
    const control = document.getElementById(id);
    const clean = cpDocCleanField(value);
    if (!control || !clean || String(control.value || "").trim()) return;
    control.value = clean;
    control.dispatchEvent(new Event("change", { bubbles: true }));
    changed.push(id);
}

function cpDocExtractMemoFields(rawText) {
    const text = cpDocNormalizeText(rawText);
    const oneLine = text.replace(/\n+/g, " ");
    const fields = {};

    if (/\boffice\s+memo\b|\bmemo\b/i.test(oneLine)) fields.officeCommunicationType = "Memo";
    else if (/\bd\.?o\.?\s*letter\b/i.test(oneLine)) fields.officeCommunicationType = "D.O. Letter";
    else if (/\bu\.?o\.?\s*note\b/i.test(oneLine)) fields.officeCommunicationType = "UO Note";
    else if (/\bletter\b/i.test(oneLine)) fields.officeCommunicationType = "Letter";

    fields.memoNumber = cpDocFirst(text, [
        /(?:Memo|Letter|D\.O\.?|U\.O\.?|Rc|Proceedings)\s*(?:No\.?|Number)\s*[:\-]?\s*([^\n]+)/i,
        /(?:File\s*No\.?|F\.No\.?)\s*[:\-]?\s*([^\n]+)/i
    ]);
    fields.fileNumber = cpDocFirst(text, [/(?:File\s*No\.?|F\.No\.?)\s*[:\-]?\s*([^\n]+)/i]);
    fields.memoDate = cpDocToISODate(cpDocFirst(text, [
        /(?:Memo|Letter|Rc|Proceedings)?\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
        /Dated\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i
    ]));
    fields.officeLetterAddressedTo = cpDocFirst(text, [
        /(?:To|Addressed\s*To)\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:Sir|Madam|Sub(?:ject)?|Ref|Rc|Memo|Letter)\b|$)/i
    ]);
    fields.subject = cpDocFirst(text, [
        /(?:Sub|Subject)\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:Ref|Reference|Sir|Madam|With reference|I am|The)\b|$)/i
    ]);
    return fields;
}

function cpDocExtractATRFields(rawText) {
    const text = cpDocNormalizeText(rawText);
    const fields = {};
    fields.atrStatus = "Received";
    fields.atrDate = cpDocToISODate(cpDocFirst(text, [
        /(?:ATR|Reply|Report|Action\s*Taken\s*Report)?\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
        /Dated\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i
    ]));
    fields.atrReceivedFrom = cpDocFirst(text, [
        /(?:From|Received\s*From|Submitted\s*By)\s*[:\-]?\s*([^\n]+)/i
    ]);
    fields.atrSummary = cpDocFirst(text, [
        /(?:Action\s*Taken\s*Report|ATR|Reply|Report)\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:Encl|Yours|Thanking|Copy|Submitted)\b|$)/i
    ]);
    if (!fields.atrSummary) fields.atrSummary = text.slice(0, 2000);
    return fields;
}

async function captureWorkflowDocument(event, role) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    const fileInput = event.target;
    fileInput.disabled = true;
    try {
        let result = null;
        let rawText = "";
        if (window.FMSParserService && window.FMSDocumentEngine) {
            result = await window.FMSParserService.parseFile(file, "CPGRAMS");
            rawText = result.text || "";
        }
        if (!rawText) rawText = await cpDocExtractTextFallback(file);
        rawText = cpDocNormalizeText(rawText);

        const fields = role === "atr"
            ? cpDocExtractATRFields(rawText)
            : cpDocExtractMemoFields(rawText);

        const changed = [];
        Object.entries(fields).forEach(([id, value]) => cpDocSetIfEmpty(id, value, changed));

        const preview = document.getElementById("parsedText");
        if (preview) preview.value = rawText;
        if (typeof window.updateWorkflowStagePreview === "function") window.updateWorkflowStagePreview();

        const label = role === "atr" ? "ATR / Reply" : "Memo / Letter";
        const message = `${label} parsed successfully. ${changed.length} field(s) populated. The file will be uploaded when you Save / Update.`;
        if (window.FMSParserService?.notify) window.FMSParserService.notify(message, "success");
        else alert(message);
    } catch (error) {
        console.error("Workflow document parsing failed:", error);
        const message = "Document parsing failed: " + (error.message || error);
        if (window.FMSParserService?.notify) window.FMSParserService.notify(message, "danger");
        else alert(message);
    } finally {
        fileInput.disabled = false;
    }
}

async function captureDocument(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;

    const fileInput = event.target;
    fileInput.disabled = true;
    try {
        let result = null;
        let rawText = "";
        if (window.FMSParserService && window.FMSDocumentEngine) {
            result = await window.FMSParserService.parseFile(file, "CPGRAMS");
            rawText = result.text || "";
        }
        if (!rawText) rawText = await cpDocExtractTextFallback(file);

        const fields = cpDocMergeFields(result?.fields || {}, rawText);
        const preview = document.getElementById("parsedText");
        if (preview) preview.value = cpDocNormalizeText(rawText);

        const changed = fillCPGRAMSFromCentralResult(fields || {});
        if (window.FMSParserService?.notify) {
            window.FMSParserService.notify(
                `Document parsed successfully. ${changed.length} field(s) populated. Please verify before Save / Update.`,
                "success"
            );
        } else {
            alert(`Document parsed successfully. ${changed.length} field(s) populated. Please verify before Save / Update.`);
        }
        console.log("CPGRAMS parsed fields:", fields);
    } catch (error) {
        console.error("CPGRAMS document parsing failed:", error);
        if (window.FMSParserService?.notify) {
            window.FMSParserService.notify("Document parsing failed: " + (error.message || error), "danger");
        } else {
            alert("Document parsing failed:\n\n" + (error.message || error));
        }
    } finally {
        fileInput.disabled = false;
    }
}

function initializeDateReceivedPicker() {
    const dateReceived = document.getElementById("dateReceived");
    const datePicker = document.getElementById("dateReceivedPicker");
    const pickerButton = document.getElementById("dateReceivedPickerButton");
    if (!dateReceived || !datePicker || !pickerButton) return;
    pickerButton.addEventListener("click", () => {
        try {
            if (typeof datePicker.showPicker === "function") datePicker.showPicker();
            else { datePicker.focus(); datePicker.click(); }
        } catch (_) {}
    });
    datePicker.addEventListener("change", function () {
        if (!this.value) return;
        const [yyyy,mm,dd] = this.value.split("-");
        dateReceived.value = `${dd}/${mm}/${yyyy}`;
        if (typeof window.calculateDueDateFromDisplay === "function") window.calculateDueDateFromDisplay(dateReceived.value);
    });
}

window.addEventListener("DOMContentLoaded", () => {
    const grievanceType = document.getElementById("grievanceType");
    if (grievanceType && !grievanceType.value) {
        grievanceType.value = "CPGRAMS";
        grievanceType.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const fileInput = document.getElementById("fileDocument");
    if (fileInput) fileInput.addEventListener("change", captureDocument);
    const memoInput = document.getElementById("memoDocument");
    if (memoInput) memoInput.addEventListener("change", event => captureWorkflowDocument(event, "memo"));
    const atrInput = document.getElementById("atrDocument");
    if (atrInput) atrInput.addEventListener("change", event => captureWorkflowDocument(event, "atr"));
    initializeDateReceivedPicker();
});

window.captureDocument = captureDocument;
window.captureWorkflowDocument = captureWorkflowDocument;
