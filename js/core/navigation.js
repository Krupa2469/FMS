/*=========================================================
  RGMS NAVIGATION CONTROLLER
=========================================================*/
(function () {
    // In-app module history. Modules are loaded into #content-area, so browser history
    // alone cannot provide a reliable Back action.
    const moduleHistory = [];
    let currentModule = null;

    const MODULES = {
        "resident-dashboard": "resident-dashboard.html",
        admin: "modules/admin/admin.html",
        residents: "modules/residents/residents.html",
        visitors: "modules/residents/visitors.html",
        dashboard: "modules/association/dashboard/dashboard.html",
        "development-fund": "modules/association/development-fund/development-fund.html",
        festival: "modules/association/festival.html",
        complaints: "modules/association/complaints.html",
        meetings: "modules/association/meetings.html",
        documents: "modules/association/documents.html",
        "notice-board": "modules/association/notice-board/notice-board.html",
        "general-information": "modules/association/general-information.html",
        "public-services": "modules/association/public-services/public-services.html",
        reports: "modules/utilities/reports.html",
        settings: "modules/utilities/settings/settings.html",
        communications: "modules/utilities/communications/communications.html"
    };

    const MODULE_JS = {
        "resident-dashboard": null,
        admin: "modules/admin/admin.js",
        residents: "modules/residents/residents.js",
        dashboard: "modules/association/dashboard/dashboard.js",
        "development-fund": "modules/association/development-fund/development-fund.js",
        visitors: "modules/residents/visitors.js",
        festival: "modules/association/festival.js",
        complaints: "modules/association/complaints.js",
        meetings: "modules/association/meetings.js",
        documents: "modules/association/documents.js",
        "notice-board": "modules/association/notice-board/notice-board.js",
        "general-information": "modules/association/general-information.js",
        "public-services": "modules/association/public-services/public-services.js",
        reports: "modules/utilities/reports.js",
        settings: "modules/utilities/settings/settings.js",
        communications: "modules/utilities/communications/communications.js"
    };

    const DEFAULT_ACCESS = {
        Admin: Object.keys(MODULES),
        President: Object.keys(MODULES).filter(x => x !== "admin"),
        "Vice President": ["dashboard","resident-dashboard","development-fund","festival","complaints","meetings","notice-board","documents","visitors","residents","public-services","reports","communications"],
        Secretary: ["dashboard","resident-dashboard","development-fund","festival","complaints","meetings","notice-board","documents","communications"],
        "Joint Secretary 1": ["dashboard","resident-dashboard","development-fund","festival","complaints","meetings","notice-board","documents","communications"],
        "Joint Secretary 2": ["dashboard","resident-dashboard","development-fund","festival","complaints","meetings","notice-board","documents","communications"],
        Treasurer: ["dashboard","resident-dashboard","development-fund","festival","reports","communications","notice-board"],
        Resident: ["resident-dashboard"]
    };


    const ROLE_ACCESS_CATALOG = [{key:'associationDashboard',label:'Association Dashboard',nav:'dashboard',actions:["view", "export"]},{key:'residentDashboard',label:'Resident Dashboard',nav:'resident-dashboard',actions:["view"]},{key:'residents',label:'Residents',nav:'residents',actions:["view", "add", "update", "delete", "export", "share"]},{key:'visitors',label:'Visitors',nav:'visitors',actions:["view", "add", "update", "delete", "export"]},{key:'colonyFund',label:'Colony Fund',nav:'development-fund',actions:["view", "add", "update", "delete", "export", "share"]},{key:'ganeshFestival',label:'Ganesh Festival Fund',nav:'festival',actions:["view", "add", "update", "delete", "export", "share"]},{key:'ladduAuction',label:'Laddu Auction',nav:null,actions:["view", "add", "update", "delete", "export", "share"]},{key:'sponsorDetails',label:'Sponsor Details',nav:null,actions:["view", "add", "update", "delete", "export", "share"]},{key:'expenditure',label:'Expenditure',nav:null,actions:["view", "add", "update", "delete", "export", "share"]},{key:'complaints',label:'Complaints',nav:'complaints',actions:["view", "add", "update", "delete", "export", "assign", "approve"]},{key:'meetings',label:'Meetings',nav:'meetings',actions:["view", "add", "update", "delete", "export", "publish"]},{key:'documents',label:'Documents',nav:'documents',actions:["view", "add", "update", "delete", "export", "share"]},{key:'noticeBoard',label:'Notice Board',nav:'notice-board',actions:["view", "add", "update", "delete", "publish", "share"]},{key:'generalInformation',label:'General Information',nav:'general-information',actions:["view", "add", "update", "delete"]},{key:'citizenServices',label:'Citizen Services',nav:'public-services',actions:["view"]},{key:'billPayments',label:'Bill Payments',nav:null,actions:["view"]},{key:'reports',label:'Reports',nav:'reports',actions:["view", "export", "share"]},{key:'reportsMaster',label:'Reports Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'dataEntryFieldsMaster',label:'Data Entry Fields Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'communications',label:'Communications',nav:'communications',actions:["view"]},{key:'sms',label:'SMS',nav:null,actions:["view", "share"]},{key:'whatsapp',label:'WhatsApp',nav:null,actions:["view", "share"]},{key:'greetings',label:'Greetings',nav:null,actions:["view", "add", "update", "delete", "share"]},{key:'settings',label:'Settings',nav:'settings',actions:["view", "update"]},{key:'adminMasters',label:'Admin Masters',nav:'admin',actions:["view"]},{key:'roleMaster',label:'Role Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'roleAccessMaster',label:'Role Access Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'dashboardAssignment',label:'Dashboard Assignment',nav:null,actions:["view", "update"]},{key:'passwordReset',label:'Office Bearer Password Reset',nav:null,actions:["view", "update"]},{key:'colonyDirectory',label:'Colony Directory Assignment',nav:null,actions:["view", "add", "update", "delete"]},{key:'homeServices',label:'Home Services Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'serviceProviders',label:'Service Provider Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'utilityBillers',label:'Utility Billers Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'officeBearers',label:'Office Bearers Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'associationSettings',label:'Association Settings Master',nav:null,actions:["view", "update"]},{key:'paymentModes',label:'Payment Modes Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'financialYears',label:'Financial Years Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'fundTypes',label:'Fund / Collection Types Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'expenseHeads',label:'Expense Heads Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'complaintCategories',label:'Complaint Categories Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'documentCategories',label:'Document Categories Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'noticeCategories',label:'Notice Categories Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'visitorTypes',label:'Visitor Types Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'meetingTypes',label:'Meeting Types Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'communicationTemplates',label:'Communication Templates Master',nav:null,actions:["view", "add", "update", "delete"]}];
    const NAV_PERMISSION_MAP = Object.fromEntries(ROLE_ACCESS_CATALOG.filter(x=>x.nav).map(x=>[x.nav,x.key]));
    window.RGMS_ROLE_ACCESS_CATALOG = ROLE_ACCESS_CATALOG;
    let runtimeRoleAccessMatrix = null;

    function accessYes(v){ return String(v||'').toUpperCase()==='YES' || v===true; }
    function roleAccessRow(role){ return runtimeRoleAccessMatrix?.[role] || null; }
    function roleAccessConfigured(role){ return !!roleAccessRow(role)?.permissions; }
    function fallbackViewAllowed(role, feature){
        const item=ROLE_ACCESS_CATALOG.find(x=>x.key===feature);
        if(!item?.nav) return true;
        return (DEFAULT_ACCESS[role]||DEFAULT_ACCESS.Resident).includes(item.nav);
    }
    function roleCan(feature, action='view', roleArg){
        const session=window.RGMS?.auth?.getSession?.()||{};
        const role=roleArg||session.role||'Resident';
        if(role==='Admin') return true;
        const row=roleAccessRow(role);
        if(!row?.permissions) return action==='view' ? fallbackViewAllowed(role,feature) : true;
        const p=row.permissions?.[feature];
        if(!p) return false;
        return accessYes(p[action]);
    }
    async function loadRuntimeRoleAccessMatrix(){
        runtimeRoleAccessMatrix=null;
        try{
            await window.RGMS?.store?.loadCollection?.(STORAGE_KEYS.SETTINGS);
            const rows=typeof getAllRecords==='function'?getAllRecords(STORAGE_KEYS.SETTINGS):[];
            const saved=rows.find(r=>String(r.id)==='roleDashboardAccess');
            if(saved?.matrix&&typeof saved.matrix==='object') runtimeRoleAccessMatrix=saved.matrix;
        }catch(e){ console.warn('Role access runtime load failed',e); }
        window.RGMS=window.RGMS||{};
        window.RGMS.roleAccess={
            catalog:ROLE_ACCESS_CATALOG,
            get matrix(){return runtimeRoleAccessMatrix;},
            can:(feature,action='view',role)=>roleCan(feature,action,role),
            isConfigured:(role)=>roleAccessConfigured(role||window.RGMS?.auth?.getSession?.()?.role),
            refresh:loadRuntimeRoleAccessMatrix
        };
        return runtimeRoleAccessMatrix;
    }

    function inferActionFromButton(btn){
        const t=`${btn.id||''} ${btn.name||''} ${btn.textContent||''} ${btn.title||''}`.toLowerCase();
        if(/delete|remove|trash/.test(t)) return 'delete';
        if(/update|modify|edit/.test(t)) return 'update';
        if(/publish/.test(t)) return 'publish';
        if(/approve|assign/.test(t)) return /assign/.test(t)?'assign':'approve';
        if(/whatsapp|share/.test(t)) return 'share';
        if(/export|excel|pdf|jpeg|print|download/.test(t)) return 'export';
        if(/save|add|new|create|record/.test(t)) return 'add';
        return null;
    }
    function restrictSection(root, selector, feature){
        const el=root.querySelector(selector); if(!el)return;
        if(!roleCan(feature,'view')){el.hidden=true;el.style.display='none';return;}
        el.querySelectorAll('button').forEach(btn=>{const action=inferActionFromButton(btn);if(action&&!roleCan(feature,action)){btn.disabled=true;btn.hidden=true;}});
    }
    function applyModuleActionPermissions(moduleName, root=document.getElementById('content-area')){
        if(!root)return;
        const session=window.RGMS?.auth?.getSession?.()||{};
        if(session.role==='Admin'||!roleAccessConfigured(session.role)) return;
        const mainFeature=NAV_PERMISSION_MAP[moduleName];
        if(mainFeature && moduleName!=='admin') root.querySelectorAll('button').forEach(btn=>{
            if(btn.closest('.rg-page-toolbar'))return;
            if(moduleName==='festival'){const card=btn.closest('.form-card');const h=(card?.querySelector('h3')?.textContent||'').toLowerCase();if(h.includes('laddu auction')||h.includes('sponsor'))return;}
            if(moduleName==='reports'){const sec=btn.closest('.report-card,.form-card,.summary-section');const h=(sec?.querySelector('h3,h2')?.textContent||'').toLowerCase();if(h.includes('expenditure'))return;}
            const action=inferActionFromButton(btn);if(action&&!roleCan(mainFeature,action)){btn.disabled=true;btn.hidden=true;}
        });
        if(moduleName==='festival'){
            const cards=[...root.querySelectorAll('.form-card')];
            cards.forEach(card=>{const h=(card.querySelector('h3')?.textContent||'').toLowerCase();if(h.includes('laddu auction')){if(!roleCan('ladduAuction','view'))card.hidden=true;else card.querySelectorAll('button').forEach(b=>{const a=inferActionFromButton(b);if(a&&!roleCan('ladduAuction',a)){b.disabled=true;b.hidden=true;}});}if(h.includes('sponsor')){if(!roleCan('sponsorDetails','view'))card.hidden=true;else card.querySelectorAll('button').forEach(b=>{const a=inferActionFromButton(b);if(a&&!roleCan('sponsorDetails',a)){b.disabled=true;b.hidden=true;}});}});
        }
        if(moduleName==='reports'){
            [...root.querySelectorAll('.report-card,.form-card,.summary-section')].forEach(sec=>{const h=(sec.querySelector('h3,h2')?.textContent||'').toLowerCase();if(h.includes('expenditure')){if(!roleCan('expenditure','view'))sec.hidden=true;else sec.querySelectorAll('button').forEach(b=>{const a=inferActionFromButton(b);if(a&&!roleCan('expenditure',a)){b.disabled=true;b.hidden=true;}});}});
        }
        if(moduleName==='admin'){
            const map={
                'residents':'residents','roles':'roleMaster','access':'roleAccessMaster','home-services':'homeServices','providers':'serviceProviders','billers':'utilityBillers','directory':'colonyDirectory'
            };
            root.querySelectorAll('[data-admin-register]').forEach(card=>{const f=map[card.dataset.adminRegister]||'adminMasters';if(!roleCan(f,'view'))card.hidden=true;});
            root.querySelectorAll('[data-generic-master]').forEach(card=>{const f=card.dataset.genericMaster;if(!roleCan(f,'view')&&!roleCan('adminMasters','view'))card.hidden=true;});
        }
    }

    document.addEventListener("DOMContentLoaded", async () => {
        try {
            const firebaseReady = await waitForFirebase(8000);
            const preloadedSession = RGMS.auth?.getSession?.() || null;
            if (!firebaseReady || !RGMS.firebaseConfigReady) {
                // A validated officer session can still reach its Home page when
                // the Firebase Web SDK is temporarily unavailable. Never leave
                // a blank screen; protected data modules will report/retry the
                // backend condition when opened.
                if (preloadedSession) {
                    showRoleHome(preloadedSession);
                    const status = document.getElementById('statusText');
                    if (status) status.textContent = 'Offline / Firebase reconnect pending';
                    return;
                }
                throw new Error("Firebase configuration is incomplete or unavailable.");
            }

            // Officer login already stores a validated session before opening
            // app.html. Do not block the first screen on Firebase Auth state
            // restoration; on Android WebView that callback can be delayed by
            // Play Services/network activity and previously left a blank screen.
            // Firebase is still required for all protected data operations.
            let session = RGMS.auth.getSession();
            let user = RGMS.firebase?.auth?.currentUser || null;
            if (!session) {
                if (RGMS.authPersistenceReady) {
                    try { await Promise.race([RGMS.authPersistenceReady, new Promise(r => setTimeout(r, 2500))]); } catch (_) {}
                }
                try {
                    user = await Promise.race([
                        RGMS.auth.waitForAuthReady(),
                        new Promise(resolve => setTimeout(() => resolve(null), 5000))
                    ]);
                } catch (_) { user = null; }
                session = RGMS.auth.getSession();
            }
            const officerRoles = RGMS.auth.STAFF_ROLES;
            const normalizedSessionRole = RGMS.auth.normalizeStaffRole(session?.role);
            // Native Android authentication is held by the Android Firebase SDK,
            // not the WebView Firebase Auth instance. A validated officer session
            // therefore remains valid even when WebView auth.currentUser is null.
            let nativeUser = null;
            try { nativeUser = RGMS.isNativeAndroid ? RGMSNativeAuth?.getCurrentUser?.() : null; } catch (_) { nativeUser = null; }
            /*
             * WEB LOGIN HAND-OFF FIX (1.2.219)
             * signInStaff() has already authenticated the officer and saved a
             * validated same-tab session before navigating here.  On some
             * browsers Firebase Auth restores currentUser a little later than
             * sessionStorage.  Redirecting solely because currentUser is still
             * null makes app.html immediately jump back to index.html, which
             * looks like the web app has exited.
             *
             * Keep the validated officer session and let Firebase restore in
             * the background. Firestore/Functions continue to enforce Firebase
             * authentication for protected data operations.
             */
            if (!user && !nativeUser && normalizedSessionRole !== "Resident" && !session) {
                const status = document.getElementById('statusText');
                if (status) status.textContent = 'Restoring login session…';
                try {
                    if (RGMS.authPersistenceReady) await Promise.race([RGMS.authPersistenceReady, new Promise(r=>setTimeout(r,3000))]);
                    user = RGMS.firebase?.auth?.currentUser || await RGMS.auth.waitForAuthReady();
                    session = RGMS.auth.getSession();
                } catch (_) {}
            }
            if (session && normalizedSessionRole !== session.role) {
                session = { ...session, role: normalizedSessionRole };
                RGMS.auth.saveSession(session);
            }
            if (!session || (!officerRoles.includes(normalizedSessionRole) && normalizedSessionRole !== "Resident")) {
                if (!user) {
                    throw new Error('Your login was successful, but the browser session could not be restored. Please refresh this page once.');
                }
                const profile = await RGMS.auth.loadUserProfile(user.uid);
                const normalizedRole = RGMS.auth.normalizeStaffRole(profile?.role);
                if (!profile || !officerRoles.includes(normalizedRole)) {
                    throw new Error('Officer profile could not be restored. Please verify Role Master and refresh.');
                }
                session = { ...profile, uid: user.uid, email: user.email || profile.email || "", role: normalizedRole };
                RGMS.auth.saveSession(session);
            }
            // Resident mapping is useful for officer convenience but must never
            // prevent the role Home from appearing.
            session = await Promise.race([
                ensureOfficerResidentMapping(session),
                new Promise(resolve => setTimeout(() => resolve(session), 5000))
            ]);
            const loggedInName = document.getElementById("loggedInName");
            if (loggedInName) {
                loggedInName.textContent = session.displayName || session.name || session.ownerName || session.email || "Resident";
                loggedInName.previousElementSibling?.classList.add("welcome-line");
            }
            await waitForStoreReady();
            await Promise.race([loadRuntimeRoleAccessMatrix(), new Promise(resolve=>setTimeout(resolve,3500))]);
            applyRoleAccess(session.role);

            // Do NOT load every Firestore collection sequentially during app
            // startup. That made officer login appear frozen and could take a
            // long time on mobile networks. Each module now refreshes only the
            // collections it needs. Resident master initialization is also
            // best-effort and runs without blocking the role Home.
            // Firebase/native authentication is already established before this
            // point. Show the role Home immediately, then initialize every
            // Firebase collection and missing packaged master/register record in
            // the background so the first screen never appears frozen.
            const startupStatus = document.getElementById("statusText");
            if (startupStatus) startupStatus.textContent = "Preparing your data…";
            RGMS.store.initializeAllDataOnAppOpen().then(result => {
                console.log("RGMS Firebase startup initialization complete:", result);
                if (startupStatus) startupStatus.textContent = "Data ready";
            }).catch(error => {
                console.warn("RGMS Firebase startup initialization failed:", error);
                if (startupStatus) startupStatus.textContent = "Some data is still loading. You can continue using the app.";
            });
            bindNavigation();
            const requestedModule = new URLSearchParams(window.location.search).get("module");
            const allowed = getAllowedModules(session.role);
            if (requestedModule && MODULES[requestedModule] && allowed.includes(requestedModule)) {
                document.querySelector(`[data-module="${requestedModule}"]`)?.click();
            } else {
                showRoleHome(session);
            }
        } catch (error) {
            console.error(error);
            document.getElementById("content-area").innerHTML = `<div class="welcome"><h2>Unable to start RGMS</h2><p>${error.message || "Please sign in again."}</p></div>`;
        }
    });


    async function ensureOfficerResidentMapping(session){
        if(!session || session.role==='Resident') return session;

        // A resident profile explicitly assigned by Admin always wins.
        if(session.plotNo || session.residentId){
            return session;
        }

        try{
            let residents=[];
            try{
                await RGMS.store.loadCollection(STORAGE_KEYS.RESIDENTS);
                residents=RGMS.store.getResidentMaster({includeVacant:true});
            }catch(e){
                console.error('Resident master Firebase lookup unavailable.',e);
                return session;
            }
            if(!Array.isArray(residents) || !residents.length) return session;
            const clean=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');

            // Prefer the officer's stored display/owner name.
            const target=clean(session.ownerName||session.displayName||session.name);
            let resident=target
                ? residents.find(r=>!r.isVacant && clean(r.ownerName)===target)
                : null;

            // Role aliases are used only when the profile has not already
            // been assigned a resident record by Admin.
            const roleAliases={
                Admin:['krupakar arakala','arakala krupakar','krupakar'],
                President:['sreekanth karimilla','karimilla sreekanth','srikanth karimilla','srikanth rao k','srikanth'],
                Treasurer:['krishna kishore sankarabanda','sankarabanda krishna kishore','s krishna kishore','krishna kishore'],
                Secretary:['rajeshwari yanamandla','yanamandla rajeshwari','rajeswari yanamandla','rajeshwari']
            };

            if(!resident){
                const aliases=(roleAliases[session.role]||[]).map(clean);
                for(const alias of aliases){
                    resident=residents.find(r=>!r.isVacant && clean(r.ownerName)===alias);
                    if(resident) break;
                }
            }

            // Match the known officer surname/name parts against the resident
            // master when an exact record uses initials (e.g. S.KRISHNA KISHORE).
            if(!resident){
                const aliases=(roleAliases[session.role]||[]);
                for(const rawAlias of aliases){
                    const parts=String(rawAlias).toLowerCase().match(/[a-z]{4,}/g)||[];
                    if(!parts.length) continue;
                    resident=residents.find(r=>{
                        if(r.isVacant) return false;
                        const n=String(r.ownerName||'').toLowerCase();
                        const normalizedFirst=n.replace(/[^a-z]/g,'');
                        const matched=parts.filter(part=>{
                            const p=part.replace(/[^a-z]/g,'');
                            // Accept common first-name spelling differences such
                            // as Sreekanth/Srikanth and initials in the master.
                            return n.includes(part) || normalizedFirst.includes(p) ||
                                   (p.startsWith('sreekanth') && n.includes('srikanth')) ||
                                   (p.startsWith('srikanth') && n.includes('sreekanth'));
                        }).length;
                        return matched>=Math.min(2,parts.length);
                    });
                    if(resident) break;
                }
            }

            if(!resident) return session;

            const mapped={
                ...session,
                residentId:resident.residentId,
                plotNo:resident.plotNo,
                ownerName:resident.ownerName,
                phoneE164:resident.phoneE164||session.phoneE164||''
            };
            RGMS.auth.saveSession(mapped);
            return mapped;
        }catch(e){
            console.warn('Officer resident mapping unavailable',e);
            return session;
        }
    }

    function getAllowedModules(role){
        const session = window.RGMS?.auth?.getSession?.() || {};
        if (role === "Admin") return DEFAULT_ACCESS.Admin;
        if (role === "Resident") return ["resident-dashboard"];
        if (roleAccessConfigured(role)) {
            const allowed=Object.entries(MODULES).filter(([moduleName])=>{
                const feature=NAV_PERMISSION_MAP[moduleName];
                return feature ? roleCan(feature,'view',role) : false;
            }).map(([moduleName])=>moduleName);
            return [...new Set(allowed)];
        }
        const assigned = Array.isArray(session.assignedModules) ? session.assignedModules.filter(x=>MODULES[x]) : [];
        const defaults = DEFAULT_ACCESS[role] || DEFAULT_ACCESS.Resident;
        const merged = [...new Set([...defaults, ...assigned])];
        if (!merged.includes("resident-dashboard")) merged.unshift("resident-dashboard");
        if (!merged.includes("dashboard")) merged.unshift("dashboard");
        return merged;
    }

    function applyRoleAccess(role){
        const allowed=new Set(getAllowedModules(role));
        // Android production navigation is toolbar/card based. The old sidebar
        // is deliberately removed from the visual tree so legacy tabs cannot
        // reappear after login or module navigation.
        document.querySelectorAll(".sidebar, .tab-bar, .dashboard-tabs, .nav-tabs, .legacy-tabs, [data-dashboard-tabs]")
            .forEach(el => el.remove());
        document.querySelectorAll(".menu-item").forEach(item=>{
            item.style.display=allowed.has(item.dataset.module)?"flex":"none";
        });
    }

    function bindNavigation() {
        document.querySelectorAll(".menu-item").forEach(item => {
            item.addEventListener("click", () => {
                document.querySelectorAll(".menu-item").forEach(x => x.classList.remove("active"));
                item.classList.add("active");
                if (item.dataset.module === "resident-dashboard") { window.location.href = "resident-dashboard.html"; return; }
                loadModule(item.dataset.module, {pushHistory: true}).catch(console.error);
            });
        });

        document.getElementById("btnResidentSwitch")?.addEventListener("click", () => {
            window.location.href = "resident-dashboard.html";
        });

        document.getElementById("btnLogout")?.addEventListener("click", async () => {
            const btn=document.getElementById('btnLogout'); if(btn) btn.disabled=true;
            try { await RGMS.auth.signOut(); } catch(e) { console.warn('Logout cleanup:',e); try{RGMS.auth.clearSession();}catch(_){ } }
            window.location.replace('index.html');
        });

        const session = RGMS.auth.getSession() || {};
        const switchBtn = document.getElementById("btnResidentSwitch");
        if (switchBtn && session.role && session.role !== "Resident") {
            switchBtn.hidden = !(session.plotNo || session.residentId);
            if(!switchBtn.hidden) switchBtn.textContent = 'My Resident Dashboard';
        }
    }


    async function waitForStoreReady(timeoutMs = 15000) {
        const started = Date.now();
        while (!(window.RGMS && window.RGMS.store && typeof window.RGMS.store.initializeStore === "function")) {
            if (Date.now() - started >= timeoutMs) {
                const detail = window.RGMS?.startupScriptError ? ` ${window.RGMS.startupScriptError}` : "";
                throw new Error(`RGMS data store failed to load.${detail} Please restart the app or reinstall the latest version.`);
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        return window.RGMS.store;
    }

    async function waitForFirebase(timeoutMs = 8000) {
        const started = Date.now();
        while (window.RGMS?.firebaseConfigReady === undefined) {
            if (Date.now() - started >= timeoutMs) return false;
            await new Promise(resolve => setTimeout(resolve, 25));
        }
        return true;
    }

    function applyUniformDashboardCardLayout(root = document.getElementById("content-area")) {
        if (!root) return;
        const selector = [
            '.association-summary-grid > .summary-card',
            '.colony-fund-dashboard-grid > .summary-card',
            '.ganesh-summary-grid > .summary-card'
        ].join(',');
        root.querySelectorAll(selector).forEach(card => {
            card.style.setProperty('display','flex','important');
            card.style.setProperty('flex-direction','column','important');
            card.style.setProperty('align-items','center','important');
            card.style.setProperty('justify-content','flex-start','important');
            card.style.setProperty('text-align','center','important');
            const icon = card.querySelector(':scope > .summary-card-icon');
            const label = card.querySelector(':scope > h4');
            if (icon) {
                icon.style.setProperty('display','block','important');
                icon.style.setProperty('position','static','important');
                icon.style.setProperty('transform','none','important');
                icon.style.setProperty('order','1','important');
                icon.style.setProperty('margin','0 0 7px','important');
                icon.style.setProperty('font-size','26px','important');
                icon.style.setProperty('line-height','1','important');
                icon.style.setProperty('text-align','center','important');
            }
            if (label) {
                label.style.setProperty('order','2','important');
                label.style.setProperty('width','100%','important');
                label.style.setProperty('margin','0','important');
                label.style.setProperty('text-align','center','important');
                label.style.setProperty('justify-content','center','important');
            }
            const dataChildren = [...card.children].filter(el => el !== icon && el !== label);
            dataChildren.forEach((el, index) => {
                el.style.setProperty('order', String(3 + index), 'important');
                el.style.setProperty('width','100%','important');
                el.style.setProperty('text-align','center','important');
                if (index === 0) el.style.setProperty('margin-top','auto','important');
            });
            card.querySelectorAll('.dashboard-period-values,.dashboard-dual-values').forEach(group => {
                group.style.setProperty('margin-top','auto','important');
                group.style.setProperty('width','100%','important');
            });
        });
    }

    async function loadModule(name, options = {}) {
        const pushHistory = options.pushHistory !== false;
        const path = MODULES[name];
        if (!path) return;
        const role=window.RGMS?.auth?.getSession?.()?.role;
        if(role && role!=='Admin' && !getAllowedModules(role).includes(name)){ alert('Access to this module has not been assigned by Admin.'); return; }

        if (pushHistory && currentModule && currentModule !== name) {
            // Never create consecutive duplicate history entries.
            if (moduleHistory[moduleHistory.length - 1] !== currentModule) {
                moduleHistory.push(currentModule);
            }
        }
        currentModule = name;
        window.RGMS.currentModule = name;

        const response = await fetch(path, { cache: "no-store" });
        if (!response.ok) throw new Error(`Module not found: ${name}`);
        document.body.classList.remove("rg-role-home-active");
        document.querySelector('.header .rg-header-logout')?.remove();
        document.body.classList.add("rg-module-fullscreen");
        document.querySelectorAll(".sidebar, .tab-bar, .dashboard-tabs, .nav-tabs, .legacy-tabs, [data-dashboard-tabs]").forEach(el => el.remove());
        const contentArea = document.getElementById("content-area");
        contentArea.innerHTML = await response.text();
        // Every module must open at its own top. Android WebView preserves the
        // scrollTop of #content-area between innerHTML replacements; without this,
        // the next screen can start halfway down with its title hidden under the
        // sticky toolbar.
        contentArea.scrollTop = 0;
        try { contentArea.scrollTo({top:0,left:0,behavior:'instant'}); } catch (_) { try { contentArea.scrollTo(0,0); } catch(__){} }
        // Defensive cleanup: a module must contain exactly one production
        // navigation toolbar. This prevents duplicate Home/Back/Logout bars
        // if a WebView restores or re-executes a previously rendered module.
        document.querySelectorAll('#content-area .rg-page-toolbar').forEach((el, index) => {
            if (index > 0) el.remove();
        });

        // Remove only legacy global navigation surfaces after module HTML is
        // inserted. The Colony Fund's own functional tab bar is intentionally
        // preserved.
        document.querySelectorAll(".sidebar, .dashboard-tabs, .nav-tabs, .legacy-tabs, [data-dashboard-tabs]").forEach(el => el.remove());

        // Production Android uses one navigation toolbar immediately above
        // every module title. It is the only in-app navigation surface.
        const moduleContainer = document.querySelector("#content-area .module-container");
        if (moduleContainer && !moduleContainer.querySelector(":scope > .rg-page-toolbar")) {
            const toolbar = document.createElement("div");
            toolbar.className = "rg-page-toolbar";
            const screenTitle = ROLE_HOME_META[name]?.label || formatModuleName(name);
            toolbar.innerHTML = `
                <div class="rg-page-toolbar-actions">
                    <button type="button" class="rg-page-btn rg-home-btn">⌂ Home</button>
                    <button type="button" class="rg-page-btn rg-back-btn">‹ Back</button>
                    <button type="button" class="rg-page-btn rg-logout-btn">Logout</button>
                </div>
                ${name === "dashboard" ? "" : `<div class="rg-page-screen-title">${screenTitle}</div>`}
                <div class="rg-build-stamp" aria-label="App version">v1.2.284</div>
            `;
            moduleContainer.insertBefore(toolbar, moduleContainer.firstChild);
            toolbar.querySelector(".rg-home-btn").addEventListener("click", () => {
                window.RGMS.navigation.goHome();
            });
            toolbar.querySelector(".rg-back-btn").addEventListener("click", () => {
                window.RGMS.navigation.goBack();
            });
            toolbar.querySelector(".rg-logout-btn").addEventListener("click", async () => {
                await logoutAndReturnToLogin();
            });
        }

        document.getElementById("module-css")?.remove();
        const cssPath = path.replace(/\.html$/, ".css");
        const link = document.createElement("link");
        link.id = "module-css";
        link.rel = "stylesheet";
        link.href = `${cssPath}?v=1.2.284`;
        document.head.appendChild(link);

        // Load the mobile UI layer AFTER module CSS so mobile rules
        // consistently control the Android presentation.
        document.getElementById("mobile-module-css")?.remove();
        const mobileLink = document.createElement("link");
        mobileLink.id = "mobile-module-css";
        mobileLink.rel = "stylesheet";
        mobileLink.href = "css/mobile-app.css?v=1.2.284";
        document.head.appendChild(mobileLink);

        // Refresh the module's Firebase-backed collections immediately before
        // initialization. This prevents dashboards/registers from showing an
        // older cached snapshot after navigating away and returning.
        const MODULE_DATA_KEYS = {
            dashboard: [STORAGE_KEYS.RESIDENTS, STORAGE_KEYS.DEVELOPMENT_FUND, STORAGE_KEYS.FESTIVAL_FUND, STORAGE_KEYS.GANESH_FESTIVAL, STORAGE_KEYS.COMPLAINTS, STORAGE_KEYS.VISITORS, STORAGE_KEYS.MEETINGS, STORAGE_KEYS.DOCUMENTS, STORAGE_KEYS.EXPENDITURES],
            residents: [STORAGE_KEYS.RESIDENTS],
            visitors: [STORAGE_KEYS.VISITORS, STORAGE_KEYS.RESIDENTS],
            'development-fund': [STORAGE_KEYS.RESIDENTS, STORAGE_KEYS.DEVELOPMENT_FUND, STORAGE_KEYS.EXPENDITURES],
            festival: [STORAGE_KEYS.RESIDENTS, STORAGE_KEYS.GANESH_FESTIVAL, STORAGE_KEYS.FESTIVAL_FUND, STORAGE_KEYS.EXPENDITURES],
            complaints: [STORAGE_KEYS.COMPLAINTS, STORAGE_KEYS.RESIDENTS],
            meetings: [STORAGE_KEYS.MEETINGS],
            documents: [STORAGE_KEYS.DOCUMENTS],
            "notice-board": [STORAGE_KEYS.NOTICES],
            meetings: [STORAGE_KEYS.MEETINGS],
            reports: [STORAGE_KEYS.RESIDENTS, STORAGE_KEYS.DEVELOPMENT_FUND, STORAGE_KEYS.GANESH_FESTIVAL, STORAGE_KEYS.FESTIVAL_FUND, STORAGE_KEYS.COMPLAINTS, STORAGE_KEYS.VISITORS, STORAGE_KEYS.MEETINGS, STORAGE_KEYS.DOCUMENTS, STORAGE_KEYS.EXPENDITURES],
            admin: [STORAGE_KEYS.USER_PROFILES, STORAGE_KEYS.RESIDENTS, STORAGE_KEYS.HOME_SERVICES, STORAGE_KEYS.SERVICE_PROVIDERS, STORAGE_KEYS.BILLERS, STORAGE_KEYS.SETTINGS, STORAGE_KEYS.DATA_ENTRY_FIELDS],
            communications: [STORAGE_KEYS.RESIDENTS, STORAGE_KEYS.COMMUNICATIONS, STORAGE_KEYS.GREETINGS, STORAGE_KEYS.NOTICES],
            settings: [STORAGE_KEYS.SETTINGS]
        };
        // Load only the collections required by this module. The global login
        // preload runs in the background; waiting for it here caused every module
        // to inherit the cost of unrelated Firestore reads.
        const refreshKeys = MODULE_DATA_KEYS[name] || [];
        // Populate the in-memory rendering cache from the current Firebase
        // snapshot before the module initializer runs. This removes the race
        // where a dashboard could render zeroes while startup loading was still
        // in progress.
        if (refreshKeys.length && window.RGMS?.store?.loadCollection) {
            // Dashboards must open from an authoritative Firebase snapshot, not an
            // empty/stale cache created during login restoration. For the two fund
            // dashboards we wait for these reads before running the initializer.
            const isAuthoritativeDashboard = name === 'dashboard' || name === 'development-fund';
            const loader = isAuthoritativeDashboard && window.RGMS.store.refreshCollection
                ? window.RGMS.store.refreshCollection.bind(window.RGMS.store)
                : window.RGMS.store.loadCollection.bind(window.RGMS.store);
            const preload = Promise.all(refreshKeys.map(key => loader(key, {retries: 3}).catch(err => {
                console.warn('Module Firebase preload skipped for', key, err);
                return [];
            })));
            if (isAuthoritativeDashboard) await preload;
            else preload.catch(()=>{});
        }
        applyUniformDashboardCardLayout(contentArea);
        // 1.2.169 Colony Fund safety net: the screen must never be left with
        // only a "Loading" message if a module script/runtime error occurs.
        if (name === "development-fund") {
            // 1.2.170: there is no loading-only state in Colony Fund. Remove any
            // legacy status node that may have been restored by WebView history.
            document.querySelectorAll("#dfInitializationStatus").forEach(el => el.remove());
            const dc = document.getElementById("dashboardContent");
            if (dc) { dc.classList.add("df-active"); dc.style.display = "block"; dc.hidden = false; }
        }

        const scriptPath = MODULE_JS[name];
        if (scriptPath) {
            const moduleBuild = "1.2.284";
            let script = document.querySelector(`script[data-module-script="${name}"]`);
            if (script && !String(script.src||'').includes(`v=${moduleBuild}`)) {
                script.remove();
                script = null;
            }
            if (!script) {
                script = document.createElement("script");
                script.src = `${scriptPath}?v=${moduleBuild}`;
                script.dataset.moduleScript = name;
                document.body.appendChild(script);
                await new Promise((resolve, reject) => {
                    script.addEventListener("load", resolve, { once: true });
                    script.addEventListener("error", () => reject(new Error(`Unable to load ${scriptPath}`)), { once: true });
                });
            }
            const initializer = window[`initialize${toPascal(name)}`];
            if (typeof initializer === "function") {
                // The module must finish its own data load before it is considered
                // ready. This prevents dashboards/registers from rendering false
                // zeroes while Firestore data is still arriving.
                try { await initializer(); }
                catch (error) { console.warn(`Module initializer failed for ${name}:`, error); }
            }
            applyUniformDashboardCardLayout(contentArea);
            requestAnimationFrame(() => applyUniformDashboardCardLayout(contentArea));
            setTimeout(() => applyUniformDashboardCardLayout(contentArea), 150);
        }

        applyModuleActionPermissions(name, contentArea);
        if(window.RGMS?.dataEntryFields?.applyForModule){try{await window.RGMS.dataEntryFields.applyForModule(name,contentArea);}catch(e){console.warn('Data Entry Fields apply skipped',e);}}

        // Initializers may update their own status text with Firebase state.
        // Do not overwrite that useful diagnostic with a generic message.
        const statusEl = document.getElementById("statusText");
        if (statusEl && !String(statusEl.textContent||'').trim()) statusEl.textContent = `${formatModuleName(name)} module loaded`;
        contentArea.scrollTop = 0;
        try { contentArea.scrollTo(0,0); } catch (_) {}
    }

    function toPascal(name) {
        return name.split("-").map(x => x.charAt(0).toUpperCase() + x.slice(1)).join("");
    }
    function formatModuleName(name) {
        return name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    }

    async function logoutAndReturnToLogin(){
        try { await RGMS.auth.signOut(); } catch(e) {
            console.warn("Logout cleanup:", e);
            try { RGMS.auth.clearSession(); } catch(_) {}
        }
        moduleHistory.length = 0;
        currentModule = null;
        window.location.replace("index.html");
    }

    function getRoleHomeModule(session = {}) {
        const role = RGMS.auth?.normalizeStaffRole
            ? RGMS.auth.normalizeStaffRole(session.role)
            : (session.role || "Resident");

        // Each authenticated role has its own Home destination.
        // Admin Home is the Admin card/management home, not the Association Dashboard.
        if (role === "Admin") return "admin";
        if (role === "Resident") return "resident-dashboard";

        const assignedHome = String(session.primaryDashboard || "").trim();
        if (assignedHome === "resident-dashboard" && MODULES[assignedHome]) return assignedHome;
        if (assignedHome === "dashboard" && MODULES[assignedHome]) return assignedHome;

        // Safe role defaults when no primary dashboard has been saved yet.
        if (role === "President") return "dashboard";
        if (role === "Secretary" || role === "Treasurer") return "resident-dashboard";
        return "dashboard";
    }

    const ROLE_HOME_META = {
        admin: {label:"Admin", icon:"⚙️", description:"Administration"},
        "resident-dashboard": {label:"Resident Dashboard", icon:"🏡", description:"Resident services"},
        dashboard: {label:"Association Dashboard", icon:"🏠", description:"Colony overview"},
        "development-fund": {label:"Colony Fund", icon:"💰", description:"Payments & register"},
        festival: {label:"Ganesh Festival Chanda", icon:"🎉", description:"Festival collections"},
        residents: {label:"Residents", icon:"👥", description:"Resident records"},
        visitors: {label:"Visitors", icon:"🚶", description:"Visitor records"},
        complaints: {label:"Complaints", icon:"📝", description:"Complaints & status"},
        meetings: {label:"Meetings", icon:"📅", description:"Meetings"},
        documents: {label:"Documents", icon:"📁", description:"Association documents"},
        "notice-board": {label:"Notice Board", icon:"📢", description:"Notices & announcements"},
        "public-services": {label:"Citizen Services", icon:"🏛️", description:"Citizen services"},
        "general-information": {label:"General Information", icon:"ℹ️", description:"Colony information"},
        reports: {label:"Reports", icon:"📊", description:"Reports"},
        settings: {label:"Settings", icon:"🔧", description:"Settings"},
        communications: {label:"Communications", icon:"💬", description:"Resident messages"}
    };

    function formatPersonName(value) {
        const raw = String(value || "").trim().replace(/\s+/g, " ");
        if (!raw) return "";
        const known = {
            "Arakala Krupakar": "Krupakar Arakala",
            "Karimilla Sreekanth": "Sreekanth Karimilla",
            "Yanamandla Rajeshwari": "Rajeshwari Yanamandla",
            "Sankarabanda Krishna Kishore": "Krishna Kishore Sankarabanda",
            "Krupakar Arakala": "Krupakar Arakala",
            "Sreekanth Karimilla": "Sreekanth Karimilla",
            "Rajeshwari Yanamandla": "Rajeshwari Yanamandla",
            "Krishna Kishore Sankarabanda": "Krishna Kishore Sankarabanda"
        };
        return known[raw] || raw;
    }

    function showRoleHome(session = {}) {
        const role = RGMS.auth?.normalizeStaffRole ? RGMS.auth.normalizeStaffRole(session.role) : (session.role || "Resident");
        if (role === "Resident") {
            window.location.replace("resident-dashboard.html");
            return true;
        }
        moduleHistory.length = 0;
        currentModule = "__ROLE_HOME__";
        document.body.classList.remove("rg-module-fullscreen");
        document.body.classList.add("rg-role-home-active");
        // Officer role Home is a clean card-based landing page. Remove the
        // entire legacy navigation surface, not just its CSS, so it cannot
        // reappear because of an old stylesheet or dynamically inserted tab.
        document.querySelectorAll(".sidebar, .tab-bar, .dashboard-tabs, .nav-tabs, .legacy-tabs, [data-dashboard-tabs], .menu-item, .menu-group")
            .forEach(el => el.remove());
        const content = document.getElementById("content-area");
        if (!content) return false;
        const allowed = getAllowedModules(role);
        const order = role === "Admin"
            ? ["admin","dashboard","residents","visitors","development-fund","festival","complaints","meetings","documents","notice-board","public-services","reports","settings","communications"]
            : ["dashboard","resident-dashboard","development-fund","festival","complaints","meetings","notice-board","documents","visitors","residents","public-services","reports","communications"];
        const modules = order.filter(name => allowed.includes(name));
        const roleName = formatPersonName(session.displayName || session.name || session.ownerName || role);
        const cards = modules.map(name => {
            const meta = ROLE_HOME_META[name] || {label:formatModuleName(name),icon:"📌",description:"Open module"};
            return `<button type="button" class="rg-role-home-card" data-role-home-module="${name}" aria-label="Open ${meta.label}">
                <span class="rg-role-home-icon">${meta.icon}</span>
                <span class="rg-role-home-copy"><strong>${meta.label}</strong><small>${meta.description}</small></span>
                <span class="rg-role-home-arrow">›</span>
            </button>`;
        }).join("");
        content.innerHTML = `<section class="rg-role-home" aria-label="${role} Home">
            <div class="rg-role-home-header"><div><div class="rg-role-home-kicker">Welcome</div><h2>${escapeHtml(roleName)}</h2></div></div>
            <div class="rg-role-home-grid">${cards}</div>
        </section>`;
        const appHeader = document.querySelector('.header');
        if (appHeader) {
            appHeader.querySelector('.rg-header-logout')?.remove();
            const logout = document.createElement('button');
            logout.type='button'; logout.className='rg-header-logout'; logout.textContent='Logout';
            logout.addEventListener('click', async () => { await logoutAndReturnToLogin(); });
            appHeader.appendChild(logout);
        }
        content.querySelectorAll("[data-role-home-module]").forEach(card => {
            card.addEventListener("click", () => {
                const name = card.dataset.roleHomeModule;
                if (name === "resident-dashboard") { window.location.replace("resident-dashboard.html"); return; }
                loadModule(name, {pushHistory:true}).catch(console.error);
            });
        });
        return true;
    }

    function escapeHtml(value){
        return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));
    }

    function goHome() {
        const session = window.RGMS?.auth?.getSession?.() || {};
        return showRoleHome(session);
    }

    function goBack() {
        // Return to the immediately previous card/module. If the previous
        // entry is the role Home (or a stale/login entry), return to Home.
        const previous = moduleHistory.pop();
        if (!previous || previous === "__ROLE_HOME__" || previous === "login" || previous === "index") {
            const session = window.RGMS?.auth?.getSession?.() || {};
            const role = window.RGMS?.auth?.normalizeStaffRole
                ? window.RGMS.auth.normalizeStaffRole(session.role)
                : String(session.role || '');
            if (role === 'Resident') {
                window.location.replace('resident-dashboard.html');
                return true;
            }
            return goHome();
        }
        if (previous === "resident-dashboard") {
            window.location.replace("resident-dashboard.html");
            return true;
        }
        if (MODULES[previous]) {
            return loadModule(previous, {pushHistory:false});
        }
        return goHome();
    }

    window.RGMS.navigation = { loadModule, goBack, goHome, showRoleHome, getRoleHomeModule, getAllowedModules };
    window.RGMSAndroidBack = function () {
        // Close common modal/drawer overlays before navigating away.
        const modal = document.querySelector(".rg-fund-modal.open, .rg-fund-modal[aria-hidden='false']");
        if (modal) {
            const close = modal.querySelector("#rgFundHistoryClose, #rgPaymentHistoryClose");
            if (close) close.click(); else modal.classList.remove("open");
            return true;
        }
        goBack();
        return true;
    };
})();
