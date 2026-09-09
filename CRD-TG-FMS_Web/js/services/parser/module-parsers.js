/* =========================================================
   FMS CENTRAL MODULE PARSERS
   Version 1.0
   Purpose: shared, module-specific field extraction.
   Lekha Technologies
========================================================= */
(function (window) {
    "use strict";

    const FMSModuleParsers = {};

    function normalize(text) {
        return String(text || "")
            .replace(/\r/g, "")
            .replace(/\u00A0/g, " ")
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    function first(text, patterns) {
        for (const pattern of patterns) {
            const m = text.match(pattern);
            if (m && m[1]) return m[1].replace(/\s+/g, " ").trim();
        }
        return "";
    }

    function dateISO(value) {
        if (!value) return "";
        const v = String(value).trim();
        let m = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
        if (m) return `${m[3]}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`;
        m = v.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
        if (m) return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;
        return "";
    }

    function addDays(dateValue, days) {
        const d = new Date(dateValue + "T00:00:00");
        if (Number.isNaN(d.getTime())) return "";
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0,10);
    }

    function confidence(fields, keys) {
        const out = {};
        keys.forEach(k => { out[k] = fields[k] ? 100 : 0; });
        return out;
    }


    FMSModuleParsers.CPGRAMS = function (rawText) {
        const text = normalize(rawText);
        if (typeof window.parseCPGRAMSPDF === "function") {
            return window.parseCPGRAMSPDF(text);
        }
        return FMSModuleParsers.GENERIC(text);
    };

    /* ---------------------------------------------------------
       RTI
    --------------------------------------------------------- */
    FMSModuleParsers.RTI = function (rawText) {
        let text = normalize(rawText);

        // PDF.js often returns a whole form row as one long line.
        // Insert logical line breaks before known RTI labels so the
        // field extractors can recognise values reliably.
        const rtiLabels = [
            "RTI Application (?:No\\.?|Number|ID)",
            "(?:RTI\\s*)?Application (?:No\\.?|Number|ID|Date)",
            "Date of Application",
            "Applicant Name",
            "Name of the Applicant",
            "Applicant Address",
            "Postal Address",
            "Mobile(?: Number)?",
            "Phone(?: Number)?",
            "Email",
            "Particulars of (?:the )?Information Sought",
            "Information Sought",
            "Information (?:Required|Requested)",
            "District",
            "Mandal",
            "Village",
            "File (?:No\\.?|Number)",
            "Date Arised",
            "Subject",
            "Type of Communication",
            "Letter addressed to",
            "Addressed to",
            "Reply obtained from",
            "Status of file"
        ];
        try {
            const labelUnion = rtiLabels.join("|");
            text = text.replace(
                new RegExp("\\s+(?=(?<!RTI\\s)(?:" + labelUnion + ")\\s*[:\\-]?)", "gi"),
                "\n"
            );
        } catch (_) {}

        // RTI applications arrive in many formats (PIO templates,
        // handwritten/scanned applications, postal formats and PDFs).
        // The parser therefore accepts both labelled and common-form layouts.
        function capture(patterns) {
            return first(text, patterns);
        }

        function cleanDate(value) {
            return dateISO(String(value || "").replace(/[|,]/g, " ").trim());
        }

        function afterLabel(labels, stopLabels = []) {
            const labelPattern = labels.join("|");
            const stopPattern = stopLabels.length ? stopLabels.join("|") : "$";
            const re = new RegExp(
                "(?:" + labelPattern + ")\\s*[:\\-]?\\s*([\\s\\S]*?)(?=\\n\\s*(?:" +
                stopPattern + ")\\s*[:\\-]?|$)", "i"
            );
            const m = text.match(re);
            return m && m[1] ? m[1].replace(/\s+/g, " ").trim() : "";
        }

        // Application number
        let applicationNumber = capture([
            /(?:RTI\s*)?(?:Application|Registration)\s*(?:No\.?|Number|ID)\s*[:\-]?\s*([A-Za-z0-9./()_-]+)/i,
            /RTI\s*(?:No\.?|Number)\s*[:\-]?\s*([A-Za-z0-9./()_-]+)/i,
            /Reference\s*(?:No\.?|Number)\s*[:\-]?\s*([A-Za-z0-9./()_-]+)/i
        ]);

        // Application date. Prefer explicitly labelled application date.
        let applicationDate = cleanDate(capture([
            /(?:Date\s*of\s*)?Application\s*Date\s*[:\-]?\s*([^\n]+)/i,
            /Date\s*of\s*Application\s*[:\-]?\s*([^\n]+)/i,
            /Application\s*(?:submitted|received)?\s*on\s*[:\-]?\s*([^\n]+)/i,
            /Dated?\s*[:\-]?\s*([^\n]+)/i
        ]));

        if (!applicationDate) {
            const dateMatches = [...text.matchAll(/\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})\b/g)];
            for (const m of dateMatches) {
                const d = cleanDate(m[1]);
                if (d) { applicationDate = d; break; }
            }
        }

        let applicantName = capture([
            /Applicant\s*Name\s*[:\-]?\s*([^\n]+)/i,
            /Name\s*of\s*(?:the\s*)?Applicant\s*[:\-]?\s*([^\n]+)/i,
            /Applicant\s*[:\-]?\s*([^\n]+)/i
        ]);

        if (!applicantName) {
            applicantName = afterLabel(
                ["Name\\s+of\\s+the\\s+Applicant", "Applicant\\s+Name", "Applicant"],
                ["Address", "Postal\\s+Address", "Mobile", "Phone", "Email", "Information\\s+Sought"]
            );
        }

        let applicantAddress = capture([
            /Applicant\s*Address\s*[:\-]?\s*([\s\S]+?)(?=\n\s*(?:Mobile|Phone|Email|Information\s*Sought|Particulars|District|Mandal|Village)\b)/i,
            /Postal\s*Address\s*[:\-]?\s*([\s\S]+?)(?=\n\s*(?:Mobile|Phone|Email|Information\s*Sought|Particulars|District|Mandal|Village)\b)/i,
            /Address\s*[:\-]?\s*([\s\S]+?)(?=\n\s*(?:Mobile|Phone|Email|Information\s*Sought|Particulars|District|Mandal|Village)\b)/i
        ]);

        if (!applicantAddress) {
            applicantAddress = afterLabel(
                ["Applicant\\s+Address", "Postal\\s+Address", "Address"],
                ["Mobile", "Phone", "Email", "Information\\s+Sought", "Particulars\\s+of\\s+Information", "District", "Mandal", "Village"]
            );
        }

        let informationSought = capture([
            /Particulars\s*of\s*(?:the\s*)?Information\s*Sought\s*[:\-]?\s*([\s\S]+?)(?=\n\s*(?:Applicant|Name\s+of|Address|District|Mandal|Village|Mobile|Phone|Email)\b)/i,
            /Information\s*Sought\s*[:\-]?\s*([\s\S]+?)(?=\n\s*(?:Applicant|Name\s+of|Address|District|Mandal|Village|Mobile|Phone|Email)\b)/i,
            /Information\s*(?:Required|Requested)\s*[:\-]?\s*([\s\S]+?)(?=\n\s*(?:Applicant|Name\s+of|Address|District|Mandal|Village|Mobile|Phone|Email)\b)/i,
            /Details\s*of\s*(?:the\s*)?Information\s*Sought\s*[:\-]?\s*([\s\S]+?)(?=\n\s*(?:Applicant|Name\s+of|Address|District|Mandal|Village|Mobile|Phone|Email)\b)/i
        ]);

        if (!informationSought) {
            informationSought = afterLabel(
                ["Particulars\\s+of\\s+(?:the\\s+)?Information\\s+Sought", "Information\\s+Sought", "Information\\s+(?:Required|Requested)", "Details\\s+of\\s+(?:the\\s+)?Information\\s+Sought"],
                ["Applicant", "Name\\s+of", "Address", "District", "Mandal", "Village", "Mobile", "Phone", "Email"]
            );
        }

        const mobileNumber = (text.match(/\b[6-9]\d{9}\b/) || [""])[0];

        let district = capture([
            /District\s*[:\-]?\s*([^\n,;]+)/i,
            /District\s+of\s+(?:the\s+)?Applicant\s*[:\-]?\s*([^\n,;]+)/i
        ]);
        let mandal = capture([/Mandal\s*[:\-]?\s*([^\n,;]+)/i]);
        let village = capture([/Village\s*[:\-]?\s*([^\n,;]+)/i]);

        // Office processing values are optional in an RTI application.
        const officeFileNo = capture([
            /File\s*(?:No\.?|Number)\s*[:\-]?\s*([^\n]+)/i
        ]);
        const officeDateArised = cleanDate(capture([
            /Date\s*Arised\s*[:\-]?\s*([^\n]+)/i
        ]));
        const officeSubject = capture([
            /Subject\s*[:\-]?\s*([^\n]+)/i
        ]);
        const officeCommunicationType = capture([
            /Type\s*of\s*Communication\s*[:\-]?\s*(Letter|D\.O\.\s*Letter|UO\s*Note|Memo)/i
        ]);
        const officeLetterAddressedTo = capture([
            /Letter\s*addressed\s*to\s*[:\-]?\s*([^\n]+)/i,
            /Addressed\s*to\s*[:\-]?\s*([^\n]+)/i
        ]);
        const officeReplyObtainedFrom = capture([
            /Reply\s*obtained\s*from\s*[:\-]?\s*([^\n]+)/i
        ]);
        const officeStatus = capture([
            /Status\s*of\s*file\s*[:\-]?\s*(Arised|Under\s*Circulation|Despatched|Reply\s*Obtained|Closed)/i
        ]);

        const fields = {
            applicationNumber: String(applicationNumber || "").trim(),
            applicationDate,
            dueDate: applicationDate ? addDays(applicationDate, 30) : "",
            applicantName: String(applicantName || "").trim(),
            mobileNumber,
            applicantAddress: String(applicantAddress || "").trim(),
            informationSought: String(informationSought || "").trim(),
            district: String(district || "").trim(),
            mandal: String(mandal || "").trim(),
            village: String(village || "").trim(),

            // Legacy RTI names retained for compatibility with registers/reports.
            fileNumber: officeFileNo,
            dateArised: officeDateArised,
            presentStatus: officeStatus,
            concernedSection: officeReplyObtainedFrom,

            officeFileNo,
            officeDateArised,
            officeSubject: String(officeSubject || "").trim(),
            communicationType: officeCommunicationType,
            officeCommunicationType,
            letterAddressedTo: String(officeLetterAddressedTo || "").trim(),
            officeLetterAddressedTo: String(officeLetterAddressedTo || "").trim(),
            replyObtainedFrom: String(officeReplyObtainedFrom || "").trim(),
            officeReplyObtainedFrom: String(officeReplyObtainedFrom || "").trim(),
            fileStatus: officeStatus,
            officeStatus
        };

        fields.confidence = confidence(fields, [
            "applicationNumber","applicationDate","applicantName",
            "informationSought","district","mandal","village"
        ]);
        fields.rawText = text;
        return fields;
    };

    /* ---------------------------------------------------------
       DISHA
    --------------------------------------------------------- */
    FMSModuleParsers.DISHA = function (rawText) {
        const text = normalize(rawText);
        const meetingDate = dateISO(first(text, [
            /Date\s*of\s*Meeting\s*[:\-]?\s*([^\n]+)/i,
            /Meeting\s*Date\s*[:\-]?\s*([^\n]+)/i,
            /Date\s*[:\-]?\s*([^\n]+)/i
        ]));
        const pomDueDate = meetingDate ? addDays(meetingDate, 30) : "";
        const exp = first(text, [/Meeting\s*Expenditure\s*[:\-]?\s*([^\n]+)/i, /Expenditure\s*[:\-]?\s*([^\n]+)/i]);
        const fields = {
            slNo: first(text, [/Sl\.?\s*No\.?\s*[:\-]?\s*(\d+)/i]),
            district: first(text, [/Name\s*of\s*the\s*District\s*[:\-]?\s*([^\n]+)/i, /District\s*[:\-]?\s*([^\n]+)/i]),
            dateOfMeeting: meetingDate,
            pomDueDate,
            pomUploaded: first(text, [/PoM\s*Uploaded\s*[:\-]?\s*(Yes|No)/i, /POM\s*Uploaded\s*[:\-]?\s*(Yes|No)/i]),
            meetingExpenditure: exp,
            statusOfBills: first(text, [/Status\s*of\s*Bills\s*[:\-]?\s*([^\n]+)/i]),
            billsSubmittedCRD: dateISO(first(text, [/Bills\s*Submitted\s*to\s*CRD[^:]*[:\-]?\s*([^\n]+)/i])),
            billsForwardedMoRD: dateISO(first(text, [/Bills\s*Forwarded\s*to\s*MoRD[^:]*[:\-]?\s*([^\n]+)/i])),
            proposedDateOfMeeting: dateISO(first(text, [/Proposed\s*Date\s*of\s*Meeting\s*[:\-]?\s*([^\n]+)/i])),
            statusOfMeeting: first(text, [/Status\s*of\s*Meeting\s*[:\-]?\s*(Held|To\s*be\s*held|Postponed)/i]),
            remarks: first(text, [/Remarks\s*[:\-]?\s*([^\n]+)/i]),
            officeFileNo: first(text, [/File\s*(?:No|Number)\s*[:\-]?\s*([^\n]+)/i]),
            officeDateArised: dateISO(first(text, [/Date\s*Arised\s*[:\-]?\s*([^\n]+)/i])),
            officeSubject: first(text, [/Subject\s*[:\-]?\s*([^\n]+)/i]),
            communicationType: first(text, [/Type\s*of\s*Communication\s*[:\-]?\s*(Letter|D\.O\.\s*Letter|UO\s*Note|Memo)/i]),
            officeCommunicationType: first(text, [/Type\s*of\s*Communication\s*[:\-]?\s*(Letter|D\.O\.\s*Letter|UO\s*Note|Memo)/i]),
            letterAddressedTo: first(text, [/Letter\s*addressed\s*to\s*[:\-]?\s*([^\n]+)/i]),
            officeLetterAddressedTo: first(text, [/Letter\s*addressed\s*to\s*[:\-]?\s*([^\n]+)/i]),
            replyObtainedFrom: first(text, [/Reply\s*obtained\s*from\s*[:\-]?\s*([^\n]+)/i]),
            officeReplyObtainedFrom: first(text, [/Reply\s*obtained\s*from\s*[:\-]?\s*([^\n]+)/i]),
            fileStatus: first(text, [/Status\s*of\s*file\s*[:\-]?\s*(Arised|Under\s*Circulation|Despatched|Reply\s*Obtained|Closed)/i]),
            officeStatus: first(text, [/Status\s*of\s*file\s*[:\-]?\s*(Arised|Under\s*Circulation|Despatched|Reply\s*Obtained|Closed)/i]),
            officeFileNo: first(text, [/File\s*(?:No|Number)\s*[:\-]?\s*([^\n]+)/i]),
            officeDateArised: dateISO(first(text, [/Date\s*Arised\s*[:\-]?\s*([^\n]+)/i])),
            officeSubject: first(text, [/Subject\s*[:\-]?\s*([^\n]+)/i])
        };
        fields.confidence = confidence(fields, ["district","dateOfMeeting","pomDueDate","pomUploaded","statusOfMeeting"]);
        fields.rawText = text;
        return fields;
    };

    /* ---------------------------------------------------------
       Generic / Module-A supporting parser
    --------------------------------------------------------- */
    FMSModuleParsers.GENERIC = function (rawText) {
        const text = normalize(rawText);
        return {
            subject: first(text, [/Subject\s*[:\-]?\s*([^\n]+)/i]),
            name: first(text, [/Name\s*[:\-]?\s*([^\n]+)/i, /Applicant\s*[:\-]?\s*([^\n]+)/i]),
            district: first(text, [/District\s*[:\-]?\s*([^\n]+)/i]),
            mobileNumber: (text.match(/\b[6-9]\d{9}\b/) || [""])[0],
            email: (text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/) || [""])[0],
            officeFileNo: first(text, [/File\s*(?:No|Number)\s*[:\-]?\s*([^\n]+)/i]),
            officeDateArised: dateISO(first(text, [/Date\s*Arised\s*[:\-]?\s*([^\n]+)/i])),
            officeSubject: first(text, [/Subject\s*[:\-]?\s*([^\n]+)/i]),
            communicationType: first(text, [/Type\s*of\s*Communication\s*[:\-]?\s*(Letter|D\.O\.\s*Letter|UO\s*Note|Memo)/i]),
            officeCommunicationType: first(text, [/Type\s*of\s*Communication\s*[:\-]?\s*(Letter|D\.O\.\s*Letter|UO\s*Note|Memo)/i]),
            letterAddressedTo: first(text, [/Letter\s*addressed\s*to\s*[:\-]?\s*([^\n]+)/i]),
            officeLetterAddressedTo: first(text, [/Letter\s*addressed\s*to\s*[:\-]?\s*([^\n]+)/i]),
            replyObtainedFrom: first(text, [/Reply\s*obtained\s*from\s*[:\-]?\s*([^\n]+)/i]),
            officeReplyObtainedFrom: first(text, [/Reply\s*obtained\s*from\s*[:\-]?\s*([^\n]+)/i]),
            fileStatus: first(text, [/Status\s*of\s*file\s*[:\-]?\s*(Arised|Under\s*Circulation|Despatched|Reply\s*Obtained|Closed)/i]),
            officeStatus: first(text, [/Status\s*of\s*file\s*[:\-]?\s*(Arised|Under\s*Circulation|Despatched|Reply\s*Obtained|Closed)/i]),
            officeFileNo: first(text, [/File\s*(?:No|Number)\s*[:\-]?\s*([^\n]+)/i]),
            officeDateArised: dateISO(first(text, [/Date\s*Arised\s*[:\-]?\s*([^\n]+)/i])),
            officeSubject: first(text, [/Subject\s*[:\-]?\s*([^\n]+)/i]),
            rawText: text
        };
    };

    window.FMSModuleParsers = FMSModuleParsers;
})(window);
