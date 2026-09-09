/*
==========================================================
FILE MANAGEMENT SYSTEM (FMS)
File        : office-processing-service.js
Version     : 1.0.0
Developer   : Lekha Technologies

Purpose:
Central Office Processing section shared by CPGRAMS, RTI and
DISHA. Section names are maintained in Firestore collection
"sections". The parser file is never involved in this data.
==========================================================
*/

"use strict";

(function () {

    const DEFAULT_SECTIONS = [
        "Administration",
        "Accounts",
        "Establishment",
        "Engineering",
        "Planning",
        "MGNREGS",
        "PMAY",
        "Finance",
        "Audit",
        "Legal",
        "General",
        "IT Cell"
    ];

    const COMMUNICATION_TYPES = [
        "Letter",
        "D.O. Letter",
        "UO Note",
        "Memo"
    ];

    const FILE_STATUSES = [
        "Arised",
        "Under Circulation",
        "Despatched",
        "Reply Obtained",
        "Closed"
    ];

    function getDb() {
        if (typeof window.getFMSFirestore === "function") {
            const value = window.getFMSFirestore();
            if (value) return value;
        }
        if (window.fmsFirebase && window.fmsFirebase.db) {
            return window.fmsFirebase.db;
        }
        if (window.db) return window.db;
        if (typeof firebase !== "undefined" && firebase.firestore) {
            try { return firebase.firestore(); } catch (_) {}
        }
        return null;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async function getSections() {
        const db = getDb();

        if (!db) return [...DEFAULT_SECTIONS];

        try {
            const snapshot = await db.collection("sections").get();
            const values = [];

            snapshot.forEach(doc => {
                const data = doc.data() || {};
                if (data.active !== false && data.name) {
                    values.push(String(data.name).trim());
                }
            });

            const merged = [...DEFAULT_SECTIONS, ...values]
                .map(v => v.trim())
                .filter(Boolean);

            return [...new Set(merged)]
                .sort((a, b) => a.localeCompare(b));
        } catch (error) {
            console.warn("Section master load failed; using local master.", error);
            return [...DEFAULT_SECTIONS];
        }
    }

    async function loadSectionDropdown(selectId, selectedValue = "") {
        const select = document.getElementById(selectId);
        if (!select) return;

        const sections = await getSections();

        select.innerHTML =
            '<option value="">-- Select Section --</option>' +
            sections.map(section =>
                `<option value="${escapeHtml(section)}">${escapeHtml(section)}</option>`
            ).join("");

        if (selectedValue) {
            const exists = [...select.options]
                .some(option => option.value === selectedValue);

            if (!exists) {
                select.insertAdjacentHTML(
                    "beforeend",
                    `<option value="${escapeHtml(selectedValue)}">${escapeHtml(selectedValue)}</option>`
                );
            }

            select.value = selectedValue;
        }
    }

    async function getMasterOptions(collectionName, defaults) {
        const db = getDb();
        if (!db) return [...defaults];

        try {
            const snapshot = await db.collection(collectionName).get();
            const values = [];

            snapshot.forEach(doc => {
                const data = doc.data() || {};
                if (data.active !== false && data.name) {
                    values.push(String(data.name).trim());
                }
            });

            if (values.length > 0) {
                return [...new Set(values)]
                    .sort((a, b) => a.localeCompare(b));
            }

            return [...new Set(defaults.map(v => v.trim()).filter(Boolean))]
                .sort((a, b) => a.localeCompare(b));
        } catch (error) {
            console.warn(`${collectionName} master load failed; using defaults.`, error);
            return [...defaults];
        }
    }

    async function loadOptionMaster(selectId, collectionName, defaults, selectedValue = "") {
        const select = document.getElementById(selectId);
        if (!select) return;

        const values = await getMasterOptions(collectionName, defaults);
        select.innerHTML =
            '<option value="">-- Select --</option>' +
            values.map(value =>
                `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
            ).join("");

        if (selectedValue) {
            if (![...select.options].some(o => o.value === selectedValue)) {
                select.insertAdjacentHTML(
                    "beforeend",
                    `<option value="${escapeHtml(selectedValue)}">${escapeHtml(selectedValue)}</option>`
                );
            }
            select.value = selectedValue;
        }
    }

    async function addSection(name) {
        const cleanName = String(name || "").trim();

        if (!cleanName) {
            throw new Error("Please enter a section name.");
        }

        const db = getDb();

        if (!db) {
            throw new Error("Firestore is not ready. Please try again.");
        }

        const existing = await db.collection("sections")
            .where("name", "==", cleanName)
            .limit(1)
            .get();

        if (!existing.empty) {
            return existing.docs[0].id;
        }

        const ref = await db.collection("sections").add({
            name: cleanName,
            code: cleanName.toUpperCase().replace(/[^A-Z0-9]+/g, "_").slice(0, 30),
            description: "Section Master",
            active: true,
            source: "Office Processing",
            createdOn: firebase.firestore.FieldValue.serverTimestamp(),
            modifiedOn: firebase.firestore.FieldValue.serverTimestamp()
        });

        return ref.id;
    }

    function getOfficeProcessingData() {
        return {
            officeFileNo: document.getElementById("officeFileNo")?.value.trim()
                || document.getElementById("fileNumber")?.value.trim() || "",
            officeDateArised: document.getElementById("officeDateArised")?.value
                || document.getElementById("dateArised")?.value || "",
            officeSubject: document.getElementById("officeSubject")?.value.trim() || "",
            officeCommunicationType: document.getElementById("officeCommunicationType")?.value || "",
            officeLetterAddressedTo: document.getElementById("officeLetterAddressedTo")?.value.trim() || "",
            officeReplyObtainedFrom: document.getElementById("officeReplySection")?.value || "",
            officeStatus: document.getElementById("officeStatus")?.value || ""
        };
    }

    function populateOfficeProcessing(data) {
        if (!data) return;

        const aliases = {
            officeFileNo: ["officeFileNo"],
            officeDateArised: ["officeDateArised"],
            officeSubject: ["officeSubject"],
            officeCommunicationType: ["officeCommunicationType"],
            officeLetterAddressedTo: ["officeLetterAddressedTo"],
            officeReplyObtainedFrom: ["officeReplyObtainedFrom", "replyObtainedFrom"],
            officeStatus: ["officeStatus", "statusOfFile"]
        };

        Object.entries(aliases).forEach(([target, sources]) => {
            const element = document.getElementById(target);
            const fallbackElement =
                target === "officeFileNo" ? document.getElementById("fileNumber") :
                target === "officeDateArised" ? document.getElementById("dateArised") :
                null;

            if (!element && !fallbackElement) return;

            for (const source of sources) {
                if (data[source] !== undefined && data[source] !== null) {
                    const value = String(data[source]);

                    const targetElement = element || fallbackElement;

                    if (targetElement.tagName === "SELECT" && value &&
                        ![...targetElement.options].some(option => option.value === value)) {
                        targetElement.insertAdjacentHTML(
                            "beforeend",
                            `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
                        );
                    }

                    targetElement.value = value;
                    break;
                }
            }
        });
    }

    async function initialise() {
        const select = document.getElementById("officeReplySection");
        if (!select) return;

        const load = () => loadSectionDropdown(
            "officeReplySection",
            select.dataset.selected || ""
        );

        load();
        loadOptionMaster(
            "officeCommunicationType",
            "officeCommunicationTypes",
            COMMUNICATION_TYPES,
            document.getElementById("officeCommunicationType")?.value || ""
        );
        loadOptionMaster(
            "officeStatus",
            "fileStatuses",
            FILE_STATUSES,
            document.getElementById("officeStatus")?.value || ""
        );

        const addButton = document.getElementById("btnAddOfficeSection");
        const input = document.getElementById("newOfficeSection");

        if (addButton && !addButton.dataset.bound) {
            addButton.dataset.bound = "1";

            addButton.addEventListener("click", async () => {
                if (!input) return;

                const name = input.value.trim();

                if (!name) {
                    input.focus();
                    alert("Enter the new section name.");
                    return;
                }

                try {
                    addButton.disabled = true;
                    await addSection(name);
                    await loadSectionDropdown("officeReplySection", name);
                    input.value = "";
                    alert("Section added to Section Master.");
                } catch (error) {
                    console.error("Section Master Add Error:", error);
                    alert(error.message || "Unable to add section.");
                } finally {
                    addButton.disabled = false;
                }
            });
        }

        if (input && !input.dataset.bound) {
            input.dataset.bound = "1";
            input.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    addButton?.click();
                }
            });
        }
    }

    window.FMSOfficeProcessing = {
        COMMUNICATION_TYPES,
        FILE_STATUSES,
        getSections,
        loadSectionDropdown,
        addSection,
        loadOptionMaster,
        getMasterOptions,
        getOfficeProcessingData,
        populateOfficeProcessing
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialise);
    } else {
        initialise();
    }

    window.addEventListener("fmsFirebaseReady", () => {
        loadSectionDropdown(
            "officeReplySection",
            document.getElementById("officeReplySection")?.value || ""
        );
        loadOptionMaster(
            "officeCommunicationType",
            "officeCommunicationTypes",
            COMMUNICATION_TYPES,
            document.getElementById("officeCommunicationType")?.value || ""
        );
        loadOptionMaster(
            "officeStatus",
            "fileStatuses",
            FILE_STATUSES,
            document.getElementById("officeStatus")?.value || ""
        );
    });

})();
