/*=========================================================
  RGMS DATA STORE
  Version 1.5: Firebase-only persistent CRUD with explicit collection-key resolution.
  Firestore/backendDataApi is the only persistent data store.
  No localStorage data cache or packaged-data fallback is used for CRUD.
  The in-memory cache is only a rendering cache for the current screen/session.
=========================================================*/
(function () {
    const KEY_TO_COLLECTION = {
        RESIDENTS: "residents",
        DEVELOPMENT_FUND: "developmentFundPayments",
        EXPENDITURES: "expenditures",
        DEVELOPMENT_FUND_SEQUENCE: "sequences",
        FESTIVAL_FUND: "festivalFundPayments",
        GANESH_FESTIVAL: "ganeshFestivalCelebrations",
        VISITORS: "visitors",
        COMPLAINTS: "complaints",
        MEETINGS: "meetings",
        DOCUMENTS: "documents",
        NOTICES: "notices",
        COMMUNICATIONS: "communications",
        GENERAL_INFORMATION: "generalInformation",
        GREETINGS: "greetings",
        SETTINGS: "settings",
        USER_PROFILES: "userProfiles",
        HOME_SERVICES: "homeServices",
        SERVICE_PROVIDERS: "serviceProviders",
        BILLERS: "billers",
        OFFICE_BEARERS: "officeBearers",
        ASSOCIATION_SETTINGS: "associationSettings",
        PAYMENT_MODES: "paymentModes",
        FINANCIAL_YEARS: "financialYears",
        FUND_TYPES: "fundTypes",
        EXPENSE_HEADS: "expenseHeads",
        COMPLAINT_CATEGORIES: "complaintCategories",
        DOCUMENT_CATEGORIES: "documentCategories",
        NOTICE_CATEGORIES: "noticeCategories",
        VISITOR_TYPES: "visitorTypes",
        MEETING_TYPES: "meetingTypes",
        COMMUNICATION_TEMPLATES: "communicationTemplates",
        REPORTS_MASTER: "reportsMaster",
        DATA_ENTRY_FIELDS: "dataEntryFields"
    };

    const COLLECTION_ALIASES = {
        RESIDENTS: ["residents", "rgms_residents"],
        DEVELOPMENT_FUND: ["developmentFundPayments", "rgms_development_fund", "development_fund", "developmentFund", "developmentFundRegister", "colonyFundPayments", "colonyFund", "colony_fund", "colonyFundRegister"],
        DEVELOPMENT_FUND_SEQUENCE: ["sequences", "developmentFundSequence", "development_fund_sequence"],
        EXPENDITURES: ["expenditures", "rgms_expenditures"],
        FESTIVAL_FUND: ["festivalFundPayments", "rgms_festival_fund", "festival_fund", "festivalFund", "festivalPayments", "ganeshFestivalFund", "ganeshChanda", "festivalChanda"],
        GANESH_FESTIVAL: ["ganeshFestivalCelebrations", "rgms_ganesh_festival", "ganesh_festival", "ganeshFestival", "festivalCelebrations", "ganeshCelebrations", "ganeshFestivalCollection", "ganeshFestivalCollections"],
        VISITORS: ["visitors", "rgms_visitors"],
        COMPLAINTS: ["complaints", "rgms_complaints"],
        MEETINGS: ["meetings", "rgms_meetings"],
        DOCUMENTS: ["documents", "rgms_documents"],
        NOTICES: ["notices", "rgms_notices"],
        COMMUNICATIONS: ["communications", "rgms_communications"],
        GENERAL_INFORMATION: ["generalInformation", "rgms_general_information", "general_information"],
        GREETINGS: ["greetings", "rgms_greetings"],
        SETTINGS: ["settings", "rgms_settings"],
        USER_PROFILES: ["userProfiles", "rgms_user_profiles", "user_profiles"],
        HOME_SERVICES: ["homeServices", "rgms_home_services", "home_services"],
        SERVICE_PROVIDERS: ["serviceProviders", "rgms_service_providers", "service_providers"],
        BILLERS: ["billers", "rgms_billers"],
        OFFICE_BEARERS: ["officeBearers", "rgms_office_bearers"],
        ASSOCIATION_SETTINGS: ["associationSettings", "rgms_association_settings"],
        PAYMENT_MODES: ["paymentModes", "rgms_payment_modes"],
        FINANCIAL_YEARS: ["financialYears", "rgms_financial_years"],
        FUND_TYPES: ["fundTypes", "rgms_fund_types"],
        EXPENSE_HEADS: ["expenseHeads", "rgms_expense_heads"],
        COMPLAINT_CATEGORIES: ["complaintCategories", "rgms_complaint_categories"],
        DOCUMENT_CATEGORIES: ["documentCategories", "rgms_document_categories"],
        NOTICE_CATEGORIES: ["noticeCategories", "rgms_notice_categories"],
        VISITOR_TYPES: ["visitorTypes", "rgms_visitor_types"],
        MEETING_TYPES: ["meetingTypes", "rgms_meeting_types"],
        COMMUNICATION_TEMPLATES: ["communicationTemplates", "rgms_communication_templates"],
        REPORTS_MASTER: ["reportsMaster", "rgms_reports_master", "reportMaster", "reports_master"],
        DATA_ENTRY_FIELDS: ["dataEntryFields", "rgms_data_entry_fields", "data_entry_fields"]
    };

    const cache = {};
    const inFlight = new Map();
    const cacheLoadedAt = new Map();
    const CACHE_TTL_MS = 0; // 1.2.284: always fetch fresh Firebase data on screen/register load

    // Resolve the Firestore collection name from either the symbolic RGMS key
    // (for example RESIDENTS) or the public STORAGE_KEYS value
    // (for example rgms_residents).  This function must exist before any
    // collection is loaded during application startup.
    function collectionName(key) {
        const raw = String(key ?? "").trim();
        if (!raw) throw new Error("RGMS storage key is empty.");

        if (Object.prototype.hasOwnProperty.call(KEY_TO_COLLECTION, raw)) {
            return KEY_TO_COLLECTION[raw];
        }

        const storageKeys = window.RGMS?.STORAGE_KEYS || {};
        const symbolicKey = Object.keys(storageKeys).find(name => String(storageKeys[name]) === raw);
        if (symbolicKey && Object.prototype.hasOwnProperty.call(KEY_TO_COLLECTION, symbolicKey)) {
            return KEY_TO_COLLECTION[symbolicKey];
        }

        // Accept an already-resolved Firestore collection name for internal
        // calls, but never silently turn an unknown RGMS key into a different
        // collection. This makes configuration errors explicit.
        if (Object.values(KEY_TO_COLLECTION).includes(raw)) return raw;
        throw new Error(`Unknown RGMS storage key: ${raw}`);
    }

    function collectionCandidates(key) {
        const raw = String(key ?? "").trim();
        const storageKeys = window.RGMS?.STORAGE_KEYS || {};
        const symbolicKey = Object.keys(storageKeys).find(name => String(storageKeys[name]) === raw) ||
            (Object.prototype.hasOwnProperty.call(KEY_TO_COLLECTION, raw) ? raw : null);
        const canonical = collectionName(raw);
        const aliases = symbolicKey && COLLECTION_ALIASES[symbolicKey] ? COLLECTION_ALIASES[symbolicKey] : [];
        return [...new Set([canonical, ...aliases, raw].filter(Boolean))];
    }

    // Collections required by the Resident Dashboard. Keep the store Firebase-only;
    // this set only controls which Firebase collections are loaded at resident startup.
    const residentKeys = new Set([
        window.RGMS.STORAGE_KEYS.RESIDENTS,
        window.RGMS.STORAGE_KEYS.DEVELOPMENT_FUND,
        window.RGMS.STORAGE_KEYS.FESTIVAL_FUND,
        window.RGMS.STORAGE_KEYS.GANESH_FESTIVAL,
        window.RGMS.STORAGE_KEYS.NOTICES,
        window.RGMS.STORAGE_KEYS.MEETINGS,
        window.RGMS.STORAGE_KEYS.COMMUNICATIONS,
        window.RGMS.STORAGE_KEYS.SETTINGS,
        window.RGMS.STORAGE_KEYS.SERVICE_PROVIDERS,
        window.RGMS.STORAGE_KEYS.HOME_SERVICES
    ]);

    async function functionsModule() {
        if (!window.RGMS?.firebase?.functions) throw new Error("Firebase Functions is not initialized.");
        return import("https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js");
    }

    async function firestoreModule() {
        return import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js");
    }

    function cleanForFirestore(value) {
        if (Array.isArray(value)) return value.map(cleanForFirestore);
        if (value && typeof value === "object") {
            const out = {};
            Object.entries(value).forEach(([k,v]) => { if (v !== undefined) out[k] = cleanForFirestore(v); });
            return out;
        }
        return value;
    }

    let nativeFirestoreSeq = 0;
    function nativeResidentSession() {
        // 1.2.160: the APK's native Firebase SDK is the authoritative Firestore
        // client for BOTH resident and office-bearer sessions.  The WebView
        // Firebase Auth instance does not reliably share the native login state;
        // requiring RGMSNativeAuth.getCurrentUser() here caused Colony Fund to
        // fall back to the unauthenticated Web SDK and return an empty/error
        // snapshot even while the Association Dashboard already had data.
        // If the native bridge is available, use it. Native Firestore itself
        // enforces the active FirebaseAuth session and returns a real error when
        // authentication/permissions are missing.
        const native = window.RGMS?.isNativeAndroid && window.AndroidBridge;
        return !!(native && typeof window.AndroidBridge.firestoreList === "function");
    }

    function nativeFirestoreRequest(method, args = [], timeoutMs = 20000) {
        if (!window.AndroidBridge || typeof window.AndroidBridge[method] !== "function") {
            return Promise.reject(new Error("Native Firestore bridge is unavailable."));
        }
        const requestId = `fs_${Date.now()}_${++nativeFirestoreSeq}`;
        window.RGMSNativeFirestoreCallbacks = window.RGMSNativeFirestoreCallbacks || {};
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                delete window.RGMSNativeFirestoreCallbacks[requestId];
                reject(new Error("Native Firestore request timed out."));
            }, timeoutMs);
            window.RGMSNativeFirestoreCallbacks[requestId] = {
                onSuccess: (json) => { clearTimeout(timer); delete window.RGMSNativeFirestoreCallbacks[requestId]; resolve(json); },
                onError: (message) => { clearTimeout(timer); delete window.RGMSNativeFirestoreCallbacks[requestId]; reject(new Error(message || "Native Firestore request failed.")); }
            };
            try { window.AndroidBridge[method](...args, requestId); } catch (e) {
                clearTimeout(timer); delete window.RGMSNativeFirestoreCallbacks[requestId]; reject(e);
            }
        });
    }

    // Android resident OTP is authenticated by the native Firebase SDK. The WebView
    // Firebase SDK does not share that user, so resident CRUD must use the native
    // Firestore bridge. Officer sessions continue to use the Web SDK/backend path.
    async function ensureNativeReadAuth() {
        if (!nativeResidentSession()) return;
        try {
            const raw = window.RGMSNativeAuth?.getCurrentUser?.() || "";
            if (raw) return;
        } catch (_) {}
        // A persisted WebView role session can outlive the native FirebaseAuth
        // process session after an app update/restart. Reads only require an
        // authenticated Firebase user under the deployed rules, so establish a
        // native read session before querying Firestore instead of rendering
        // false zeroes or leaving Colony Fund at initialization.
        if (window.AndroidBridge && typeof window.AndroidBridge.ensureResidentReadAuth === "function") {
            await nativeFirestoreRequest("ensureResidentReadAuth", [], 8000);
        }
    }

    async function directList(collection) {
        if (nativeResidentSession()) {
            await ensureNativeReadAuth();
            const json = await nativeFirestoreRequest("firestoreList", [String(collection)], 9000);
            const rows = JSON.parse(json || "[]");
            return Array.isArray(rows) ? rows : [];
        }
        if (!window.RGMS?.firebase?.db) throw new Error("Firestore is not initialized.");
        const { collection: col, getDocs } = await firestoreModule();
        const snap = await getDocs(col(window.RGMS.firebase.db, collection));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    async function directListForKey(key) {
        // 1.2.284 consolidated rule: the canonical Firestore collection is the
        // only live source for registers, dashboards and reports. Historical
        // alias collections are migration sources only and are never used as a
        // runtime fallback, preventing deleted/old records from reappearing.
        const canonical = collectionName(key);
        if (!canonical) return [];
        const rows = await directList(canonical);
        console.log(`Firebase ${String(key)}: loaded ${Array.isArray(rows) ? rows.length : 0} record(s) from ${canonical}.`);
        return Array.isArray(rows) ? rows : [];
    }

    async function directSet(collection, id, record, merge = true) {
        if (nativeResidentSession()) {
            // 1.2.163: all Android CRUD uses the same native FirebaseAuth +
            // Firestore client as reads. Ensure the native auth session exists
            // before every write so WebView authentication is never required.
            await ensureNativeReadAuth();
            await nativeFirestoreRequest("firestoreSet", [String(collection), String(id), JSON.stringify(cleanForFirestore(record)), Boolean(merge)]);
            return;
        }
        if (!window.RGMS?.firebase?.db) throw new Error("Firestore is not initialized.");
        const { doc, setDoc } = await firestoreModule();
        if (merge) await setDoc(doc(window.RGMS.firebase.db, collection, String(id)), cleanForFirestore(record), { merge: true });
        else await setDoc(doc(window.RGMS.firebase.db, collection, String(id)), cleanForFirestore(record));
    }

    // Insert and update intentionally share the same document-set path.
    // Earlier builds called an undefined directInsert(), which threw before
    // Firestore was reached and then incorrectly fell back to backendDataApi,
    // producing the Firebase authentication error seen on Save.
    async function directInsert(collection, id, record) {
        return directSet(collection, id, record);
    }

    async function directDelete(collection, id) {
        if (nativeResidentSession()) {
            await ensureNativeReadAuth();
            await nativeFirestoreRequest("firestoreDelete", [String(collection), String(id)]);
            return;
        }
        if (!window.RGMS?.firebase?.db) throw new Error("Firestore is not initialized.");
        const { doc, deleteDoc } = await firestoreModule();
        await deleteDoc(doc(window.RGMS.firebase.db, collection, String(id)));
    }

    async function authoritativeList(collection) {
        try {
            return await directList(collection);
        } catch (_) {
            if (window.RGMS.authPersistenceReady) {
                try { await window.RGMS.authPersistenceReady; } catch (_) {}
            }
            const result = await callBackend({ action: "list", collection });
            return Array.isArray(result?.records) ? result.records : [];
        }
    }

    async function waitForFirebaseAuthUser(timeoutMs = 15000) {
        const auth = window.RGMS?.firebase?.auth;
        if (!auth) throw new Error("Firebase Authentication is not initialized.");
        if (auth.currentUser) return auth.currentUser;

        // Firebase Web SDK 12 is modular: onAuthStateChanged is a function,
        // not a method on the Auth object.  Using auth.onAuthStateChanged here
        // made protected officer data requests fail immediately after login.
        try {
            if (typeof auth.authStateReady === 'function') {
                await Promise.race([
                    auth.authStateReady(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase authentication session is not ready. Please sign in again.")), timeoutMs))
                ]);
                if (auth.currentUser) return auth.currentUser;
            }
        } catch (_) {}

        const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js");
        return await new Promise((resolve, reject) => {
            let settled = false;
            let unsubscribe = null;
            const finish = (fn, value) => {
                if (settled) return;
                settled = true;
                if (unsubscribe) { try { unsubscribe(); } catch (_) {} }
                clearTimeout(timer);
                fn(value);
            };
            const timer = setTimeout(() => {
                finish(reject, new Error("Firebase authentication session is not ready. Please sign in again."));
            }, timeoutMs);
            try {
                unsubscribe = onAuthStateChanged(auth, user => {
                    if (user) finish(resolve, user);
                }, error => finish(reject, error));
            } catch (e) {
                finish(reject, e);
            }
        });
    }

    async function callBackend(payload) {
        if (!window.RGMS?.firebase?.functions) {
            throw new Error("Firebase Functions is not initialized.");
        }

        // Option A: all application writes go through the deployed callable
        // backend. Never attempt a direct Firestore write first.
        await waitForFirebaseAuthUser();

        const { httpsCallable } = await functionsModule();
        const callable = httpsCallable(
            window.RGMS.firebase.functions,
            "backendDataApi"
        );

        try {
            const result = await callable(payload);
            if (!result?.data?.ok) {
                throw new Error("Firebase backend returned an unsuccessful response.");
            }
            return result.data;
        } catch (error) {
            const code = String(error?.code || "").replace(/^functions\//, "");
            const message = String(error?.message || "Backend API request failed.");
            console.error("backendDataApi callable failed:", { code, message, payload });
            throw new Error(code ? `Backend API (${code}): ${message}` : message);
        }
    }

    async function waitForNativeFirebaseUser(timeoutMs = 10000) {
        if (!window.RGMS?.isNativeAndroid || !window.RGMSNativeAuth?.getCurrentUser) return null;
        const started = Date.now();
        while (Date.now() - started < timeoutMs) {
            try {
                const raw = window.RGMSNativeAuth.getCurrentUser();
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        if (parsed?.uid) return parsed;
                    } catch (_) {
                        return { uid: String(raw) };
                    }
                }
            } catch (_) {}
            await new Promise(resolve => setTimeout(resolve, 150));
        }
        throw new Error('Native Firebase authentication session is not ready.');
    }

    async function loadCollection(key, options = {}) {
        const name = collectionName(key);
        const force = options.force === true;
        const ttl = Number.isFinite(Number(options.ttlMs)) ? Number(options.ttlMs) : CACHE_TTL_MS;
        const now = Date.now();

        // Reuse a recent successful snapshot and, critically, share concurrent
        // requests for the same collection. Older versions could issue the same
        // Firestore read from navigation + module initialization + dashboard code
        // at the same time, making Android rendering unnecessarily slow.
        if (!force && Array.isArray(cache[key]) && cacheLoadedAt.has(key) &&
            (now - cacheLoadedAt.get(key) < ttl)) {
            return cache[key];
        }
        if (inFlight.has(key)) {
            if (!force) return inFlight.get(key);
            // A forced dashboard refresh must not inherit an older in-flight read
            // that may have started before Firebase Auth was fully restored. Wait
            // for it to finish, then issue a genuinely fresh authoritative read.
            try { await inFlight.get(key); } catch (_) {}
        }

        const promise = (async () => {
            const session = window.RGMS?.auth?.getSession?.() || null;
            const staffRoles = new Set(["Admin", "President", "Vice President", "Secretary", "Joint Secretary 1", "Joint Secretary 2", "Treasurer"]);
            const isStaff = staffRoles.has(String(session?.role || "").trim());
            const attempts = Math.max(1, Number(options.retries || 2));
            let lastError = null;

            for (let attempt = 1; attempt <= attempts; attempt++) {
                try {
                    let records = [];
                    if (isStaff) {
                        // Android officers are authenticated by the native Firebase
                        // SDK. Wait for that exact Firebase user before querying
                        // Firestore; otherwise a page opened immediately after
                        // login can race the native auth restore and render zeros.
                        if (window.RGMS?.isNativeAndroid) {
                            records = await directListForKey(key);
                        } else {
                            try {
                                records = await directListForKey(key);
                            } catch (directError) {
                                if (window.RGMS.authPersistenceReady) {
                                    try { await window.RGMS.authPersistenceReady; } catch (_) {}
                                }
                                const result = await callBackend({ action: "list", collection: name });
                                records = Array.isArray(result?.records) ? result.records : [];
                            }
                        }
                    } else {
                        records = await directListForKey(key);
                    }
                    cache[key] = Array.isArray(records) ? records : [];
                    cacheLoadedAt.set(key, Date.now());

                    // 1.2.284: Firestore is the only authoritative source.
                    // Packaged JSON/local data is never merged into live registers.
                    return cache[key];
                } catch (error) {
                    lastError = error;
                    console.warn(`Firebase load failed (${name}) attempt ${attempt}/${attempts}:`, error);
                    if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, 250 * attempt));
                }
            }
            // Never display stale data when Firebase cannot be refreshed.
            // Clear the rendering cache and surface a user-facing load error.
            cache[key] = [];
            cacheLoadedAt.delete(key);
            throw lastError || new Error(`Unable to load latest ${name} data from Firebase. Please try again.`);
        })().finally(() => inFlight.delete(key));

        inFlight.set(key, promise);
        return promise;
    }

    async function refreshCollection(key, options = {}) {
        return loadCollection(key, { ...options, force: true });
    }

    async function initializeStore() {
        const allKeys = Object.values(window.RGMS.STORAGE_KEYS);
        const session = window.RGMS.auth?.getSession?.();
        const keys = session?.role === "Resident"
            ? allKeys.filter(k => residentKeys.has(k))
            : allKeys;
        await Promise.all(keys.map(async key => {
            try { await loadCollection(key, { retries: 2 }); }
            catch (error) { console.error("RGMS store load failed:", key, error); if (!Array.isArray(cache[key])) cache[key] = []; }
        }));
    }

    function enrichResidentReferences(key, rows) {
        if (key === window.RGMS.STORAGE_KEYS.RESIDENTS) return rows;
        const residents = Array.isArray(cache[window.RGMS.STORAGE_KEYS.RESIDENTS]) ? cache[window.RGMS.STORAGE_KEYS.RESIDENTS] : [];
        if (!residents.length) return rows;

        const norm = v => String(v ?? '').replace(/\s+/g,' ').trim().toLowerCase();
        const hkey = v => norm(String(v ?? '').replace(/^2-1\//i,''));
        const typeKey = r => {
            const t=norm(r?.residentType || r?.type || r?.occupationStatus || r?.status);
            if(!t) return '';
            if(t==='tenant') return 'tenant';
            if(t==='family member'||t==='familymember'||t==='family') return 'family member';
            if(t==='owner'||t==='occupied') return 'owner';
            return t;
        };
        const nameKey = r => norm(r?.ownerName || r?.residentName || r?.name || r?.winnerName);

        const byId = new Map();
        residents.forEach(r => {
            [r.residentId,r.id,r.residentDocId].filter(Boolean).forEach(id => {
                const k=norm(id);
                if(!byId.has(k)) byId.set(k,[]);
                byId.get(k).push(r);
            });
        });

        const resolve = row => {
            if (!row || typeof row !== 'object') return null;
            const rid = norm(row.residentId || row.winnerResidentId || row.residentDocId || row.winnerResidentDocId);
            const rh = hkey(row.houseNo || row.plotNo || row.winnerPlotNo);
            const rn = nameKey(row);
            const rt = typeKey(row);

            let candidates = rh ? residents.filter(r => hkey(r.houseNo || r.plotNo) === rh) : [];
            if (candidates.length > 1 && rt) {
                const typed = candidates.filter(r => typeKey(r) === rt);
                if (typed.length) candidates = typed;
            }
            if (candidates.length > 1 && rn) {
                const named = candidates.filter(r => nameKey(r) === rn);
                if (named.length) candidates = named;
            }
            if (candidates.length === 1) return candidates[0];

            // Resident IDs are used only when unique, or when the H.No. also
            // agrees. Historical duplicated IDs must never overwrite a name in
            // another house.
            if (rid) {
                let idRows = byId.get(rid) || [];
                if (rh && idRows.length > 1) {
                    const sameHouse=idRows.filter(r => hkey(r.houseNo || r.plotNo) === rh);
                    if (sameHouse.length) idRows=sameHouse;
                }
                if (rt && idRows.length > 1) {
                    const sameType=idRows.filter(r => typeKey(r) === rt);
                    if (sameType.length) idRows=sameType;
                }
                if (rn && idRows.length > 1) {
                    const sameName=idRows.filter(r => nameKey(r) === rn);
                    if (sameName.length) idRows=sameName;
                }
                if (idRows.length === 1) return idRows[0];
            }

            if (rn) {
                const byNameRows=residents.filter(r => nameKey(r)===rn);
                if(byNameRows.length===1) return byNameRows[0];
            }
            return candidates[0] || null;
        };

        return rows.map(row => {
            const resident = resolve(row);
            if (!resident) return row;

            const name = resident.ownerName || resident.name || '';
            const house = resident.houseNo || resident.plotNo || '';
            const mobile = resident.mobile?.[0] || resident.whatsapp || '';
            const out = {...row};

            if ('winnerResidentId' in row || String(row.recordType||'').toLowerCase().includes('laddu')) {
                out.winnerResidentId = resident.residentId || resident.id || out.winnerResidentId;
                out.winnerName = name;
                out.winnerPlotNo = resident.plotNo || house;
                out.houseNo = house;
                out.winnerMobile = mobile || out.winnerMobile;
            } else {
                out.residentId = resident.residentId || resident.id || out.residentId;
                out.ownerName = name;
                out.name = name;
                if ('residentName' in out) out.residentName = name;
                out.houseNo = house;
                out.plotNo = resident.plotNo || house;
                if ('whatsapp' in out) out.whatsapp = mobile;
                if ('mobile' in out && mobile) out.mobile = Array.isArray(out.mobile) ? [mobile] : mobile;
            }
            return out;
        });
    }

    function getAllRecords(key) {
        const rows = Array.isArray(cache[key]) ? [...cache[key]] : [];
        return enrichResidentReferences(key, rows);
    }

    // Single authoritative resident master for every resident picker/dropdown.
    // Context-specific modules may apply business rules (for example Colony Fund
    // uses Resident Type = Owner for every Occupation Status), but they must start
    // from this same master list.
    function getResidentMaster(options = {}) {
        const includeVacant = options.includeVacant !== false;
        const rows = getAllRecords(window.RGMS.STORAGE_KEYS.RESIDENTS);
        const seen = new Set();
        const out = [];
        const ownerByHouse = new Map();

        const value = (row, names) => {
            for (const name of names) {
                if (row && row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== '') {
                    return row[name];
                }
            }
            const wanted = names.map(n => String(n).toLowerCase().replace(/[\s_.-]/g, ''));
            for (const key of Object.keys(row || {})) {
                const nk = String(key).toLowerCase().replace(/[\s_.-]/g, '');
                if (wanted.includes(nk) && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
                    return row[key];
                }
            }
            return '';
        };

        rows.forEach(row => {
            const rawH = String(value(row, [
                'houseNo','HouseNo','House No','H.No.','H.No','hno','houseNumber',
                'plotNo','PlotNo','Plot No','plotNumber'
            ]) || '').trim();
            const h = ((typeof window.formatHNo === 'function' && rawH) ? window.formatHNo(rawH) : rawH).toLowerCase();
            const t = String(value(row, [
                'residentType','ResidentType','Resident Type','resident_type','type','Type'
            ]) || 'Owner').trim().toLowerCase();
            const n = String(value(row, [
                'ownerName','OwnerName','Owner Name','owner_name','name','Name','residentName','Resident Name'
            ]) || '').replace(/\s+/g, ' ').trim();
            if (h && n && t === 'owner' && !ownerByHouse.has(h)) ownerByHouse.set(h, n);
        });

        for (const row of rows) {
            if (!row) continue;

            const name = String(value(row, [
                'ownerName','OwnerName','Owner Name','owner_name','name','Name','residentName','Resident Name','fullName'
            ]) || '').replace(/\s+/g, ' ').trim();

            const rawHouseNo = String(value(row, [
                'houseNo','HouseNo','House No','H.No.','H.No','hno','houseNumber',
                'plotNo','PlotNo','Plot No','plotNumber'
            ]) || '').trim();

            const houseNo = (typeof window.formatHNo === 'function' && rawHouseNo)
                ? window.formatHNo(rawHouseNo)
                : rawHouseNo;

            const residentType = String(value(row, [
                'residentType','ResidentType','Resident Type','resident_type','type','Type'
            ]) || 'Owner').trim();

            // H.No. is NOT a resident identity: an Owner and a Tenant can share it.
            // Prefer the Firebase/system resident id. For legacy rows without one,
            // create a stable per-person key so same-house residents remain separate.
            const explicitResidentId = String(value(row, [
                'residentId','ResidentId','Resident ID','Resident Id','resident_id','id','ID'
            ]) || '').trim();
            const residentId = explicitResidentId || [
                'legacy',
                String(houseNo || '').trim().toLowerCase(),
                String(residentType || '').trim().toLowerCase(),
                String(name || '').trim().toLowerCase()
            ].join('::');

            if (!name || !houseNo) continue;

            const rawOccupation = String(value(row, [
                'occupationStatus','OccupationStatus','Occupation Status','occupation_status',
                'occupancyStatus','status','Status'
            ]) || '').replace(/\s+/g, ' ').trim();
            const occupationKey = rawOccupation.toLowerCase();
            const residentTypeKey = String(residentType || '').replace(/\s+/g, ' ').trim().toLowerCase();
            const canonicalResidentType = residentTypeKey === 'tenant' ? 'Tenant'
                : (residentTypeKey === 'family member' || residentTypeKey === 'familymember') ? 'Family Member'
                : 'Owner';
            const vacant = row.isVacant === true || occupationKey === 'vacant';
            // Canonical occupation model used everywhere in the application:
            // Owner / Tenant / Vacant. Legacy "Occupied" rows are resolved from
            // Resident Type so dashboards, filters, reports and forms agree.
            const occupationStatus = vacant ? 'Vacant'
                : occupationKey === 'tenant' ? 'Tenant'
                : occupationKey === 'owner' ? 'Owner'
                : occupationKey === 'occupied' ? (residentTypeKey === 'tenant' ? 'Tenant' : 'Owner')
                : residentTypeKey === 'tenant' ? 'Tenant'
                : 'Owner';

            if (!includeVacant && vacant) continue;

            // Never de-duplicate residents by Resident ID alone. Historical data
            // contains a small number of duplicated/legacy Resident IDs; doing so
            // can silently remove a valid person (for example Pavan Alapati) from
            // dropdowns. The Firestore document id is the strongest identity. When
            // it is unavailable, use a person-level composite identity.
            const residentDocId = String(row.id || row.docId || row.documentId || '').trim();
            const identityKey = residentDocId
                ? `doc:${residentDocId.toLowerCase()}`
                : ['person', residentId, houseNo, residentType, name].map(v => String(v||'').trim().toLowerCase()).join('::');
            const mappedOwnerName = residentType.toLowerCase() === 'tenant'
                ? (ownerByHouse.get(houseNo.toLowerCase()) || row.ownerNameMapped || '')
                : '';

            const normalized = {
                ...row,
                residentId,
                residentDocId: residentDocId || row.residentDocId || '',
                ownerName: name,
                name: String(value(row, ['name','Name','residentName','Resident Name']) || name || mappedOwnerName).trim(),
                houseNo,
                plotNo: String(value(row, ['plotNo','PlotNo','Plot No']) || houseNo).trim(),
                residentType: canonicalResidentType,
                occupationStatus,
                status: occupationStatus === 'Vacant' ? 'Vacant' : 'Occupied',
                isVacant: occupationStatus === 'Vacant',
                ownerNameMapped: mappedOwnerName || row.ownerNameMapped || ''
            };

            if (!seen.has(identityKey)) {
                seen.add(identityKey);
                out.push(normalized);
            }
        }

        return out.sort((a, b) =>
            String(a.ownerName || a.name || '').localeCompare(String(b.ownerName || b.name || ''), 'en', { sensitivity: 'base', numeric: true }) ||
            String(a.houseNo || a.plotNo || '').localeCompare(String(b.houseNo || b.plotNo || ''), undefined, { numeric: true }) ||
            String(a.residentType || '').localeCompare(String(b.residentType || ''), 'en', { sensitivity: 'base' })
        );
    }

    function recordId(record, fallback) {
        return String(record?.id || record?.residentId || record?.receiptNo || fallback || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
    }

    function notifyDataChanged(key, action) {
        try {
            window.dispatchEvent(new CustomEvent("rgms:data-changed", {
                detail: { key, action, timestamp: Date.now() }
            }));
        } catch (e) {
            console.warn("RGMS data-change notification failed:", e);
        }
    }

    // ------------------------------------------------------------------
    // APPLICATION-OPEN FIREBASE BOOTSTRAP
    // ------------------------------------------------------------------
    // The Android host initializes the native Firebase SDK before WebView
    // creation. This companion bootstrap waits for the authenticated
    // Firebase session and then loads every application collection and
    // imports all packaged master/register data that is missing in Firebase.
    // Existing Firebase records are never overwritten by the packaged seed.
    let allDataInitializationPromise = null;

    async function waitForApplicationFirebaseAuth(timeoutMs = 20000) {
        const started = Date.now();
        while (Date.now() - started < timeoutMs) {
            const webUser = window.RGMS?.firebase?.auth?.currentUser || null;
            if (webUser) return { mode: 'web', uid: webUser.uid };

            // Android staff/resident authentication is held by the native
            // Firebase SDK. The native Firestore bridge can use that session
            // even though WebView Firebase Auth has no currentUser.
            try {
                if (window.RGMS?.isNativeAndroid && window.RGMSNativeAuth?.getCurrentUser) {
                    const nativeUid = window.RGMSNativeAuth.getCurrentUser();
                    if (nativeUid) return { mode: 'native', uid: nativeUid };
                }
            } catch (_) {}

            await new Promise(resolve => setTimeout(resolve, 250));
        }
        throw new Error('Firebase authentication session is not ready. Please sign in again.');
    }

    async function seedPackagedRowsIfMissing(key, url, idResolver, normalizer = row => ({ ...row })) {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Unable to load packaged data: ${url}`);
        const source = await response.json();
        const rows = Array.isArray(source) ? source : [];
        if (!rows.length) return { added: 0, total: 0 };

        const existing = getAllRecords(key);
        const existingIds = new Set(existing.map(r => String(r?.id || '').trim()).filter(Boolean));
        const toInsert = [];
        for (const raw of rows) {
            const normalized = normalizer(raw) || {};
            const id = String(idResolver(normalized) || '').trim();
            if (!id || existingIds.has(id)) continue;
            toInsert.push({ ...normalized, id, initializedFromPackagedData: true, initializedOn: new Date().toISOString() });
            existingIds.add(id);
        }
        if (!toInsert.length) return { added: 0, total: rows.length };
        await insertRecords(key, toInsert);
        return { added: toInsert.length, total: rows.length };
    }

    async function initializeAllDataOnAppOpen() {
        if (allDataInitializationPromise) return allDataInitializationPromise;
        allDataInitializationPromise = (async () => {
            const session = window.RGMS?.auth?.getSession?.() || null;
            const staffRoles = new Set(['Admin', 'President', 'Vice President', 'Secretary', 'Joint Secretary 1', 'Joint Secretary 2', 'Treasurer']);
            if (!staffRoles.has(String(session?.role || '').trim())) return { skipped: true, reason: 'resident-or-unauthenticated' };

            await waitForApplicationFirebaseAuth(12000);
            // Load dashboard-critical collections first so financial figures are
            // available quickly after login. Older builds started every master and
            // utility collection at once, which competed with the dashboard reads
            // and made amounts appear several seconds later.
            const all = [...new Set(Object.values(window.RGMS.STORAGE_KEYS || {}))];
            const priority = [...new Set([
                window.RGMS.STORAGE_KEYS.RESIDENTS,
                window.RGMS.STORAGE_KEYS.DEVELOPMENT_FUND,
                window.RGMS.STORAGE_KEYS.GANESH_FESTIVAL,
                window.RGMS.STORAGE_KEYS.FESTIVAL_FUND,
                window.RGMS.STORAGE_KEYS.EXPENDITURES,
                window.RGMS.STORAGE_KEYS.COMPLAINTS,
                window.RGMS.STORAGE_KEYS.VISITORS,
                window.RGMS.STORAGE_KEYS.MEETINGS,
                window.RGMS.STORAGE_KEYS.DOCUMENTS
            ].filter(Boolean))];
            const rest = all.filter(key => !priority.includes(key));
            const loadOne = async key => {
                try {
                    const rows = await loadCollection(key, { retries: 2 });
                    return { key, ok: true, count: Array.isArray(rows) ? rows.length : 0 };
                } catch (error) {
                    return { key, ok: false, count: 0, error: error?.message || String(error) };
                }
            };
            const priorityResults = await Promise.all(priority.map(loadOne));
            // Remaining masters/utilities load only after the dashboard snapshot is
            // ready. They still complete during normal background initialization.
            const restResults = await Promise.all(rest.map(loadOne));
            const results = [...priorityResults, ...restResults];
            return { initialized: true, collections: all.length, priorityCollections: priority.length, totalRecords: results.reduce((n, r) => n + Number(r.count || 0), 0), results };
        })().catch(error => { allDataInitializationPromise = null; throw error; });
        return allDataInitializationPromise;
    }

    async function initializeResidentMaster(options = {}) {
        if (options.manualMigration !== true) throw new Error('Packaged resident migration is disabled. Firebase is authoritative.');
        const response = await fetch("data/residents.json", { cache: "no-store" });
        if (!response.ok) throw new Error("Resident master data could not be loaded from the packaged application.");
        const packaged = await response.json();
        if (!Array.isArray(packaged) || !packaged.length) throw new Error("Resident master file contains no records.");

        await loadCollection(window.RGMS.STORAGE_KEYS.RESIDENTS);
        const existing = getAllRecords(window.RGMS.STORAGE_KEYS.RESIDENTS);
        const byId = new Map(existing.map(r => [String(r?.id || r?.residentId || '').trim(), r]));
        let added = 0;
        let normalized = 0;

        // First-login initialization is intentionally non-destructive: it adds
        // missing packaged residents but never overwrites CRUD changes already
        // saved in Firebase. This keeps the Residents Master authoritative.
        for (const resident of packaged) {
            const id = String(resident?.residentId || resident?.id || resident?.plotNo || resident?.houseNo || '').trim();
            if (!id) continue;
            const houseNo = String(resident?.houseNo || resident?.plotNo || id).trim();
            // Resident ID is the authoritative key. Do not match by H.No.;
            // multiple residents may legitimately share one H.No.
            const existingRow = byId.get(id);
            if (existingRow) {
                const patch = {};
                if (!existingRow.houseNo && houseNo) patch.houseNo = houseNo;
                if (!existingRow.plotNo && houseNo) patch.plotNo = houseNo;
                if (!existingRow.residentId) patch.residentId = id;
                if (!existingRow.name && (resident.name || resident.ownerName)) patch.name = resident.name || resident.ownerName;
                if (!existingRow.ownerName && (resident.ownerName || resident.name)) patch.ownerName = resident.ownerName || resident.name;
                if (Object.keys(patch).length) {
                    await setRecord(window.RGMS.STORAGE_KEYS.RESIDENTS, existingRow.id || id, patch);
                    normalized++;
                }
                continue;
            }
            const payload = {
                ...resident,
                id,
                residentId: resident.residentId || id,
                houseNo,
                plotNo: resident.plotNo || houseNo,
                name: resident.name || resident.ownerName || '',
                ownerName: resident.ownerName || resident.name || '',
                residentType: resident.residentType || 'Owner',
                occupationStatus: resident.occupationStatus || resident.status || 'Vacant',
                status: String(resident.occupationStatus || resident.status || '').toLowerCase() === 'vacant' ? 'Vacant' : 'Occupied',
                isVacant: String(resident.occupationStatus || resident.status || '').toLowerCase() === 'vacant'
            };
            await insertRecord(window.RGMS.STORAGE_KEYS.RESIDENTS, payload);
            added++;
        }

        await loadCollection(window.RGMS.STORAGE_KEYS.RESIDENTS);
        return { count: getAllRecords(window.RGMS.STORAGE_KEYS.RESIDENTS).length, added, normalized, records: getAllRecords(window.RGMS.STORAGE_KEYS.RESIDENTS) };
    }

    async function syncResidentMaster() {
        const session = window.RGMS?.auth?.getSession?.() || null;
        if (String(session?.role || '').trim() !== 'Admin') {
            throw new Error('Only Admin can synchronize the Residents Master.');
        }
        const markerId = 'residentMaster_excel_20260824_v1';
        try { await loadCollection(window.RGMS.STORAGE_KEYS.SETTINGS); } catch (e) { console.warn('Unable to load resident master sync marker:', e); }
        const marker = getAllRecords(window.RGMS.STORAGE_KEYS.SETTINGS).find(r => String(r.id) === markerId);
        if (marker?.status === 'Completed') {
            await loadCollection(window.RGMS.STORAGE_KEYS.RESIDENTS);
            return { count: getAllRecords(window.RGMS.STORAGE_KEYS.RESIDENTS).length, alreadySynchronized: true };
        }
        const response = await fetch('data/residents.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('Resident master data could not be loaded from the packaged Excel update.');
        const packaged = await response.json();
        if (!Array.isArray(packaged) || !packaged.length) throw new Error('Resident master contains no records.');
        await loadCollection(window.RGMS.STORAGE_KEYS.RESIDENTS);
        const existing = getAllRecords(window.RGMS.STORAGE_KEYS.RESIDENTS);
        const incomingIds = new Set();
        let written = 0, deleted = 0;
        for (const resident of packaged) {
            const id = String(resident?.residentId || resident?.id || '').trim();
            if (!id) continue;
            incomingIds.add(id);
            const payload = { ...resident, id, residentId: id, houseNo: resident.houseNo || resident.plotNo || '', plotNo: resident.plotNo || resident.houseNo || '', name: resident.name || resident.ownerName || '', ownerName: resident.ownerName || resident.name || '', occupationStatus: resident.occupationStatus || resident.status || 'Owner', status: String(resident.occupationStatus || '').toLowerCase() === 'vacant' ? 'Vacant' : 'Occupied', isVacant: String(resident.occupationStatus || resident.status || '').toLowerCase() === 'vacant' };
            await setRecord(window.RGMS.STORAGE_KEYS.RESIDENTS, id, payload);
            written++;
        }
        for (const row of existing) {
            const id = String(row?.id || row?.residentId || '').trim();
            if (id && !incomingIds.has(id)) {
                await deleteRecord(window.RGMS.STORAGE_KEYS.RESIDENTS, id);
                deleted++;
            }
        }
        await loadCollection(window.RGMS.STORAGE_KEYS.RESIDENTS);
        try {
            await setRecord(window.RGMS.STORAGE_KEYS.SETTINGS, markerId, { id: markerId, key: markerId, module: 'Residents Master', source: 'All Residents(2).xlsx', importedRecords: packaged.length, written, deleted, importedOn: new Date().toISOString(), status: 'Completed' });
        } catch (e) { console.warn('Unable to save resident master sync marker:', e); }
        return { count: getAllRecords(window.RGMS.STORAGE_KEYS.RESIDENTS).length, written, deleted, alreadySynchronized: false };
    }

    // 1.2.165 Web/Android schema contract. The current Web App is the
    // source of truth for canonical Firestore collection and field names.
    // Android may read historical aliases, but every new/updated record is
    // written to the same canonical collection and with Web-compatible fields.
    function webCanonicalRecord(key, record, forcedId = "") {
        const r = { ...cleanForFirestore(record) };
        const storageKeys = window.RGMS?.STORAGE_KEYS || {};
        const raw = String(key || "");
        const symbolic = Object.keys(storageKeys).find(k => String(storageKeys[k]) === raw) || raw;
        const first = (...vals) => vals.find(v => v !== undefined && v !== null && String(v).trim() !== "");

        // Shared identity normalization used by both Web and Android.
        // Persist one H.No. shape and collapse accidental whitespace in names so
        // dashboards, dropdowns, registers and reports join the same records.
        if (first(r.plotNo, r.houseNo)) {
            const rawHouse = String(first(r.houseNo, r.plotNo)).replace(/\s+/g, ' ').trim();
            const house = (typeof window.formatHNo === 'function') ? window.formatHNo(rawHouse) : rawHouse;
            r.plotNo = house;
            r.houseNo = house;
        }
        if (first(r.ownerName, r.name, r.residentName)) {
            const personName = String(first(r.ownerName, r.name, r.residentName)).replace(/\s+/g, ' ').trim();
            r.ownerName = personName;
            if (symbolic === 'RESIDENTS') r.name = personName;
        }
        if (first(r.residentId, r.ResidentId, r.residentID)) r.residentId = String(first(r.residentId, r.ResidentId, r.residentID)).trim();

        if (symbolic === 'RESIDENTS') {
            r.residentId = String(first(r.residentId, forcedId, r.id));
            r.plotNo = String(first(r.plotNo, r.houseNo, '')).trim();
            r.houseNo = String(first(r.houseNo, r.plotNo, '')).trim();
            r.ownerName = String(first(r.ownerName, r.name, '')).replace(/\s+/g, ' ').trim();
            r.name = r.ownerName;
            const mobileValue = Array.isArray(r.mobile) ? r.mobile.filter(Boolean) : [first(r.mobile, r.cellNo, r.phone, r.whatsapp)].filter(Boolean);
            r.mobile = mobileValue.map(String);
            r.whatsapp = String(first(r.whatsapp, r.mobile[0], ''));
            r.phoneE164 = String(first(r.phoneE164, (typeof normalizePhone === 'function' ? normalizePhone(r.mobile[0] || r.whatsapp) : ''), ''));
            const rawType = String(first(r.residentType, 'Owner')).replace(/\s+/g, ' ').trim().toLowerCase();
            r.residentType = rawType === 'tenant' ? 'Tenant' : (rawType === 'family member' || rawType === 'familymember') ? 'Family Member' : 'Owner';
            const occ = String(first(r.occupationStatus, r.status, '')).trim().toLowerCase();
            const type = String(r.residentType || '').trim().toLowerCase();
            r.occupationStatus = occ === 'vacant' ? 'Vacant'
                : occ === 'tenant' ? 'Tenant'
                : occ === 'owner' ? 'Owner'
                : occ === 'occupied' ? (type === 'tenant' ? 'Tenant' : 'Owner')
                : type === 'tenant' ? 'Tenant' : 'Owner';
            r.status = r.occupationStatus === 'Vacant' ? 'Vacant' : 'Occupied';
            r.isVacant = r.occupationStatus === 'Vacant';
            r.role = String(first(r.role, 'Resident'));
            r.remarks = String(first(r.remarks, '')).trim();
        }

        if (symbolic === 'DEVELOPMENT_FUND' || symbolic === 'FESTIVAL_FUND') {
            r.plotNo = String(first(r.plotNo, r.houseNo, ''));
            r.ownerName = String(first(r.ownerName, r.residentName, r.name, ''));
            r.fundAmount = Number(first(r.fundAmount, r.expectedAmount, window.RGMS?.DEFAULT_FUND_AMOUNT, 500) || 0);
            r.amountPaid = Number(first(r.amountPaid, r.paidAmount, r.amount, r.paymentAmount, 0) || 0);
            r.balance = Number(first(r.balance, Math.max(0, r.fundAmount - r.amountPaid), 0));
            r.paymentDate = String(first(r.paymentDate, r.date, new Date().toISOString().slice(0,10)));
            r.paymentMode = String(first(r.paymentMode, r.mode, ''));
            r.transactionNo = String(first(r.transactionNo, r.transactionId, ''));
            r.remarks = String(first(r.remarks, ''));
            if (first(r.receiptNo, r.receiptNumber)) r.receiptNo = String(first(r.receiptNo, r.receiptNumber));
            if (first(r.collectionPeriod, r.period)) r.collectionPeriod = String(first(r.collectionPeriod, r.period));
            if (first(r.financialYear, r.fy)) r.financialYear = String(first(r.financialYear, r.fy));
        }
        return r;
    }

    async function insertRecord(key, record) {
        const id = recordId(record);
        const enriched = window.RGMS?.dataEntryFields?.enrichRecord ? window.RGMS.dataEntryFields.enrichRecord(key, record, false) : record;
        const payload = { ...webCanonicalRecord(key, enriched, id), id };
        const name = collectionName(key);

        // Prefer a direct Firestore write so the APK immediately persists the
        // exact form values to the user's Firebase project. If Firestore rules
        // reject the client write, fall back to the authenticated backend API.
        try {
            await directInsert(name, id, payload);
        } catch (directError) {
            if (nativeResidentSession()) throw directError;
            console.warn("Direct Firestore insert failed; using backendDataApi:", directError);
            await callBackend({ action: "insert", collection: name, record: payload });
        }

        // Verify that Firestore now contains the same record before updating the
        // local mirror. This prevents a successful-looking Save from being
        // replaced by stale cached data on the next screen refresh.
        const verified = await authoritativeList(name);
        const remoteSaved = verified.find(r => String(r.id) === id);
        if (!remoteSaved) throw new Error(`Firestore verification failed for ${name}/${id}.`);

        const saved = { id, ...remoteSaved };
        const rows = [...getAllRecords(key).filter(r => String(r.id) !== id), saved];
        cache[key] = rows;
        notifyDataChanged(key, "insert");
        return id;
    }


    // Efficiently seed/import a group of records with one final Firestore
    // verification. This avoids the old N x full-collection-read pattern,
    // which could make Colony Fund initialization appear stuck on Android.
    async function insertRecords(key, records = {}) {
        const source = Array.isArray(records) ? records : [];
        if (!source.length) return { count: 0, ids: [] };
        const name = collectionName(key);
        const prepared = source.map(record => {
            const id = recordId(record);
            return { id, payload: { ...webCanonicalRecord(key, record, id), id } };
        });

        // Write in small parallel batches so mobile devices do not overwhelm
        // the Firestore/native bridge with dozens of simultaneous calls.
        const batchSize = 10;
        for (let i = 0; i < prepared.length; i += batchSize) {
            const batch = prepared.slice(i, i + batchSize);
            await Promise.all(batch.map(async item => {
                try {
                    await directInsert(name, item.id, item.payload);
                } catch (directError) {
                    if (nativeResidentSession()) throw directError;
                    console.warn("Direct Firestore bulk insert failed; using backendDataApi:", directError);
                    await callBackend({ action: "insert", collection: name, record: item.payload });
                }
            }));
        }

        const verified = await authoritativeList(name);
        const verifiedById = new Map(verified.map(r => [String(r.id), r]));
        const missing = prepared.filter(item => !verifiedById.has(String(item.id)));
        if (missing.length) {
            throw new Error(`Firestore verification failed for ${name}: ${missing.length} record(s) were not saved.`);
        }

        cache[key] = Array.from(verifiedById.values());
        notifyDataChanged(key, "bulk-insert");
        return { count: prepared.length, ids: prepared.map(x => x.id) };
    }


    // Efficient verified bulk upsert used by one-time data migrations. Each
    // write is sent in small parallel batches and the collection is verified
    // once at the end, avoiding N full-collection reads.
    async function upsertRecords(key, records = []) {
        const source = Array.isArray(records) ? records : [];
        if (!source.length) return { count: 0, ids: [] };
        const name = collectionName(key);
        const prepared = source.map(record => {
            const id = String(record?.id || recordId(record));
            return { id, payload: { ...webCanonicalRecord(key, record, id), id } };
        });
        const batchSize = 10;
        for (let i = 0; i < prepared.length; i += batchSize) {
            const batch = prepared.slice(i, i + batchSize);
            await Promise.all(batch.map(async item => {
                try {
                    await directSet(name, item.id, item.payload);
                } catch (directError) {
                    if (nativeResidentSession()) throw directError;
                    console.warn("Direct Firestore bulk upsert failed; using backendDataApi:", directError);
                    await callBackend({ action: "set", collection: name, id: item.id, record: item.payload });
                }
            }));
        }
        const verified = await authoritativeList(name);
        const verifiedById = new Map(verified.map(r => [String(r.id), r]));
        const missing = prepared.filter(item => !verifiedById.has(item.id));
        if (missing.length) throw new Error(`Firestore verification failed for ${name}: ${missing.length} upserted record(s) were not found.`);
        cache[key] = Array.from(verifiedById.values());
        cacheLoadedAt.set(key, Date.now());
        notifyDataChanged(key, "bulk-upsert");
        return { count: prepared.length, ids: prepared.map(x => x.id) };
    }

    async function deleteRecords(key, ids = []) {
        const source = [...new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean))];
        if (!source.length) return { count: 0, ids: [] };
        const name = collectionName(key);
        const batchSize = 10;
        for (let i = 0; i < source.length; i += batchSize) {
            const batch = source.slice(i, i + batchSize);
            await Promise.all(batch.map(async id => {
                try {
                    await directDelete(name, id);
                } catch (directError) {
                    if (nativeResidentSession()) throw directError;
                    console.warn("Direct Firestore bulk delete failed; using backendDataApi:", directError);
                    await callBackend({ action: "delete", collection: name, id });
                }
            }));
        }
        const verified = await authoritativeList(name);
        const remaining = new Set(verified.map(r => String(r.id)));
        const failed = source.filter(id => remaining.has(id));
        if (failed.length) throw new Error(`Firebase bulk delete verification failed for ${name}: ${failed.length} record(s) remain.`);
        cache[key] = verified;
        cacheLoadedAt.set(key, Date.now());
        notifyDataChanged(key, "bulk-delete");
        return { count: source.length, ids: source };
    }

    async function setRecord(key, id, record) {
        const sid = String(id || recordId(record));
        const enriched = window.RGMS?.dataEntryFields?.enrichRecord ? window.RGMS.dataEntryFields.enrichRecord(key, record, true) : record;
        const payload = { ...webCanonicalRecord(key, enriched, sid), id: sid };
        const name = collectionName(key);

        // Prefer direct Firestore update; fall back to backendDataApi when the
        // Firestore security rules require the server-side officer path.
        try {
            await directSet(name, sid, payload);
        } catch (directError) {
            if (nativeResidentSession()) throw directError;
            console.warn("Direct Firestore update failed; using backendDataApi:", directError);
            await callBackend({ action: "set", collection: name, id: sid, record: payload });
        }

        const verified = await authoritativeList(name);
        const remoteSaved = verified.find(r => String(r.id) === sid);
        if (!remoteSaved) throw new Error(`Firestore verification failed for ${name}/${sid}.`);

        const rows = getAllRecords(key);
        cache[key] = rows.some(r => String(r.id) === sid)
            ? rows.map(r => String(r.id) === sid ? { ...remoteSaved } : r)
            : [...rows, { ...remoteSaved }];
        notifyDataChanged(key, "set");
        return true;
    }

    // Exact document replacement. Role Access uses this path so unchecked
    // nested permissions are actually removed instead of being preserved by
    // Firestore merge semantics. This is also supported by the Android native
    // bridge (merge=false).
    // Restricted merge patch used by self-service resident profile updates.
    // Unlike setRecord(), this intentionally does NOT run full Residents Master
    // canonicalization, so a resident editing DOB/email/etc. cannot accidentally
    // blank or rewrite Name, H.No., mobile, resident type or occupancy fields.
    async function patchRecord(key, id, patch) {
        const sid = String(id || '').trim();
        if (!sid) throw new Error('Record id is required for profile update.');
        const name = collectionName(key);
        const payload = cleanForFirestore({ ...(patch || {}) });
        delete payload.id;
        delete payload.residentId;
        delete payload.ownerName;
        delete payload.name;
        delete payload.houseNo;
        delete payload.plotNo;
        delete payload.mobile;
        delete payload.phone;
        delete payload.phoneE164;
        delete payload.whatsapp;
        delete payload.residentType;
        delete payload.occupationStatus;
        delete payload.status;
        delete payload.isVacant;

        await directSet(name, sid, payload, true);

        // A successful Firestore set() is already server-acknowledged. On Android
        // resident sessions, do not immediately verify through authoritativeList(),
        // because its Web backend fallback has a different Auth context and could
        // incorrectly turn a successful native write into "session expired".
        const current = getAllRecords(key);
        let remoteSaved = { id: sid, ...payload };
        const existing = current.find(r => String(r.id) === sid || String(r.residentDocId || '') === sid);
        if (existing) remoteSaved = { ...existing, ...payload, id: existing.id || sid };
        cache[key] = current.some(r => String(r.id) === sid || String(r.residentDocId || '') === sid)
            ? current.map(r => (String(r.id) === sid || String(r.residentDocId || '') === sid) ? { ...r, ...payload } : r)
            : [...current, remoteSaved];
        cacheLoadedAt.set(key, Date.now());
        notifyDataChanged(key, 'patch');

        // Best-effort background refresh through the SAME direct client only.
        // Failure here does not invalidate the already acknowledged profile save.
        directList(name).then(rows => {
            if (!Array.isArray(rows)) return;
            cache[key] = rows;
            cacheLoadedAt.set(key, Date.now());
            notifyDataChanged(key, 'refresh');
        }).catch(e => console.warn('Profile post-save refresh skipped:', e));
        return { ...remoteSaved };
    }

    async function replaceRecord(key, id, record) {
        const sid = String(id || recordId(record));
        const payload = { ...webCanonicalRecord(key, record, sid), id: sid };
        const name = collectionName(key);
        try {
            await directSet(name, sid, payload, false);
        } catch (directError) {
            if (nativeResidentSession()) throw directError;
            console.warn("Direct Firestore replace failed; using verified backend replace:", directError);
            try { await callBackend({ action: "delete", collection: name, id: sid }); } catch (_) {}
            await callBackend({ action: "insert", collection: name, record: payload });
        }
        const verified = await authoritativeList(name);
        const remoteSaved = verified.find(r => String(r.id) === sid);
        if (!remoteSaved) throw new Error(`Firestore verification failed for ${name}/${sid}.`);
        cache[key] = verified;
        cacheLoadedAt.set(key, Date.now());
        notifyDataChanged(key, "replace");
        return { ...remoteSaved };
    }

    async function deleteRecord(key, id) {
        const sid = String(id);
        const name = collectionName(key);
        try {
            await directDelete(name, sid);
        } catch (directError) {
            if (nativeResidentSession()) throw directError;
            console.warn("Direct Firestore delete failed; using backendDataApi:", directError);
            await callBackend({ action: "delete", collection: name, id: sid });
        }
        const verified = await authoritativeList(name);
        if (verified.some(r => String(r.id) === sid)) {
            throw new Error(`Firebase delete verification failed for ${name}/${sid}.`);
        }
        cache[key] = getAllRecords(key).filter(r => String(r.id) !== sid);
        notifyDataChanged(key, "delete");
        return true;
    }

    // Explicitly synchronize the local cache with the backend. This is the
    // safe replacement for the old direct Firestore synchronization helper.
    async function syncAllToFirestore() {
        const session = window.RGMS?.auth?.getSession?.() || null;
        const staffRoles = new Set(["Admin", "President", "Vice President", "Secretary", "Joint Secretary 1", "Joint Secretary 2", "Treasurer"]);
        if (!staffRoles.has(String(session?.role || "").trim())) {
            throw new Error("Only an authenticated Rose Gardens officer can synchronize data.");
        }

        const keys = Object.values(window.RGMS.STORAGE_KEYS || {});
        const result = { synced: 0, failed: 0 };

        for (const key of keys) {
            const name = collectionName(key);
            const rows = getAllRecords(key);

            for (const row of rows) {
                try {
                    await callBackend({
                        action: "set",
                        collection: name,
                        id: recordId(row),
                        record: { ...row, id: recordId(row) }
                    });
                    result.synced++;
                } catch (e) {
                    result.failed++;
                    console.warn("Backend sync failed", name, row?.id, e);
                }
            }
        }
        return result;
    }

    // Emit one user-facing error event for every final CRUD failure, even when
    // the calling module catches the Promise. This complements per-form messages
    // and prevents silent Firebase failures anywhere in the application.
    const crudGuard = (action, fn) => async function(...args) {
        try { return await fn(...args); }
        catch (error) {
            try { window.dispatchEvent(new CustomEvent('rgms:data-error', { detail: { key: args[0], action, error, timestamp: Date.now() } })); } catch (_) {}
            throw error;
        }
    };
    window.RGMS.store = {
        initializeStore, loadCollection, refreshCollection, getAllRecords,
        insertRecord: crudGuard('save', insertRecord),
        setRecord: crudGuard('update', setRecord),
        patchRecord: crudGuard('update', patchRecord),
        replaceRecord: crudGuard('update', replaceRecord),
        deleteRecord: crudGuard('delete', deleteRecord),
        insertRecords: crudGuard('save', insertRecords),
        upsertRecords: crudGuard('update', upsertRecords),
        deleteRecords: crudGuard('delete', deleteRecords),
        collectionName, callBackend, syncAllToFirestore, initializeResidentMaster,
        initializeAllDataOnAppOpen, syncResidentMaster, getResidentMaster
    };
})();
