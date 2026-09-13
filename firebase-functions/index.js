'use strict';

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();

const REGION = 'asia-south1';
const ALLOWED_ORIGINS = [
  'https://rose-gardens-cheeryal.web.app',
  'https://rose-gardens-cheeryal.firebaseapp.com',
  /^http:\/\/localhost(?::\d+)?$/,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/
];

function text(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}

function first(obj, keys) {
  for (const key of keys) {
    const v = obj?.[key];
    if (Array.isArray(v) && v.length) return text(v[0]);
    if (text(v)) return text(v);
  }
  return '';
}

function normalizeIndianPhone(v) {
  const digits = text(v).replace(/\D/g, '');
  if (!digits) return '';
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function residentIdOf(data, docId) {
  return first(data, ['residentId', 'ResidentId', 'residentID', 'Resident ID', 'id', 'ID']) || text(docId);
}

function residentNameOf(data) {
  return first(data, ['ownerName', 'name', 'residentName', 'Resident Name', 'Owner Name']);
}

function residentPhoneOf(data) {
  return first(data, [
    'phoneE164', 'phone', 'phoneNumber', 'mobile', 'mobileNumber', 'cellNo',
    'cellNumber', 'whatsapp', 'Cell No', 'Mobile Number', 'Registered Mobile Number'
  ]);
}

function isLoginEligible(data) {
  const residentType = first(data, ['residentType', 'Resident Type']).toLowerCase();
  // Resident Type = Owner, Tenant or Family Member is eligible for login for
  // every Occupation Status. Other Resident Types are excluded.
  return [
    'owner', 'owners', 'property owner', 'propertyowner',
    'tenant', 'tenants',
    'family member', 'family members', 'familymember', 'familymembers'
  ].includes(residentType);
}

async function findResidentById(residentId) {
  const db = getFirestore();
  const id = text(residentId);
  if (!id) return null;

  const direct = await db.collection('residents').doc(id).get();
  if (direct.exists) return { doc: direct, data: direct.data() || {} };

  for (const field of ['residentId', 'ResidentId', 'residentID', 'id']) {
    const q = await db.collection('residents').where(field, '==', id).limit(1).get();
    if (!q.empty) {
      const doc = q.docs[0];
      return { doc, data: doc.data() || {} };
    }
  }
  return null;
}

exports.residentLoginDirectory = onCall(
  { region: REGION, cors: ALLOWED_ORIGINS },
  async () => {
    try {
      const snap = await getFirestore().collection('residents').get();
      const residents = snap.docs
        .map(doc => {
          const data = doc.data() || {};
          return {
            residentId: residentIdOf(data, doc.id),
            name: residentNameOf(data),
            phoneE164: residentPhoneOf(data),
            eligible: isLoginEligible(data)
          };
        })
        .filter(r => r.eligible && r.residentId && r.name)
        .map(({ residentId, name }) => ({ residentId, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

      return { residents };
    } catch (error) {
      console.error('residentLoginDirectory failed', error);
      throw new HttpsError('internal', 'Resident login directory is temporarily unavailable.');
    }
  }
);


exports.residentLoginPhone = onCall(
  { region: REGION, cors: ALLOWED_ORIGINS },
  async request => {
    const residentId = text(request.data?.residentId);
    if (!residentId) {
      throw new HttpsError('invalid-argument', 'Resident ID is required.');
    }

    const match = await findResidentById(residentId);
    if (!match) {
      throw new HttpsError('not-found', 'Resident not found.');
    }

    if (!isLoginEligible(match.data)) {
      throw new HttpsError('permission-denied', 'Resident login is not enabled for this record.');
    }

    const phone = normalizeIndianPhone(residentPhoneOf(match.data));
    if (phone.length !== 10) {
      throw new HttpsError('failed-precondition', 'Registered mobile number is not mapped for this resident.');
    }

    // The web client uses this value only to ask Firebase Phone Auth to send
    // the OTP. It is intentionally not displayed or editable on the login UI.
    return { phoneE164: `+91${phone}` };
  }
);

exports.activateResidentSession = onCall(
  { region: REGION, cors: ALLOWED_ORIGINS },
  async request => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'OTP verification is required.');
    }

    const residentId = text(request.data?.residentId);
    if (!residentId) {
      throw new HttpsError('invalid-argument', 'Resident ID is required.');
    }

    const match = await findResidentById(residentId);
    if (!match) {
      throw new HttpsError('not-found', 'Resident not found.');
    }

    const resident = match.data;
    if (!isLoginEligible(resident)) {
      throw new HttpsError('permission-denied', 'Resident login is not enabled for this record.');
    }

    const verifiedPhone = normalizeIndianPhone(
      request.auth.token?.phone_number || request.auth.token?.phoneNumber || ''
    );
    const registeredPhone = normalizeIndianPhone(residentPhoneOf(resident));

    if (!verifiedPhone || !registeredPhone || verifiedPhone !== registeredPhone) {
      throw new HttpsError('failed-precondition', 'Registered mobile number does not match.');
    }

    const uid = request.auth.uid;
    const user = await getAuth().getUser(uid);
    const existingClaims = user.customClaims || {};
    await getAuth().setCustomUserClaims(uid, {
      ...existingClaims,
      role: 'Resident',
      residentId,
      residentDocId: match.doc.id
    });

    return { ok: true, residentId };
  }
);


/* ---------------- RESIDENT SELF PROFILE ---------------- */
async function authenticatedResident(request) {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Resident sign-in is required.');
  const residentId = text(request.auth.token?.residentId || request.data?.residentId || '');
  if (!residentId) throw new HttpsError('failed-precondition', 'Resident session is not activated.');
  const match = await findResidentById(residentId);
  if (!match) throw new HttpsError('not-found', 'Resident record not found.');
  return { residentId, ...match };
}

function publicProfile(data, docId) {
  return {
    residentId: residentIdOf(data, docId),
    ownerName: residentNameOf(data),
    houseNo: text(data.houseNo || data.plotNo || data['H.No.']),
    dateOfBirth: text(data.dateOfBirth || data.dob || data.birthday),
    marriageAnniversary: text(data.marriageAnniversary || data.anniversary || data.anniversaryDate),
    email: text(data.email || data.personalEmail),
    bloodGroup: text(data.bloodGroup),
    occupation: text(data.occupation || data.profession),
    emergencyContact: text(data.emergencyContact),
    personalRemarks: text(data.personalRemarks || data.profileRemarks)
  };
}

exports.getResidentProfile = onCall(
  { region: REGION, cors: ALLOWED_ORIGINS },
  async request => {
    const match = await authenticatedResident(request);
    return { ok: true, profile: publicProfile(match.data, match.doc.id) };
  }
);

exports.updateResidentProfile = onCall(
  { region: REGION, cors: ALLOWED_ORIGINS },
  async request => {
    const match = await authenticatedResident(request);
    const clean = v => text(v).slice(0, 500);
    const emergencyContact = text(request.data?.emergencyContact).replace(/\D/g, '').slice(-10);
    if (emergencyContact && emergencyContact.length !== 10) {
      throw new HttpsError('invalid-argument', 'Emergency contact must contain 10 digits.');
    }
    const update = {
      dateOfBirth: clean(request.data?.dateOfBirth).slice(0,10),
      marriageAnniversary: clean(request.data?.marriageAnniversary).slice(0,10),
      email: clean(request.data?.email).slice(0,120),
      bloodGroup: clean(request.data?.bloodGroup).slice(0,5),
      occupation: clean(request.data?.occupation).slice(0,80),
      emergencyContact,
      personalRemarks: clean(request.data?.personalRemarks),
      profileUpdatedOn: FieldValue.serverTimestamp(),
      profileUpdatedByUid: request.auth.uid
    };
    await match.doc.ref.set(update, { merge: true });
    const fresh = await match.doc.ref.get();
    return { ok: true, profile: publicProfile(fresh.data() || {}, fresh.id) };
  }
);
