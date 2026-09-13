const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const crypto = require('crypto');

admin.initializeApp();
setGlobalOptions({ region: 'asia-south1', maxInstances: 2 });

const db = getFirestore();
const auth = getAuth();
const TZ = 'Asia/Kolkata';
const COLONY_FUND_UPI_ID = 'sriharipriya1209@okhdfcbank';
const COLONY_FUND_PAYMENT_MOBILE = '+919704035400';

const WHATSAPP_TOKEN = defineSecret('WHATSAPP_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = defineSecret('WHATSAPP_PHONE_NUMBER_ID');
const MSG91_AUTHKEY = defineSecret('MSG91_AUTHKEY');
const RAZORPAY_KEY_ID = defineSecret('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET');
const RAZORPAY_WEBHOOK_SECRET = defineSecret('RAZORPAY_WEBHOOK_SECRET');

function todayParts() {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d, iso: s };
}

function norm(v) {
  const d = String(v || '').replace(/\D/g, '');
  if (!d) return '';
  return d.length === 10 ? `91${d}` : (d.startsWith('91') ? d : d);
}

function collectionPeriod(y, m) {
  return `${y}-${String(m).padStart(2, '0')}`;
}

async function communicationSettings() {
  const snap = await db.collection('settings').doc('communications').get();
  return snap.exists ? snap.data() : {};
}

async function sendWhatsAppText(to, text) {
  const token = WHATSAPP_TOKEN.value();
  const phoneId = WHATSAPP_PHONE_NUMBER_ID.value();
  const version = process.env.WHATSAPP_API_VERSION || 'v23.0';
  if (!token || !phoneId) throw new Error('WhatsApp Cloud API credentials are not configured.');

  const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: norm(to),
      type: 'text',
      text: { preview_url: true, body: String(text || '') }
    })
  });
  if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sendWhatsAppTemplate(to, templateName, languageCode, bodyVariables = [], imageUrl = '') {
  const token = WHATSAPP_TOKEN.value();
  const phoneId = WHATSAPP_PHONE_NUMBER_ID.value();
  const version = process.env.WHATSAPP_API_VERSION || 'v23.0';
  if (!token || !phoneId) throw new Error('WhatsApp Cloud API credentials are not configured.');
  if (!templateName) throw new Error('Approved WhatsApp template name is required for automatic/proactive messages.');

  const components = [];
  if (imageUrl) {
    components.push({
      type: 'header',
      parameters: [{ type: 'image', image: { link: imageUrl } }]
    });
  }
  if (Array.isArray(bodyVariables) && bodyVariables.length) {
    components.push({
      type: 'body',
      parameters: bodyVariables.map(v => ({ type: 'text', text: String(v ?? '') }))
    });
  }

  const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: norm(to),
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode || 'en_US' },
        ...(components.length ? { components } : {})
      }
    })
  });
  if (!res.ok) throw new Error(`WhatsApp template API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sendWhatsAppImage(to, imageUrl, caption = '') {
  const token = WHATSAPP_TOKEN.value();
  const phoneId = WHATSAPP_PHONE_NUMBER_ID.value();
  const version = process.env.WHATSAPP_API_VERSION || 'v23.0';
  if (!token || !phoneId) throw new Error('WhatsApp Cloud API credentials are not configured.');
  if (!imageUrl) throw new Error('Image URL is required.');

  const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: norm(to),
      type: 'image',
      image: { link: imageUrl, ...(caption ? { caption } : {}) }
    })
  });
  if (!res.ok) throw new Error(`WhatsApp image API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sendSmsViaMsg91(to, templateId, variables = {}) {
  const authkey = MSG91_AUTHKEY.value();
  if (!authkey) throw new Error('MSG91 authkey is not configured.');
  if (!templateId) throw new Error('MSG91/DLT template ID is required.');

  const settings = await communicationSettings();
  const recipients = [{
    mobiles: norm(to),
    ...Object.fromEntries(Object.entries(variables || {}).map(([k, v]) => [k, String(v ?? '')]))
  }];

  const res = await fetch('https://control.msg91.com/api/v5/flow', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authkey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      template_id: templateId,
      short_url: settings.smsShortUrl ? '1' : '0',
      recipients
    })
  });
  if (!res.ok) throw new Error(`MSG91 API ${res.status}: ${await res.text()}`);
  return res.json();
}

/* ---------------- PAYMENT LINK ---------------- */

exports.createRazorpayPaymentLink = onCall(
  async request => {
    if (!request.auth) throw new Error('Authentication required.');
    const amount = Number(request.data?.amount || 0);
    const resident = request.data?.resident || {};
    if (!amount || amount <= 0) throw new Error('A valid payment amount is required.');
    const period = request.data?.collectionPeriod || collectionPeriod(...Object.values(todayParts()).slice(0, 2));
    return {
      id: `UPI-ACCOUNT-${Date.now()}`,
      shortUrl: '',
      upiId: COLONY_FUND_UPI_ID,
      paymentMobile: COLONY_FUND_PAYMENT_MOBILE,
      mode: 'UPI Account Details',
      status: 'ready'
    };
  }
);

/* Razorpay webhook: verifies payment-link events and records an online payment. */
exports.razorpayWebhook = onRequest(
  { secrets: [RAZORPAY_WEBHOOK_SECRET] },
  async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const secret = RAZORPAY_WEBHOOK_SECRET.value();
    const signature = req.get('X-Razorpay-Signature') || '';
    if (!secret || !signature) return res.status(401).send('Missing webhook signature.');

    const raw = req.rawBody;
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (Buffer.byteLength(expected) !== Buffer.byteLength(signature) || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      return res.status(401).send('Invalid signature.');
    }

    const event = req.body;
    if (event?.event === 'payment_link.paid') {
      const entity = event?.payload?.payment_link?.entity || {};
      const payment = event?.payload?.payment?.entity || {};
      const linkId = String(entity.id || '');
      if (linkId) {
        const linkRef = db.collection('paymentLinks').doc(linkId);
        const linkSnap = await linkRef.get();
        const link = linkSnap.exists ? linkSnap.data() : {};
        const eventRef = db.collection('paymentLinkEvents').doc(String(payment.id || event?.account_id || Date.now()));
        const already = await eventRef.get();
        if (!already.exists) {
          await eventRef.set({
            event: event.event,
            paymentId: payment.id || '',
            paymentLinkId: linkId,
            receivedOn: FieldValue.serverTimestamp()
          });
          if (link.plotNo) {
            const paymentDate = todayParts().iso;
            const record = {
              receiptNo: `ONLINE-${String(payment.id || linkId).slice(-10)}`,
              plotNo: String(link.plotNo),
              ownerName: link.ownerName || '',
              mobile: '',
              phoneE164: '',
              financialYear: getFinancialYearFromISO(paymentDate),
              collectionPeriod: link.collectionPeriod || '',
              fundAmount: Number(link.amount || 0),
              amountPaid: Number(payment.amount || link.amount || 0) / 100,
              balance: 0,
              paymentDate,
              paymentMode: 'Razorpay Payment Link',
              transactionNo: payment.id || '',
              remarks: 'Automatically recorded from Razorpay payment-link webhook.',
              createdOn: new Date().toISOString(),
              createdBy: 'Razorpay Webhook',
              onlinePayment: true,
              paymentLinkId: linkId
            };
            await db.collection('developmentFundPayments').add(record);
            await linkRef.set({
              status: 'paid',
              paidOn: FieldValue.serverTimestamp(),
              paymentId: payment.id || ''
            }, { merge: true });
          }
        }
      }
    }
    return res.status(200).send('OK');
  }
);

