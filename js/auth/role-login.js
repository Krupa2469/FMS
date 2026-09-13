(function () {
    'use strict';

    const roleMap = {
        Resident: 'Resident',
        Admin: 'Admin',
        President: 'President',
        'Vice President': 'Vice President',
        Secretary: 'Secretary',
        'Joint Secretary 1': 'Joint Secretary 1',
        'Joint Secretary 2': 'Joint Secretary 2',
        Treasurer: 'Treasurer'
    };

    // Office-bearer Firebase email is resolved from Firebase masters at login time.
    const STAFF_DISPLAY_NAMES = {
        Admin: 'Krupakar Arakala',
        President: 'Sreekanth Karimilla',
        'Vice President': 'Naresh Mamindla',
        Secretary: 'Rajeshwari Yanamandla',
        'Joint Secretary 1': 'Sekhar Babu Kasoji',
        'Joint Secretary 2': 'Vamshi Reddy Kasula',
        Treasurer: 'Krishna Kishore Sankarabanda'
    };

    const $ = id => document.getElementById(id);

    /* ---------------------------------------------------------
       COMMON HELPERS
    --------------------------------------------------------- */

    const norm = value =>
        String(value || '')
            .replace(/\D/g, '')
            .replace(/^91(?=\d{10}$)/, '');

    const escapeHtml = value =>
        String(value ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));

    const isVacant = resident => {
        return (
            resident?.isVacant === true ||
            String(resident?.status || '').trim().toLowerCase() === 'vacant' ||
            String(resident?.occupancyStatus || '').trim().toLowerCase() === 'vacant'
        );
    };

    const phoneOf = resident => {
        return (
            resident?.phoneE164 ||
            (Array.isArray(resident?.mobile)
                ? resident.mobile[0]
                : resident?.mobile) ||
            resident?.whatsapp ||
            resident?.phone ||
            resident?.mobileNumber ||
            resident?.phoneNumber ||
            ''
        );
    };

    function show(message, error = false) {
        const element = $('loginMessage');

        if (element) {
            element.textContent = message;
            element.className = 'message ' + (error ? 'error' : 'ok');
        }
    }

    function mask(value) {
        const digits = norm(value);

        if (digits.length === 10) {
            return digits.slice(0, 2) + 'XXXXXX' + digits.slice(-2);
        }

        return 'registered mobile';
    }

    /* ---------------------------------------------------------
       RESIDENT FIELD NORMALISATION

       Firestore / JSON records may contain different field names.
       Convert everything to one standard structure.
    --------------------------------------------------------- */

    function normalizeResident(record) {
        if (!record || typeof record !== 'object') {
            return null;
        }

        const residentTypeRaw =
            record.residentType ??
            record.ResidentType ??
            record.resident_type ??
            record.type ??
            record.Type ??
            record.residentCategory ??
            record.category ??
            '';

        const ownerName =
            record.ownerName ??
            record.OwnerName ??
            record.owner_name ??
            record.name ??
            record.Name ??
            record.residentName ??
            record.ResidentName ??
            record.fullName ??
            record.full_name ??
            '';

        const plotNo =
            record.plotNo ??
            record.PlotNo ??
            record.plotNumber ??
            record.PlotNumber ??
            record.houseNo ??
            record.HouseNo ??
            record.houseNumber ??
            record.HouseNumber ??
            record.residentId ??
            record.ResidentId ??
            '';

        const residentId =
            record.residentId ??
            record.ResidentId ??
            record.id ??
            record.ID ??
            record.plotNo ??
            record.PlotNo ??
            record.houseNo ??
            record.HouseNo ??
            '';

        const mobile =
            record.phoneE164 ??
            record.mobile ??
            record.mobileNumber ??
            record.phone ??
            record.phoneNumber ??
            record.whatsapp ??
            '';

        return {
            ...record,

            residentId: String(residentId || ''),
            ownerName: String(ownerName || '').trim(),
            name: String(ownerName || '').trim(),

            plotNo: String(plotNo || '').trim(),
            houseNo: String(plotNo || '').trim(),

            residentType: String(residentTypeRaw || '').trim(),

            mobile: mobile,
            phone: record.phone ?? mobile,
            phoneE164: record.phoneE164 ?? mobile
        };
    }

    /* ---------------------------------------------------------
       OWNER CHECK
    --------------------------------------------------------- */

    function isOwnerResident(resident) {
        const value = String(
            resident?.residentType ??
            resident?.ResidentType ??
            resident?.resident_type ??
            resident?.type ??
            resident?.Type ??
            resident?.residentCategory ??
            resident?.category ??
            ''
        )
            .trim()
            .toLowerCase();

        return (
            value === 'owner' ||
            value === 'owners' ||
            value === 'property owner' ||
            value === 'propertyowner'
        );
    }

    /* ---------------------------------------------------------
       FIREBASE TEST PHONE CONFIG / SERVER SYNC

       Firebase Console test-phone entries are stored in the Identity
       Platform project configuration. They are not exposed by the client
       Firebase SDK, so the Android app asks our Cloud Function for the
       current list. The server returns only test-phone metadata needed by
       the login picker; no Admin credentials are ever shipped in the APK.
    --------------------------------------------------------- */

    // Disabled in public releases. Firebase test verification codes must never
    // be exposed by a client-accessible endpoint.
    const FIREBASE_TEST_PHONE_SYNC_URL = '';

    async function loadFirebaseTestConfigs() {
        return [];
        /* Legacy development loader retained below only for source-history
           compatibility; it is unreachable in production. */
        let localConfig = null;

        try {
            const response = await fetch('./data/firebase-test-config.json', { cache: 'no-store' });
            if (response.ok) localConfig = await response.json();
        } catch (e) {
            console.warn('Local Firebase test-phone configuration unavailable:', e);
        }

        // Server is authoritative. It reads the Firebase/Identity Platform
        // configuration with server-side IAM and therefore sees the numbers
        // configured in Firebase Console without exposing Admin credentials.
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(
                FIREBASE_TEST_PHONE_SYNC_URL + '?t=' + Date.now(),
                {
                    method: 'GET',
                    cache: 'no-store',
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                }
            );
            clearTimeout(timeout);

            if (response.ok) {
                const payload = await response.json();
                const numbers = Array.isArray(payload?.testPhoneNumbers)
                    ? payload.testPhoneNumbers
                    : [];

                const configs = numbers.map((entry, index) => {
                    const phone = String(entry?.phoneE164 || entry?.phone || '').trim();
                    if (!phone) return null;
                    const label = String(entry?.label || `Firebase Test Phone ${index + 1}`).trim();
                    return {
                        enabled: true,
                        phoneE164: phone,
                        verificationCode: String(entry?.verificationCode || '').trim(),
                        residentId: 'FIREBASE-TEST-PHONE-' + phone.replace(/[^0-9]/g, ''),
                        houseNo: 'TEST',
                        plotNo: 'TEST',
                        ownerName: label,
                        name: label,
                        residentType: 'Owner',
                        occupationStatus: 'Occupied',
                        status: 'Occupied',
                        isFirebaseTestNumber: true,
                        firebaseTestSource: 'server-sync'
                    };
                }).filter(Boolean);

                console.log(
                    'Firebase test-phone sync: retrieved',
                    configs.length,
                    'configured test phone(s).'
                );
                return configs;
            }

            console.warn('Firebase test-phone sync HTTP status:', response.status);
        } catch (e) {
            console.warn('Firebase test-phone server sync unavailable:', e);
        }

        // Development fallback for offline builds only.
        if (localConfig && localConfig.enabled === true) {
            const phone = String(localConfig.phoneE164 || localConfig.phone || '').trim();
            if (phone) {
                return [{
                    enabled: true,
                    phoneE164: phone,
                    verificationCode: String(localConfig.verificationCode || '').trim(),
                    residentId: 'FIREBASE-TEST-PHONE-' + phone.replace(/[^0-9]/g, ''),
                    houseNo: String(localConfig.houseNo || 'TEST').trim(),
                    plotNo: String(localConfig.plotNo || localConfig.houseNo || 'TEST').trim(),
                    ownerName: String(localConfig.label || 'Firebase Test Phone').trim(),
                    name: String(localConfig.label || 'Firebase Test Phone').trim(),
                    residentType: 'Owner',
                    occupationStatus: 'Occupied',
                    status: 'Occupied',
                    isFirebaseTestNumber: true,
                    firebaseTestSource: 'local-fallback'
                }];
            }
        }

        return [];
    }

    // Backward-compatible single-record helper for any future callers.
    async function loadFirebaseTestConfig() {
        const configs = await loadFirebaseTestConfigs();
        return configs[0] || null;
    }

    /* ---------------------------------------------------------
       LOAD RESIDENT MASTER
    --------------------------------------------------------- */

    async function loadResidents() {
      // Security release: the login page never downloads the Residents Master.
      // It receives only the resident login directory. The registered mobile
      // number is resolved from Firebase for the selected resident and is never
      // shown as an editable field on the login screen.
      try {
        const { httpsCallable } = await import('https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js');
        const callable = httpsCallable(window.RGMS.firebase.functions, 'residentLoginDirectory');
        const result = await callable({});
        const directory = Array.isArray(result?.data?.residents) ? result.data.residents : [];
        if (directory.length) {
          const seen=new Set();
          return directory.map(row => ({
            residentId: String(row.residentId || '').trim(),
            ownerName: String(row.name || '').trim(),
            name: String(row.name || '').trim(),
            phoneE164: String(row.phoneE164 || row.phone || row.mobile || '').trim(),
            mobile: String(row.mobile || row.phoneE164 || row.phone || '').replace(/\D/g,'').slice(-10)
          })).filter(row => {
            if(!row.residentId || !row.ownerName) return false;
            const key=(row.residentId+'|'+row.ownerName).toLowerCase();
            if(seen.has(key)) return false; seen.add(key); return true;
          }).sort((a,b)=>a.ownerName.localeCompare(b.ownerName,'en',{sensitivity:'base',numeric:true})||a.residentId.localeCompare(b.residentId,undefined,{numeric:true}));
        }
      } catch (error) {
        console.error('Resident login directory Firebase read failed:', error);
      }

      throw new Error('Unable to load latest resident data from Firebase. Please try again.');

      let rows = [];

      /*
       * Read a field from an object using several possible field-name
       * variations. This is important because Firebase/store mappings
       * may expose "Resident Type" as residentType, Resident Type,
       * resident_type, etc.
       */
      function field(obj, names) {
        if (!obj || typeof obj !== 'object') return '';

        for (const name of names) {
          if (
            Object.prototype.hasOwnProperty.call(obj, name) &&
            obj[name] !== null &&
            obj[name] !== undefined &&
            String(obj[name]).trim() !== ''
          ) {
            return obj[name];
          }
        }

        /*
         * Also try case-insensitive matching after removing spaces,
         * underscores, hyphens and dots.
         */
        const wanted = names.map(n =>
          String(n)
            .toLowerCase()
            .replace(/[\s_.-]/g, '')
        );

        for (const key of Object.keys(obj)) {
          const normalKey = String(key)
            .toLowerCase()
            .replace(/[\s_.-]/g, '');

          if (
            wanted.includes(normalKey) &&
            obj[key] !== null &&
            obj[key] !== undefined &&
            String(obj[key]).trim() !== ''
          ) {
            return obj[key];
          }
        }

        return '';
      }

      function normalizeResident(raw) {
        const residentId = field(raw, [
          'residentId',
          'residentID',
          'Resident Id',
          'Resident ID',
          'resident_id',
          'id'
        ]);

        const houseNo = field(raw, [
          'houseNo',
          'houseNumber',
          'House No',
          'H.No.',
          'H.No',
          'H No',
          'hno',
          'h_no',
          'plotNo',
          'Plot No',
          'flatNo',
          'Flat No'
        ]);

        const name = field(raw, [
          'ownerName',
          'residentName',
          'name',
          'Name',
          'Resident Name',
          'Owner Name'
        ]);

        const phone = field(raw, [
          'phoneE164',
          'mobile',
          'Mobile',
          'Cell No.',
          'Cell No',
          'Cell',
          'cellNo',
          'cell',
          'whatsapp',
          'WhatsApp',
          'phone',
          'Phone'
        ]);

        const residentType = field(raw, [
          'residentType',
          'Resident Type',
          'resident_type',
          'type',
          'Type',
          'residentCategory',
          'Resident Category'
        ]);

        const occupationStatus = field(raw, [
          'occupationStatus',
          'Occupation Status',
          'occupation_status',
          'status',
          'Status'
        ]);

        return {
          ...raw,
          residentId: String(residentId || '').trim(),
          houseNo: String(houseNo || '').trim(),
          plotNo: String(houseNo || '').trim(),
          ownerName: String(name || '').trim(),
          name: String(name || '').trim(),
          phoneE164: Array.isArray(phone)
            ? String(phone[0] || '').trim()
            : String(phone || '').trim(),
          residentType: String(residentType || 'Owner').trim(),
          occupationStatus: String(occupationStatus || '').trim()
        };
      }

      /*
       * ============================================================
       * 1. LOAD AUTHORITATIVE RESIDENT MASTER
       * ============================================================
       */
      try {
        if (
          window.RGMS?.store?.loadCollection &&
          window.RGMS?.STORAGE_KEYS?.RESIDENTS
        ) {
          await window.RGMS.store.loadCollection(
            window.RGMS.STORAGE_KEYS.RESIDENTS,
            { retries: 3 }
          );

          rows =
            window.RGMS.store.getResidentMaster({
              includeVacant: true
            }) || [];

          // Firebase is authoritative. Never repopulate the master from packaged
          // historical JSON during login. If Firestore is empty/unavailable the
          // login screen reports that latest resident data cannot be loaded.
        } else if (window.RGMS?.store?.initializeStore) {
          await window.RGMS.store.initializeStore();

          rows =
            window.RGMS.store.getResidentMaster({
              includeVacant: true
            }) || [];
        }
      } catch (e) {
        console.warn(
          'Resident master remote load failed:',
          e
        );
      }

      // Firestore Residents Master is the only resident directory source.
      if (!rows.length) {
        throw new Error('Unable to load latest resident data from Firebase. Please try again.');
      }

      // Firebase Authentication does not expose configured test numbers to
      // the client. The Cloud Function is authoritative for this development
      // list. Always append each configured test number as a synthetic Owner
      // login record. Do NOT suppress it merely because the same phone happens
      // to exist in a resident/tenant record; the Firebase test record must be
      // independently selectable and must survive the Owner eligibility filter.
      const firebaseTestResidents = await loadFirebaseTestConfigs();
      firebaseTestResidents.forEach(testResident => {
        const testDigits = norm(testResident.phoneE164);
        const alreadyTestRecord = rows.some(r =>
          r?.isFirebaseTestNumber === true && norm(phoneOf(r)) === testDigits
        );
        if (!alreadyTestRecord) rows.push(testResident);
      });

      /*
       * ============================================================
       * 3. NO MASTER AT ALL
       * ============================================================
       */
      if (!rows.length) {
        throw new Error(
          'Resident master could not be loaded from Firebase.'
        );
      }

      console.log(
        'Resident Login - raw resident master count:',
        rows.length
      );

      /*
       * ============================================================
       * 4. NORMALIZE THE FIREBASE RECORDS
       * ============================================================
       */
      const master = rows.map(normalizeResident);

      console.log(
        'Resident Login - normalized resident master:',
        master
      );

      /*
       * ============================================================
       * 5. DIAGNOSTIC COUNTS
       * ============================================================
       */
      const ownerCount = master.filter(r =>
        String(r.residentType)
          .trim()
          .toLowerCase() === 'owner'
      ).length;

      const tenantCount = master.filter(r =>
        String(r.residentType)
          .trim()
          .toLowerCase() === 'tenant'
      ).length;

      const familyMemberCount = master.filter(r =>
        String(r.residentType)
          .trim()
          .toLowerCase() === 'family member'
      ).length;

      console.log(
        'Resident Login - Resident Type counts:',
        {
          total: master.length,
          owners: ownerCount,
          tenants: tenantCount,
          familyMembers: familyMemberCount
        }
      );

      /*
       * Show the actual Resident Type values in Logcat/Chrome console.
       * This will immediately expose any unexpected Firebase value.
       */
      const residentTypes = [
        ...new Set(
          master.map(r => r.residentType).filter(Boolean)
        )
      ];

      console.log(
        'Resident Login - Resident Type values found:',
        residentTypes
      );

      /*
       * ============================================================
       * 6. RESIDENT LOGIN ELIGIBILITY
       * ============================================================
       *
       * Resident Type = Owner, Tenant or Family Member is eligible for login
       * for every Occupation Status. Occupation Status must never suppress an
       * otherwise eligible resident login.
       */
      const loginType = r => String(r?.residentType || '').trim().toLowerCase();
      const eligibleResidents = master
        .filter(r => {
          const type = loginType(r);
          const hasName = !!String(r.ownerName || r.name || '').trim();
          const hasHouse = !!String(r.houseNo || r.plotNo || '').trim();
          const eligibleType = ['owner','owners','property owner','propertyowner','tenant','tenants','family member','family members','familymember','familymembers'].includes(type);
          return eligibleType && hasName && hasHouse;
        })
        .sort((a, b) =>
          String(a.ownerName || a.name || '').localeCompare(
            String(b.ownerName || b.name || ''),
            'en',
            { sensitivity: 'base', numeric: true }
          ) || String(a.houseNo || a.plotNo || '').localeCompare(
            String(b.houseNo || b.plotNo || ''),
            undefined,
            { numeric: true, sensitivity: 'base' }
          )
        );

      if (!eligibleResidents.length) {
        throw new Error(
          `Resident master is available, but no complete Resident Type = Owner/Tenant/Family Member records were found. ` +
          `Records loaded: ${master.length}. Resident Types found: ${residentTypes.length ? residentTypes.join(', ') : 'none'}`
        );
      }

      console.log('Resident Login - eligible Owner/Tenant/Family Member residents:', eligibleResidents.length);
      console.log(
        'Resident Login - eligible names:',
        eligibleResidents.map(r => ({ name: r.ownerName || r.name, houseNo: r.houseNo || r.plotNo, residentId: r.residentId, residentType: r.residentType, occupationStatus: r.occupationStatus }))
      );
      const testRecord = eligibleResidents.find(r => r.isFirebaseTestNumber === true || String(r.ownerName || r.name || '').trim().toLowerCase().includes('firebase test'));
      console.log('Resident Login - Test record:', testRecord || 'NOT FOUND');

      /*
       * ============================================================
       * 8. RETURN ELIGIBLE OWNER/TENANT/FAMILY MEMBER RESIDENTS
       * ============================================================
       */
      return eligibleResidents;
    }
    /* ---------------------------------------------------------
       RESOLVE MAPPED RESIDENT MOBILE

       The login screen never asks the resident to type a phone
       number. If the directory response does not include the mapped
       phone (for example while an older directory function is still
       deployed), resolve it only for the selected resident.
    --------------------------------------------------------- */

    async function resolveMappedResidentPhone(resident) {
        const existing = String(phoneOf(resident) || '')
            .replace(/\D/g, '')
            .slice(-10);

        if (existing.length === 10) return existing;

        const residentId = String(resident?.residentId || '').trim();
        if (!residentId) return '';

        try {
            const { httpsCallable } = await import(
                'https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js'
            );
            const callable = httpsCallable(
                window.RGMS.firebase.functions,
                'residentLoginPhone'
            );
            const result = await callable({ residentId });
            const phone = String(
                result?.data?.phoneE164 ||
                result?.data?.phone ||
                result?.data?.mobile ||
                ''
            ).replace(/\D/g, '').slice(-10);

            if (phone.length === 10) {
                resident.phoneE164 = `+91${phone}`;
                resident.mobile = phone;
                return phone;
            }
        } catch (error) {
            console.warn('Unable to resolve mapped resident mobile:', error);
        }

        return '';
    }

    /* ---------------------------------------------------------
       INITIALISE LOGIN
    --------------------------------------------------------- */

    async function init() {

        const params =
            new URLSearchParams(location.search);

        const role =
            roleMap[
                params.get('role')
            ] || 'Resident';

        /* ---------------------------------------------
           LOGIN TITLE
        --------------------------------------------- */

        const roleElement = $('loginRole');

        if (roleElement) {

            roleElement.textContent =
                `${role} Login${
                    role !== 'Resident'
                        ? ' · ' +
                          (STAFF_DISPLAY_NAMES[role] || role)
                        : ''
                }`;
        }

        // Native Android Firebase diagnostics. These are local console values
        // only and never include passwords or SMS codes.
        try {
            if (window.RGMS?.isNativeAndroid && window.RGMSNativeAuth) {
                console.log('Rose Gardens Firebase Android diagnostics:', {
                    packageName: window.RGMSNativeAuth.getAndroidPackageName?.() || '',
                    firebaseAppId: window.RGMSNativeAuth.getFirebaseAppId?.() || '',
                    firebaseProjectId: window.RGMSNativeAuth.getFirebaseProjectId?.() || '',
                    signingSha1: window.RGMSNativeAuth.getSigningSha1?.() || '',
                    signingSha256: window.RGMSNativeAuth.getSigningSha256?.() || ''
                });
            }
        } catch (e) {
            console.warn('Unable to read native Firebase diagnostics:', e);
        }

        /* =====================================================
           RESIDENT LOGIN
        ===================================================== */

        if (role === 'Resident') {
            // Warm up Firebase's invisible reCAPTCHA after first paint. This
            // keeps OTP verification in the background in normal cases while
            // preserving Firebase's ability to request a challenge when needed.
            const warmRecaptcha = () => {
                try { RGMS.auth?.prepareResidentRecaptcha?.(); } catch (_) {}
            };
            if ('requestIdleCallback' in window) requestIdleCallback(warmRecaptcha, { timeout: 1500 });
            else setTimeout(warmRecaptcha, 350);

            const residentPanel = $('residentPanel');

            if (residentPanel) {
                residentPanel.classList.add('active');
            }

            let rows;

            try {

                rows = await loadResidents();

            } catch (error) {

                show(
                    error.message ||
                    'Unable to load resident master.',
                    true
                );

                return;
            }

            rows = (Array.isArray(rows) ? rows : []).slice().sort((a,b)=>String(a?.ownerName||a?.name||'').localeCompare(String(b?.ownerName||b?.name||''), undefined, {sensitivity:'base'}));

            const select =
                $('residentName');

            const picker =
                $('residentPicker');

            const pickerButton =
                $('residentNamePicker');

            const pickerList =
                $('residentPickerList');

            const pickerSearch =
                $('residentPickerSearch');

            const pickerOptions =
                $('residentPickerOptions');

            /* ---------------------------------------------
               NORMAL SELECT
            --------------------------------------------- */

            if (select) {

                select.innerHTML =
                    '<option value="">-- Select your Name --</option>' +

                    rows.map(resident => {

                        const id =
                            String(
                                resident.residentId ||
                                resident.plotNo
                            );

                        const name =
                            escapeHtml(
                                resident.ownerName ||
                                'Resident'
                            );

                        return `
                            <option value="${escapeHtml(id)}">
                                ${name}
                            </option>
                        `;

                    }).join('');
            }

            /* ---------------------------------------------
               FIND SELECTED RESIDENT
            --------------------------------------------- */

            const findResident = () => {

                if (!select) {
                    return null;
                }

                return rows.find(
                    resident =>
                        String(
                            resident.residentId ||
                            resident.plotNo
                        ) ===
                        String(select.value)
                );
            };

            /* ---------------------------------------------
               CUSTOM RESIDENT PICKER
            --------------------------------------------- */

            if (
                picker &&
                pickerButton &&
                pickerSearch &&
                pickerOptions
            ) {

                function renderPicker(filter = '') {

                    const query =
                        String(filter || '')
                            .trim()
                            .toLowerCase();

                    const filtered =
                        rows.filter(resident => {
                            const name = String(resident.ownerName || resident.name || 'Resident').toLowerCase();
                            return name.includes(query);
                        });

                    if (!filtered.length) {

                        pickerOptions.innerHTML =
                            '<div class="rg-picker-empty">' +
                            'No resident found.' +
                            '</div>';

                        return;
                    }

                    pickerOptions.innerHTML =
                        filtered.map(resident => {

                            const id =
                                String(
                                    resident.residentId ||
                                    resident.plotNo
                                );

                            const displayName = resident.ownerName || resident.name || 'Resident';

                            const name = escapeHtml(displayName);

                            const selected =
                                select &&
                                String(select.value) === id
                                    ? ' selected'
                                    : '';

                            return `
                                <button
                                    type="button"
                                    class="rg-picker-option${selected}"
                                    role="option"
                                    data-value="${escapeHtml(id)}"
                                >
                                    <span>${name}</span>
                                </button>
                            `;

                        }).join('');

                    pickerOptions
                        .querySelectorAll('[data-value]')
                        .forEach(button => {

                            button.addEventListener(
                                'click',
                                () => {

                                    if (select) {
                                        select.value =
                                            button.dataset.value || '';
                                    }

                                    pickerButton.textContent =
                                        button.textContent.trim() ||
                                        '-- Select your Name --';

                                    picker.classList.remove(
                                        'open'
                                    );

                                    pickerButton.setAttribute(
                                        'aria-expanded',
                                        'false'
                                    );

                                    pickerSearch.value = '';

                                    renderPicker('');

                                    const resident =
                                        findResident();

                                    pendingResident = null;
                                    if ($('otpPanel')) $('otpPanel').classList.add('hidden');
                                    if ($('residentOTP')) $('residentOTP').value = '';

                                    if (
                                        $('residentDetails')
                                    ) {
                                        $('residentDetails').textContent = resident
                                            ? 'OTP will be sent to the registered mobile number mapped to this resident.'
                                            : '';
                                    }
                                }
                            );
                        });
                }

                renderPicker();

                const toggleResidentPicker = () => {
                    const open = picker.classList.toggle('open');
                    pickerButton.setAttribute('aria-expanded', String(open));
                    if (open) {
                        pickerSearch.value = '';
                        renderPicker('');
                        // Do not force the keyboard immediately on Android.
                        // The list opens on the first tap; the user may tap Search
                        // only when filtering is needed.
                        pickerSearch.blur();
                    }
                };

                // Android WebView can delay/cancel the synthesized click after a
                // touch. Handle the physical pointer press directly so one tap
                // always opens the resident list. Keyboard activation still uses
                // click (detail === 0) for accessibility.
                pickerButton.addEventListener('pointerdown', event => {
                    if (event.pointerType === 'mouse' && event.button !== 0) return;
                    event.preventDefault();
                    event.stopPropagation();
                    toggleResidentPicker();
                });
                pickerButton.addEventListener('click', event => {
                    if (event.detail === 0) {
                        event.preventDefault();
                        toggleResidentPicker();
                    }
                });

                pickerSearch.addEventListener(
                    'input',
                    () =>
                        renderPicker(
                            pickerSearch.value
                        )
                );

                document.addEventListener(
                    'click',
                    event => {

                        if (
                            !picker.contains(
                                event.target
                            )
                        ) {

                            picker.classList.remove(
                                'open'
                            );

                            pickerButton.setAttribute(
                                'aria-expanded',
                                'false'
                            );
                        }
                    }
                );
            }

            /* ---------------------------------------------
               SEND OTP
            --------------------------------------------- */

            const sendOTPButton =
                $('btnSendOTP');

            let pendingResident = null;

            if (sendOTPButton) {

                sendOTPButton.addEventListener(
                    'click',
                    async () => {

                        const resident =
                            findResident();

                        if (!resident) {

                            show(
                                'Please select your Name.',
                                true
                            );

                            return;
                        }

                        try {

                            sendOTPButton.disabled =
                                true;

                            const phone = await resolveMappedResidentPhone(resident);

                            if (phone.length !== 10) {
                                show(
                                    'Registered mobile number is not mapped for this resident. Please contact the Association Admin.',
                                    true
                                );
                                sendOTPButton.disabled = false;
                                return;
                            }

                            pendingResident = {
                                ...resident,
                                phoneE164: `+91${phone}`,
                                mobile: phone
                            };

                            await RGMS.auth.sendResidentOTP(phone, 'btnSendOTP');

                            if ($('otpPanel')) {
                                $('otpPanel')
                                    .classList
                                    .remove('hidden');
                            }

                            show(
                                'OTP sent to your registered mobile number.'
                            );

                            $('residentOTP')?.focus();

                        } catch (error) {

                            show(
                                error.message ||
                                'Unable to send OTP.',
                                true
                            );

                            sendOTPButton.disabled =
                                false;
                        }
                    }
                );
            }

            /* ---------------------------------------------
               VERIFY OTP
            --------------------------------------------- */

            const verifyOTPButton =
                $('btnVerifyOTP');

            if (verifyOTPButton) {

                verifyOTPButton.addEventListener(
                    'click',
                    async () => {

                        const resident = pendingResident;

                        const code =
                            $('residentOTP')
                                ?.value
                                .trim() || '';

                        if (!resident) {

                            show(
                                'Please select your Name and request an OTP first.',
                                true
                            );

                            return;
                        }

                        if (!/^\d{6}$/.test(code)) {

                            show(
                                'Enter the 6-digit OTP.',
                                true
                            );

                            return;
                        }

                        try {

                            verifyOTPButton.disabled =
                                true;

                            await RGMS.auth.verifyResidentOTP(
                                code,
                                resident
                            );

                            /*
                             * Register this device for FCM AFTER resident OTP
                             * succeeds.  The resident ID comes from the
                             * selected resident record, so Firebase test
                             * phone numbers do not have to match the resident
                             * phone field.
                             */
                            try {

                                const residentId =
                                    String(
                                        resident.residentId ||
                                        resident.plotNo ||
                                        ""
                                    ).trim();

                                if (
                                    window.AndroidBridge &&
                                    typeof window.AndroidBridge
                                        .enableResidentNotifications === "function" &&
                                    residentId
                                ) {

                                    window.AndroidBridge
                                        .enableResidentNotifications(
                                            residentId
                                        );

                                    console.log(
                                        "RGMS: FCM registration requested for resident:",
                                        residentId
                                    );

                                } else {

                                    console.warn(
                                        "RGMS: Android FCM registration bridge unavailable."
                                    );

                                }

                            } catch (notificationError) {

                                console.warn(
                                    "RGMS: FCM registration request failed:",
                                    notificationError
                                );

                            }

                            /*
                             * Location permission is independent of push
                             * notifications. Request it without allowing a
                             * failure here to interrupt resident navigation.
                             */
                            try {

                                window.RGMS
                                    ?.getNativeFirebaseAuth
                                    ?.()
                                    ?.then?.(
                                        bridge =>
                                            bridge
                                                ?.requestLocationPermission
                                                ?.()
                                    );

                            } catch (_) {}

                            window.location.replace(
                                'resident-dashboard.html'
                            );

                        } catch (error) {

                            const raw = String(error?.message || '').trim();
                            const lower = raw.toLowerCase();
                            const friendly = (!raw || lower === 'internal' || lower.includes('cors') || lower.includes('failed to fetch') || lower.includes('net::err_failed'))
                                ? 'Unable to complete resident login. Please try again.'
                                : raw;

                            show(friendly, true);

                            verifyOTPButton.disabled =
                                false;
                        }
                    }
                );
            }

            return;
        }

        /* =====================================================
           STAFF LOGIN
        ===================================================== */

        const staffPanel =
            $('staffPanel');

        if (staffPanel) {
            staffPanel.classList.add('active');
        }

        if ($('staffRoleDisplay')) {
            $('staffRoleDisplay').value = role;
        }

        // Privacy-first officer login: never render the Firebase User ID/email.
        // The account email is resolved securely from the selected role only when
        // login/reset is requested and is kept in memory/hidden fields.
        const staffEmail = $('staffEmail');
        if (staffEmail) {
            staffEmail.value = '';
            staffEmail.classList.add('hidden');
            staffEmail.setAttribute('aria-hidden', 'true');
            staffEmail.tabIndex = -1;
        }
        if ($('staffPassword')) { $('staffPassword').value = ''; $('staffPassword').placeholder = 'Enter password'; }

        async function resolveStaffLoginEmail(selectedRole) {
            if (!window.RGMS?.firebase?.functions) {
                throw new Error('Firebase Functions is not initialized.');
            }
            const { httpsCallable } = await import('https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js');
            const callable = httpsCallable(window.RGMS.firebase.functions, 'resolveOfficerLoginEmail');
            const result = await callable({ role: selectedRole, t: Date.now() });
            const email = String(result?.data?.email || '').trim().toLowerCase();
            if (!email) throw new Error(`No Firebase login email is configured for ${selectedRole}.`);
            if ($('staffEmail')) $('staffEmail').value = email;
            return email;
        }

        /* ---------------------------------------------
           STAFF LOGIN
        --------------------------------------------- */

        $('btnStaffLogin')
            ?.addEventListener(
                'click',
                async () => {

                    const password =
                        $('staffPassword')
                            ?.value || '';

                    if (!password) {
                        show('Enter your password.', true);
                        return;
                    }

                    try {
                        $('btnStaffLogin').disabled = true;
                        show('Verifying your role securely...');

                        // Resolve the Firebase account silently so the User ID is
                        // never displayed on the officer login screen.
                        const email = await resolveStaffLoginEmail(role);

                        const profile =
                            await RGMS.auth.signInStaff(
                                email,
                                password,
                                role
                            );

                        show(
                            `Welcome ${
                                profile.displayName ||
                                profile.role
                            }.`
                        );

                        /*
                         * All office bearers first enter their clean role Home.
                         * Do not deep-link Admin directly to the large Admin module:
                         * that module performs several Firebase-backed master loads
                         * and is deliberately opened only after the Home screen is
                         * rendered. This prevents the post-login Android WebView
                         * from being overloaded immediately after authentication.
                         */
                        window.location.replace('app.html');

                    } catch (error) {

                        const code = String(error?.code || '');
                        const rawMessage = String(error?.message || '');
                        let friendly = rawMessage || 'Login failed.';
                        if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found') || rawMessage.includes('auth/invalid-credential')) {
                            friendly = `Incorrect password for ${role}, or the Firebase Authentication account configured for this role is missing.`;
                        } else if (code.includes('functions/failed-precondition') || rawMessage.includes('No Firebase login email is configured')) {
                            friendly = `No Firebase login email is configured for ${role}. Update Role Master / Office Bearers Master first.`;
                        } else if (code.includes('functions/internal') || rawMessage.trim().toLowerCase() === 'internal') {
                            friendly = 'Officer account was authenticated, but the officer profile could not be loaded. Please verify the Role Master entry and try again.';
                        }
                        show(friendly, true);

                        $('btnStaffLogin').disabled =
                            false;
                    }
                }
            );

        $('staffPassword')
            ?.addEventListener(
                'keydown',
                event => {

                    if (event.key === 'Enter') {
                        $('btnStaffLogin').click();
                    }
                }
            );

        /* ---------------------------------------------
           SHOW / HIDE PASSWORD
        --------------------------------------------- */

        $('toggleStaffPassword')
            ?.addEventListener(
                'click',
                () => {

                    const input =
                        $('staffPassword');

                    const button =
                        $('toggleStaffPassword');

                    if (!input) {
                        return;
                    }

                    const visible =
                        input.type === 'text';

                    input.type =
                        visible
                            ? 'password'
                            : 'text';

                    button.textContent =
                        visible
                            ? '👁'
                            : '🙈';

                    button.setAttribute(
                        'aria-label',
                        visible
                            ? 'Show password'
                            : 'Hide password'
                    );

                    button.title =
                        visible
                            ? 'Show password'
                            : 'Hide password';
                }
            );

        /* ---------------------------------------------
           FORGOT PASSWORD
        --------------------------------------------- */

        $('btnForgotPassword')
            ?.addEventListener(
                'click',
                () => {

                    const panel =
                        $('resetPanel');

                    panel?.classList.toggle(
                        'hidden'
                    );

                    if ($('resetEmail')) $('resetEmail').value = '';

                    if (!panel?.classList.contains('hidden')) {
                        setTimeout(() => $('btnSendReset')?.focus(), 50);
                    }
                }
            );

        $('btnCancelReset')
            ?.addEventListener(
                'click',
                () => {

                    $('resetPanel')
                        ?.classList
                        .add('hidden');

                    if ($('resetMessage')) {
                        $('resetMessage')
                            .textContent = '';
                    }
                }
            );

        $('btnSendReset')
            ?.addEventListener(
                'click',
                async () => {

                    const output = $('resetMessage');

                    try {

                        $('btnSendReset').disabled = true;
                        if (output) {
                            output.textContent = 'Resolving the registered account securely...';
                            output.className = 'message';
                        }

                        const email = await resolveStaffLoginEmail(role);
                        if ($('resetEmail')) $('resetEmail').value = email;

                        await RGMS.auth
                            .resetStaffPassword(
                                email
                            );

                        if (output) {

                            output.textContent =
                                'Password reset link sent. Please check your email.';

                            output.className =
                                'message ok';
                        }

                    } catch (error) {

                        if (output) {

                            output.textContent =
                                error.message ||
                                'Unable to send password reset link.';

                            output.className =
                                'message error';
                        }

                    } finally {

                        $('btnSendReset').disabled =
                            false;
                    }
                }
            );

        // The officer User ID/email is intentionally not rendered.
        // Put focus directly on the only credential the officer needs to enter.
        $('staffPassword')?.focus();
    }

    /* ---------------------------------------------------------
       START
    --------------------------------------------------------- */

    window.addEventListener(
        'DOMContentLoaded',
        () => {

            init().catch(
                error => {

                    console.error(
                        'Rose Gardens login initialization failed:',
                        error
                    );

                    show(
                        error.message ||
                        'Unable to initialize login.',
                        true
                    );
                }
            );
        }
    );

})();
