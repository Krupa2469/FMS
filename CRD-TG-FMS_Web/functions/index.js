const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const WHATSAPP_ACCESS_TOKEN = defineSecret("WHATSAPP_ACCESS_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = defineSecret("WHATSAPP_PHONE_NUMBER_ID");

function clean(value){ return String(value ?? "").trim(); }
function normalizePhone(value){ return clean(value).replace(/[^0-9]/g,""); }

exports.sendCustomWhatsAppMessage = onCall({
  region: "asia-south1",
  secrets: [WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID],
  timeoutSeconds: 30,
  memory: "256MiB"
}, async (request) => {
  const data = request.data || {};
  const to = normalizePhone(data.to);
  const message = clean(data.message);
  const module = clean(data.module || "FMS").slice(0,50);

  if (!/^\d{8,15}$/.test(to)) {
    throw new HttpsError("invalid-argument", "Enter a valid international WhatsApp number without + or spaces.");
  }
  if (!message) throw new HttpsError("invalid-argument", "Message cannot be empty.");
  if (message.length > 4000) throw new HttpsError("invalid-argument", "Message is limited to 4000 characters.");

  const token = clean(WHATSAPP_ACCESS_TOKEN.value());
  const phoneNumberId = clean(WHATSAPP_PHONE_NUMBER_ID.value());
  if (!token) throw new HttpsError("failed-precondition", "WHATSAPP_ACCESS_TOKEN is not configured.");
  if (!phoneNumberId) throw new HttpsError("failed-precondition", "WHATSAPP_PHONE_NUMBER_ID is not configured.");

  const graphVersion = "v23.0";
  const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: message }
    })
  });
  const bodyText = await response.text();
  let body; try { body = JSON.parse(bodyText); } catch { body = { raw: bodyText }; }
  if (!response.ok) {
    logger.error("WhatsApp custom message failed", { module, to, status: response.status, body });
    const detail = body?.error?.message || `WhatsApp API returned HTTP ${response.status}.`;
    throw new HttpsError("failed-precondition", detail);
  }
  logger.info("WhatsApp custom message sent", { module, to, messageId: body?.messages?.[0]?.id || null });
  return { success: true, module, to, messageId: body?.messages?.[0]?.id || null };
});
