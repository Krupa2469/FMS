# FMS WhatsApp Custom Messaging

This version sends **custom text messages only** through the WhatsApp Cloud API. No template name, recipient list, or scheduled WhatsApp job is used.

## Required Firebase secrets

```bash
firebase functions:secrets:set WHATSAPP_ACCESS_TOKEN
firebase functions:secrets:set WHATSAPP_PHONE_NUMBER_ID
```

`WHATSAPP_ACCESS_TOKEN` is the Meta WhatsApp Business API access token. `WHATSAPP_PHONE_NUMBER_ID` is the sender phone-number ID from Meta WhatsApp setup.

## Install and deploy

```bash
cd functions
npm install
cd ..
firebase deploy --only functions:sendCustomWhatsAppMessage
```

Custom/free-form text is subject to Meta WhatsApp Business messaging rules. In particular, outside an active customer-service window Meta can require an approved message template. This application intentionally does not create or send templates.
