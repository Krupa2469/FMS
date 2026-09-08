/* =========================================================
   FMS CENTRAL PARSER UI
   Version 1.0
   Adds the same Parse & Fill workflow to data-entry modules.
   Lekha Technologies
========================================================= */
(function (window, document) {
    "use strict";

    const CONFIG = {
        CPGRAMS: {
            fileId: "fileDocument",
            title: "Central Document Parser — CPGRAMS",
            accept: ".pdf,.txt,.png,.jpg,.jpeg",
            mapping: {
                grievanceNumber:"grievanceNumber",
                dateReceived:"dateReceived",
                subject:"subject",
                grievanceDescription:"grievanceDescription",
                category:"category",
                nature:"natureOfGrievance",
                priority:"priority",
                complainantName:"complainantName",
                mobileNumber:"mobileNumber",
                email:"email",
                district:"district",
                mandal:"mandal",
                village:"village",
                address:"address",
                fileNumber:"fileNumber",
                dateArised:"dateArised",
                officeSubject:"officeSubject",
                officeCommunicationType:"officeCommunicationType",
                officeLetterAddressedTo:"officeLetterAddressedTo",
                officeReplySection:"officeReplySection",
                officeStatus:"officeStatus",
                assignedOfficer:"assignedOfficer",
                section:"section",
                currentStatus:"currentStatus",
                remarks:"remarks"
            }
        },
        RTI: {
            fileId: "documentFile",
            title: "Central Document Parser — RTI",
            accept: ".pdf,.txt,.png,.jpg,.jpeg",
            mapping: {
                applicationNumber:"applicationNumber", applicationDate:"applicationDate",
                applicantName:"applicantName", mobileNumber:"mobileNumber", applicantAddress:"applicantAddress",
                informationSought:"informationSought", district:"district", mandal:"mandal", village:"village",
                fileNumber:"fileNumber", dateArised:"dateArised", presentStatus:"presentStatus",
                concernedSection:"concernedSection",
                replyFurnishedByConcernedSectionDate:"replyFurnishedByConcernedSectionDate",
                finalReplySentToPIODate:"finalReplySentToPIODate",
                officeFileNo:"officeFileNo", officeDateArised:"officeDateArised", officeSubject:"officeSubject",
                communicationType:"officeCommunicationType", letterAddressedTo:"officeLetterAddressedTo",
                replyObtainedFrom:"officeReplySection", fileStatus:"officeStatus"
            }
        },
        DISHA: {
            fileId: null,
            title: "Central Document Parser — DISHA",
            accept: ".pdf,.txt,.png,.jpg,.jpeg",
            mapping: {
                slNo:"slNo", district:"district", dateOfMeeting:"dateOfMeeting",
                pomUploaded:"pomUploaded", meetingExpenditure:"meetingExpenditure", statusOfBills:"statusOfBills",
                billsSubmittedCRD:"billsSubmittedCRD", billsForwardedMoRD:"billsForwardedMoRD",
                proposedDateOfMeeting:"proposedDateOfMeeting", statusOfMeeting:"statusOfMeeting", remarks:"remarks",
                fileNumber:"officeFileNo", dateArised:"officeDateArised", officeSubject:"officeSubject",
                communicationType:"officeCommunicationType", letterAddressedTo:"officeLetterAddressedTo",
                replyObtainedFrom:"officeReplySection", fileStatus:"officeStatus"
            }
        }
    };

    function detectModule() {
        const path = location.pathname.toLowerCase();
        if (path.includes("cpgrams")) return "CPGRAMS";
        if (path.includes("rti")) return "RTI";
        if (path.includes("disha")) return "DISHA";
        return "GENERIC";
    }

    function ensureInput(config) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = config.accept || ".pdf,.txt,.png,.jpg,.jpeg";
        input.className = "form-control";
        input.id = "fmsCentralParserFile";
        return input;
    }

    function build(module) {
        const config = CONFIG[module] || { title:"Central Document Parser", accept:".pdf,.txt,.png,.jpg,.jpeg", mapping:{} };
        const card = document.createElement("div");
        card.id = "fmsCentralParserCard";
        card.className = "card shadow-sm border-primary mb-4";
        card.innerHTML = `
          <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <strong><i class="bi bi-file-earmark-text"></i> ${config.title}</strong>
            <span id="fmsParserConfidence" class="badge bg-light text-dark">Ready</span>
          </div>
          <div class="card-body">
            <div class="row g-2 align-items-end">
              <div class="col-md-7"><label class="form-label">Document to parse</label><div id="fmsParserFileHost"></div></div>
              <div class="col-md-5 d-flex gap-2">
                <button type="button" class="btn btn-primary" id="fmsParseFill"><i class="bi bi-magic"></i> Parse &amp; Fill</button>
                <button type="button" class="btn btn-outline-secondary" id="fmsParseClear">Clear</button>
              </div>
            </div>
            <div id="fmsParserStatus" class="small text-muted mt-2">PDF, text and image documents are supported. Scanned PDFs/images use OCR when available.</div>
            <details class="mt-2"><summary>Extracted text preview</summary><textarea id="fmsParserPreview" class="form-control mt-2" rows="6" readonly></textarea></details>
          </div>`;
        return { card, config };
    }

    async function run(module, file, config, status, confidence, preview) {
        if (!file) throw new Error("Please select a document first.");
        status.textContent = "Parsing document… please wait.";
        confidence.textContent = "Parsing";
        const result = await window.FMSParserService.parseFile(file, module);
        preview.value = result.text || "";
        const hiddenParsedText = document.getElementById("parsedText");
        if (hiddenParsedText) hiddenParsedText.value = result.text || "";
        const parsedFields = { ...(result.fields || {}) };
        const changed = window.FMSParserService.fillFields(parsedFields, config.mapping, { onlyEmpty: true });

        // CPGRAMS: if a master dropdown cannot match the OCR text, keep the
        // extracted value in the manual fallback field instead of losing it.
        if (module === "CPGRAMS") {
            [
                ["district", "districtManual"],
                ["mandal", "mandalManual"],
                ["village", "villageManual"]
            ].forEach(([source, fallbackId]) => {
                const value = parsedFields[source];
                const fallback = document.getElementById(fallbackId);
                const master = document.getElementById(source);
                if (value && fallback && !String(fallback.value || "").trim() && !String(master?.value || "").trim()) {
                    fallback.value = value;
                    changed.push(fallbackId);
                }
            });
            if (parsedFields.dateReceived && typeof window.calculateDueDateFromDisplay === "function") {
                window.calculateDueDateFromDisplay(parsedFields.dateReceived);
            }
        }

        // DISHA: PoM due date is derived from Date of Meeting + 30 days.
        if (module === "DISHA" && parsedFields.dateOfMeeting) {
            const d = new Date(parsedFields.dateOfMeeting + "T00:00:00");
            if (!Number.isNaN(d.getTime())) {
                d.setDate(d.getDate() + 30);
                const iso = d.toISOString().slice(0, 10);
                const due = document.getElementById("pomDueDate");
                if (due && !String(due.value || "").trim()) {
                    due.value = due.type === "date" ? iso : `${iso.slice(8,10)}/${iso.slice(5,7)}/${iso.slice(0,4)}`;
                    changed.push("pomDueDate");
                }
            }
            if (typeof window.updateDISHAStatus === "function") window.updateDISHAStatus();
        }
        const score = window.FMSParserService.formatConfidence(result.fields?.confidence || {});
        confidence.textContent = `${score}% confidence`;
        status.textContent = `Completed using ${result.extractionMethod || "document extraction"}${result.ocrUsed ? " + OCR" : ""}. ${changed.length} empty field(s) populated. Please review before saving.`;
        window.FMSParserService.notify(`Document parsed successfully. ${changed.length} field(s) populated.`, "success");
    }

    function init() {
        const module = detectModule();
        if (!CONFIG[module]) return;
        if (!window.FMSParserService || !window.FMSDocumentEngine) return;
        if (document.getElementById("fmsCentralParserCard")) return;

        const built = build(module);
        const input = ensureInput(built.config);
        built.card.querySelector("#fmsParserFileHost").appendChild(input);

        const toolbar = document.querySelector(".fms-action-toolbar") || document.querySelector(".navbar");
        const root = toolbar?.parentElement || document.querySelector("main") || document.querySelector(".container-fluid") || document.body;
        if (toolbar && toolbar.parentElement === root) {
            toolbar.insertAdjacentElement("afterend", built.card);
        } else {
            root.insertBefore(built.card, root.firstElementChild);
        }

        const status = built.card.querySelector("#fmsParserStatus");
        const confidence = built.card.querySelector("#fmsParserConfidence");
        const preview = built.card.querySelector("#fmsParserPreview");
        built.card.querySelector("#fmsParseFill").addEventListener("click", async () => {
            try { await run(module, input.files[0], built.config, status, confidence, preview); }
            catch (e) { console.error(e); status.textContent = e.message || String(e); confidence.textContent = "Error"; window.FMSParserService.notify(status.textContent, "danger"); }
        });
        built.card.querySelector("#fmsParseClear").addEventListener("click", () => { input.value=""; preview.value=""; confidence.textContent="Ready"; status.textContent="Ready for another document."; });
    }

    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 50));
})(window, document);