function getFinancialYearFromISO(iso) {
  const d = new Date(`${iso}T00:00:00+05:30`);
  const y = d.getFullYear();
  return d.getMonth() >= 3 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
}

/* ---------------- MANUAL / CUSTOM COMMUNICATIONS ---------------- */

exports.sendSms = onCall(
  { secrets: [MSG91_AUTHKEY] },
  async request => {
    if (!request.auth) throw new Error('Authentication required.');
    const profile = await db.collection('userProfiles').doc(request.auth.uid).get();
     const actualRole = profile.exists ? String(profile.data().role || '').trim() : '';
     if (actualRole !== 'Admin') throw new HttpsError('permission-denied', 'SMS access is restricted to Admin only.');

    const to = request.data?.number;
    const result = await sendSmsViaMsg91(to, request.data?.templateId, request.data?.variables || {});
    await db.collection('communications').add({
      type: 'SMS',
      recipient: norm(to),
      templateId: request.data?.templateId || '',
      variables: request.data?.variables || {},
      result,
      sentOn: new Date().toISOString(),
      automatic: false,
      channel: 'MSG91'
    });
    return { ok: true, result };
  }
);
exports.sendWhatsAppMessage = onCall(
  { secrets: [WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID] },
  async request => {
    try {
      if (!request.auth) {
        throw new HttpsError(
          'unauthenticated',
          'Authentication required.'
        );
      }

      const profile = await db.collection('userProfiles').doc(request.auth.uid).get();
      const actualRole = profile.exists ? String(profile.data().role || '').trim() : '';
      if (actualRole !== 'Admin') {
        throw new HttpsError('permission-denied', 'WhatsApp access is restricted to Admin only.');
      }

      const number = request.data?.number;
      const templateName = request.data?.templateName || '';
      const languageCode = request.data?.languageCode || 'en_US';
      const bodyVariables = request.data?.bodyVariables || [];
      const imageUrl = request.data?.imageUrl || '';
      const message = request.data?.message || '';

      console.log('sendWhatsAppMessage request:', {
        number,
        templateName,
        languageCode,
        bodyVariablesCount: Array.isArray(bodyVariables)
          ? bodyVariables.length
          : 0,
        hasImageUrl: !!imageUrl,
        messageLength: String(message).length
      });

      let result;
      let mode;

      if (templateName) {
        result = await sendWhatsAppTemplate(
          number,
          templateName,
          languageCode,
          bodyVariables,
          imageUrl
        );

        mode = 'template';
      } else {
        result = await sendWhatsAppText(
          number,
          message
        );

        mode = 'text';
      }

      await db.collection('communications').add({
        type: 'WhatsApp',
        recipient: norm(number),
        templateName,
        languageCode,
        message,
        imageUrl,
        mode,
        result,
        sentOn: new Date().toISOString(),
        automatic: false,
        channel: 'WhatsApp Cloud API'
      });

      return {
        ok: true,
        result,
        mode
      };

    } catch (error) {

      if (error instanceof HttpsError) throw error;

      console.error(
        'sendWhatsAppMessage FAILED:',
        error?.message || error
      );

      throw new HttpsError(
        'internal',
        error?.message || 'WhatsApp sending failed.'
      );
    }
  }
);

exports.sendBulkWhatsAppMessages = onCall(
  { secrets: [WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID] },
  async request => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const profile = await db.collection('userProfiles').doc(request.auth.uid).get();
    const actualRole = profile.exists ? String(profile.data().role || '').trim() : '';
    if (actualRole !== 'Admin') throw new HttpsError('permission-denied', 'WhatsApp access is restricted to Admin only.');
    const recipients = Array.isArray(request.data?.recipients) ? request.data.recipients : [];
    if (!recipients.length) throw new Error('No recipients supplied.');

    const settings = await communicationSettings();
    const templateName = request.data?.templateName || settings.whatsappCustomTemplateName || '';
    const languageCode = request.data?.languageCode || settings.whatsappLanguageCode || 'en_US';
    const imageUrl = request.data?.imageUrl || '';

    const results = [];
    for (const r of recipients) {
      const to = r.number || r.whatsapp || r.mobile || r.phoneE164;
      if (!norm(to)) continue;
      try {
        const result = templateName
          ? await sendWhatsAppTemplate(to, templateName, languageCode, r.bodyVariables || [], imageUrl)
          : await sendWhatsAppText(to, request.data?.message || '');
        results.push({ number: norm(to), ok: true, result });
      } catch (e) {
        results.push({ number: norm(to), ok: false, error: e.message });
      }
    }
    await db.collection('communications').add({
      type: 'WhatsApp Bulk',
      count: results.length,
      results,
      sentOn: new Date().toISOString(),
      automatic: false,
      channel: 'WhatsApp Cloud API'
    });
    return { ok: true, results };
  }
);

/* ---------------- AUTOMATIC REMINDERS + GREETINGS ---------------- */

