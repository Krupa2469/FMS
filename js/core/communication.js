/*=========================================================
  RGMS COMMUNICATION + PAYMENT UTILITIES 1.0
  WhatsApp is MANUAL for now: the existing WhatsApp buttons
  open WhatsApp Web/App with a pre-filled editable message.
  Automated WhatsApp delivery is intentionally held.
=========================================================*/
(function () {
    function normalizeDigits(number) {
        const digits = String(number || "").replace(/\D/g, "");
        if (!digits) return "";
        return digits.length === 10 ? "91" + digits : (digits.startsWith("91") ? digits : digits);
    }

    function openWhatsApp(number, message) {
        const digits = normalizeDigits(number);
        if (!digits) throw new Error("Resident WhatsApp number is missing.");
        const url = "https://wa.me/" + digits + "?text=" + encodeURIComponent(message || "");
        window.RGMS?.openExternal ? window.RGMS.openExternal(url) : window.open(url, "_blank", "noopener,noreferrer");
        return { mode: "manual", number: digits };
    }

    // Keeps the same existing WhatsApp buttons, but lets Admin/Treasurer
    // edit the message before WhatsApp is opened.
    function openWhatsAppComposer(number, prefilledMessage = "", title = "WhatsApp Message") {
        const digits = normalizeDigits(number);
        if (!digits) {
            alert("Resident WhatsApp number is missing.");
            return false;
        }
        const message = window.prompt(title + "\n\nEdit the message if required, then press OK:", prefilledMessage || "");
        if (message === null) return false;
        openWhatsApp(digits, message);
        return true;
    }

    // Direct UPI payment deep link. Android presents the installed UPI apps;
    // the selected payer app receives the beneficiary, amount, note and an RGMS
    // reference pre-filled. The payer must still authorize with their UPI PIN.
    function generateUPIPaymentLink(resident, amount, period = getCollectionPeriod()) {
        const value = Number(amount || 0);
        const houseNo = formatHNo(resident?.houseNo || resident?.plotNo || "");
        const periodKey = String(period || "").replace(/\D/g, "").slice(-6) || "000000";
        const houseKey = String(houseNo || "NA").replace(/\D/g, "").slice(-8) || "NA";
        const stamp = String(Date.now()).slice(-8);
        const transactionRef = (`RGMSCF${periodKey}${houseKey}${stamp}`).slice(0, 35);
        const params = new URLSearchParams();
        params.set("pa", String(SOCIETY.upiId || "").trim());
        params.set("pn", String(SOCIETY.upiRecipientName || "S Sri Hari Priya"));
        params.set("tr", transactionRef);
        if (value > 0) params.set("am", value.toFixed(2));
        params.set("cu", "INR");
        params.set("tn", `Colony Fund ${period}${houseNo ? " - " + houseNo : ""}`.slice(0, 80));
        return "upi://pay?" + params.toString();
    }

    async function callFunction(name, data) {
        if (!window.RGMS?.firebase?.app) throw new Error("Firebase is not initialized.");
        const { getFunctions, httpsCallable } =
            await import("https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js");
        const functions = getFunctions(window.RGMS.firebase.app, "asia-south1");
        const callable = httpsCallable(functions, name);
        const result = await callable(data || {});
        return result.data;
    }

    async function createPaymentLink({ resident, amount, fundType = "Colony Fund", collectionPeriod }) {
        const value = Number(amount || 0);
        if (!value || value <= 0) throw new Error("A valid payment amount is required.");
        const period = collectionPeriod || getCollectionPeriod();
        return {
            ok: true,
            mode: "UPI Account Details",
            upiId: SOCIETY.upiId,
            paymentMobile: SOCIETY.paymentMobile || "",
            shortUrl: "",
            fundType,
            collectionPeriod: period
        };
    }

    async function sendSms({ number, templateId, variables = {}, metadata = {} }) {
        return callFunction("sendSms", { number, templateId, variables, metadata });
    }

    // Kept for future re-enable. Current UI uses openWhatsApp/openWhatsAppComposer.
    async function sendWhatsApp({ number, message, templateName, languageCode = "en_US", bodyVariables = [], imageUrl = "" }) {
        return callFunction("sendWhatsAppMessage", {
            number, message, templateName, languageCode, bodyVariables, imageUrl
        });
    }

    async function sendBulkWhatsApp({ recipients, message, templateName, languageCode = "en_US", imageUrl = "" }) {
        return callFunction("sendBulkWhatsAppMessages", {
            recipients, message, templateName, languageCode, imageUrl
        });
    }

    function buildDevelopmentFundReminder(resident, amount, paymentLink) {
        const paymentId = SOCIETY.upiId || paymentLink || "";
        const paymentMobile = SOCIETY.paymentMobile || "+919704035400";
        return `Dear ${resident.ownerName},\n\nGreetings from ${SOCIETY.name}.\n\nOur records indicate that your Colony Fund for ${getCollectionPeriod()} is pending.\n\nAmount Due : ₹${amount}\nPayment Link / UPI ID : ${paymentId}\nPhonePe / GPay No. : ${paymentMobile}\n(Same payment account)\n\nIf you have already paid, kindly ignore this message.\n\nRegards,\n${SOCIETY.treasurerName}\nTreasurer\n${SOCIETY.shortName}`;
    }

    function buildAcknowledgement(payment) {
        return `Dear ${payment.ownerName},\n\nThank you for paying the Colony Fund.\n\nReceipt No. : ${payment.receiptNo}\nAmount      : ₹${payment.amountPaid}\nDate        : ${payment.paymentDate}\n\nYour payment has been successfully recorded.\n\nRegards,\n${SOCIETY.treasurerName}\nTreasurer\n${SOCIETY.shortName}`;
    }

    async function logCommunication(data) {
        return insertRecord(
            STORAGE_KEYS.COMMUNICATIONS,
            { ...data, createdOn: new Date().toISOString(), mode: "Manual WhatsApp" }
        );
    }

    window.RGMS.communication = {
        openWhatsApp,
        openWhatsAppComposer,
        generateUPIPaymentLink,
        createPaymentLink,
        sendSms,
        sendWhatsApp,
        sendBulkWhatsApp,
        buildDevelopmentFundReminder,
        buildAcknowledgement,
        logCommunication
    };
})();
