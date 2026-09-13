
/* RGMS 1.2.170 - runtime Colony Fund dashboard layout enforcement. */
function escHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function rg170ApplyColonyDashboardLayout(){
    const module=document.getElementById('developmentFundModule');
    if(!module) return;
    document.querySelectorAll('#dfInitializationStatus').forEach(el=>el.remove());
    const dash=document.getElementById('dashboardContent');
    if(dash){dash.style.setProperty('display','block','important');dash.hidden=false;dash.classList.add('df-active');}
    const grid=module.querySelector('.colony-fund-dashboard-grid');
    if(!grid) return;
    const mobile=window.matchMedia('(max-width:600px)').matches;
    grid.style.setProperty('display','grid','important');
    grid.style.setProperty('grid-template-columns','repeat(2,minmax(0,1fr))','important');
    grid.style.setProperty('gap',mobile?'10px':'12px','important');
    grid.querySelectorAll(':scope > .summary-card').forEach(card=>{
        const detail=card.querySelector('.dashboard-period-values');
        card.style.setProperty('height','auto','important');
        card.style.setProperty('min-height',mobile?(detail?'224px':'170px'):(detail?'190px':'168px'),'important');
        card.style.setProperty('max-height','none','important');
        card.style.setProperty('padding',mobile?'12px 9px 14px':'12px','important');
        card.style.setProperty('display','flex','important');
        card.style.setProperty('flex-direction','column','important');
        card.style.setProperty('align-items','center','important');
        card.style.setProperty('justify-content','flex-start','important');
        card.style.setProperty('overflow','visible','important');
        card.style.setProperty('min-width','0','important');
        card.style.setProperty('box-sizing','border-box','important');
        const icon=card.querySelector('.summary-card-icon');
        if(icon){icon.style.setProperty('position','static','important');icon.style.setProperty('transform','none','important');icon.style.setProperty('font-size',mobile?'28px':'25px','important');icon.style.setProperty('line-height','1','important');icon.style.setProperty('margin','0 0 7px','important');icon.style.setProperty('order','1','important');}
        const h=card.querySelector('h4');
        if(h){h.style.setProperty('order','2','important');h.style.setProperty('width','100%','important');h.style.setProperty('height','auto','important');h.style.setProperty('min-height','34px','important');h.style.setProperty('max-height','none','important');h.style.setProperty('display','flex','important');h.style.setProperty('align-items','center','important');h.style.setProperty('justify-content','center','important');h.style.setProperty('text-align','center','important');h.style.setProperty('font-size',mobile?'14px':'15px','important');h.style.setProperty('line-height','1.15','important');h.style.setProperty('margin','0','important');h.style.setProperty('overflow','visible','important');h.style.setProperty('white-space','normal','important');}
        const num=card.querySelector('.dashboard-number');
        if(num){num.style.setProperty('order','3','important');num.style.setProperty('position','static','important');num.style.setProperty('transform','none','important');num.style.setProperty('display','block','important');num.style.setProperty('width','100%','important');num.style.setProperty('height','auto','important');num.style.setProperty('min-height','34px','important');num.style.setProperty('margin','auto 0 0','important');num.style.setProperty('font-size',mobile?'clamp(21px,6vw,28px)':'25px','important');num.style.setProperty('line-height','1.1','important');num.style.setProperty('font-weight','900','important');num.style.setProperty('white-space','normal','important');num.style.setProperty('overflow','visible','important');num.style.setProperty('overflow-wrap','anywhere','important');num.style.setProperty('text-align','center','important');}
        if(detail){detail.style.setProperty('order','3','important');detail.style.setProperty('margin','auto 0 0','important');detail.style.setProperty('width','100%','important');detail.style.setProperty('display','grid','important');detail.style.setProperty('grid-template-columns',mobile?'1fr':'repeat(2,minmax(0,1fr))','important');detail.style.setProperty('gap',mobile?'7px':'8px','important');detail.style.setProperty('text-align','center','important');detail.querySelectorAll(':scope > span').forEach(x=>{x.style.setProperty('display','flex','important');x.style.setProperty('flex-direction','column','important');x.style.setProperty('align-items','center','important');x.style.setProperty('justify-content','center','important');x.style.setProperty('gap','3px','important');x.style.setProperty('white-space','normal','important');x.style.setProperty('min-width','0','important');x.style.setProperty('font-size',mobile?'11px':'10px','important');});detail.querySelectorAll('strong').forEach(x=>{x.style.setProperty('font-size',mobile?'clamp(17px,4.8vw,22px)':'18px','important');x.style.setProperty('line-height','1.08','important');x.style.setProperty('font-weight','900','important');x.style.setProperty('white-space','normal','important');x.style.setProperty('max-width','100%','important');x.style.setProperty('overflow-wrap','anywhere','important');});}
        const sub=card.querySelector('.occupied-breakdown');
        if(sub){sub.style.setProperty('order','4','important');sub.style.setProperty('position','static','important');sub.style.setProperty('width','100%','important');sub.style.setProperty('margin','6px 0 0','important');sub.style.setProperty('font-size','10px','important');sub.style.setProperty('line-height','1.15','important');sub.style.setProperty('overflow','visible','important');}
    });
}

/*=========================================================
  RGMS - Colony Fund
  Clean Version 4.0
  Association Module
=========================================================*/

const DF_STORAGE = STORAGE_KEYS.DEVELOPMENT_FUND;

let residents = [];
let payments = [];
let currentFinancialYear = "";
let currentCollectionPeriod = "";
let selectedDashboardMonth = "";
let selectedDashboardFY = "";
let currentPayment = null;

function colonyUserMessage(text, error=false){
    const el=document.getElementById('colonyFundMessage');
    if(el){el.textContent=String(text||'');el.className='message '+(error?'error':'ok');}
}
function colonyFriendlyError(error, fallback='Unable to complete the Colony Fund action. Please try again.') {
    const code=String(error?.code||'').toLowerCase();
    const msg=String(error?.message||'');
    if(code.includes('permission')||msg.toLowerCase().includes('permission')) return 'You do not have permission for this Colony Fund action.';
    if(code.includes('network')||msg.toLowerCase().includes('firebase')||msg.toLowerCase().includes('firestore')) return 'Unable to update the latest Colony Fund data. Please check the connection and try again.';
    return fallback;
}
async function refreshColonyAfterCrud(selectedId=''){
    await RGMS.store.refreshCollection(DF_STORAGE,{retries:3});
    payments=getAllRecords(DF_STORAGE).map(normalizeColonyPayment);
    if(selectedId) currentPayment=payments.find(p=>String(p.id)===String(selectedId))||null;
    updateDashboard();
    try{window.RGMSRenderColonyIntegratedRegister?.();}catch(_){}
    loadPaymentHistory();
    loadPendingResidents();
}

const DEVELOPMENT_FUND_REGISTER_IMPORT_ID = "developmentFundRegister_2026_27_photo_20260907_v2";
const DEVELOPMENT_FUND_REGISTER_PATH = "data/development-fund-register-2026-27.json";