async function pendingResidents(y, m) {
  const residents = (await db.collection('residents').where('status', '==', 'Occupied').get())
    .docs.map(d => ({ id: d.id, ...d.data() }));
  const period = collectionPeriod(y, m);
  const pays = (await db.collection('developmentFundPayments').where('collectionPeriod', '==', period).get())
    .docs.map(d => d.data());
  const paid = {};
  for (const p of pays) paid[String(p.plotNo)] = (paid[String(p.plotNo)] || 0) + Number(p.amountPaid || 0);
  return residents
    .map(r => ({
      ...r,
      due: Math.max(0, Number(r.developmentFundAmount || 500) - Number(paid[String(r.plotNo)] || 0)),
      period
    }))
    .filter(r => r.due > 0 && norm(r.whatsapp || r.mobile?.[0] || r.phoneE164));
}

async function processReminders(y, m, iso) {
  const settings = await communicationSettings();
  const pending = await pendingResidents(y, m);

  for (const r of pending) {
    const id = `${r.plotNo}_${r.period}`;
    const ref = db.collection('automationStates').doc(id);
    const state = (await ref.get()).data() || {};
    const last = state.lastReminderSentAt ? new Date(state.lastReminderSentAt) : null;
    const days = last ? (Date.now() - last.getTime()) / 86400000 : 999;
    if (days < 3) continue;

    const paymentLink = COLONY_FUND_UPI_ID;
    const paymentMobile = COLONY_FUND_PAYMENT_MOBILE;
    const msg = `Dear ${r.ownerName},

Greetings from Rose Gardens Residents Welfare Association.

Your Colony Fund for ${r.period} is pending.
Amount Due: ₹${r.due}
Payment Link / UPI ID: ${paymentLink}
PhonePe / GPay No.: ${paymentMobile}
(Same payment account)

If you have already paid, kindly ignore this message.

Regards,
Treasurer
Rose Gardens RWA`;

    try {
      const templateName = settings.whatsappReminderTemplateName || '';
      const language = settings.whatsappLanguageCode || 'en_US';
      if (templateName) {
        await sendWhatsAppTemplate(
          r.whatsapp || r.mobile?.[0] || r.phoneE164,
          templateName,
          language,
          [r.ownerName || '', String(r.due), `${paymentLink} | PhonePe/GPay: ${paymentMobile}`]
        );
      } else {
        await sendWhatsAppText(r.whatsapp || r.mobile?.[0] || r.phoneE164, msg);
      }

      if (settings.smsReminderTemplateId) {
        await sendSmsViaMsg91(
          r.mobile?.[0] || r.whatsapp || r.phoneE164,
          settings.smsReminderTemplateId,
          { name: r.ownerName || '', amount: String(r.due), payment_link: `${paymentLink} | PhonePe/GPay: ${paymentMobile}` }
        );
      }

      await ref.set({
        lastReminderSentAt: new Date().toISOString(),
        lastReminderDate: iso,
        plotNo: String(r.plotNo),
        period: r.period,
        type: 'DEVELOPMENT_FUND_REMINDER'
      });
      await db.collection('communications').add({
        type: 'DEVELOPMENT_FUND_REMINDER',
        plotNo: String(r.plotNo),
        residentName: r.ownerName || '',
        message: msg,
        paymentLink: paymentLink || '',
        paymentMobile: paymentMobile || '',
        sentOn: new Date().toISOString(),
        channel: 'WhatsApp Cloud API + SMS',
        automatic: true
      });
    } catch (e) {
      console.error('Reminder failed', r.plotNo, e.message);
    }
  }
}

async function createAutomatedPaymentLinkIfConfigured(r) {
  // Colony Fund uses the association's authoritative direct UPI ID.
  // This helper is retained for backward compatibility with older scheduled code.
  return COLONY_FUND_UPI_ID;
}

async function processGreetings(iso) {
  const settings = await communicationSettings();
  const gs = await db.collection('greetings').where('active', '==', true).get();

  for (const doc of gs.docs) {
    const g = { id: doc.id, ...doc.data() };
    let match = false;
    if (g.type === 'Birthday' || g.type === 'Marriage Anniversary') {
      match = String(g.date || '').slice(5, 10) === iso.slice(5, 10);
    }
    if (g.type === 'Festival') {
      match = String(g.date || '').slice(0, 10) === iso;
    }
    if (!match) continue;

    const sentRef = db.collection('automationStates').doc(`greeting_${g.id}_${iso}`);
    if ((await sentRef.get()).exists) continue;

    let targets = [];
    if (g.type === 'Festival') {
      targets = (await db.collection('residents').where('status', '==', 'Occupied').get()).docs
        .map(d => d.data()).filter(r => norm(r.whatsapp || r.mobile?.[0] || r.phoneE164));
    } else {
      targets = [g];
    }

    for (const t of targets) {
      const to = t.whatsapp || t.mobile?.[0] || t.phoneE164;
      if (!norm(to)) continue;
      const name = t.ownerName || g.name;
      const msg = g.message || `🌹 Warm greetings from Rose Gardens Residents Welfare Association.

Dear ${name},

Wishing you happiness, good health and prosperity on this special occasion.

Regards,
Rose Gardens RWA`;
      try {
        const templateName = g.whatsappTemplateName || settings.whatsappGreetingTemplateName || '';
        if (templateName) {
          await sendWhatsAppTemplate(to, templateName, g.whatsappLanguageCode || settings.whatsappLanguageCode || 'en_US',
            [name, g.name || 'Rose Gardens'], g.imageUrl || '');
        } else if (g.imageUrl) {
          await sendWhatsAppImage(to, g.imageUrl, msg);
        } else {
          await sendWhatsAppText(to, msg);
        }
        if (settings.smsGreetingTemplateId) {
          await sendSmsViaMsg91(t.mobile?.[0] || t.whatsapp || t.phoneE164,
            settings.smsGreetingTemplateId, { name, occasion: g.name || g.type });
        }
        await db.collection('communications').add({
          type: 'GREETING',
          greetingId: g.id,
          recipient: name,
          message: msg,
          imageUrl: g.imageUrl || '',
          sentOn: new Date().toISOString(),
          channel: 'WhatsApp Cloud API + SMS',
          automatic: true
        });
      } catch (e) {
        console.error('Greeting failed', g.name, e.message);
      }
    }
    await sentRef.set({ sentOn: new Date().toISOString(), type: 'GREETING' });
  }
}

