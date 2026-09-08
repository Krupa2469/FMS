/******************************************************************
 * CPGRAMS DOCUMENT CAPTURE
 * Version 6.0
 * Uses the same FMS Central Document Engine used by RTI/DISHA.
 * Lekha Technologies
 ******************************************************************/

"use strict";

console.log("CPGRAMS Central Document Capture V6 loaded");

function cpSetIfEmpty(id, value) {
    const el = document.getElementById(id);
    if (!el || value === undefined || value === null || String(value).trim() === "") return false;
    if (String(el.value || "").trim() !== "") return false;
    el.value = String(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
}

function fillCPGRAMSFromCentralResult(fields) {
    if (!window.FMSParserService) throw new Error("FMS Parser Service is not loaded.");
    const mapping = {
        grievanceNumber:"grievanceNumber", dateReceived:"dateReceived", subject:"subject",
        grievanceDescription:"grievanceDescription", category:"category", nature:"natureOfGrievance",
        priority:"priority", complainantName:"complainantName", mobileNumber:"mobileNumber",
        district:"district", mandal:"mandal", village:"village", address:"address",
        fileNumber:"fileNumber", dateArised:"dateArised", officeSubject:"officeSubject",
        officeCommunicationType:"officeCommunicationType", officeLetterAddressedTo:"officeLetterAddressedTo",
        officeReplySection:"officeReplySection", officeStatus:"officeStatus",
        assignedOfficer:"assignedOfficer", section:"section", currentStatus:"currentStatus", remarks:"remarks"
    };
    const changed = window.FMSParserService.fillFields(fields || {}, mapping, { onlyEmpty: true });

    // Manual fallback fields retain OCR text if a master dropdown has no exact match.
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
    return changed;
}

async function captureDocument(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    try {
        if (!window.FMSParserService || !window.FMSDocumentEngine) {
            throw new Error("Central document parser is not loaded.");
        }
        const result = await window.FMSParserService.parseFile(file, "CPGRAMS");
        const preview = document.getElementById("parsedText");
        if (preview) preview.value = result.text || "";
        const changed = fillCPGRAMSFromCentralResult(result.fields || {});
        if (window.FMSParserService.notify) {
            window.FMSParserService.notify(
                `Document parsed successfully. ${changed.length} empty field(s) populated. Please review before saving.`,
                "success"
            );
        }
        console.log("CPGRAMS parsed fields:", result.fields);
    } catch (error) {
        console.error("CPGRAMS document parsing failed:", error);
        alert("Document import failed:\n\n" + (error.message || error));
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
    const fileInput = document.getElementById("fileDocument");
    if (fileInput) fileInput.addEventListener("change", captureDocument);
    initializeDateReceivedPicker();
});

window.captureDocument = captureDocument;