function findResidentForPayment(payment, residentRows = RGMS.store.getResidentMaster({includeVacant:true})) {
    const norm = v => String(v ?? '').replace(/\s+/g,' ').trim().toLowerCase();
    const plot = v => {
        const raw = String(v ?? '').trim();
        if (typeof window.extractPlotNo === 'function') return norm(window.extractPlotNo(raw));
        return norm(raw.replace(/^2-1\//i, ''));
    };
    const pp = plot(payment?.plotNo || payment?.houseNo);
    const pn = norm(payment?.ownerName || payment?.name || payment?.residentName);
    const pt = norm(payment?.residentType || payment?.type || 'Owner');
    const pid = norm(payment?.residentId);

    // H.No. + Resident Type is the safest join for Colony Fund. Historical
    // Firebase data contains duplicated Resident IDs, so never let an ID alone
    // override a clearly different house.
    let candidates = residentRows.filter(r => !pp || plot(r.plotNo || r.houseNo) === pp);
    if (pt && candidates.length > 1) {
        const byType = candidates.filter(r => norm(r.residentType || r.type) === pt);
        if (byType.length) candidates = byType;
    }
    if (pn && candidates.length > 1) {
        const byName = candidates.filter(r => norm(r.ownerName || r.name) === pn);
        if (byName.length) candidates = byName;
    }
    if (candidates.length === 1) return candidates[0];

    if (pid) {
        const byId = residentRows.filter(r => norm(r.residentId || r.id) === pid);
        if (byId.length === 1) return byId[0];
        if (pp) {
            const byIdHouse = byId.filter(r => plot(r.plotNo || r.houseNo) === pp);
            if (byIdHouse.length === 1) return byIdHouse[0];
        }
    }
    if (pn) {
        const byName = residentRows.filter(r => norm(r.ownerName || r.name) === pn);
        if (byName.length === 1) return byName[0];
    }
    return candidates[0] || null;
}

async function importDevelopmentFundRegisterIfNeeded(options={}) {
    if(options.manualMigration!==true) return;
    const migrationRole=String(RGMS.auth.getSession()?.role||'').trim();
    if (!['Admin','Treasurer'].includes(migrationRole) && !canColonyFund('add') && !canColonyFund('update')) return;

    try {
        await RGMS.store.refreshCollection(STORAGE_KEYS.SETTINGS, {retries: 2});
        const marker = getAllRecords(STORAGE_KEYS.SETTINGS).find(r => String(r.id || r.key) === DEVELOPMENT_FUND_REGISTER_IMPORT_ID);
        if (marker?.status === 'Completed') return;
    } catch (e) {
        console.warn('Colony Fund register migration marker check skipped:', e);
    }

    const response = await fetch(DEVELOPMENT_FUND_REGISTER_PATH, { cache: "no-store" });
    if (!response.ok) throw new Error("Colony Fund register data file could not be loaded.");
    const register = await response.json();
    const rows = Array.isArray(register.records) ? register.records : [];
    if (!rows.length) throw new Error("Colony Fund register contains no records.");

    await RGMS.store.refreshCollection(DF_STORAGE, {retries: 3});
    const residentRows = RGMS.store.getResidentMaster({includeVacant:true});
    const existing = getAllRecords(DF_STORAGE).map(normalizeColonyPayment);
    const upsertMap = new Map();
    const duplicateIds = new Set();
    let inserted = 0, updated = 0, reconciledNames = 0;

    const sourceIdentity = row => {
        const house=String(row?.plotNo||row?.houseNo||'').replace(/^2-1\//i,'').trim().toLowerCase();
        const period=String(row?.collectionPeriod||paymentPeriodKey(row)||'').slice(0,7);
        return `${house}::${period}`;
    };

    for (const sourceRow of rows) {
        const resident = findResidentForPayment(sourceRow, residentRows);
        const canonicalName = resident?.ownerName || resident?.name || sourceRow.ownerName || '';
        const row = {
            ...sourceRow,
            residentId: resident?.residentId || resident?.id || sourceRow.residentId || '',
            houseNo: resident?.houseNo || resident?.plotNo || sourceRow.houseNo || sourceRow.plotNo || '',
            plotNo: resident?.plotNo || resident?.houseNo || sourceRow.plotNo || '',
            ownerName: canonicalName,
            name: canonicalName,
            residentType: 'Owner',
            mobile: resident?.mobile?.[0] || resident?.whatsapp || sourceRow.mobile || '',
            phoneE164: resident?.phoneE164 || normalizePhone(resident?.mobile?.[0] || resident?.whatsapp || sourceRow.mobile || ''),
            financialYear: '2026-27',
            fundAmount: 500,
            amountPaid: 500,
            balance: 0,
            paymentStatus: 'Paid',
            paymentDate: '2026-09-07',
            remarks: '',
            updatedOn: new Date().toISOString()
        };
        const period = String(row.collectionPeriod || '').slice(0,7);
        const samePeriod = existing.filter(p =>
            String(paymentPeriodKey(p)) === period &&
            ((resident && paymentMatchesResident(p, resident)) ||
             (!resident && sourceIdentity(p) === sourceIdentity(row)))
        );

        if (samePeriod.length) {
            const primary = samePeriod[0];
            if (String(primary.ownerName||'') !== String(row.ownerName||'')) reconciledNames++;
            upsertMap.set(String(primary.id), { ...primary, ...row, id: primary.id, remarks:'' });
            samePeriod.slice(1).forEach(extra => { if(extra?.id) duplicateIds.add(String(extra.id)); });
            updated++;
        } else {
            const deterministicId = String(row.receiptNo || `CF-${String(row.plotNo||'').replace(/\D/g,'')}-${period.replace('-','')}`);
            upsertMap.set(deterministicId, { ...row, id: deterministicId, createdOn: new Date().toISOString() });
            inserted++;
        }
    }

    // Normalize every older Colony Fund record to the current Residents Master
    // so reports/history do not show abbreviations or stale spellings.
    for (const payment of existing) {
        if (!payment?.id || duplicateIds.has(String(payment.id)) || upsertMap.has(String(payment.id))) continue;
        const resident = findResidentForPayment(payment, residentRows);
        if (!resident) continue;
        const canonicalName = resident.ownerName || resident.name || '';
        const canonicalHouse = resident.houseNo || resident.plotNo || payment.houseNo || payment.plotNo || '';
        const needsName = canonicalName && String(payment.ownerName||'') !== String(canonicalName);
        const needsHouse = canonicalHouse && String(payment.houseNo||'') !== String(canonicalHouse);
        const needsPlot = resident.plotNo && String(payment.plotNo||'') !== String(resident.plotNo);
        const needsId = resident.residentId && String(payment.residentId||'') !== String(resident.residentId);
        const needsRemarks = String(payment.remarks||'') !== '';
        if (needsName || needsHouse || needsPlot || needsId || needsRemarks) {
            if(needsName) reconciledNames++;
            upsertMap.set(String(payment.id), {
                ...payment,
                id: payment.id,
                ownerName: canonicalName || payment.ownerName,
                name: canonicalName || payment.name || payment.ownerName,
                residentId: resident.residentId || payment.residentId,
                houseNo: canonicalHouse,
                plotNo: resident.plotNo || canonicalHouse,
                residentType: payment.residentType || 'Owner',
                remarks: ''
            });
        }
    }

    const upserts=[...upsertMap.values()];
    if (upserts.length) await RGMS.store.upsertRecords(DF_STORAGE, upserts);
    if (duplicateIds.size) await RGMS.store.deleteRecords(DF_STORAGE, [...duplicateIds]);
    await RGMS.store.refreshCollection(DF_STORAGE, {retries: 3});

    try {
        await RGMS.store.setRecord(STORAGE_KEYS.SETTINGS, DEVELOPMENT_FUND_REGISTER_IMPORT_ID, {
            key: DEVELOPMENT_FUND_REGISTER_IMPORT_ID,
            module: "Colony Fund",
            financialYear: "2026-27",
            source: "Colony Maintenance Payment Register supplied 2026-09-07",
            asOfDate: "2026-09-07",
            importedRecords: rows.length,
            insertedThisRun: inserted,
            updatedThisRun: updated,
            duplicateRowsRemoved: duplicateIds.size,
            residentNamesReconciled: reconciledNames,
            remarksPolicy: "Blank",
            importedOn: new Date().toISOString(),
            status: "Completed"
        });
    } catch (e) {
        console.warn('Unable to save Colony Fund migration marker:', e);
    }

    console.log(`Colony Fund register synchronized: ${inserted} inserted; ${updated} updated; ${duplicateIds.size} duplicates removed; ${reconciledNames} names reconciled.`);
}

async function ensureResidentsSeeded(options={}) {
    if(options.manualMigration!==true) return RGMS.store.getResidentMaster({includeVacant:true});
    const role = RGMS.auth.getSession()?.role;
    if (!['Admin','President','Secretary','Treasurer'].includes(role)) return RGMS.store.getResidentMaster({includeVacant:true});

    try {
        const response = await fetch('data/residents.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('Resident master data could not be loaded.');
        const packaged = await response.json();
        const seedRows = Array.isArray(packaged) ? packaged : [];
        const existing = RGMS.store.getResidentMaster({includeVacant:true});
        const existingKeys = new Set(existing.map(r => String(r.residentId || r.plotNo || r.id || '').trim()));
        let added = 0;

        for (const resident of seedRows) {
            const id = String(resident.residentId || resident.plotNo || '').trim();
            if (!id || existingKeys.has(id)) continue;
            await RGMS.store.insertRecord(STORAGE_KEYS.RESIDENTS, {
                ...resident,
                id,
                houseNo: resident.houseNo || resident.plotNo || ''
            });
            existingKeys.add(id);
            added++;
        }

        if (added > 0 || !existing.length) {
            await RGMS.store.refreshCollection(STORAGE_KEYS.RESIDENTS, {retries: 3});
        }
        return RGMS.store.getResidentMaster({includeVacant:true});
    } catch (error) {
        console.error('Resident master initialization failed:', error);
        throw new Error(`Resident master data could not be initialized: ${error.message || error}`);
    }
}

function canColonyFund(action='view'){const ra=window.RGMS?.roleAccess;if(ra?.isConfigured?.())return ra.can('colonyFund',action);return ['Admin','Treasurer'].includes(RGMS.auth.getSession()?.role);}
async function initializeDevelopmentFund() {
    rg170ApplyColonyDashboardLayout();
    // 1.2.169: Colony Fund must never remain on a loading-only screen.
    // Reveal the dashboard first, then populate from the current Firebase cache
    // and refresh from Firestore in the background.
    const status = document.getElementById('dfInitializationStatus');
    if (status) { status.textContent = ''; status.style.display = 'none'; }
    const dash = document.getElementById('dashboardContent');
    if (dash) { dash.classList.add('df-active'); dash.style.display = 'block'; }

    const safePeriod = () => {
        try { return typeof getCollectionPeriod === 'function' ? getCollectionPeriod() : new Date().toISOString().slice(0,7); }
        catch (_) { return new Date().toISOString().slice(0,7); }
    };
    const safeFY = () => {
        try { return typeof getFinancialYear === 'function' ? getFinancialYear() : String(new Date().getFullYear()); }
        catch (_) { return String(new Date().getFullYear()); }
    };
    const applyData = () => {
        try {
            residents = colonyResidentMasterCompat().slice()
              .sort((a,b)=>String(a.ownerName||a.name||a.houseNo||'').localeCompare(String(b.ownerName||b.name||b.houseNo||''),undefined,{numeric:true,sensitivity:'base'}));
        } catch (_) { residents = residents || []; }
        try { payments = (getAllRecords(DF_STORAGE) || []).map(normalizeColonyPayment); }
        catch (_) { payments = payments || []; }
    };
    const paint = () => {
        try { updateDashboard(); } catch (e) { console.warn('Colony Fund dashboard paint skipped', e); }
        try { loadPaymentHistory(); } catch (e) { console.warn('Colony Fund history paint skipped', e); }
        try { loadPendingResidents(); } catch (e) { console.warn('Colony Fund pending paint skipped', e); }
    };

    currentFinancialYear = safeFY();
    currentCollectionPeriod = safePeriod();
    selectedDashboardFY = currentFinancialYear;
    selectedDashboardMonth = currentCollectionPeriod;

    // 1.2.197 / 4.5.40: force one authoritative Firebase refresh before the first
    // Colony Fund calculation. Older cached module URLs could leave this screen with
    // an empty resident/payment cache and every card at zero even though the
    // Association Dashboard already had data.
    try {
        const refreshResults=await Promise.allSettled([
          RGMS.store.loadCollection(STORAGE_KEYS.RESIDENTS,{retries:3,ttlMs:10000}),
          RGMS.store.loadCollection(DF_STORAGE,{retries:3,ttlMs:10000}),
          RGMS.store.loadCollection(STORAGE_KEYS.EXPENDITURES,{retries:2,ttlMs:10000})
        ]);
        let residentFailure=refreshResults[0]?.status==='rejected';
        if(!residentFailure && !RGMS.store.getResidentMaster({includeVacant:true}).length){
          // A first-open request can occasionally have started during auth restore.
          // Force one second read before painting so a browser refresh is never required.
          try { await RGMS.store.refreshCollection(STORAGE_KEYS.RESIDENTS,{retries:3}); }
          catch (retryError) { residentFailure=true; console.warn('Residents Master forced retry failed',retryError); }
        }
        if(residentFailure || !RGMS.store.getResidentMaster({includeVacant:true}).length){
          const msg='Unable to load Residents Master from Firebase. Colony Fund totals cannot be calculated.';
          if(status){status.style.display='block';status.textContent=msg;status.classList.add('error');}
          console.error(msg,refreshResults[0]?.reason);
        }
    } catch (e) { console.warn('Colony Fund authoritative refresh skipped', e); }

    // v1.2.284 one-time synchronization from the owner payment register supplied
    // on 2026-09-07. It is marker-protected and runs only for roles that already
    // have Colony Fund add/update permission.
    try { await importDevelopmentFundRegisterIfNeeded({manualMigration:true}); }
    catch (e) { console.warn('Colony Fund 2026-27 register synchronization skipped', e); }

    try { applyData(); } catch (e) { console.warn('Colony Fund cached data unavailable', e); }
    try { bindEvents(); } catch (e) { console.warn('Colony Fund event binding skipped', e); }
    try { populateFinancialYearSelectors(); } catch (_) {}
    try { populateResidentDropdown(); } catch (_) {}
    try { generateReceiptNumber(); } catch (_) {}
    try { clearForm(); } catch (_) {}
    try { applyFinancePermissions(); } catch (_) {}
    try { openTab('dashboard'); } catch (_) {
        if (dash) { dash.classList.add('df-active'); dash.style.display = 'block'; }
    }
    paint();
    rg170ApplyColonyDashboardLayout();
    requestAnimationFrame(rg170ApplyColonyDashboardLayout);
    setTimeout(rg170ApplyColonyDashboardLayout,120);
    // Data was loaded once above through the shared store. Navigation, app-start
    // preload and this initializer now share the same in-flight Firebase request,
    // so do not issue duplicate forced reads or delayed repaint timers here.
}

function monthLabel(period){
    const key=String(period||'');
    if(!/^\d{4}-\d{2}$/.test(key)) return key;
    const [y,m]=key.split('-').map(Number);
    return new Date(y,m-1,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'});
}

function populateDashboardFilters(){
    const fyEl=document.getElementById('dfDashboardFinancialYear');
    const monthEl=document.getElementById('dfDashboardMonth');
    const fys=getFinancialYearOptions(6);
    if(fyEl){
        fyEl.innerHTML=fys.map(fy=>`<option value="${fy}">${fy}</option>`).join('');
        fyEl.value=selectedDashboardFY||getFinancialYear();
    }
    const fyStart=Number(String(selectedDashboardFY||getFinancialYear()).slice(0,4));
    if(monthEl){
        const rows=Array.from({length:12},(_,i)=>{const d=new Date(fyStart,3+i,1);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;return {key,label:monthLabel(key)};});
        monthEl.innerHTML=rows.map(r=>`<option value="${r.key}">${r.label}</option>`).join('');
        const current=getCollectionPeriod();
        const currentInFY=rows.some(r=>r.key===current);
        monthEl.value=(currentInFY?current:rows[0].key);
        selectedDashboardMonth=monthEl.value;
    }
}

function onDashboardFYChange(e){
    selectedDashboardFY=String(e?.target?.value||getFinancialYear());
    const fyStart=Number(selectedDashboardFY.slice(0,4));
    const rows=Array.from({length:12},(_,i)=>{const d=new Date(fyStart,3+i,1);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;return {key,label:monthLabel(key)};});
    const monthEl=document.getElementById('dfDashboardMonth');
    if(monthEl){monthEl.innerHTML=rows.map(r=>`<option value="${r.key}">${r.label}</option>`).join('');}
    const current=getCollectionPeriod();
    selectedDashboardMonth=rows.some(r=>r.key===current)?current:rows[0].key;
    if(monthEl) monthEl.value=selectedDashboardMonth;
    updateDashboard();
}

function onDashboardMonthChange(e){
    selectedDashboardMonth=String(e?.target?.value||getCollectionPeriod());
    updateDashboard();
}

function colonyMonthsForFY(fy) {
    const start = Number(String(fy || '').slice(0,4));
    if (!start) return [];
    return Array.from({length:12}, (_,i) => {
        const d = new Date(start, 3 + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        return { key, label: d.toLocaleDateString('en-IN',{month:'long',year:'numeric'}) };
    });
}

function populateMonthSelector(id, fy, preferred) {
    const el = document.getElementById(id); if (!el) return;
    const rows = colonyMonthsForFY(fy);
    el.innerHTML = rows.map(r => `<option value="${r.key}">${r.label}</option>`).join('');
    const current = String(preferred || currentCollectionPeriod || getCollectionPeriod()).slice(0,7);
    el.value = rows.some(r=>r.key===current) ? current : (rows[0]?.key || '');
}

function populateFinancialYearSelectors() {
    const options = getFinancialYearOptions(6);
    const payFY = document.getElementById("dfPaymentFinancialYear");
    if(payFY){payFY.innerHTML=options.map(y=>`<option value="${y}">${y}</option>`).join("");payFY.value=currentFinancialYear;}
    const histFY = document.getElementById("dfHistoryFinancialYear");
    if(histFY){histFY.innerHTML='<option value="">All Financial Years</option>'+options.map(y=>`<option value="${y}">${y}</option>`).join("");histFY.value='';}
    populateMonthSelector('dfPaymentMonth', currentFinancialYear, currentCollectionPeriod);
    const histMonth=document.getElementById('dfHistoryMonth');
    if(histMonth){histMonth.innerHTML='<option value="">All Months</option>';histMonth.value='';}
}

function onFinancialYearChange(e) {
    currentFinancialYear = String(e?.target?.value || "").trim();
    const payment = document.getElementById("dfPaymentFinancialYear");
    if (payment) payment.value = currentFinancialYear;
    payments = getAllRecords(DF_STORAGE).map(normalizeColonyPayment);
    updateDashboard();
    loadPaymentHistory();
    loadPendingResidents();
}

function onPaymentFinancialYearChange(e) {
    currentFinancialYear = String(e?.target?.value || "").trim();
    const dashboard = document.getElementById("dfFinancialYear");
    if (dashboard) dashboard.value = currentFinancialYear;
    populateMonthSelector('dfPaymentMonth', currentFinancialYear, currentCollectionPeriod);
    payments = getAllRecords(DF_STORAGE).map(normalizeColonyPayment);
    updateDashboard();
    loadPendingResidents();
}

function onHistoryFinancialYearChange(e) {
    const fy = String(e?.target?.value || '').trim();
    const el=document.getElementById('dfHistoryMonth');
    if(el){
      if(!fy){el.innerHTML='<option value="">All Months</option>';el.value='';}
      else {populateMonthSelector('dfHistoryMonth',fy,'');el.insertAdjacentHTML('afterbegin','<option value="">All Months</option>');el.value='';}
    }
    loadPaymentHistory();
}

function onHistoryMonthChange() { loadPaymentHistory(); }

function applyFinancePermissions() {
    const permissions={btnSave:'add',btnUpdate:'update',btnDelete:'delete'};
    Object.entries(permissions).forEach(([id,action])=>{const el=document.getElementById(id);if(el)el.disabled=!canColonyFund(action);});
}

function bindColonyDashboardDelegation() {
    const module=document.getElementById('developmentFundModule');
    if(!module || module.dataset.rgColonyDrillBound==='1') return;
    module.dataset.rgColonyDrillBound='1';
    module.addEventListener('click', e => {
        const target=e.target.closest('[data-colony-dashboard]');
        if(!target || !module.contains(target)) return;
        e.preventDefault();
        e.stopPropagation();
        openColonyDashboardDetail(target.dataset.colonyDashboard, target.dataset.colonyPeriod || 'month');
    });
    module.addEventListener('keydown', e => {
        const target=e.target.closest('[data-colony-dashboard]');
        if(!target || !module.contains(target) || (e.key!=='Enter' && e.key!==' ')) return;
        e.preventDefault();
        e.stopPropagation();
        openColonyDashboardDetail(target.dataset.colonyDashboard, target.dataset.colonyPeriod || 'month');
    });
}

function bindEvents() {
    document.getElementById("btnSave")?.addEventListener("click", savePayment);
    document.getElementById("btnUpdate")?.addEventListener("click", updatePayment);
    document.getElementById("btnDelete")?.addEventListener("click", deleteSelectedPayment);
    document.getElementById("btnClear")?.addEventListener("click", clearForm);
    document.getElementById("btnPrint")?.addEventListener("click", printReceipt);
    document.getElementById("cmbResidentName")?.addEventListener("change", loadResidentDetailsByName);
    document.getElementById("txtAmountPaid")?.addEventListener("input", calculateBalance);
    document.getElementById("txtFundAmount")?.addEventListener("input", calculateBalance);
    document.getElementById("dfFinancialYear")?.addEventListener("change", onFinancialYearChange);
    document.getElementById("dfPaymentFinancialYear")?.addEventListener("change", onPaymentFinancialYearChange);
    document.getElementById("dfHistoryFinancialYear")?.addEventListener("change", onHistoryFinancialYearChange);
    document.getElementById("dfHistoryMonth")?.addEventListener("change", onHistoryMonthChange);
    document.getElementById("dfDashboardFinancialYear")?.addEventListener("change", onDashboardFYChange);
    document.getElementById("dfDashboardMonth")?.addEventListener("change", onDashboardMonthChange);
    bindColonyDashboardDelegation();
    document.getElementById("colonyDashboardDetailClose")?.addEventListener("click", closeColonyDashboardDetail);
}


function closeColonyDashboardDetail(){
    const sec=document.getElementById('colonyDashboardDetail');
    if(sec){sec.style.display='none';sec.classList.remove('dashboard-dropdown-open','rg-filter-overlay');}
    document.getElementById('developmentFundModule')?.classList.remove('colony-drill-open');
}
function showColonyDashboardDetail(){
    const sec=document.getElementById('colonyDashboardDetail');
    if(!sec)return;
    sec.style.display='block';
    sec.classList.add('dashboard-dropdown-open');
    document.getElementById('developmentFundModule')?.classList.add('colony-drill-open');
    try{sec.scrollTo({top:0,behavior:'smooth'});}catch(_){sec.scrollTop=0;}
}

function colonyResidentMasterCompat(){
    // Start with the normalized Residents Master, but also merge the raw Firebase
    // resident cache by person identity. Historical data contains duplicated legacy
    // Resident IDs; merging by Name + H.No. + Resident Type ensures a valid resident
    // (including Pavan Alapati) is not lost from Colony Fund registers/dropdowns.
    let normalized=[];
    let raw=[];
    try { normalized=(RGMS?.store?.getResidentMaster?.({includeVacant:true})||[]).slice(); } catch (_) {}
    try { raw=(getAllRecords(STORAGE_KEYS.RESIDENTS)||[]).map(r=>normalizeColonyResident(r)).filter(Boolean); } catch (_) {}
    const out=[];
    const seen=new Set();
    const personKey=r=>[r?.ownerName||r?.name||'',r?.houseNo||r?.plotNo||'',r?.residentType||'Owner']
      .map(v=>String(v||'').replace(/\s+/g,' ').trim().toLowerCase()).join('::');
    [...normalized,...raw].forEach(r=>{
      if(!r) return;
      const key=personKey(r);
      if(!key || seen.has(key)) return;
      seen.add(key); out.push(r);
    });
    return out.sort((a,b)=>String(a.ownerName||a.name||'').localeCompare(String(b.ownerName||b.name||''),'en',{sensitivity:'base',numeric:true})||String(a.houseNo||a.plotNo||'').localeCompare(String(b.houseNo||b.plotNo||''),undefined,{numeric:true}));
}
function normalizeColonyResident(row){
    const r={...(row||{})};
    const field=(names)=>colonyField(r,names);
    const rawHouse=field(['houseNo','HouseNo','House No','H.No.','H.No','plotNo','PlotNo','Plot No','plotNumber']);
    const house=typeof window.formatHNo==='function' ? window.formatHNo(rawHouse||'') : String(rawHouse||'').trim();
    return {
      ...r,
      residentId: field(['residentId','ResidentId','Resident ID','Resident Id','id','ID'])||r.residentId||r.id||'',
      houseNo: house,
      plotNo: field(['plotNo','PlotNo','Plot No'])||house,
      ownerName: field(['ownerName','OwnerName','Owner Name','name','Name','residentName','Resident Name'])||'',
      name: field(['name','Name','residentName','Resident Name','ownerName','Owner Name'])||'',
      residentType: field(['residentType','ResidentType','Resident Type','type','Type'])||'Owner',
      occupationStatus: field(['occupationStatus','Occupation Status','occupancyStatus','status','Status'])||''
    };
}
function colonyDashboardResidents(){
    // Colony Fund eligibility is Resident Type = Owner only, for every
    // Occupation Status. Tenant and Family Member records are excluded.
    const source=(residents&&residents.length?residents:colonyResidentMasterCompat());
    return source.filter(isOwnerResident);
}
function colonyIsPaid(p){
    const st=String(p?.paymentStatus||'').trim().toLowerCase();
    return st==='paid' || (!st && colonyAmountPaid(p)>=DEFAULT_FUND_AMOUNT);
}
function colonyCurrentPaidResidents(){
    const houses=colonyDashboardResidents();
    const period=String(currentCollectionPeriod||getCollectionPeriod()).slice(0,7);
    return houses.filter(r=>payments.some(p=>paymentMatchesResident(p,r) && colonyIsPaid(p) && (!paymentPeriodKey(p)||paymentPeriodKey(p)===period)));
}
function openColonyDashboardDetail(kind, periodScope='fy'){
    const sec=document.getElementById('colonyDashboardDetail'), title=document.getElementById('colonyDashboardDetailTitle');
    const head=document.getElementById('colonyDashboardDetailHead'), body=document.getElementById('colonyDashboardDetailBody');
    if(!sec||!head||!body)return;
    const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const all=colonyDashboardResidents();
    let months=rgmsDevelopmentFundMonths();
    const currentMonth=String(selectedDashboardMonth||currentCollectionPeriod||getCollectionPeriod()).slice(0,7);
    if(periodScope==='month') months=[currentMonth];
    const monthName=k=>{const [y,m]=String(k).split('-').map(Number);return new Date(y,m-1,1).toLocaleDateString('en-IN',{month:'short',year:'numeric'});};
    const paidFor=(r,m)=>payments.filter(p=>paymentMatchesResident(p,r)&&paymentPeriodKey(p)===m).reduce((a,p)=>a+colonyAmountPaid(p),0);
    if(kind==='expenditure'||kind==='balance'){
      const isColonyExpense=r=>{const f=String(r.expenditureVariant||r.fundType||r.fund||r.variant||r.module||r.expenseType||'').toLowerCase();return f.includes('colony')||f.includes('development')||f.includes('maintenance');};
      const monthOf=r=>String(r?.date||r?.expenseDate||r?.paymentDate||r?.createdOn||'').slice(0,7);
      const expRows=getAllRecords(STORAGE_KEYS.EXPENDITURES).filter(isColonyExpense).filter(r=>months.includes(monthOf(r)));
      const totalExp=expRows.reduce((a,r)=>a+Number(r.amount||r.totalAmount||0),0);
      const collected=payments.filter(p=>months.includes(paymentPeriodKey(p))).reduce((a,p)=>a+colonyAmountPaid(p),0);
      const sb=document.getElementById('colonyFilteredSummary');if(sb){sb.innerHTML='';sb.style.display='none';}
      if(kind==='balance'){
        head.innerHTML='<tr><th>S.No.</th><th>Month</th><th>Contributed Colony Fund</th><th>Colony Expenditure</th><th>Balance</th></tr>';
        let running=0;
        body.innerHTML=months.map((m,i)=>{const contributed=payments.filter(p=>paymentPeriodKey(p)===m).reduce((a,p)=>a+colonyAmountPaid(p),0);const expenditure=expRows.filter(r=>monthOf(r)===m).reduce((a,r)=>a+Number(r.advancePaid??r.paidAmount??r.amountPaid??((String(r.paymentStatus||'').toLowerCase()==='paid')?(r.amountCommitted??r.amount??r.totalAmount??0):0)),0);running+=contributed-expenditure;return `<tr><td>${i+1}</td><td>${monthName(m)}</td><td>${formatCurrency(contributed)}</td><td>${formatCurrency(expenditure)}</td><td>${formatCurrency(running)}</td></tr>`;}).join('');
        if(title)title.textContent='Colony Fund Balance – Month-wise Register';
      }else{
        head.innerHTML='<tr><th>S.No.</th><th>Date</th><th>Description</th><th>Amount</th><th>Advance</th><th>Balance to be paid</th></tr>';
        body.innerHTML=expRows.map((r,i)=>{const committed=Number(r.amountCommitted??r.amount??r.totalAmount??0)||0;const advance=Number(r.advancePaid??r.advance??r.paidAmount??r.amountPaid??((String(r.paymentStatus||'').toLowerCase()==='paid')?committed:0))||0;return `<tr><td>${i+1}</td><td>${esc(r.date||r.expenseDate||'')}</td><td>${esc(r.description||r.particulars||'')}</td><td>${formatCurrency(committed)}</td><td>${formatCurrency(advance)}</td><td>${formatCurrency(Math.max(0,committed-advance))}</td></tr>`;}).join('')||'<tr><td colspan="6" class="empty">No Colony Fund expenditure records.</td></tr>';
        if(title)title.textContent='Colony Fund Expenditure Register';
      }
      showColonyDashboardDetail();return;
    }
    if(kind==='total'){
      const houseRows=rgmsDevelopmentTotalHouseRows();
      if(title)title.textContent='Total Houses';
      head.innerHTML='<tr><th>S.No.</th><th>Name</th><th>H.No.</th><th>Occupation</th></tr>';
      body.innerHTML=houseRows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.ownerName||r.name||'')}</td><td>${esc(formatHNo(r.houseNo||r.plotNo||''))}</td><td>${esc(r.occupationStatus||r.status||r.residentType||'')}</td></tr>`).join('')||'<tr><td colspan="4" class="empty">No matching records found.</td></tr>';
      showColonyDashboardDetail();return;
    }
    const mode=kind==='expected'?'Expected':kind==='collected'?'Contributed':'Pending';
    if(title)title.textContent=mode+' Colony Fund – Month-wise Register';
    head.innerHTML='<tr><th>S.No.</th><th>Name</th><th>H.No.</th>'+months.map(m=>`<th>${monthName(m)}</th>`).join('')+'<th>Total Amount</th></tr>';
    const detailRows=all.map(r=>{let total=0;const values=months.map(m=>{const matching=payments.filter(p=>paymentMatchesResident(p,r)&&paymentPeriodKey(p)===m);const paidAmount=matching.reduce((a,p)=>a+colonyAmountPaid(p),0);const paid=matching.some(colonyIsPaid)||paidAmount>=Number(window.RGMS?.DEFAULT_FUND_AMOUNT||500);let v=Number(window.RGMS?.DEFAULT_FUND_AMOUNT||500);if(kind==='collected')v=paid?Number(window.RGMS?.DEFAULT_FUND_AMOUNT||500):0;else if(kind==='pending')v=paid?0:Number(window.RGMS?.DEFAULT_FUND_AMOUNT||500);total+=v;return v;});return {r,values,total};}).filter(x=>kind==='expected'||x.total>0);
    body.innerHTML=detailRows.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.r.ownerName||x.r.name||'')}</td><td>${esc(formatHNo(x.r.houseNo||x.r.plotNo||''))}</td>${x.values.map(v=>`<td>${formatCurrency(v)}</td>`).join('')}<td>${formatCurrency(x.total)}</td></tr>`).join('')||'<tr><td colspan="20" class="empty">No matching records found.</td></tr>';
    showColonyDashboardDetail();
}

window.closeColonyDashboardDetail=closeColonyDashboardDetail;
window.openColonyDashboardDetail=openColonyDashboardDetail;

function openTab(tabName) {
    document.querySelectorAll(".df-tab").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".df-tab-content").forEach(page => {
        page.classList.remove("df-active");
        page.style.display = "none";
    });

    document.getElementById(tabName + "Tab")?.classList.add("active");
    const page = document.getElementById(tabName + "Content");
    if (page) {
        page.classList.add("df-active");
        page.style.display = "block";
    }
}

window.openTab = openTab;

function colonyResidentSelectionKey(r){
    const doc=String(r?.residentDocId||r?.docId||r?.documentId||'').trim();
    if(doc) return `doc::${doc}`;
    return ['person',r?.houseNo||r?.plotNo||'',r?.residentType||'',r?.ownerName||r?.name||'',r?.residentId||r?.id||'']
      .map(v=>String(v||'').replace(/\s+/g,' ').trim().toLowerCase()).join('::');
}
if(!window.__rgColonyResidentSync){window.__rgColonyResidentSync=true;window.addEventListener('rgms:resident-directory-changed',()=>{try{residents=colonyResidentMasterCompat().slice();populateResidentDropdown();populateIntegratedSelectors();}catch(e){console.warn('Colony Fund resident dropdown refresh failed',e);}});}
function populateResidentDropdown() {
    const name = document.getElementById("cmbResidentName");
    if (!name) return;
    const rows = residents.filter(isOwnerResident).slice().sort((a,b)=>String(a.ownerName||a.name||'').localeCompare(String(b.ownerName||b.name||''), 'en', {sensitivity:'base',numeric:true})||String(a.houseNo||a.plotNo||'').localeCompare(String(b.houseNo||b.plotNo||''),undefined,{numeric:true}));
    name.innerHTML = '<option value="">Select Name</option>' + rows.map(r=>`<option value="${escHtml(colonyResidentSelectionKey(r))}">${escHtml(r.ownerName || r.name || 'Resident')}</option>`).join('');
}

function findResidentFromNameSelection() {
    const value = document.getElementById("cmbResidentName")?.value || '';
    return residents.find(r => colonyResidentSelectionKey(r) === String(value));
}

function loadResidentDetails() {
    loadResidentDetailsByName();
}

function loadResidentDetailsByName() {
    const resident = findResidentFromNameSelection();
    if (!resident) return;
    const ownerName = document.getElementById("txtOwnerName");
    if (ownerName) ownerName.value = resident.ownerName || "";
    const mobile = document.getElementById("txtMobileNumber");
    if (mobile) mobile.value = resident.mobile?.[0] || resident.whatsapp || resident.phoneE164 || "";
    const fund = document.getElementById("txtFundAmount");
    if (fund) fund.value = DEFAULT_FUND_AMOUNT;
    calculateBalance();
    const selectedFY = document.getElementById('dfPaymentFinancialYear')?.value || currentFinancialYear;
    const selectedMonth = document.getElementById('dfPaymentMonth')?.value || currentCollectionPeriod;
    const existing = payments.find(p => paymentFinancialYear(p) === String(selectedFY) && String(p.collectionPeriod || paymentPeriodKey(p) || '') === String(selectedMonth || '') && paymentMatchesResident(p, resident));
    if (existing && !currentPayment) {
        currentPayment = existing;
        document.getElementById("txtReceiptNo").value = existing.receiptNo || '';
        document.getElementById("txtAmountPaid").value = existing.amountPaid || 0;
        document.getElementById("txtBalance").value = existing.balance || Math.max(0, DEFAULT_FUND_AMOUNT - Number(existing.amountPaid||0));
        document.getElementById("cmbPaymentStatus").value = existing.paymentStatus || 'Pending';
        document.getElementById("dtPaymentDate").value = existing.paymentDate || new Date().toISOString().slice(0,10);
        document.getElementById("cmbPaymentMode").value = existing.paymentMode || 'Cash';
        document.getElementById("txtTransactionNo").value = existing.transactionNo || '';
        document.getElementById("txtRemarks").value = '';
    }
}


function generateReceiptNumber() {
    const year = new Date().getFullYear();
    const next = payments.length + 1;
    const input = document.getElementById("txtReceiptNo");
    if (input) input.value = `RGRWA-${year}-${String(next).padStart(4,"0")}`;
}

function calculateBalance() {
    const fund = Number(document.getElementById("txtFundAmount")?.value || 0);
    const paid = Number(document.getElementById("txtAmountPaid")?.value || 0);
    document.getElementById("txtBalance").value = Math.max(0, fund - paid);
}

async function savePayment() {
    // The form Save button also updates a record selected from the grid.
    if (currentPayment?.id) { await updatePayment(); return; }

    if (!canColonyFund('add')) {
        alert("Colony Fund add permission has not been assigned to this role.");
        return;
    }

    const resident = findResidentFromNameSelection();
    if (!resident) { alert("Please select Name."); return; }

    const plotNo = String(resident.plotNo);
    if (!resident) { alert("Resident not found."); return; }

    if (!isOwnerResident(resident)) { alert("Colony Fund can only be collected from Owners."); return; }
    const fundAmount = Number(document.getElementById("txtFundAmount").value || 0);
    const amountPaid = Number(document.getElementById("txtAmountPaid").value || 0);

    if (amountPaid <= 0) { alert("Please enter Amount Paid."); return; }
    if (amountPaid > fundAmount) { alert("Amount Paid cannot exceed Fund Amount."); return; }

    const payment = {
        receiptNo: document.getElementById("txtReceiptNo").value,
        plotNo: String(plotNo),
        houseNo: resident.houseNo || resident.plotNo,
        residentId: resident.residentId || resident.plotNo || "",
        residentType: resident.residentType || "Owner",
        ownerName: resident.ownerName,
        mobile: resident.mobile?.[0] || resident.whatsapp || "",
        phoneE164: normalizePhone(resident.mobile?.[0] || resident.whatsapp || ""),
        financialYear: document.getElementById("dfPaymentFinancialYear")?.value || currentFinancialYear,
        collectionPeriod: document.getElementById("dfPaymentMonth")?.value || currentCollectionPeriod,
        fundAmount,
        amountPaid,
        balance: Math.max(0, fundAmount - amountPaid),
        paymentStatus: document.getElementById("cmbPaymentStatus")?.value || (amountPaid >= fundAmount ? "Paid" : "Pending"),
        paymentDate: document.getElementById("dtPaymentDate").value,
        paymentMode: document.getElementById("cmbPaymentMode").value,
        transactionNo: document.getElementById("txtTransactionNo").value.trim(),
        remarks: "",
        createdOn: new Date().toISOString(),
        createdBy: RGMS.auth.getSession()?.role || ""
    };

    try {
        const id = await insertRecord(DF_STORAGE, payment);
        await refreshColonyAfterCrud(id);
        colonyUserMessage('Colony Fund payment saved successfully.');

        if (confirm("Payment saved. Print receipt now?")) {
            RGMS.receipt.printDevelopmentFundReceipt(payment);
        }

        if (payment.mobile) {
            const msg = RGMS.communication.buildAcknowledgement(payment);
            if (confirm("Open WhatsApp acknowledgement for the resident?")) {
                RGMS.communication.openWhatsAppComposer(payment.mobile, msg, "WhatsApp acknowledgement");
                await RGMS.communication.logCommunication({
                    plotNo: payment.plotNo,
                    residentName: payment.ownerName,
                    mobile: payment.mobile,
                    module: "Colony Fund",
                    type: "Acknowledgement",
                    status: "Opened"
                });
            }
        }

        clearForm();
        generateReceiptNumber();
    } catch (error) {
        console.error(error);
        colonyUserMessage(colonyFriendlyError(error,'Unable to save Colony Fund payment. Please try again.'),true);
    }
}

async function updatePayment() {
    if (!currentPayment?.id) {
        alert("Select a payment from Payment History first.");
        return;
    }

    if (!canColonyFund('update')) {
        alert("Colony Fund update permission has not been assigned to this role.");
        return;
    }

    const updated = {
        ...currentPayment,
        financialYear: document.getElementById("dfPaymentFinancialYear")?.value || currentFinancialYear,
        collectionPeriod: document.getElementById("dfPaymentMonth")?.value || currentCollectionPeriod,
        amountPaid: Number(document.getElementById("txtAmountPaid").value || 0),
        paymentStatus: document.getElementById("cmbPaymentStatus")?.value || (Number(document.getElementById("txtAmountPaid").value || 0) >= Number(document.getElementById("txtFundAmount").value || 0) ? "Paid" : "Pending"),
        balance: Math.max(0,
            Number(document.getElementById("txtFundAmount").value || 0) -
            Number(document.getElementById("txtAmountPaid").value || 0)),
        paymentDate: document.getElementById("dtPaymentDate").value,
        paymentMode: document.getElementById("cmbPaymentMode").value,
        transactionNo: document.getElementById("txtTransactionNo").value.trim(),
        remarks: "",
        updatedOn: new Date().toISOString()
    };

    try {
        const updateId=currentPayment.id;
        await RGMS.store.setRecord(DF_STORAGE, updateId, updated);
        await refreshColonyAfterCrud(updateId);
        colonyUserMessage('Colony Fund payment updated successfully.');
    } catch (e) {
        console.error(e);
        colonyUserMessage(colonyFriendlyError(e,'Unable to update Colony Fund payment. Please try again.'),true);
    }
}

function selectPayment(idOrIndex) {
    const payment = payments.find(p => String(p.id) === String(idOrIndex)) || payments[Number(idOrIndex)];
    if (!payment) return;
    currentPayment = payment;

    document.getElementById("txtReceiptNo").value = payment.receiptNo || "";
    const payFY = paymentFinancialYear(payment) || currentFinancialYear;
    const fyEl = document.getElementById('dfPaymentFinancialYear');
    if (fyEl) {if(![...fyEl.options].some(o=>o.value===payFY))fyEl.insertAdjacentHTML('beforeend',`<option value="${payFY}">${payFY}</option>`);fyEl.value = payFY;}
    populateMonthSelector('dfPaymentMonth', payFY, paymentPeriodKey(payment));
    const resident = residents.find(r => paymentMatchesResident(payment, r));
    document.getElementById("cmbResidentName").value = colonyResidentSelectionKey(resident);
    loadResidentDetailsByName();
    document.getElementById("txtAmountPaid").value = payment.amountPaid || 0;
    document.getElementById("txtBalance").value = payment.balance || 0;
    document.getElementById("cmbPaymentStatus").value = payment.paymentStatus || (Number(payment.amountPaid || 0) >= Number(payment.fundAmount || DEFAULT_FUND_AMOUNT) ? "Paid" : "Pending");
    document.getElementById("dtPaymentDate").value = payment.paymentDate || "";
    document.getElementById("cmbPaymentMode").value = payment.paymentMode || "Cash";
    document.getElementById("txtTransactionNo").value = payment.transactionNo || "";
    document.getElementById("txtRemarks").value = "";
    openTab("payment");
}

window.selectPayment = selectPayment;

async function deleteSelectedPayment() {
    if (!currentPayment?.id) {
        alert("Select a payment from Payment History first.");
        return;
    }
    if (!canColonyFund('delete')) {
        alert("Colony Fund delete permission has not been assigned to this role.");
        return;
    }
    if (!confirm(`Delete receipt ${currentPayment.receiptNo}?`)) return;

    try{
      await RGMS.store.deleteRecord(DF_STORAGE, currentPayment.id);
      currentPayment = null;
      await refreshColonyAfterCrud();
      colonyUserMessage('Colony Fund payment deleted successfully.');
      clearForm();
      generateReceiptNumber();
    }catch(e){console.error(e);colonyUserMessage(colonyFriendlyError(e,'Unable to delete Colony Fund payment. Please try again.'),true);}
}

async function deletePaymentById(id) {
    const payment = payments.find(p => String(p.id) === String(id));
    if (!payment) return;
    if (!canColonyFund('delete')) {
        alert("Colony Fund delete permission has not been assigned to this role.");
        return;
    }
    if (!confirm(`Delete receipt ${payment.receiptNo || ""}?`)) return;
    try{
      await RGMS.store.deleteRecord(DF_STORAGE, id);
      if (String(currentPayment?.id) === String(id)) currentPayment = null;
      await refreshColonyAfterCrud();
      colonyUserMessage('Colony Fund payment deleted successfully.');
      clearForm();
      generateReceiptNumber();
    }catch(e){console.error(e);colonyUserMessage(colonyFriendlyError(e,'Unable to delete Colony Fund payment. Please try again.'),true);}
}
window.deletePaymentById = deletePaymentById;


function colonyField(row, names){
    if(!row||typeof row!=="object") return "";
    for(const n of names){if(row[n]!==undefined&&row[n]!==null&&String(row[n]).trim()!=="") return row[n];}
    const wanted=names.map(n=>String(n).toLowerCase().replace(/[\s_.-]/g,""));
    for(const k of Object.keys(row)){const nk=String(k).toLowerCase().replace(/[\s_.-]/g,"");if(wanted.includes(nk)&&row[k]!==undefined&&row[k]!==null&&String(row[k]).trim()!=="")return row[k];}
    return "";
}
function colonyAmountPaid(row){return Number(colonyField(row,['amountPaid','Amount Paid','paidAmount','Paid Amount','amount','Amount','paymentAmount','Payment Amount'])||0);}
function colonyFundAmount(row){return Number(colonyField(row,['fundAmount','Fund Amount','expectedAmount','Expected Amount','monthlyAmount'])||DEFAULT_FUND_AMOUNT);}
function normalizeColonyPayment(row){
    const r={...(row||{})};
    r.residentId=colonyField(r,['residentId','ResidentId','Resident ID','Resident Id'])||r.residentId||'';
    r.houseNo=colonyField(r,['houseNo','HouseNo','House No','H.No.','H.No','plotNo','PlotNo','Plot No'])||'';
    r.plotNo=colonyField(r,['plotNo','PlotNo','Plot No','houseNo','HouseNo','House No'])||'';
    r.ownerName=colonyField(r,['ownerName','OwnerName','Owner Name','name','Name','residentName'])||'';
    r.residentType=colonyField(r,['residentType','ResidentType','Resident Type','type','Type'])||r.residentType||'';
    r.amountPaid=colonyAmountPaid(r);
    r.fundAmount=colonyFundAmount(r);
    r.paymentDate=colonyField(r,['paymentDate','PaymentDate','Payment Date','dateOfPayment','Date of Payment','date','Date','createdOn'])||'';
    r.collectionPeriod=colonyField(r,['collectionPeriod','CollectionPeriod','Collection Period','monthKey','MonthKey','month','Month','paymentMonth'])||'';
    if(/^\d{4}-\d{2}-\d{2}/.test(String(r.collectionPeriod))) r.collectionPeriod=String(r.collectionPeriod).slice(0,7);
    if(!/^\d{4}-\d{2}$/.test(String(r.collectionPeriod)) && /^\d{4}-\d{2}/.test(String(r.paymentDate))) r.collectionPeriod=String(r.paymentDate).slice(0,7);
    r.financialYear=colonyField(r,['financialYear','FinancialYear','Financial Year','fy','FY'])||r.financialYear||'';
    r.paymentStatus=colonyField(r,['paymentStatus','PaymentStatus','Payment Status','status','Status'])||r.paymentStatus||'';
    r.receiptNo=colonyField(r,['receiptNo','ReceiptNo','Receipt No','receiptNumber'])||r.receiptNo||r.id||'';
    r.remarks='';
    return r;
}

function paymentFinancialYear(row) {
    // Legacy Development Fund records may not have financialYear, or may have
    // been written with a creation date that is different from the month for
    // which the payment was collected. The collection period/payment date is
    // the authoritative period; this keeps old Development Fund history
    // visible after the Colony Fund rename and after tenant records were added.
    const period = String(colonyField(row,['collectionPeriod','Collection Period','monthKey','month','paymentMonth']) || '').trim();
    if (/^\d{4}-\d{2}$/.test(period)) {
        const month = Number(period.slice(5, 7));
        const year = Number(period.slice(0, 4));
        if (month >= 1 && month <= 12 && year > 2000) {
            return month >= 4
                ? `${year}-${String(year + 1).slice(2)}`
                : `${year - 1}-${String(year).slice(2)}`;
        }
    }
    const paymentDate = String(colonyField(row,['paymentDate','Payment Date','dateOfPayment','date','createdOn']) || '').trim();
    if (paymentDate) {
        const d = new Date(paymentDate);
        if (!Number.isNaN(d.getTime())) return getFinancialYear(d);
    }
    const fy=String(colonyField(row,['financialYear','Financial Year','fy','FY'])||'').trim();
    if (/^\d{4}-\d{2}$/.test(fy)) return fy;
    const created = String(row?.createdOn || '').trim();
    if (created) {
        const d = new Date(created);
        if (!Number.isNaN(d.getTime())) return getFinancialYear(d);
    }
    return '';
}

function monthsDueForFinancialYear(fy) {
    const value=String(fy||'').trim();
    try { return (window.RGMS?.getColonyFundMonthsForFY?.(value,new Date())||[]).length; }
    catch (_) { return 0; }
}

function selectedFYPaymentRows(fy) {
    const target = String(fy || '').trim();
    if (!target) return [];
    return ownerPaymentRows().filter(p => paymentFinancialYear(p) === target);
}

function expenditureFinancialYear(row) {
    if (row?.financialYear) return String(row.financialYear);
    const d = row?.date || row?.expenditureDate || row?.createdOn;
    return d ? getFinancialYear(d) : '';
}

function isOwnerResident(r){
    if(window.RGMS?.isColonyFundEligibleOwner) return window.RGMS.isColonyFundEligibleOwner(r);
    if(!r || String(r.residentType || '').trim().toLowerCase()!=='owner') return false;
    // Resident Type = Owner remains eligible for every Occupation Status.
    return !!String(r.ownerName || r.name || '').trim();
}
function paymentMatchesResident(payment,resident){
    if (window.RGMS?.colonyFundPaymentMatchesResident) {
        return window.RGMS.colonyFundPaymentMatchesResident(payment,resident);
    }
    if(!payment||!resident) return false;
    const normalize = value => String(value ?? '').trim().toLowerCase();
    const paymentResidentId = normalize(payment.residentId);
    const residentId = normalize(resident.residentId);
    if (paymentResidentId && residentId) return paymentResidentId === residentId;
    const paymentHouse = normalize(payment.houseNo || payment.plotNo).replace(/^2-1\//i,'');
    const residentHouse = normalize(resident.houseNo || resident.plotNo).replace(/^2-1\//i,'');
    return !!(paymentHouse && residentHouse && paymentHouse === residentHouse);
}
function ownerPaymentRows(){
    const owners=residents.filter(isOwnerResident);
    return payments.filter(p=>owners.some(r=>paymentMatchesResident(p,r)));
}
function paymentPeriodKey(payment){
    const cp=String(colonyField(payment,['collectionPeriod','Collection Period','monthKey','month','paymentMonth'])||'').trim();
    if (/^\d{4}-\d{2}$/.test(cp)) return cp;
    if (/^\d{4}-\d{2}-\d{2}/.test(cp)) return cp.slice(0,7);
    const d=colonyField(payment,['paymentDate','Payment Date','dateOfPayment','date','createdOn']);
    return d ? String(d).slice(0,7) : '';
}
function monthLabel(date){const key=/^\d{4}-\d{2}$/.test(String(date||''))?String(date):String(date||'').slice(0,10);if(/^\d{4}-\d{2}$/.test(key)){const [y,m]=key.split('-').map(Number);return new Date(y,m-1,1).toLocaleDateString('en-IN',{month:'short',year:'numeric'});}const d=new Date(date);return isNaN(d)?"":d.toLocaleDateString("en-IN",{month:"short",year:"numeric"});}
function currentCalendarYearPaid(plotNo){const y=String(new Date().getFullYear());return payments.filter(p=>String(p.plotNo)===String(plotNo)&&String(paymentPeriodKey(p)).slice(0,4)===y).reduce((s,p)=>s+colonyAmountPaid(p),0);}
function totalPaidTillDate(plotNo){return payments.filter(p=>String(p.plotNo)===String(plotNo)).reduce((s,p)=>s+colonyAmountPaid(p),0);}
function monthsDueThrough(date){const d=new Date(date||new Date());try{return (window.RGMS?.getColonyFundMonthsForFY?.(getFinancialYear(d),d)||[]).length;}catch(_){return 0;}}
function ownerTotalDue(plotNo,date){const expected=DEFAULT_FUND_AMOUNT*monthsDueThrough(date);return Math.max(0,expected-totalPaidTillDate(plotNo));}


function rgmsDevelopmentFundMonths(){
    const fy=String(selectedDashboardFY||currentFinancialYear||getFinancialYear()).trim();
    return window.RGMS?.getColonyFundMonthsForFY?.(fy) || [];
}

function rgmsDevelopmentTotalHouseRows(){
    const source=(residents&&residents.length?residents:colonyResidentMasterCompat());
    const groups=new Map();
    source.forEach(r=>{const h=String(r?.houseNo||r?.plotNo||'').trim().toLowerCase();if(h&&!groups.has(h))groups.set(h,r);});
    return [...groups.values()];
}

function updateDashboard() {
    // Always re-read the shared Firebase cache, then calculate both FY and month
    // from one authoritative owner-only rule set.
    try { residents=colonyResidentMasterCompat(); } catch (_) {}
    try { payments=(getAllRecords(DF_STORAGE)||[]).map(normalizeColonyPayment); } catch (_) {}
    const fy=String(selectedDashboardFY||currentFinancialYear||getFinancialYear()).trim();
    const month=String(selectedDashboardMonth||currentCollectionPeriod||getCollectionPeriod()).slice(0,7);
    const expenditures=getAllRecords(STORAGE_KEYS.EXPENDITURES)||[];
    const summary=RGMS.getColonyFundSummary({
        residents, payments, expenditures, financialYear:fy, month
    });
    const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
    const monthLabelText=/^\d{4}-\d{2}$/.test(month)
        ? new Date(Number(month.slice(0,4)),Number(month.slice(5,7))-1,1).toLocaleDateString('en-IN',{month:'long'})
        : month;
    setText('colonyFYLabelExpected',fy); setText('colonyMonthLabelExpected',monthLabelText);
    setText('colonyFYLabelCollected',fy); setText('colonyMonthLabelCollected',monthLabelText);
    setText('colonyFYLabelPending',fy); setText('colonyMonthLabelPending',monthLabelText);
    setText('colonyFYLabelExpenditure',fy); setText('colonyMonthLabelExpenditure',monthLabelText);
    setText('colonyFYLabelBalance',fy); setText('colonyMonthLabelBalance',monthLabelText);
    setText('colonyTotalHouses',String(summary.totalHouses));
    setText('expectedAmountFY',formatCurrency(summary.expectedFY));
    setText('expectedAmountMonth',formatCurrency(summary.expectedMonth));
    setText('collectedAmountFY',formatCurrency(summary.collectedFY));
    setText('collectedAmountMonth',formatCurrency(summary.collectedMonth));
    setText('pendingAmountFY',formatCurrency(summary.pendingFY));
    setText('pendingAmountMonth',formatCurrency(summary.pendingMonth));
    setText('colonyExpenditureFY',formatCurrency(summary.expenditureFY));
    setText('colonyExpenditureMonth',formatCurrency(summary.expenditureMonth));
    setText('colonyBalanceFY',formatCurrency(summary.balanceFY));
    setText('colonyBalanceMonth',formatCurrency(summary.balanceMonth));
}

function loadPaymentHistory() {
    const tbody = document.getElementById("paymentHistoryBody");
    if (!tbody) return;

    payments = getAllRecords(DF_STORAGE).map(normalizeColonyPayment);
    const dashFilter = window.RGMS?.consumeDashboardFilter?.("development-fund");
    const historyFY = String(document.getElementById('dfHistoryFinancialYear')?.value || '').trim();
    const historyMonth = String(document.getElementById('dfHistoryMonth')?.value || '').slice(0,7);
    const rows = ownerPaymentRows()
        .filter(p => !historyFY || paymentFinancialYear(p) === historyFY)
        .filter(p => !historyMonth || paymentPeriodKey(p) === historyMonth)
        .filter(p => !dashFilter || dashFilter.filter !== "__CURRENT_MONTH__" || paymentPeriodKey(p) === String(currentCollectionPeriod).slice(0,7))
        .slice()
        .sort((a,b)=>{
            const am=paymentPeriodKey(a);
            const bm=paymentPeriodKey(b);
            return bm.localeCompare(am) || String(a.houseNo||a.plotNo||'').localeCompare(String(b.houseNo||b.plotNo||''),undefined,{numeric:true});
        });

    const monthName = key => {
        if(!/^\d{4}-\d{2}$/.test(key)) return key || 'Month not specified';
        const [y,m]=key.split('-').map(Number);
        return new Date(y,m-1,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'});
    };

    let html='';
    let currentMonth='';
    let serial=0;
    rows.forEach(payment=>{
        const monthKey=paymentPeriodKey(payment) || 'unknown';
        if(monthKey!==currentMonth){
            currentMonth=monthKey;
            html += `<tr class="rg-month-row"><td colspan="12">${monthName(monthKey)}</td></tr>`;
        }
        serial++;
        const totalCY=currentCalendarYearPaid(payment.plotNo);
        const totalTill=totalPaidTillDate(payment.plotNo);
        const due=Math.max(0, colonyFundAmount(payment) - colonyAmountPaid(payment));
        const status=payment.paymentStatus || (colonyAmountPaid(payment)>=colonyFundAmount(payment)?'Paid':'Pending');
        const id=String(payment.id||'').replace(/'/g,"\\'");
        html += `<tr data-rg-id="${String(payment.id||'').replace(/"/g,'&quot;')}" data-payment-month="${monthKey}">
            <td>${serial}</td><td>${payment.ownerName||''}</td><td>${formatHNo(payment.houseNo||payment.plotNo||'')}</td><td>${formatCurrency(payment.amountPaid)}</td><td>${monthLabel(payment.paymentDate)}</td><td><span class="badge ${status==='Paid'?'badge-green':'badge-yellow'}">${status}</span></td><td>${payment.paymentMode||''}</td><td>${formatCurrency(totalCY)}</td><td>${formatCurrency(totalTill)}</td><td>${formatCurrency(due)}</td><td></td>
            <td><div class="rg-grid-actions"><button class="rg-icon-btn rg-view" type="button" title="View Fund" onclick="selectPayment('${id}')">View</button>${canColonyFund('update')?`<button class="rg-icon-btn rg-update" type="button" title="Update Fund" onclick="selectPayment('${id}')">Update</button>`:''}${canColonyFund('delete')?`<button class="rg-icon-btn rg-delete" type="button" title="Delete Fund" onclick="deletePaymentById('${id}')">Delete</button>`:''}</div></td></tr>`;
    });
    tbody.innerHTML = html || '<tr><td colspan="12" class="empty">No Colony Fund payments found.</td></tr>';
    window.RGMS?.refreshRegisterScrolling?.();
}

function loadPendingResidents() {
    const tbody = document.getElementById("pendingResidentsBody");
    if (!tbody) return;

    payments = getAllRecords(DF_STORAGE).map(normalizeColonyPayment);
    tbody.innerHTML = "";
    const selectedFY = String(currentFinancialYear || '').trim();
    const monthsDue = monthsDueForFinancialYear(selectedFY);
    const expectedPerOwner = DEFAULT_FUND_AMOUNT * monthsDue;

    residents.filter(isOwnerResident).forEach(resident => {
        const paidInFY = payments
            .filter(p => paymentFinancialYear(p) === selectedFY && paymentMatchesResident(p, resident))
            .reduce((sum,p) => sum + Number(p.amountPaid || 0), 0);

        // For a historical FY, compare the full FY obligation. For the current
        // FY, compare the obligation accrued through the current month.
        const due = Math.max(0, expectedPerOwner - paidInFY);
        if (due <= 0) return;

        tbody.innerHTML += `
        <tr>
            <td>${formatHNo(resident.houseNo || resident.plotNo)}</td>
            <td>${resident.ownerName}</td>
            <td>${resident.mobile?.[0] || resident.whatsapp || ""}</td>
            <td>${formatCurrency(due)}</td>
            <td>
              <button class="btn btn-success btn-sm" onclick="collectPayment('${resident.plotNo}')">Collect</button>
              <button class="btn btn-primary btn-sm" onclick="sendWhatsAppReminder('${resident.plotNo}')">WhatsApp</button>
              <button class="btn btn-warning btn-sm" onclick="createResidentPaymentLink('${resident.plotNo}')">Payment Details</button>
            </td>
        </tr>`;
    });

    if (!tbody.innerHTML) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">No pending Colony Fund residents for the selected financial year.</td></tr>';
    }
}

function collectPayment(plotNo) {
    const resident = residents.find(r => String(r.plotNo) === String(plotNo));
    if (resident) document.getElementById("cmbResidentName").value = colonyResidentSelectionKey(resident);
    loadResidentDetails();
    openTab("payment");
}

window.collectPayment = collectPayment;

async function sendWhatsAppReminder(plotNo) {
    const resident = residents.find(r => String(r.plotNo) === String(plotNo));
    if (!resident) return;

    const amount = DEFAULT_FUND_AMOUNT;
    const link = RGMS.communication.generateUPIPaymentLink(resident, amount);
    const message = RGMS.communication.buildDevelopmentFundReminder(resident, amount, link);

    RGMS.communication.openWhatsAppComposer(resident.mobile?.[0] || resident.whatsapp || "", message, "Colony Fund WhatsApp message");

    await RGMS.communication.logCommunication({
        plotNo: resident.plotNo,
        residentName: resident.ownerName,
        mobile: resident.mobile?.[0] || resident.whatsapp || "",
        module: "Colony Fund",
        type: "Reminder",
        status: "Opened"
    });
}

window.sendWhatsAppReminder = sendWhatsAppReminder;

function printReceipt() {
    if (currentPayment) {
        RGMS.receipt.printDevelopmentFundReceipt(currentPayment);
        return;
    }

    const receiptNo = document.getElementById("txtReceiptNo")?.value;
    const payment = getAllRecords(DF_STORAGE).find(p => p.receiptNo === receiptNo);
    if (!payment) {
        alert("Please save or select a payment before printing.");
        return;
    }
    currentPayment = payment;
    RGMS.receipt.printDevelopmentFundReceipt(payment);
}

function clearForm(resetPlot = true) {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };

    if (resetPlot) { set("cmbResidentName", ""); }
    set("txtOwnerName", "");
    set("txtMobileNumber", "");
    set("txtFundAmount", DEFAULT_FUND_AMOUNT);
    set("txtAmountPaid", "");
    set("txtBalance", DEFAULT_FUND_AMOUNT);
    set("dtPaymentDate", new Date().toISOString().split("T")[0]);
    set("cmbPaymentStatus", "Pending");
    set("cmbPaymentMode", "Cash");
    set("txtTransactionNo", "");
    set("txtRemarks", "");
    set("dfPaymentFinancialYear", currentFinancialYear);
    populateMonthSelector('dfPaymentMonth', currentFinancialYear, currentCollectionPeriod);
    currentPayment = null;
}

window.clearForm = clearForm;

async function createResidentPaymentLink(plotNo){
    const resident=residents.find(r=>String(r.plotNo)===String(plotNo));
    if(!resident)return;
    const paid=payments.filter(p=>String(p.plotNo)===String(plotNo)&&p.collectionPeriod===currentCollectionPeriod)
        .reduce((sum,p)=>sum+colonyAmountPaid(p),0);
    const due=Math.max(0,DEFAULT_FUND_AMOUNT-paid);
    if(due<=0){alert('No outstanding amount for this resident.');return;}
    const mobile=String(SOCIETY.paymentMobile||'+919704035400').replace(/\D/g,'').replace(/^91(?=\d{10}$)/,'');
    let opened=false;
    try{ opened=!!window.RGMS?.openP2PPaymentApp?.('phonepe',mobile); }catch(_){}
    if(!opened){
        try{await navigator.clipboard?.writeText(mobile);}catch(_){}
        try{opened=!!window.RGMS?.openPaymentApp?.('phonepe');}catch(_){}
    }
    if(opened){
        alert(`PhonePe opened. Mobile ${mobile} belongs to the same payment account as ${SOCIETY.upiId}.\nChoose Pay to Mobile Number and paste ${mobile}.\nAmount Due: ₹${due}.`);
    }else{
        try{await navigator.clipboard?.writeText(mobile);}catch(_){}
        alert(`Payment mobile copied: ${mobile}\nUPI ID: ${SOCIETY.upiId}\nAmount Due: ₹${due}\nOpen PhonePe/GPay and choose Pay to Mobile Number.`);
    }
}

window.createResidentPaymentLink=createResidentPaymentLink;


window.addEventListener('rgms:data-changed', async function(e){
    const key=e?.detail?.key;
    if(![STORAGE_KEYS.RESIDENTS,STORAGE_KEYS.DEVELOPMENT_FUND,STORAGE_KEYS.EXPENDITURES].includes(key)) return;
    const active=document.querySelector('.menu-item.active')?.dataset.module;
    if(active!=='development-fund') return;
    try{
        await RGMS.store.refreshCollection(STORAGE_KEYS.RESIDENTS, {retries: 3});
        await RGMS.store.loadCollection(STORAGE_KEYS.DEVELOPMENT_FUND);
        await RGMS.store.refreshCollection(STORAGE_KEYS.EXPENDITURES,{retries:2,ttlMs:0});
        residents=RGMS.store.getResidentMaster({includeVacant:true});
        payments=(getAllRecords(STORAGE_KEYS.DEVELOPMENT_FUND)||[]).map(normalizeColonyPayment);
        updateDashboard(); loadPaymentHistory(); loadPendingResidents();
    }catch(err){ console.warn('Colony Fund refresh failed:',err); }
});


// Module loader entry point.
window.initializeDevelopmentFund = initializeDevelopmentFund;

/* RGMS 4.5.49 / Android 1.2.208 — integrated Colony Fund dashboard + FY register + CRUD form. */
(function(){
  'use strict';
  const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const escCF=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const moneyCF=v=>typeof formatCurrency==='function'?formatCurrency(Number(v||0)):`₹ ${Number(v||0).toLocaleString('en-IN')}`;
  function ownerRows(){return colonyResidentMasterCompat().filter(r=>typeof isOwnerResident==='function'?isOwnerResident(r):String(r.residentType||'').trim().toLowerCase()==='owner').sort((a,b)=>String(a.ownerName||a.name||'').localeCompare(String(b.ownerName||b.name||''),'en',{sensitivity:'base',numeric:true})||String(a.houseNo||a.plotNo||'').localeCompare(String(b.houseNo||b.plotNo||''),undefined,{numeric:true}));}
  function currentFY(){try{return getFinancialYear(new Date())}catch(_){const y=new Date().getFullYear();return `${y}-${String(y+1).slice(2)}`;}}
  function fyMonthKey(fy,monthNo){const y=Number(String(fy).slice(0,4)); const calYear=monthNo<=3?y+1:y; return `${calYear}-${String(monthNo).padStart(2,'0')}`;}
  function isMatch(p,r){return typeof paymentMatchesResident==='function'?paymentMatchesResident(p,r):String(p.residentId||'')===String(r.residentId||'');}
  function paymentRows(){try{return (getAllRecords(DF_STORAGE)||[]).map(normalizeColonyPayment)}catch(_){return []}}
  function ensureLayout(){
    const root=document.getElementById('developmentFundModule'); const dash=document.getElementById('dashboardContent'); if(!root||!dash||document.getElementById('colonyIntegratedRegister'))return;
    document.querySelector('.tab-bar')?.setAttribute('style','display:none!important');
    ['paymentContent','historyContent','pendingContent'].forEach(id=>{const x=document.getElementById(id);if(x)x.style.display='none';});
    const reg=document.createElement('section');reg.id='colonyIntegratedRegister';reg.className='colony-integrated-section';reg.innerHTML=`
      <h3>Colony Fund Register</h3>
      <div class="rg-register-filter-row colony-register-filters"><div class="form-group"><label>Financial Year</label><select id="colonyRegisterFY" class="form-control"></select></div><div class="form-group"><label>Month</label><select id="colonyRegisterMonth" class="form-control"><option value="ALL">All Months</option>${MONTHS.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('')}</select></div></div>
      <div class="table-wrap"><table class="table colony-year-register"><thead><tr><th>S.No.</th><th>Name</th><th>H.No.</th>${MONTHS.map(m=>`<th>${m}</th>`).join('')}<th>Total</th><th>Remarks</th><th>Action</th></tr></thead><tbody id="colonyIntegratedRegisterBody"></tbody></table></div>`;
    dash.insertAdjacentElement('afterend',reg);
    const form=document.createElement('section');form.id='colonyIntegratedForm';form.className='colony-integrated-section';form.innerHTML=`
      <h3>Colony Fund Data Entry</h3>
      <input type="hidden" id="colonyEditResidentId"><input type="hidden" id="colonyEditPaymentId">
      <div class="form-row"><div class="form-group"><label>Financial Year</label><select id="colonyFormFY" class="form-control"></select></div><div class="form-group"><label>Month</label><select id="colonyFormMonth" class="form-control">${MONTHS.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('')}</select></div><div class="form-group"><label>Name</label><select id="colonyFormResident" class="form-control"></select></div><div class="form-group"><label>H.No.</label><input id="colonyFormHouse" class="form-control" readonly></div></div>
      <div class="form-row"><div class="form-group"><label>Amount</label><input type="number" min="0" step="1" id="colonyFormAmount" class="form-control" placeholder="0"></div><div class="form-group"><label>Payment Date</label><input type="date" id="colonyFormDate" class="form-control"></div></div>
      <input type="hidden" id="colonyFormRemarks" value="">
      <div class="button-row"><button type="button" id="colonyFormSave" class="btn btn-primary">Save</button><button type="button" id="colonyFormUpdate" class="btn btn-warning">Update</button><button type="button" id="colonyFormDelete" class="btn btn-danger">Delete</button><button type="button" id="colonyFormClear" class="btn btn-secondary">Clear</button></div>`;
    reg.insertAdjacentElement('afterend',form);
    const existing=document.createElement('section');existing.id='colonyExistingRecords';existing.className='colony-integrated-section';existing.innerHTML=`
      <h3>Existing Colony Fund Records</h3>
      <div class="rg-register-filter-row colony-register-filters"><div class="form-group"><label>Financial Year</label><select id="colonyExistingFY" class="form-control"><option value="">All Financial Years</option></select></div><div class="form-group"><label>Month</label><select id="colonyExistingMonth" class="form-control"><option value="">All Months</option>${MONTHS.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('')}</select></div></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>S.No.</th><th>Name</th><th>H.No.</th><th>Financial Year</th><th>Month</th><th>Amount</th><th>Payment Date</th><th>Status</th><th>Mode</th><th>Remarks</th><th>Action</th></tr></thead><tbody id="colonyExistingRecordsBody"></tbody></table></div>`;
    form.insertAdjacentElement('afterend',existing);
    bindIntegrated(); populateIntegratedSelectors(); renderIntegratedRegister(); renderExistingRecords(); clearIntegratedForm();
  }
  function fyOptionsList(){const cur=currentFY();const y=Number(cur.slice(0,4));return Array.from({length:8},(_,i)=>`${y-i}-${String(y-i+1).slice(2)}`);}
  function populateIntegratedSelectors(){const fy=[...new Set([...fyOptionsList(),...paymentRows().map(p=>paymentFinancialYear(p)).filter(Boolean)])].sort().reverse();['colonyRegisterFY','colonyFormFY'].forEach(id=>{const e=document.getElementById(id);if(e){const val=e.value||currentFY();e.innerHTML=fy.map(x=>`<option value="${x}">${x}</option>`).join('');e.value=fy.includes(val)?val:currentFY();}});const ex=document.getElementById('colonyExistingFY');if(ex){const val=ex.value;ex.innerHTML='<option value="">All Financial Years</option>'+fy.map(x=>`<option value="${x}">${x}</option>`).join('');ex.value=fy.includes(val)?val:'';} const sel=document.getElementById('colonyFormResident');if(sel){const val=sel.value;sel.innerHTML='<option value="">Select Name</option>'+ownerRows().map(r=>`<option value="${escCF(colonyResidentSelectionKey(r))}">${escCF(r.ownerName||r.name||'Resident')}</option>`).join('');if(val)sel.value=val;} const currentMonth=String(new Date().getMonth()+1);const hm=document.getElementById('colonyRegisterMonth');if(hm&&!hm.dataset.defaulted){hm.value=currentMonth;hm.dataset.defaulted='1';}const fm=document.getElementById('colonyFormMonth');if(fm&&!fm.dataset.defaulted){fm.value=currentMonth;fm.dataset.defaulted='1';}}
  function selectedFormResident(){const v=document.getElementById('colonyFormResident')?.value||'';return ownerRows().find(r=>colonyResidentSelectionKey(r)===String(v));}
  function aggregateResident(r,fy){const rows=paymentRows().filter(p=>paymentFinancialYear(p)===fy&&isMatch(p,r));const amounts=Array(12).fill(0);rows.forEach(p=>{const k=paymentPeriodKey(p);const m=Number(String(k).slice(5,7));if(m>=1&&m<=12)amounts[m-1]+=colonyAmountPaid(p);});return {rows,amounts,total:amounts.reduce((a,b)=>a+b,0),date:rows.map(x=>String(x.paymentDate||'')).filter(Boolean).sort().pop()||'',remarks:''};}
  function renderExistingRecords(){
    const body=document.getElementById('colonyExistingRecordsBody');if(!body)return;
    const fy=String(document.getElementById('colonyExistingFY')?.value||'');
    const month=String(document.getElementById('colonyExistingMonth')?.value||'');
    const rows=paymentRows().filter(p=>!fy||paymentFinancialYear(p)===fy).filter(p=>!month||Number(String(paymentPeriodKey(p)).slice(5,7))===Number(month)).sort((a,b)=>String(b.paymentDate||b.collectionPeriod||'').localeCompare(String(a.paymentDate||a.collectionPeriod||''))||String(a.houseNo||a.plotNo||'').localeCompare(String(b.houseNo||b.plotNo||''),undefined,{numeric:true}));
    body.innerHTML=rows.map((p,i)=>{const m=Number(String(paymentPeriodKey(p)).slice(5,7));const id=escCF(p.id||'');return `<tr><td>${i+1}</td><td>${escCF(p.ownerName||'')}</td><td>${escCF(formatHNo(p.houseNo||p.plotNo||''))}</td><td>${escCF(paymentFinancialYear(p)||'')}</td><td>${escCF(MONTHS[m-1]||paymentPeriodKey(p)||'')}</td><td>${moneyCF(colonyAmountPaid(p))}</td><td>${escCF(String(p.paymentDate||'').slice(0,10))}</td><td>${escCF(p.paymentStatus||'')}</td><td>${escCF(p.paymentMode||'')}</td><td></td><td><div class="rg-grid-actions"><button type="button" class="btn btn-sm btn-secondary" data-colony-record-view="${id}">View</button>${canColonyFund('delete')?`<button type="button" class="btn btn-sm btn-danger" data-colony-record-delete="${id}">Delete</button>`:''}</div></td></tr>`}).join('')||'<tr><td colspan="11" class="empty">No Colony Fund records found.</td></tr>';
  }
  function viewExistingRecord(id){
    const p=paymentRows().find(x=>String(x.id)===String(id));if(!p)return;
    const fy=paymentFinancialYear(p)||currentFY();const m=Number(String(paymentPeriodKey(p)).slice(5,7))||new Date().getMonth()+1;
    ['colonyFormFY','colonyRegisterFY'].forEach(fid=>{const e=document.getElementById(fid);if(e){if(![...e.options].some(o=>o.value===fy))e.insertAdjacentHTML('beforeend',`<option value="${escCF(fy)}">${escCF(fy)}</option>`);e.value=fy;}});
    const rm=document.getElementById('colonyRegisterMonth');if(rm)rm.value=String(m);const fm=document.getElementById('colonyFormMonth');if(fm)fm.value=String(m);
    const r=ownerRows().find(x=>isMatch(p,x));if(r){const rid=colonyResidentSelectionKey(r);document.getElementById('colonyFormResident').value=rid;viewIntegrated(rid);}document.getElementById('colonyEditPaymentId').value=String(p.id||'');document.getElementById('colonyIntegratedForm')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function deleteExistingRecord(id){
    if(!canColonyFund('delete')){alert('Colony Fund delete permission has not been assigned to this role.');return;}
    const p=paymentRows().find(x=>String(x.id)===String(id));if(!p)return;
    if(!confirm(`Delete Colony Fund record ${p.receiptNo||formatHNo(p.houseNo||p.plotNo||'')}?`))return;
    await RGMS.store.deleteRecord(DF_STORAGE,id);await RGMS.store.refreshCollection(DF_STORAGE,{retries:2});payments=getAllRecords(DF_STORAGE).map(normalizeColonyPayment);updateDashboard();renderIntegratedRegister();renderExistingRecords();loadPaymentHistory();loadPendingResidents();alert('Colony Fund record deleted successfully.');
  }
  function residentMobileCF(r){
    const raw=Array.isArray(r?.mobile)?r.mobile.find(Boolean):r?.mobile;
    return String(raw||r?.whatsapp||r?.phoneE164||r?.cellNo||r?.phone||'').trim();
  }
  function periodLabelCF(fy,month){
    if(String(month)==='ALL')return `FY ${fy}`;
    const monthNo=Number(month);const key=fyMonthKey(fy,monthNo);const [y,m]=key.split('-').map(Number);
    return new Date(y,m-1,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  }
  function integratedWhatsAppContext(r,fy,month){
    const a=aggregateResident(r,fy);const monthValue=String(month||'ALL');let expected=0,paid=0,rows=[];
    if(monthValue==='ALL'){
      expected=DEFAULT_FUND_AMOUNT*monthsDueForFinancialYear(fy);paid=a.total;rows=a.rows.slice();
    }else{
      const monthNo=Number(monthValue);expected=DEFAULT_FUND_AMOUNT;paid=Number(a.amounts[monthNo-1]||0);rows=a.rows.filter(p=>Number(String(paymentPeriodKey(p)).slice(5,7))===monthNo);
    }
    const due=Math.max(0,expected-paid);const latest=rows.slice().sort((x,y)=>String(y.paymentDate||y.createdOn||'').localeCompare(String(x.paymentDate||x.createdOn||'')))[0]||null;
    return {a,expected,paid,due,rows,latest,period:periodLabelCF(fy,monthValue),month:monthValue};
  }
  async function sendIntegratedWhatsApp(residentId){
    if(!canColonyFund('share')){alert('WhatsApp share permission has not been assigned to this role.');return;}
    const r=ownerRows().find(x=>colonyResidentSelectionKey(x)===String(residentId));if(!r){alert('Resident record was not found.');return;}
    const mobile=residentMobileCF(r);if(!mobile){alert('Resident WhatsApp/mobile number is not available in Residents Master.');return;}
    const fy=document.getElementById('colonyRegisterFY')?.value||currentFY();const month=String(document.getElementById('colonyRegisterMonth')?.value||'ALL');const ctx=integratedWhatsAppContext(r,fy,month);
    const name=String(r.ownerName||r.name||'Resident').trim();const hno=formatHNo(r.houseNo||r.plotNo||'');let type='Reminder',message='';
    if(ctx.due>0){
      const link=RGMS.communication.generateUPIPaymentLink(r,ctx.due,month==='ALL'?fy:fyMonthKey(fy,Number(month)));
      message=`Dear ${name},

Greetings from ${SOCIETY.name}.

Colony Fund payment reminder
H.No.: ${hno}
Period: ${ctx.period}
Amount Due: ${moneyCF(ctx.due)}
Payment Link / UPI ID: ${SOCIETY.upiId}
PhonePe / GPay No.: ${SOCIETY.paymentMobile || '+919704035400'}
(Same payment account)${ctx.paid>0?`
Amount Already Paid: ${moneyCF(ctx.paid)}`:''}

If you have already paid, kindly ignore this message.

Regards,
${SOCIETY.treasurerName}
Treasurer
${SOCIETY.shortName}`;
    }else if(ctx.paid>0){
      type='Receipt';
      const p=ctx.latest||{};const receiptNo=String(p.receiptNo||'').trim();const payDate=String(p.paymentDate||'').slice(0,10);const payMode=String(p.paymentMode||'').trim();
      const paidMonths=ctx.month==='ALL'?ctx.a.amounts.map((v,i)=>v>0?`${MONTHS[i]} ${moneyCF(v)}`:'').filter(Boolean).join(', '):'';
      message=`Dear ${name},

Thank you for your Colony Fund payment.

COLONY FUND RECEIPT
H.No.: ${hno}
Period: ${ctx.period}
Amount Paid: ${moneyCF(ctx.paid)}${receiptNo?`
Receipt No.: ${receiptNo}`:''}${payDate?`
Payment Date: ${payDate}`:''}${payMode?`
Payment Mode: ${payMode}`:''}${paidMonths?`
Payment Details: ${paidMonths}`:''}

Your payment has been recorded successfully.

Regards,
${SOCIETY.treasurerName}
Treasurer
${SOCIETY.shortName}`;
    }else{
      alert('There is no due or paid amount to send for the selected period.');return;
    }
    const opened=RGMS.communication.openWhatsAppComposer(mobile,message,`Colony Fund WhatsApp ${type}`);if(!opened)return;
    try{await RGMS.communication.logCommunication({plotNo:r.plotNo||r.houseNo,residentId:r.residentId||r.id,residentName:name,mobile,module:'Colony Fund',type,status:'Opened',financialYear:fy,period:ctx.period,amount:type==='Reminder'?ctx.due:ctx.paid});}catch(err){console.warn('Colony Fund WhatsApp log failed:',err);}
  }
  window.sendIntegratedColonyWhatsApp=sendIntegratedWhatsApp;
  function renderIntegratedRegister(){
    const body=document.getElementById('colonyIntegratedRegisterBody');if(!body)return;
    const fy=document.getElementById('colonyRegisterFY')?.value||currentFY();const month=String(document.getElementById('colonyRegisterMonth')?.value||'ALL');const owners=ownerRows();
    body.innerHTML=owners.map((r,i)=>{const a=aggregateResident(r,fy);const ctx=integratedWhatsAppContext(r,fy,month);const rid=colonyResidentSelectionKey(r);const mobile=residentMobileCF(r);const monthCells=a.amounts.map((v,idx)=>`<td class="${month!=='ALL'&&Number(month)!==idx+1?'rg-month-muted':''}">${moneyCF(v||0)}</td>`).join('');let wa='';
      if(canColonyFund('share')){
        if(!mobile)wa='<button type="button" class="btn btn-sm btn-secondary" disabled title="Mobile number not available">WhatsApp</button>';
        else if(ctx.due>0)wa=`<button type="button" class="btn btn-sm btn-success" data-colony-whatsapp="${escCF(rid)}" title="Send pending Colony Fund reminder">💬 Reminder</button>`;
        else if(ctx.paid>0)wa=`<button type="button" class="btn btn-sm btn-success" data-colony-whatsapp="${escCF(rid)}" title="Send Colony Fund payment receipt">💬 Receipt</button>`;
      }
      return `<tr><td>${i+1}</td><td>${escCF(r.ownerName||r.name||'')}</td><td>${escCF(formatHNo(r.houseNo||r.plotNo||''))}</td>${monthCells}<td>${moneyCF(a.total)}</td><td></td><td><div class="rg-grid-actions"><button type="button" class="btn btn-sm btn-secondary" data-colony-view="${escCF(rid)}">View</button>${wa}</div></td></tr>`;
    }).join('')||'<tr><td colspan="18" class="empty">No owner records found.</td></tr>';
  }
  function clearIntegratedForm(){const rid=document.getElementById('colonyEditResidentId');if(rid)rid.value='';const pid=document.getElementById('colonyEditPaymentId');if(pid)pid.value='';const resident=document.getElementById('colonyFormResident');if(resident)resident.value='';const h=document.getElementById('colonyFormHouse');if(h)h.value='';const amt=document.getElementById('colonyFormAmount');if(amt)amt.value='';const d=document.getElementById('colonyFormDate');if(d)d.value=new Date().toISOString().slice(0,10);const rem=document.getElementById('colonyFormRemarks');if(rem)rem.value='';}
  function viewIntegrated(id){const r=ownerRows().find(x=>colonyResidentSelectionKey(x)===String(id));if(!r)return;const fy=document.getElementById('colonyRegisterFY')?.value||currentFY();const regMonth=String(document.getElementById('colonyRegisterMonth')?.value||new Date().getMonth()+1);const monthNo=regMonth==='ALL'?new Date().getMonth()+1:Number(regMonth);document.getElementById('colonyFormFY').value=fy;document.getElementById('colonyFormMonth').value=String(monthNo);document.getElementById('colonyFormResident').value=colonyResidentSelectionKey(r);document.getElementById('colonyEditResidentId').value=String(r.residentId||r.id||r.plotNo);const h=document.getElementById('colonyFormHouse');if(h)h.value=formatHNo(r.houseNo||r.plotNo||'');const target=aggregateResident(r,fy).rows.filter(p=>Number(String(paymentPeriodKey(p)).slice(5,7))===monthNo);document.getElementById('colonyEditPaymentId').value=target[0]?.id||'';document.getElementById('colonyFormAmount').value=target.reduce((sum,p)=>sum+colonyAmountPaid(p),0)||'';document.getElementById('colonyFormDate').value=target.map(x=>String(x.paymentDate||'').slice(0,10)).filter(Boolean).sort().pop()||new Date().toISOString().slice(0,10);document.getElementById('colonyFormRemarks').value='';document.getElementById('colonyIntegratedForm')?.scrollIntoView({behavior:'smooth',block:'start'});}
  async function persistIntegrated(mode){
    const role=RGMS.auth.getSession()?.role;
    const action=mode==='save'?'add':mode==='update'?'update':'delete';
    if(!canColonyFund(action)){colonyUserMessage(`Colony Fund ${action} permission has not been assigned to this role.`,true);return;}
    const r=selectedFormResident();
    if(!r){colonyUserMessage('Please select Name.',true);return;}
    const fy=String(document.getElementById('colonyFormFY')?.value||currentFY());
    const monthNo=Number(document.getElementById('colonyFormMonth')?.value||0);
    const amount=Number(document.getElementById('colonyFormAmount')?.value||0);
    if(monthNo<1||monthNo>12){colonyUserMessage('Please select a valid month.',true);return;}
    if(amount<0){colonyUserMessage('Amount cannot be negative.',true);return;}
    const allRows=paymentRows();
    const samePeriod=allRows.filter(p=>paymentFinancialYear(p)===fy&&isMatch(p,r)&&Number(String(paymentPeriodKey(p)).slice(5,7))===monthNo);
    const selectedId=String(document.getElementById('colonyEditPaymentId')?.value||'');
    const selectedRecord=selectedId?allRows.find(p=>String(p.id)===selectedId):null;
    try{
      if(mode==='delete'){
        const deleteRows=selectedRecord?[selectedRecord]:samePeriod;
        if(!deleteRows.length){colonyUserMessage('No Colony Fund record exists for the selected resident, FY and month.',true);return;}
        if(!confirm(`Delete ${MONTHS[monthNo-1]} Colony Fund record for ${r.ownerName||r.name}?`))return;
        for(const p of deleteRows) await RGMS.store.deleteRecord(DF_STORAGE,p.id);
        await refreshColonyAfterCrud();
        clearIntegratedForm();
        colonyUserMessage('Colony Fund record deleted successfully.');
        return;
      }
      if(mode==='save'&&samePeriod.length){colonyUserMessage('A record already exists for this resident, FY and month. Use Update.',true);return;}
      if(mode==='update'&&!selectedRecord&&!samePeriod.length){colonyUserMessage('No existing record found. Click View on the record first, then Update.',true);return;}
      const periodKey=fyMonthKey(fy,monthNo);
      const common={
        residentId:r.residentId||r.id||r.plotNo,plotNo:r.plotNo||r.houseNo,houseNo:r.houseNo||r.plotNo,
        residentType:'Owner',ownerName:r.ownerName||r.name||'',financialYear:fy,
        fundAmount:Number(DEFAULT_FUND_AMOUNT||500),collectionPeriod:periodKey,amountPaid:amount,
        balance:Math.max(0,Number(DEFAULT_FUND_AMOUNT||500)-amount),paymentStatus:amount>0?'Paid':'Unpaid',
        paymentDate:document.getElementById('colonyFormDate')?.value||new Date().toISOString().slice(0,10),
        remarks:'',updatedOn:new Date().toISOString(),updatedBy:role
      };
      if(mode==='update'){
        const primary=selectedRecord||samePeriod[0];
        const conflict=samePeriod.find(p=>String(p.id)!==String(primary.id));
        if(selectedRecord && conflict && (paymentPeriodKey(selectedRecord)!==periodKey || !isMatch(selectedRecord,r))){
          colonyUserMessage('Another record already exists for this resident and month. Please select that record instead.',true);return;
        }
        await RGMS.store.setRecord(DF_STORAGE,primary.id,{...primary,...common});
        // Remove only accidental duplicates for the same resident/FY/month, never unrelated records.
        for(const extra of samePeriod){if(String(extra.id)!==String(primary.id))await RGMS.store.deleteRecord(DF_STORAGE,extra.id);}
        const hidden=document.getElementById('colonyEditPaymentId');if(hidden)hidden.value=String(primary.id);
        await refreshColonyAfterCrud(primary.id);
        colonyUserMessage('Colony Fund record updated successfully.');
      }else{
        if(amount<=0){colonyUserMessage('Amount is zero. Enter an amount before saving a payment.',true);return;}
        const id=await RGMS.store.insertRecord(DF_STORAGE,{...common,createdOn:new Date().toISOString(),createdBy:role});
        const hidden=document.getElementById('colonyEditPaymentId');if(hidden)hidden.value=String(id);
        await refreshColonyAfterCrud(id);
        colonyUserMessage('Colony Fund record saved successfully.');
      }
      renderIntegratedRegister();renderExistingRecords();
    }catch(error){
      console.error('Colony Fund integrated CRUD failed:',error);
      colonyUserMessage(colonyFriendlyError(error,`Unable to ${mode} Colony Fund record. Please try again.`),true);
    }
  }
  function bindIntegrated(){document.getElementById('colonyExistingFY')?.addEventListener('change',renderExistingRecords);document.getElementById('colonyExistingMonth')?.addEventListener('change',renderExistingRecords);document.getElementById('colonyExistingRecordsBody')?.addEventListener('click',e=>{const v=e.target.closest('[data-colony-record-view]');if(v){viewExistingRecord(v.dataset.colonyRecordView);return;}const d=e.target.closest('[data-colony-record-delete]');if(d)deleteExistingRecord(d.dataset.colonyRecordDelete);});document.getElementById('colonyRegisterFY')?.addEventListener('change',()=>{renderIntegratedRegister();const id=document.getElementById('colonyFormResident')?.value;if(id)viewIntegrated(id);});document.getElementById('colonyRegisterMonth')?.addEventListener('change',e=>{renderIntegratedRegister();const fm=document.getElementById('colonyFormMonth');if(fm&&e.target.value!=='ALL')fm.value=e.target.value;const id=document.getElementById('colonyFormResident')?.value;if(id)viewIntegrated(id);});document.getElementById('colonyFormFY')?.addEventListener('change',e=>{const reg=document.getElementById('colonyRegisterFY');if(reg)reg.value=e.target.value;renderIntegratedRegister();const id=document.getElementById('colonyFormResident')?.value;if(id)viewIntegrated(id)});document.getElementById('colonyFormMonth')?.addEventListener('change',()=>{const id=document.getElementById('colonyFormResident')?.value;if(id){const reg=document.getElementById('colonyRegisterMonth');if(reg)reg.value=document.getElementById('colonyFormMonth').value;viewIntegrated(id);}});document.getElementById('colonyFormResident')?.addEventListener('change',e=>{if(e.target.value)viewIntegrated(e.target.value);else clearIntegratedForm();});document.getElementById('colonyFormSave')?.addEventListener('click',()=>persistIntegrated('save'));document.getElementById('colonyFormUpdate')?.addEventListener('click',()=>persistIntegrated('update'));document.getElementById('colonyFormDelete')?.addEventListener('click',()=>persistIntegrated('delete'));document.getElementById('colonyFormClear')?.addEventListener('click',clearIntegratedForm);document.getElementById('colonyIntegratedRegisterBody')?.addEventListener('click',e=>{const w=e.target.closest('[data-colony-whatsapp]');if(w){sendIntegratedWhatsApp(w.dataset.colonyWhatsapp);return;}const b=e.target.closest('[data-colony-view]');if(b)viewIntegrated(b.dataset.colonyView);});}
  const oldInit=window.initializeDevelopmentFund; if(typeof oldInit==='function')window.initializeDevelopmentFund=async function(){const out=await oldInit.apply(this,arguments);setTimeout(()=>{ensureLayout();populateIntegratedSelectors();renderIntegratedRegister();renderExistingRecords();},0);return out;};
  document.addEventListener('DOMContentLoaded',()=>setTimeout(ensureLayout,100)); setTimeout(ensureLayout,250);
  window.RGMSRenderColonyIntegratedRegister=()=>{renderIntegratedRegister();renderExistingRecords();};
})();