async function processGoodMorning(iso) {
  const snap = await db.collection('settings').doc('goodMorning').get();
  if (!snap.exists || !snap.data().active) return;
  const g = snap.data();
  const sentRef = db.collection('automationStates').doc(`goodMorning_${iso}`);
  if ((await sentRef.get()).exists) return;

  const residents = (await db.collection('residents').where('status', '==', 'Occupied').get()).docs
    .map(d => d.data()).filter(r => norm(r.whatsapp || r.mobile?.[0] || r.phoneE164));

  for (const r of residents) {
    const to = r.whatsapp || r.mobile?.[0] || r.phoneE164;
    try {
      if (g.whatsappTemplateName) {
        await sendWhatsAppTemplate(to, g.whatsappTemplateName, g.whatsappLanguageCode || 'en_US',
          [r.ownerName || 'Rose Gardens Resident'], g.imageUrl || '');
      } else if (g.imageUrl) {
        await sendWhatsAppImage(to, g.imageUrl, g.message || 'Good Morning from Rose Gardens RWA 🌹');
      } else {
        await sendWhatsAppText(to, g.message || 'Good Morning 🌹\nHave a happy, healthy and peaceful day.\n\nRose Gardens RWA');
      }

      if (g.smsTemplateId) {
        await sendSmsViaMsg91(r.mobile?.[0] || r.whatsapp || r.phoneE164,
          g.smsTemplateId, { name: r.ownerName || '' });
      }
    } catch (e) {
      console.error('Good morning failed', r.plotNo, e.message);
    }
  }

  await sentRef.set({ sentOn: new Date().toISOString(), type: 'GOOD_MORNING' });
}


/* ---------------- RAZORPAY BBPS TEST / BILLER CATALOGUE ---------------- */

function requireAdminRole(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  return db.collection('userProfiles').doc(request.auth.uid).get().then(profile => {
    const actualRole = profile.exists ? String(profile.data().role || '').trim() : '';
    if (actualRole !== 'Admin') {
      throw new HttpsError('permission-denied', 'BBPS access is restricted to Admin only.');
    }
  });
}

