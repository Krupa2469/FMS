# FMS WhatsApp Custom Message Setup

This revision intentionally uses **one WhatsApp button per module** and a custom text composer. It does not schedule messages and does not use WhatsApp templates.

## 1. Firebase secrets

In the FMS project terminal:

```bash
firebase functions:secrets:set WHATSAPP_ACCESS_TOKEN
firebase functions:secrets:set WHATSAPP_PHONE_NUMBER_ID
```

The access token must come from Meta WhatsApp Business Platform. The phone number ID is the sender phone-number ID associated with the WhatsApp Business Account.

## 2. Install Functions dependencies

```bash
cd functions
npm install
cd ..
```

Node.js 22 is configured for Firebase Functions.

## 3. Deploy only the custom WhatsApp function

```bash
firebase deploy --only functions:sendCustomWhatsAppMessage
```

## 4. How it works

CPGRAMS, RTI and DISHA each have a single **WhatsApp** button. Clicking it opens a composer with:
- recipient international phone number
- editable custom message
- Send WhatsApp button

The browser never receives the Meta access token. The token remains in Firebase Secret Manager and the Cloud Function calls the WhatsApp Cloud API.

## 5. Meta messaging rule

Free-form text is subject to Meta's WhatsApp Business messaging rules. A custom text message is normally allowed during an active customer-service window. Outside that window Meta may require an approved template. This FMS revision intentionally does **not** send templates.

## 6. Dropdowns

Districts use Firestore when populated and a complete 33-district fallback. Mandal and Village dropdowns use this order:
1. Firestore master data
2. official Telangana TGRAC administrative service
3. local fallback data

The dependent flow is District -> Mandal -> Village.
