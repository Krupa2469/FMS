/*=========================================================
  RGMS ROLE-BASED AUTHENTICATION
  Residents : Firebase Phone OTP
  Officers  : Firebase Email/Password
=========================================================*/

(function () {

    "use strict";

    const STAFF_ROLES = [
        "Admin",
        "President",
        "Vice President",
        "Secretary",
        "Joint Secretary 1",
        "Joint Secretary 2",
        "Treasurer"
    ];

    const DEFAULT_STAFF_DISPLAY_NAMES = {
        Admin: "Krupakar Arakala",
        President: "Sreekanth Karimilla",
        "Vice President": "Naresh Mamindla",
        Secretary: "Rajeshwari Yanamandla",
        "Joint Secretary 1": "Sekhar Babu Kasoji",
        "Joint Secretary 2": "Vamshi Reddy Kasula",
        Treasurer: "Krishna Kishore Sankarabanda"
    };

    /* Normalize role values coming from Firestore/session.
       This prevents values such as "admin", "ADMIN" or " Admin "
       from being rejected by the officer-role check. */
    function normalizeStaffRole(role) {
        const value = String(role || "").trim().toLowerCase();
        const map = {
            admin: "Admin",
            president: "President",
            "vice president": "Vice President",
            vicepresident: "Vice President",
            secretary: "Secretary",
            "joint secretary 1": "Joint Secretary 1",
            jointsecretary1: "Joint Secretary 1",
            "joint secretary 2": "Joint Secretary 2",
            jointsecretary2: "Joint Secretary 2",
            treasurer: "Treasurer"
        };
        return map[value] || String(role || "").trim();
    }

    /* =====================================================
       CURRENT FIREBASE USER
    ===================================================== */

    function currentUser() {

        return window.RGMS.firebase?.auth?.currentUser || null;

    }


    /* =====================================================
       WAIT FOR FIREBASE AUTH INITIALIZATION
    ===================================================== */

    async function waitForAuthReady() {

        const auth = window.RGMS.firebase?.auth;
        if (!auth) return null;

        // Firebase Web SDK 12 uses the modular onAuthStateChanged(auth, cb) API.
        // Calling auth.onAuthStateChanged(...) is a compat-only pattern and caused
        // the browser officer session restore to fail, sending valid Admin logins
        // back to the login screen. Prefer authStateReady() when available and
        // fall back to the modular observer.
        try {
            if (typeof auth.authStateReady === 'function') {
                await auth.authStateReady();
                return auth.currentUser || null;
            }

            const { onAuthStateChanged } =
                await import('https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js');

            return await new Promise((resolve) => {
                let unsubscribe = null;
                unsubscribe = onAuthStateChanged(auth, (user) => {
                    try { unsubscribe?.(); } catch (_) {}
                    resolve(user || null);
                }, () => {
                    try { unsubscribe?.(); } catch (_) {}
                    resolve(auth.currentUser || null);
                });
            });
        } catch (error) {
            console.warn('RGMS Firebase auth restore wait failed:', error);
            return auth.currentUser || null;
        }

    }


    /* =====================================================
       STAFF LOGIN
    ===================================================== */

    async function signInStaff(
        email,
        password,
        expectedRole = ""
    ) {

        /*
         * Android WebView must use the native Firebase bridge for officer
         * email/password authentication. The WebView Firebase Auth instance
         * is a separate runtime and may not load/restore reliably on Android;
         * the native bridge also gives the store a matching authenticated
         * Firebase session for protected Firestore operations. Browser builds
         * continue to use the normal Firebase Web Auth SDK.
         */
        let credentialUser = null;
        let profile = null;

        if (isNativeAndroidAuth()) {
            try {
                const nativeProfile = await nativeRequest('signInStaff', [email, password]);
                profile = nativeProfile || null;
                credentialUser = {
                    uid: profile?.uid || '',
                    email: profile?.email || email
                };
                if (!credentialUser.uid) {
                    throw new Error('Firebase did not return an authenticated officer account.');
                }
            } catch (error) {
                throw new Error(error?.message || 'Unable to complete officer login.');
            }
        } else {
            // Browser/Web fallback.
            if (window.RGMS.authPersistenceReady) {
                await window.RGMS.authPersistenceReady;
            }

            if (!window.RGMS?.firebase?.auth) {
                throw new Error('Firebase Authentication is not initialized. Please restart the app and try again.');
            }

            const { signInWithEmailAndPassword } =
                await import(
                    "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"
                );

            const credential = await signInWithEmailAndPassword(
                window.RGMS.firebase.auth,
                email,
                password
            );
            credentialUser = credential.user;
            // Prefer the server-side session activator, but do not make a
            // successful Firebase email/password login fail just because the
            // callable returns a generic functions/internal error.  The signed-in
            // user may securely resolve their own officer profile from Firestore.
            try {
                const { httpsCallable } = await import('https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js');
                const activateOfficer = httpsCallable(window.RGMS.firebase.functions, 'activateOfficerSession');
                const activated = await activateOfficer({ role: expectedRole || '' });
                profile = activated?.data || null;

                // The callable maps generated Role Master IDs to the Firebase
                // Auth UID by issuing an officer role custom claim. Force-refresh
                // the ID token before any protected Firestore read so Security
                // Rules see the newly activated officer session immediately.
                if (credentialUser?.getIdToken) {
                    await credentialUser.getIdToken(true);
                }
            } catch (activationError) {
                console.warn('RGMS activateOfficerSession failed; trying authenticated profile lookup:', activationError);
                try {
                    profile = await loadUserProfile(credentialUser.uid, credentialUser.email || email);
                } catch (profileError) {
                    console.warn('RGMS authenticated officer profile lookup failed:', profileError);
                    throw new Error('Unable to activate the office-bearer session. Please try again.');
                }
                if (!profile) throw new Error('No RGMS officer profile is mapped to this Firebase account.');
            }
        }

        if (!profile) {
            await signOut();
            throw new Error(
                "No RGMS officer profile was found for this account."
            );
        }

        const normalizedRole =
            normalizeStaffRole(profile.role);

        console.log("RGMS Staff Profile:", {
            uid: credentialUser.uid,
            email: credentialUser.email || profile.email || "",
            firestoreRole: profile.role || null,
            normalizedRole
        });

        if (!STAFF_ROLES.includes(normalizedRole)) {

            await signOut();

            throw new Error(
                "This account does not have an RGMS officer role assigned."
            );

        }

        const normalizedExpectedRole =
            normalizeStaffRole(expectedRole);

        if (
            normalizedExpectedRole &&
            normalizedRole !== normalizedExpectedRole
        ) {

            await signOut();

            throw new Error(
                "Selected role does not match this account."
            );

        }

        const fullProfile = {

            ...profile,

            uid:
                credentialUser.uid,

            email:
                credentialUser.email ||
                profile.email ||
                "",

            role:
                normalizedRole,

            displayName:
                profile.displayName ||
                DEFAULT_STAFF_DISPLAY_NAMES[normalizedRole] ||
                normalizedRole

        };

        saveSession(fullProfile);

        // Commit the browser Firebase session before replacing login.html.
        if (!isNativeAndroidAuth()) {
            try {
                if (credentialUser?.getIdToken) await credentialUser.getIdToken();
                const auth = window.RGMS.firebase?.auth;
                if (auth?.authStateReady) {
                    await Promise.race([
                        auth.authStateReady(),
                        new Promise(resolve => setTimeout(resolve, 3000))
                    ]);
                } else {
                    await new Promise(resolve => setTimeout(resolve, 250));
                }
            } catch (error) {
                console.warn("RGMS officer auth commit wait:", error);
            }
        }

        return fullProfile;

    }


    /* =====================================================
       LOAD USER PROFILE
    ===================================================== */

    async function loadUserProfile(uid, email = "") {

        const { doc, getDoc, collection, query, where, limit, getDocs } =
        await import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js");

        const snap = await getDoc(doc(window.RGMS.firebase.db, "userProfiles", uid));
        if (snap.exists()) return { ...snap.data(), _profileDocId: snap.id };

        // User Account ID is intentionally separate from Firebase Auth UID.
        // Existing/new profiles can therefore be stored under the generated
        // RGRWA account ID and resolved securely by the authenticated email.
        const rawEmail = String(email || "").trim();
        const normalizedEmail = rawEmail.toLowerCase();
        for (const candidate of [...new Set([normalizedEmail, rawEmail].filter(Boolean))]) {
            const qs = await getDocs(query(collection(window.RGMS.firebase.db, "userProfiles"), where("email", "==", candidate), limit(1)));
            if (!qs.empty) { const d = qs.docs[0]; return { ...d.data(), _profileDocId: d.id }; }
        }
        return null;

    }


    /* =====================================================
       SAVE SESSION
    ===================================================== */

    function saveSession(profile) {

        const json = JSON.stringify(profile);
        sessionStorage.setItem("rgmsSession", json);

        /* Same-tab login hand-off fallback.  This is session metadata only,
           never application CRUD data. */
        try {
            const marker = "RGMS_SESSION:";
            const current = String(window.name || "");
            if (!current || current.startsWith(marker)) {
                window.name = marker + encodeURIComponent(json);
            }
        } catch (_) {}

    }


    /* =====================================================
       GET SESSION
    ===================================================== */

    function getSession() {

        try {
            const raw = sessionStorage.getItem("rgmsSession");
            if (raw) return JSON.parse(raw);

            const marker = "RGMS_SESSION:";
            const handoff = String(window.name || "");
            if (handoff.startsWith(marker)) {
                const json = decodeURIComponent(handoff.slice(marker.length));
                const profile = JSON.parse(json);
                if (profile && profile.role) {
                    sessionStorage.setItem("rgmsSession", JSON.stringify(profile));
                    return profile;
                }
            }
            return null;
        } catch (_) {
            return null;
        }

    }


    /* =====================================================
       CLEAR SESSION
    ===================================================== */

    function clearSession() {

        sessionStorage.removeItem("rgmsSession");
        try {
            if (String(window.name || "").startsWith("RGMS_SESSION:")) window.name = "";
        } catch (_) {}

    }


    /* =====================================================
       SIGN OUT
    ===================================================== */

    async function signOut() {

        const {
            signOut: firebaseSignOut
        } =
        await import(
            "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"
        );

        clearSession();

        if (window.RGMS) {

            window.RGMS.phoneConfirmation =
                null;

            if (
                window.RGMS.recaptchaVerifier
            ) {

                try {

                    window.RGMS.recaptchaVerifier.clear();

                }
                catch {}

                window.RGMS.recaptchaVerifier =
                    null;

            }

        }

        if (currentUser()) {
            await firebaseSignOut(
                window.RGMS.firebase.auth
            );
        }

        // Also clear the native Firebase Auth session on Android.
        try {
            const nativePlugin = await getNativeFirebaseAuth();
            if (nativePlugin) {
                await nativePlugin.signOut();
            }
        } catch (error) {
            console.warn("RGMS native Firebase sign-out:", error);
        }

    }


    /* =====================================================
       FORGOT / RESET STAFF PASSWORD
    ===================================================== */

    async function resetStaffPassword(email) {
        const normalizedEmail = String(email || "").trim();
        if (!normalizedEmail) {
            throw new Error("Enter your officer email.");
        }

        const { sendPasswordResetEmail } = await import(
            "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"
        );

        if (!window.RGMS.firebase?.auth) {
            throw new Error("Firebase authentication is not initialized.");
        }

        try {
            await sendPasswordResetEmail(
                window.RGMS.firebase.auth,
                normalizedEmail
            );
        } catch (error) {
            const code = String(error?.code || "").replace(/^.*\//, "");
            if (code === "auth/invalid-email") {
                throw new Error("Enter a valid officer email address.");
            }
            if (code === "auth/user-not-found") {
                throw new Error("No Firebase account was found for this email address.");
            }
            if (code === "auth/too-many-requests") {
                throw new Error("Too many reset requests. Please wait and try again later.");
            }
            throw new Error(error?.message || "Unable to send password reset email.");
        }
    }

    /* =====================================================
       CHANGE PASSWORD
    ===================================================== */

    async function changePassword(
        currentPassword,
        newPassword
    ) {

        const {
            EmailAuthProvider,
            reauthenticateWithCredential,
            updatePassword
        } =
        await import(
            "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"
        );

        const user =
            currentUser();

        if (
            !user ||
            !user.email
        ) {

            throw new Error(
                "No officer password account is signed in."
            );

        }

        await reauthenticateWithCredential(

            user,

            EmailAuthProvider.credential(
                user.email,
                currentPassword
            )

        );

        await updatePassword(
            user,
            newPassword
        );

    }


    /* =====================================================
       RESIDENT OTP - ANDROID NATIVE + WEB FALLBACK
    ===================================================== */

    function isAndroidWrapper() {
        return !!(window.RGMS?.isNativeAndroid || (window.RGMSNativeAuth && typeof window.RGMSNativeAuth.isAvailable === 'function' && window.RGMSNativeAuth.isAvailable()) || /RoseGardensAndroid\/1\.[0-9]+(?:\.[0-9]+)?-NativeOTP/i.test(navigator.userAgent || ''));
    }

    function isNativeAndroidAuth() {
        try {
            const bridge = window.RGMSNativeAuth;
            if (!bridge) return false;
            if (typeof bridge.isAvailable === "function") {
                try {
                    if (bridge.isAvailable() === true) return true;
                } catch (_) {}
            }
            // Defensive fallback for Android WebView builds where the
            // availability probe is exposed late, but the native methods
            // are already present.
            return typeof bridge.signInStaff === "function" &&
                   typeof bridge.sendOtp === "function" &&
                   typeof bridge.verifyOtp === "function";
        } catch (_) {
            return false;
        }
    }

    async function getNativeFirebaseAuth() {
        return isNativeAndroidAuth() ? window.RGMSNativeAuth : null;
    }

    window.RGMSNativeAuthCallbacks = window.RGMSNativeAuthCallbacks || {};

    function nativeRequest(method, args, requestIdOverride = null) {
        return new Promise((resolve, reject) => {
            const requestId = requestIdOverride || ('rgms_' + Date.now() + '_' + Math.random().toString(36).slice(2));
            const timeout = setTimeout(() => {
                delete window.RGMSNativeAuthCallbacks[requestId];
                reject(new Error('Firebase phone verification timed out. Please try again.'));
            }, 70000);
            window.RGMSNativeAuthCallbacks[requestId] = {
                resolve: value => { clearTimeout(timeout); delete window.RGMSNativeAuthCallbacks[requestId]; resolve(value); },
                reject: error => { clearTimeout(timeout); delete window.RGMSNativeAuthCallbacks[requestId]; reject(error); }
            };
            try {
                window.RGMSNativeAuth[method](...(args || []), requestId);
            } catch (e) {
                clearTimeout(timeout);
                delete window.RGMSNativeAuthCallbacks[requestId];
                reject(e);
            }
        });
    }

    window.RGMSNativeAuthCallbacks.onStaffSignedIn = function(requestId, profileJson) {
        const cb = window.RGMSNativeAuthCallbacks[requestId];
        if (!cb) return;
        try {
            const profile = typeof profileJson === 'string' ? JSON.parse(profileJson) : profileJson;
            cb.resolve(profile);
        } catch (_) {
            cb.reject(new Error('Invalid officer profile returned by Android Firebase.'));
        }
    };

    window.RGMSNativeAuthCallbacks.onCodeSent = function(requestId) {
        const cb = window.RGMSNativeAuthCallbacks[requestId];
        if (cb) cb.resolve({codeSent:true});
    };
    window.RGMSNativeAuthCallbacks.onVerified = function(requestId, uid, phoneNumber) {
        const cb = window.RGMSNativeAuthCallbacks[requestId];
        if (cb) cb.resolve({user:{uid, phoneNumber}});
    };
    window.RGMSNativeAuthCallbacks.onSessionActivated = function(requestId) {
        const cb = window.RGMSNativeAuthCallbacks[requestId];
        if (cb) cb.resolve({ok:true});
    };
    window.RGMSNativeAuthCallbacks.onError = function(requestId, message) {
        const cb = window.RGMSNativeAuthCallbacks[requestId];
        if (cb) cb.reject(new Error(message || 'Firebase phone verification failed.'));
    };

    function firebaseErrorMessage(error) {
        const code = String(error?.code || "").replace(/^.*\//, "");
        const map = {
            "invalid-phone-number": "The registered mobile number is invalid.",
            "too-many-requests": "Firebase has temporarily blocked OTP requests for this phone/device because of repeated attempts. Please wait before trying again.",
            "quota-exceeded": "Firebase SMS quota has been exceeded. Please try again later.",
            "operation-not-allowed": "Phone authentication is not enabled in Firebase.",
            "app-not-authorized": "This Android app is not authorized in Firebase. Check the Android package name and SHA-1/SHA-256 fingerprints.",
            "invalid-app-credential": "Firebase could not verify this Android app. Make sure com.lekha.rosegardens is registered in Firebase and the Android SHA-1 and SHA-256 fingerprints are added.",
            "captcha-check-failed": "Firebase security verification failed. Please check the Android SHA-1/SHA-256 setup and try again.",
            "network-request-failed": "Network connection failed. Please check the phone's internet connection."
        };
        return map[code] || error?.message || "Firebase OTP login failed.";
    }

    async function prepareResidentRecaptcha() {
        if (isAndroidWrapper() || isNativeAndroidAuth()) return true;
        if (!window.RGMS?.firebase?.auth) return false;
        const recaptchaContainer = document.getElementById("recaptcha-container");
        if (!recaptchaContainer) return false;
        if (window.RGMS.recaptchaVerifier) return true;
        try {
            const { RecaptchaVerifier } = await import(
                "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"
            );
            recaptchaContainer.innerHTML = "";
            window.RGMS.recaptchaVerifier = new RecaptchaVerifier(
                window.RGMS.firebase.auth,
                "recaptcha-container",
                {
                    size: "invisible",
                    callback: () => {},
                    "expired-callback": () => {
                        window.RGMS.phoneConfirmation = null;
                    }
                }
            );
            // Pre-render the invisible verifier so Send OTP does not have to
            // initialize it in the foreground. Firebase may still show a
            // challenge when Google determines one is required.
            await window.RGMS.recaptchaVerifier.render();
            return true;
        } catch (error) {
            console.warn("RGMS background reCAPTCHA preparation failed:", error);
            try { window.RGMS.recaptchaVerifier?.clear(); } catch (_) {}
            window.RGMS.recaptchaVerifier = null;
            recaptchaContainer.innerHTML = "";
            return false;
        }
    }

    async function sendResidentOTP(phoneNumber, buttonId = null, options = {}) {
        const normalized = normalizePhone(phoneNumber);
        if (!/^\+91\d{10}$/.test(normalized)) {
            throw new Error("The registered mobile number is not a valid Indian mobile number.");
        }

        const button = buttonId ? document.getElementById(buttonId) : null;

        // Android: always use native Firebase phone authentication. Never fall
        // back to the Web reCAPTCHA flow inside the Android WebView.
        if (isAndroidWrapper() && !isNativeAndroidAuth()) {
            throw new Error('Native Firebase OTP is not initialized in this APK. Rebuild the latest project and confirm google-services.json belongs to com.lekha.rosegardens.');
        }
        if (isNativeAndroidAuth()) {
            if (button) button.disabled = true;
            try {
                const requestId = 'rgms_otp_' + Date.now() + '_' + Math.random().toString(36).slice(2);
                window.RGMS.nativeOtpRequestId = requestId;
                await nativeRequest('sendOtp', [normalized], requestId);
                sessionStorage.setItem('rgmsOtpLastRequest', String(Date.now()));
                return true;
            } catch (error) {
                window.RGMS.nativeOtpRequestId = null;
                throw new Error(firebaseErrorMessage(error));
            }
        }

        // Browser fallback: Firebase Web Auth flow.
        const {
            RecaptchaVerifier,
            signInWithPhoneNumber
        } = await import(
            "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"
        );

        // Firebase Console test phone numbers are fictional numbers and should
        // not require a browser reCAPTCHA challenge.  Enable Firebase's
        // documented test-only app-verification bypass only for the synthetic
        // test record selected by the resident-login UI.  Real residents keep
        // normal reCAPTCHA/app verification.
        const isFirebaseTestNumber = options?.isFirebaseTestNumber === true;
        try {
            window.RGMS.firebase.auth.settings.appVerificationDisabledForTesting =
                isFirebaseTestNumber;
        } catch (_) {}

        const now = Date.now();
        const lastRequest = Number(
            sessionStorage.getItem("rgmsOtpLastRequest") || 0
        );
        const remaining = Math.ceil(
            (60000 - (now - lastRequest)) / 1000
        );
        if (remaining > 0) {
            throw new Error(
                `Please wait ${remaining} seconds before requesting another OTP.`
            );
        }

        if (window.RGMS.authPersistenceReady) {
            await window.RGMS.authPersistenceReady;
        }

        const recaptchaContainer =
            document.getElementById("recaptcha-container");

        if (!recaptchaContainer) {
            throw new Error(
                "reCAPTCHA container is missing from the login page."
            );
        }

        if (!window.RGMS.recaptchaVerifier) {
            await prepareResidentRecaptcha();
        }
        if (!window.RGMS.recaptchaVerifier) {
            throw new Error("Unable to initialize secure phone verification. Please try again.");
        }

        if (button) button.disabled = true;

        try {
            window.RGMS.phoneConfirmation =
                await signInWithPhoneNumber(
                    window.RGMS.firebase.auth,
                    normalized,
                    window.RGMS.recaptchaVerifier
                );

            sessionStorage.setItem(
                "rgmsOtpLastRequest",
                String(Date.now())
            );
            return true;
        } catch (error) {
            window.RGMS.phoneConfirmation = null;

            try {
                window.RGMS.recaptchaVerifier?.clear();
            } catch (_) {}

            window.RGMS.recaptchaVerifier = null;

            if (recaptchaContainer) {
                recaptchaContainer.innerHTML = "";
            }

            throw new Error(firebaseErrorMessage(error));
        }
    }

    /* =====================================================
       VERIFY RESIDENT OTP
    ===================================================== */

    async function verifyResidentOTP(code, resident) {
        if (!/^\d{6}$/.test(String(code || ""))) {
            throw new Error("Enter the 6-digit OTP.");
        }

        const mobileValue = Array.isArray(resident.mobile) ? resident.mobile[0] : resident.mobile;
        const registered = normalizePhone(resident.phoneE164 || resident.phone || resident.phoneNumber || resident.whatsapp || mobileValue);
        let phone = null;
        let uid = null;

        if (isAndroidWrapper() && !isNativeAndroidAuth()) {
            throw new Error('Native Firebase OTP is not initialized in this APK. Rebuild the latest project and confirm google-services.json belongs to com.lekha.rosegardens.');
        }

        if (isNativeAndroidAuth()) {
            try {
                const requestId = window.RGMS.nativeOtpRequestId;
                if (!requestId) {
                    throw new Error('Please request an OTP first.');
                }
                const result = await nativeRequest('verifyOtp', [code], requestId);
                phone = result?.user?.phoneNumber || null;
                uid = result?.user?.uid || null;
                window.RGMS.nativeOtpRequestId = null;
            } catch (error) {
                throw new Error(firebaseErrorMessage(error));
            }
        } else {
            if (!window.RGMS.phoneConfirmation) {
                throw new Error("Please request an OTP first.");
            }
            try {
                const credential = await window.RGMS.phoneConfirmation.confirm(code);
                phone = credential.user.phoneNumber;
                uid = credential.user.uid;
            } catch (error) {
                throw new Error(firebaseErrorMessage(error));
            }
        }

        if (!phone || registered !== normalizePhone(phone)) {
            await signOut();
            throw new Error("The verified mobile number does not match this resident.");
        }

        if (isNativeAndroidAuth()) {
            await nativeRequest('activateResidentSession', [String(resident.residentId || '')]);
        } else {
            const { httpsCallable } = await import('https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js');
            const activate = httpsCallable(window.RGMS.firebase.functions, 'activateResidentSession');
            try {
                await activate({ residentId: String(resident.residentId || '') });
                // The backend may add/update Resident custom claims. Refresh the
                // ID token immediately so Firestore rules see the new claims on
                // the first Resident Dashboard request.
                const webUser = window.RGMS.firebase?.auth?.currentUser;
                if (webUser?.getIdToken) await webUser.getIdToken(true);
            } catch (activationError) {
                const code = String(activationError?.code || '').toLowerCase();
                const msg = String(activationError?.message || '').trim().toLowerCase();
                if (code.includes('permission-denied') || code.includes('unauthenticated')) {
                    throw new Error('The verified mobile number is not authorized for the selected resident.');
                }
                if (code.includes('not-found')) {
                    throw new Error('The selected resident could not be found. Please contact the Association Admin.');
                }
                if (code.includes('failed-precondition')) {
                    throw new Error('The registered mobile number does not match the selected resident.');
                }
                // Never expose Cloud Functions internals/CORS details to residents.
                if (code.includes('internal') || code.includes('unavailable') || msg === 'internal' || msg.includes('cors') || msg.includes('failed to fetch') || msg.includes('network')) {
                    throw new Error('Resident login service is temporarily unavailable. Please try again.');
                }
                throw new Error('Unable to complete resident login. Please try again.');
            }
        }

        const profile = {
            uid,
            role: "Resident",
            residentId: resident.residentId,
            plotNo: resident.plotNo,
            ownerName: resident.ownerName,
            phone,
            phoneE164: phone,
            houseNo: resident.houseNo || resident.plotNo || ""
        };

        saveSession(profile);
        window.RGMS.phoneConfirmation = null;
        window.RGMS.nativePhoneVerificationId = null;
        window.RGMS.nativePhoneAutoResult = null;
        window.RGMS.nativeOtpRequestId = null;
        // Native Android authentication is not the same in-memory user as the
        // WebView Firebase Auth instance. Do not block successful resident login
        // waiting for the Web SDK to observe the native session.
        if (!isNativeAndroidAuth()) await waitForAuthReady();
        return profile;
    }

    /* =====================================================
       ROLE PROTECTION
    ===================================================== */

    async function requireRoles(
        roles
    ) {

        const session =
            getSession();

        const normalizedSessionRole =
            normalizeStaffRole(session?.role);

        if (
            !session ||
            !roles.map(normalizeStaffRole).includes(
                normalizedSessionRole
            )
        ) {

            window.location.href =
                "index.html";

            return false;

        }

        /*
          IMPORTANT:
          Wait for Firebase to restore
          the authenticated user.
        */

        const user =
            await waitForAuthReady();

        if (!user) {
            console.warn("RGMS Auth: Firebase user restore is delayed; keeping validated browser session.");
            return true;
        }

        return true;

    }


    /* =====================================================
       PUBLIC AUTH API
    ===================================================== */

    window.RGMS.auth = {

        STAFF_ROLES,

        normalizeStaffRole,

        currentUser,

        waitForAuthReady,

        signInStaff,

        loadUserProfile,

        saveSession,

        getSession,

        clearSession,

        signOut,

        changePassword,

        resetStaffPassword,

        prepareResidentRecaptcha,
        sendResidentOTP,

        verifyResidentOTP,

        requireRoles

    };

})();