async function razorpayBbpsGet(path, query = {}) {
  const keyId = RAZORPAY_KEY_ID.value();
  const keySecret = RAZORPAY_KEY_SECRET.value();

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured.');
  }

  const url = new URL(`https://api.razorpay.com${path}`);
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && String(value) !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json'
    }
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_) {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data?.error?.description || data?.error?.message || text || `Razorpay BBPS API ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.razorpay = data;
    throw error;
  }

  return data;
}

/* Fetch all BBPS categories available to the Razorpay Test account. */
exports.bbpsCategories = onCall(
  { secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET] },
  async request => {
    await requireAdminRole(request);

    try {
      const data = await razorpayBbpsGet('/v1/bill_payments/billers/categories');
      return {
        ok: true,
        testMode: true,
        categories: Array.isArray(data.categories) ? data.categories : []
      };
    } catch (error) {
      console.error('BBPS categories failed:', error.message);
      throw new HttpsError('internal', error.message || 'Unable to fetch BBPS categories.');
    }
  }
);

/*
 * Fetch BBPS billers.
 * Supported request.data fields:
 *   category  - e.g. electricity, water, broadband
 *   state     - optional BBPS state code
 *   city      - optional city
 *   status    - active/inactive/deactivated (default active)
 *   count     - 1..100 (default 100)
 *   skip      - pagination offset (default 0)
 *
 * The function deliberately does not hard-code a Telangana state code.
 * We can use the state value returned/confirmed by Razorpay's catalogue.
 */
exports.bbpsBillers = onCall(
  { secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET] },
  async request => {
    await requireAdminRole(request);

    try {
      const category = String(request.data?.category || '').trim();
      const state = String(request.data?.state || '').trim();
      const city = String(request.data?.city || '').trim();
      const status = String(request.data?.status || 'active').trim();
      const count = Math.min(Math.max(Number(request.data?.count || 100), 1), 100);
      const skip = Math.max(Number(request.data?.skip || 0), 0);

      if (!category) {
        throw new HttpsError('invalid-argument', 'BBPS biller category is required.');
      }

      const data = await razorpayBbpsGet('/v1/bill_payments/billers', {
        category,
        ...(state ? { 'geo_coverage.state': state } : {}),
        ...(city ? { 'geo_coverage.city': city } : {}),
        'geo_coverage.country': 'IN',
        status,
        count,
        skip
      });

      return {
        ok: true,
        testMode: true,
        category,
        count: Number(data.count || 0),
        billers: Array.isArray(data.items) ? data.items : []
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error('BBPS billers failed:', error.message, error.razorpay || '');
      throw new HttpsError('internal', error.message || 'Unable to fetch BBPS billers.');
    }
  }
);

/* Daily automation. Reminders run after the 5th; greetings and optional good-morning run daily. */
exports.dailyWhatsAppAutomation = onSchedule(
  { schedule: '0 9 * * *', timeZone: TZ, secrets: [WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, MSG91_AUTHKEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET] },
  async () => {
    const { y, m, d, iso } = todayParts();
    if (d >= 5) await processReminders(y, m, iso);
    await processGreetings(iso);
  }
);

exports.dailyGoodMorning = onSchedule(
  { schedule: '30 7 * * *', timeZone: TZ, secrets: [WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, MSG91_AUTHKEY] },
  async () => {
    const { iso } = todayParts();
    await processGoodMorning(iso);
  }
);


/* ---------------- ADMIN OFFICER PASSWORD RESET ---------------- */
const RGMS_STAFF_ROLES = new Set([
  'Admin', 'President', 'Vice President', 'Secretary',
  'Joint Secretary 1', 'Joint Secretary 2', 'Treasurer'
]);

async function resolveAdminCaller(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Admin sign-in is required.');
  }
  const uid = String(request.auth.uid || '').trim();
  const tokenEmail = String(request.auth.token?.email || '').trim().toLowerCase();

  if (uid) {
    const direct = await db.collection('userProfiles').doc(uid).get();
    if (direct.exists && String(direct.data()?.role || '').trim() === 'Admin') {
      return { uid, email: tokenEmail, profileId: direct.id };
    }
  }

  // Recreated Firebase Authentication accounts receive a new UID. Resolve the
  // existing RGMS Admin profile by the verified Auth email so the Admin can
  // still use server-side administration without weakening client rules.
  if (tokenEmail) {
    const snap = await db.collection('userProfiles').where('email', '==', tokenEmail).limit(5).get();
    const match = snap.docs.find(d => String(d.data()?.role || '').trim() === 'Admin');
    if (match) return { uid, email: tokenEmail, profileId: match.id };
  }

  throw new HttpsError('permission-denied', 'Only the RGMS Admin can reset office-bearer passwords.');
}


/* ---------------- OFFICE-BEARER LOGIN EMAIL RESOLVER ---------------- */
exports.resolveOfficerLoginEmail = onCall(
  { region: 'asia-south1', timeoutSeconds: 15, memory: '256MiB' },
  async request => {
    const requestedRole = String(request.data?.role || '').trim();
    if (!RGMS_STAFF_ROLES.has(requestedRole)) {
      throw new HttpsError('invalid-argument', 'Select a valid office-bearer role.');
    }

    const validEmail = value => {
      const email = String(value || '').trim().toLowerCase();
      return email.includes('@') ? email : '';
    };

    // Role Master (userProfiles) is authoritative for office-bearer login.
    const profileSnap = await db.collection('userProfiles').where('role', '==', requestedRole).limit(20).get();
    const profiles = profileSnap.docs
      .map(d => ({ id: d.id, ...(d.data() || {}) }))
      .sort((a, b) => Number(Boolean(validEmail(b.email))) - Number(Boolean(validEmail(a.email))));
    for (const data of profiles) {
      const email = validEmail(data.email);
      if (email) return { email, source: 'Role Master', residentId: String(data.residentId || '') };
    }

    // Office Bearers Master is the fallback if Role Master has no email yet.
    const bearerSnap = await db.collection('officeBearers').where('role', '==', requestedRole).limit(20).get();
    const docs = bearerSnap.docs
      .map(d => d.data() || {})
      .sort((a,b) => {
        const aa = String(a.status || 'Active').trim().toLowerCase() === 'active' ? 1 : 0;
        const bb = String(b.status || 'Active').trim().toLowerCase() === 'active' ? 1 : 0;
        return bb - aa;
      });
    for (const data of docs) {
      const email = validEmail(data.email);
      if (email) return { email, source: 'Office Bearers Master', residentId: String(data.residentId || '') };
    }

    throw new HttpsError(
      'failed-precondition',
      `No Firebase login email is configured for ${requestedRole}. Add the officer email in Role Master / Office Bearers Master first.`
    );
  }
);


/* ---------------- OFFICE-BEARER SESSION ACTIVATION ----------------
   An RGMS Role Master document may use the generated RGRWA account ID rather
   than the Firebase Authentication UID as its Firestore document ID.  After a
   successful Firebase email/password sign-in this callable resolves the
   authenticated officer by email, validates the configured RGMS role, and
   issues a short custom-claim bridge used by Firestore Security Rules.
*/
function rgNormalizeOfficerRole(value) {
  const raw = String(value || '').trim();
  const key = raw.toLowerCase().replace(/\s+/g, ' ');
  const map = {
    'admin': 'Admin',
    'president': 'President',
    'vice president': 'Vice President',
    'vicepresident': 'Vice President',
    'secretary': 'Secretary',
    'joint secretary 1': 'Joint Secretary 1',
    'jointsecretary1': 'Joint Secretary 1',
    'joint secretary 2': 'Joint Secretary 2',
    'jointsecretary2': 'Joint Secretary 2',
    'treasurer': 'Treasurer'
  };
  return map[key] || raw;
}

async function rgFindOfficerProfileForAuth(uid, email) {
  const cleanUid = String(uid || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (cleanUid) {
    const direct = await db.collection('userProfiles').doc(cleanUid).get();
    if (direct.exists) return direct;
  }

  if (!cleanEmail) return null;

  // Normal Role Master entries store email in lowercase, so use the indexed
  // lookup first.  The small scan fallback also handles historical mixed-case
  // email values without weakening client Firestore rules.
  const exact = await db.collection('userProfiles').where('email', '==', cleanEmail).limit(10).get();
  if (!exact.empty) {
    const staff = exact.docs.find(d => RGMS_STAFF_ROLES.has(rgNormalizeOfficerRole(d.data()?.role)));
    if (staff) return staff;
    return exact.docs[0];
  }

  const allProfiles = await db.collection('userProfiles').get();
  return allProfiles.docs.find(d =>
    String(d.data()?.email || '').trim().toLowerCase() === cleanEmail &&
    RGMS_STAFF_ROLES.has(rgNormalizeOfficerRole(d.data()?.role))
  ) || null;
}

exports.activateOfficerSession = onCall(
  {
    region: 'asia-south1',
    timeoutSeconds: 30,
    memory: '256MiB',
    cors: true
  },
  async request => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Office-bearer sign-in is required.');
    }

    const uid = String(request.auth.uid || '').trim();
    const authEmail = String(request.auth.token?.email || '').trim().toLowerCase();
    if (!uid || !authEmail) {
      throw new HttpsError('failed-precondition', 'The signed-in Firebase account does not contain an email address.');
    }

    const profileDoc = await rgFindOfficerProfileForAuth(uid, authEmail);
    if (!profileDoc) {
      throw new HttpsError('permission-denied', 'No RGMS office-bearer profile is mapped to this Firebase account.');
    }

    const data = profileDoc.data() || {};
    const role = rgNormalizeOfficerRole(data.role);
    if (!RGMS_STAFF_ROLES.has(role)) {
      throw new HttpsError('permission-denied', 'This Firebase account is not assigned an RGMS office-bearer role.');
    }

    const profileEmail = String(data.email || '').trim().toLowerCase();
    if (profileEmail && profileEmail !== authEmail) {
      throw new HttpsError('permission-denied', 'The Firebase account does not match the selected RGMS officer profile.');
    }

    const requestedRole = rgNormalizeOfficerRole(request.data?.role || '');
    if (requestedRole && requestedRole !== role) {
      throw new HttpsError('permission-denied', 'Selected role does not match this account.');
    }

    const authUser = await auth.getUser(uid);
    const previous = { ...(authUser.customClaims || {}) };
    delete previous.role;
    delete previous.officerProfileId;
    delete previous.residentId;
    delete previous.residentDocId;

    const claims = {
      ...previous,
      role,
      officerProfileId: profileDoc.id
    };
    const residentId = String(data.residentId || '').trim();
    if (residentId) claims.residentId = residentId;

    await auth.setCustomUserClaims(uid, claims);

    return {
      ok: true,
      uid,
      role,
      email: authEmail,
      displayName: String(data.displayName || data.name || '').trim(),
      residentId,
      profileDocId: profileDoc.id
    };
  }
);


/* ---------------- ROLE ACCESS PERSISTENCE ----------------
   Role Access is security-sensitive configuration. Client-side writes were
   vulnerable to stale custom claims / historical Role Master document IDs and
   could appear to save while Firestore rejected or reloaded the old matrix.
   These callables resolve the authenticated officer server-side and update only
   the selected role inside settings/roleDashboardAccess.
*/
const RGMS_ROLE_ACCESS_ACTIONS = new Set([
  'view', 'add', 'update', 'delete', 'export', 'share', 'publish', 'approve', 'assign'
]);

function rgRoleAccessYesNo(value) {
  return String(value || '').trim().toUpperCase() === 'YES' ? 'YES' : 'NO';
}

function rgSanitizeRoleAccessRow(input) {
  const source = input && typeof input === 'object' ? input : {};
  const out = {};
  ['associationDashboard', 'residentDashboard', 'sms', 'whatsapp', 'greetings', 'roleManagement']
    .forEach(key => { out[key] = rgRoleAccessYesNo(source[key]); });
  out.permissions = {};
  const permissions = source.permissions && typeof source.permissions === 'object' ? source.permissions : {};
  for (const [feature, values] of Object.entries(permissions)) {
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(String(feature))) continue;
    if (!values || typeof values !== 'object') continue;
    const actions = {};
    for (const [action, value] of Object.entries(values)) {
      if (!RGMS_ROLE_ACCESS_ACTIONS.has(String(action))) continue;
      actions[action] = rgRoleAccessYesNo(value);
    }
    out.permissions[feature] = actions;
  }
  return out;
}

async function rgResolveRoleAccessCaller(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Office-bearer sign-in is required.');
  const uid = String(request.auth.uid || '').trim();
  const email = String(request.auth.token?.email || '').trim().toLowerCase();
  const profile = await rgFindOfficerProfileForAuth(uid, email);
  const profileRole = profile ? rgNormalizeOfficerRole(profile.data()?.role) : '';
  const claimRole = rgNormalizeOfficerRole(request.auth.token?.role || '');
  const role = RGMS_STAFF_ROLES.has(claimRole) ? claimRole : profileRole;
  if (!RGMS_STAFF_ROLES.has(role)) {
    throw new HttpsError('permission-denied', 'This Firebase account is not an authorized RGMS office bearer.');
  }
  return { uid, email, role, profileId: profile?.id || '' };
}

function rgRoleAccessAllowed(matrix, role, action) {
  if (role === 'Admin') return true;
  return String(matrix?.[role]?.permissions?.roleAccessMaster?.[action] || '').trim().toUpperCase() === 'YES';
}

exports.getRoleAccessMatrix = onCall(
  { region: 'asia-south1', timeoutSeconds: 30, memory: '256MiB', cors: true },
  async request => {
    const caller = await rgResolveRoleAccessCaller(request);
    const ref = db.collection('settings').doc('roleDashboardAccess');
    const snap = await ref.get();
    const data = snap.exists ? (snap.data() || {}) : {};
    return {
      ok: true,
      role: caller.role,
      exists: snap.exists,
      matrix: data.matrix && typeof data.matrix === 'object' ? data.matrix : {}
    };
  }
);

exports.saveRoleAccessRole = onCall(
  { region: 'asia-south1', timeoutSeconds: 30, memory: '256MiB', cors: true },
  async request => {
    const caller = await rgResolveRoleAccessCaller(request);
    const targetRole = rgNormalizeOfficerRole(request.data?.role || '');
    if (!RGMS_STAFF_ROLES.has(targetRole) || targetRole === 'Admin') {
      throw new HttpsError('invalid-argument', 'Select a valid non-Admin officer role.');
    }
    const requestedRow = rgSanitizeRoleAccessRow(request.data?.row);
    const ref = db.collection('settings').doc('roleDashboardAccess');

    const result = await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const current = snap.exists ? (snap.data() || {}) : {};
      const currentMatrix = current.matrix && typeof current.matrix === 'object' ? { ...current.matrix } : {};

      if (!snap.exists && caller.role !== 'Admin') {
        throw new HttpsError('failed-precondition', 'Admin must initialize Role Access before an office bearer can maintain it.');
      }
      if (caller.role !== 'Admin' && !rgRoleAccessAllowed(currentMatrix, caller.role, 'update')) {
        throw new HttpsError('permission-denied', 'Your role does not have permission to update Role Access.');
      }

      currentMatrix[targetRole] = requestedRow;
      const payload = {
        ...current,
        id: 'roleDashboardAccess',
        type: 'roleDashboardAccess',
        matrix: currentMatrix,
        updatedOn: FieldValue.serverTimestamp(),
        updatedByUid: caller.uid,
        updatedByEmail: caller.email,
        updatedByRole: caller.role
      };
      tx.set(ref, payload, { merge: false });
      return currentMatrix;
    });

    return { ok: true, role: caller.role, targetRole, matrix: result };
  }
);

exports.resetOfficerPassword = onCall(
  { region: 'asia-south1', timeoutSeconds: 30, memory: '256MiB' },
  async request => {
    const caller = await resolveAdminCaller(request);
    const targetEmail = String(request.data?.targetEmail || '').trim().toLowerCase();
    const requestedRole = String(request.data?.targetRole || '').trim();
    const newPassword = String(request.data?.newPassword || '');

    if (!targetEmail || !targetEmail.includes('@')) {
      throw new HttpsError('invalid-argument', 'Select an office bearer with a valid Firebase email.');
    }
    if (newPassword.length < 6 || newPassword.length > 64) {
      throw new HttpsError('invalid-argument', 'Password must contain between 6 and 64 characters.');
    }

    const profileSnap = await db.collection('userProfiles').where('email', '==', targetEmail).limit(5).get();
    const profileDoc = profileSnap.docs.find(d => RGMS_STAFF_ROLES.has(String(d.data()?.role || '').trim()));
    if (!profileDoc) {
      throw new HttpsError('failed-precondition', 'No office-bearer profile is configured for this email.');
    }
    const targetRole = String(profileDoc.data()?.role || '').trim();
    if (!RGMS_STAFF_ROLES.has(targetRole)) {
      throw new HttpsError('permission-denied', 'The selected account is not an office-bearer account.');
    }
    if (requestedRole && requestedRole !== targetRole) {
      throw new HttpsError('failed-precondition', 'Selected role does not match the office-bearer profile.');
    }
    if (targetRole === 'Admin' && targetEmail !== caller.email) {
      throw new HttpsError('permission-denied', 'Admin can reset another office bearer, but not a different Admin account.');
    }

    let authUser;
    try {
      authUser = await auth.getUserByEmail(targetEmail);
    } catch (error) {
      const code = String(error?.code || '');
      console.error('resetOfficerPassword getUserByEmail failed', { code, message: error?.message, targetEmail });
      if (code.includes('user-not-found')) {
        throw new HttpsError('not-found', 'No Firebase Authentication user exists for this office bearer. Create the Auth user first.');
      }
      if (code.includes('insufficient-permission') || code.includes('permission-denied') || /permission/i.test(String(error?.message||''))) {
        throw new HttpsError('failed-precondition', 'The Cloud Function runtime service account does not have Firebase Authentication Admin permission. Grant it the Firebase Authentication Admin role and retry.');
      }
      throw new HttpsError('internal', `Unable to read the Firebase Authentication account (${code || 'unknown error'}).`);
    }

    try {
      await auth.updateUser(authUser.uid, { password: newPassword });
    } catch (error) {
      const code = String(error?.code || '');
      console.error('resetOfficerPassword updateUser failed', { code, message: error?.message, targetEmail, targetUid: authUser.uid });
      if (code.includes('insufficient-permission') || code.includes('permission-denied') || /permission/i.test(String(error?.message||''))) {
        throw new HttpsError('failed-precondition', 'The Cloud Function runtime service account does not have Firebase Authentication Admin permission. Grant it the Firebase Authentication Admin role and retry.');
      }
      if (code.includes('invalid-password')) {
        throw new HttpsError('invalid-argument', 'Firebase rejected the password. Use at least 6 characters.');
      }
      throw new HttpsError('internal', `Firebase Authentication password update failed (${code || 'unknown error'}).`);
    }

    await db.collection('adminAuditLogs').add({
      action: 'OFFICER_PASSWORD_RESET',
      targetUid: authUser.uid,
      targetEmail,
      targetRole,
      performedByUid: caller.uid,
      performedByEmail: caller.email,
      performedOn: FieldValue.serverTimestamp()
    });

    return { ok: true, targetEmail, targetRole };
  }
);

/* ---------------- RESIDENT OTP LOGIN ---------------- */

function rgText(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}

function rgFirst(obj, keys) {
  for (const key of keys) {
    const v = obj?.[key];

    if (Array.isArray(v) && v.length) {
      const value = rgText(v[0]);
      if (value) return value;
    }

    const value = rgText(v);
    if (value) return value;
  }

  return '';
}

function rgNormalizePhone(v) {
  const digits = rgText(v).replace(/\D/g, '');

  if (!digits) return '';

  // Compare only the last 10 digits so +91 / 91 / plain mobile all match.
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function rgResidentId(data, docId) {
  return rgFirst(data, [
    'residentId',
    'ResidentId',
    'residentID',
    'Resident ID',
    'id',
    'ID'
  ]) || rgText(docId);
}

function rgResidentName(data) {
  return rgFirst(data, [
    'ownerName',
    'name',
    'residentName',
    'Resident Name',
    'Owner Name'
  ]);
}

function rgResidentPhone(data) {
  return rgFirst(data, [
    'phoneE164',
    'phone',
    'phoneNumber',
    'mobile',
    'mobileNumber',
    'cellNo',
    'cellNumber',
    'whatsapp',
    'Cell No',
    'Mobile Number',
    'Registered Mobile Number'
  ]);
}

function rgResidentLoginEligible(data) {
  const residentType = rgFirst(
    data,
    ['residentType', 'Resident Type']
  ).toLowerCase();

  // RGMS 1.2.284 resident-login rule:
  // Resident Type alone controls login eligibility. Owners, Tenants and Family
  // Members are selectable for every Occupation Status (Owner / Tenant / Vacant /
  // legacy Occupied). Other Resident Types are excluded.
  return (
    residentType === 'owner' ||
    residentType === 'owners' ||
    residentType === 'property owner' ||
    residentType === 'propertyowner' ||
    residentType === 'tenant' ||
    residentType === 'tenants' ||
    residentType === 'family member' ||
    residentType === 'family members' ||
    residentType === 'familymember' ||
    residentType === 'familymembers'
  );
}

async function rgFindResidentById(residentId) {
  const id = rgText(residentId);

  if (!id) return null;

  // First try Firestore document ID.
  const direct = await db.collection('residents').doc(id).get();

  if (direct.exists) {
    return {
      doc: direct,
      data: direct.data() || {}
    };
  }

  // Then try known Resident ID field names.
  const fields = [
    'residentId',
    'ResidentId',
    'residentID',
    'Resident ID',
    'id'
  ];

  for (const field of fields) {
    const snap = await db
      .collection('residents')
      .where(field, '==', id)
      .limit(1)
      .get();

    if (!snap.empty) {
      const doc = snap.docs[0];

      return {
        doc,
        data: doc.data() || {}
      };
    }
  }

  return null;
}


/*
 * Returns only Resident ID + Name.
 * Mobile numbers are deliberately not exposed to the login page.
 */
exports.residentLoginDirectory = onCall(
  {
    region: 'asia-south1',
    timeoutSeconds: 30,
    memory: '256MiB',
    cors: true
  },
  async () => {
    try {
      const snap = await db.collection('residents').get();

      const residents = snap.docs
        .map(doc => {
          const data = doc.data() || {};

          return {
            residentId: rgResidentId(data, doc.id),
            name: rgResidentName(data),
            eligible: rgResidentLoginEligible(data)
          };
        })
        .filter(row =>
          row.eligible &&
          row.residentId &&
          row.name
        )
        .map(row => ({
          residentId: row.residentId,
          name: row.name
        }))
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            'en',
            { sensitivity: 'base' }
          )
        );

      return {
        ok: true,
        residents
      };

    } catch (error) {
      console.error(
        'residentLoginDirectory failed:',
        error
      );

      throw new HttpsError(
        'internal',
        'Resident login directory is temporarily unavailable.'
      );
    }
  }
);


/*
 * Called only after Firebase Phone OTP succeeds.
 * The verified Firebase phone number must match the selected
 * Resident Master record before Resident claims are activated.
 */

exports.residentLoginPhone = onCall(
  {
    region: 'asia-south1',
    timeoutSeconds: 30,
    memory: '256MiB',
    cors: true
  },
  async request => {
    const residentId = rgText(request.data?.residentId);
    if (!residentId) {
      throw new HttpsError('invalid-argument', 'Resident ID is required.');
    }
    const match = await rgFindResidentById(residentId);
    if (!match) {
      throw new HttpsError('not-found', 'Resident not found.');
    }
    if (!rgResidentLoginEligible(match.data)) {
      throw new HttpsError('permission-denied', 'Resident login is not enabled for this record.');
    }
    const phone = rgNormalizePhone(rgResidentPhone(match.data));
    if (phone.length !== 10) {
      throw new HttpsError('failed-precondition', 'Registered mobile number is not mapped for this resident.');
    }
    return { phoneE164: `+91${phone}` };
  }
);

exports.activateResidentSession = onCall(
  {
    region: 'asia-south1',
    timeoutSeconds: 30,
    memory: '256MiB',
    cors: true
  },
  async request => {

    if (!request.auth?.uid) {
      throw new HttpsError(
        'unauthenticated',
        'OTP verification is required.'
      );
    }

    const residentId = rgText(
      request.data?.residentId
    );

    if (!residentId) {
      throw new HttpsError(
        'invalid-argument',
        'Resident ID is required.'
      );
    }

    const match = await rgFindResidentById(
      residentId
    );

    if (!match) {
      throw new HttpsError(
        'not-found',
        'Resident not found.'
      );
    }

    const resident = match.data;

    if (!rgResidentLoginEligible(resident)) {
      throw new HttpsError(
        'permission-denied',
        'Resident login is not enabled for this record.'
      );
    }

    const verifiedPhone = rgNormalizePhone(
      request.auth.token?.phone_number ||
      request.auth.token?.phoneNumber ||
      ''
    );

    const registeredPhone = rgNormalizePhone(
      rgResidentPhone(resident)
    );

    if (
      !verifiedPhone ||
      !registeredPhone ||
      verifiedPhone !== registeredPhone
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Registered mobile number does not match.'
      );
    }

    try {
      const uid = request.auth.uid;

      const authUser = await auth.getUser(uid);

      const existingClaims =
        authUser.customClaims || {};

      await auth.setCustomUserClaims(uid, {
        ...existingClaims,
        role: 'Resident',
        residentId: residentId,
        residentDocId: match.doc.id
      });

      await db.collection('residentLoginAudit').add({
        residentId,
        residentDocId: match.doc.id,
        uid,
        loginOn: FieldValue.serverTimestamp()
      });

      return {
        ok: true,
        residentId,
        residentDocId: match.doc.id
      };

    } catch (error) {
      console.error(
        'activateResidentSession failed:',
        error
      );

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        'Resident session could not be activated.'
      );
    }
  }
);

/* ---------------- RESIDENT SELF PROFILE ---------------- */
async function rgAuthenticatedResident(request) {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Resident sign-in is required.');
  }

  const claimedResidentId = rgText(request.auth.token?.residentId || '');
  const requestedResidentId = rgText(request.data?.residentId || '');

  if (claimedResidentId && requestedResidentId && claimedResidentId !== requestedResidentId) {
    throw new HttpsError('permission-denied', 'This profile does not match the verified resident login.');
  }

  const residentId = claimedResidentId || requestedResidentId;
  if (!residentId) {
    throw new HttpsError('failed-precondition', 'Resident session is not activated.');
  }

  const match = await rgFindResidentById(residentId);
  if (!match) {
    throw new HttpsError('not-found', 'Resident record not found.');
  }

  // If a stale token has not received the residentId custom claim yet, allow the
  // requested resident only when the Firebase Phone Auth number matches the
  // mobile mapped in Residents Master. This keeps the fallback secure.
  if (!claimedResidentId) {
    const verifiedPhone = rgNormalizePhone(
      request.auth.token?.phone_number || request.auth.token?.phoneNumber || ''
    );
    const registeredPhone = rgNormalizePhone(rgResidentPhone(match.data));
    if (!verifiedPhone || !registeredPhone || verifiedPhone !== registeredPhone) {
      throw new HttpsError('permission-denied', 'Verified mobile number does not match this resident.');
    }
  }

  return { residentId, ...match };
}

function rgPublicProfile(data, docId) {
  return {
    residentId: rgResidentId(data, docId),
    ownerName: rgResidentName(data),
    houseNo: rgText(data.houseNo || data.plotNo || data['H.No.']),
    dateOfBirth: rgText(data.dateOfBirth || data.dob || data.birthday),
    marriageAnniversary: rgText(data.marriageAnniversary || data.anniversary || data.anniversaryDate),
    email: rgText(data.email || data.personalEmail),
    bloodGroup: rgText(data.bloodGroup),
    occupation: rgText(data.occupation || data.profession),
    emergencyContact: rgText(data.emergencyContact),
    personalRemarks: rgText(data.personalRemarks || data.profileRemarks)
  };
}

exports.getResidentProfile = onCall(
  { region: 'asia-south1', timeoutSeconds: 30, memory: '256MiB', cors: true },
  async request => {
    try {
      const match = await rgAuthenticatedResident(request);
      return { ok: true, profile: rgPublicProfile(match.data, match.doc.id) };
    } catch (error) {
      console.error('getResidentProfile failed:', error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', 'Resident profile could not be loaded.');
    }
  }
);

exports.updateResidentProfile = onCall(
  { region: 'asia-south1', timeoutSeconds: 30, memory: '256MiB', cors: true },
  async request => {
    try {
      const match = await rgAuthenticatedResident(request);
      const clean = v => rgText(v).slice(0, 500);
      const emergencyContact = rgText(request.data?.emergencyContact).replace(/\D/g, '').slice(-10);
      if (emergencyContact && emergencyContact.length !== 10) {
        throw new HttpsError('invalid-argument', 'Emergency contact must contain 10 digits.');
      }
      const email = clean(request.data?.email).slice(0,120);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new HttpsError('invalid-argument', 'Enter a valid email address.');
      }
      const update = {
        dateOfBirth: clean(request.data?.dateOfBirth).slice(0,10),
        marriageAnniversary: clean(request.data?.marriageAnniversary).slice(0,10),
        email,
        bloodGroup: clean(request.data?.bloodGroup).slice(0,5),
        occupation: clean(request.data?.occupation).slice(0,80),
        emergencyContact,
        personalRemarks: clean(request.data?.personalRemarks),
        profileUpdatedOn: FieldValue.serverTimestamp(),
        profileUpdatedByUid: request.auth.uid
      };
      await match.doc.ref.set(update, { merge: true });
      const fresh = await match.doc.ref.get();
      return { ok: true, profile: rgPublicProfile(fresh.data() || {}, fresh.id) };
    } catch (error) {
      console.error('updateResidentProfile failed:', error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', 'Resident profile could not be saved.');
    }
  }
);
