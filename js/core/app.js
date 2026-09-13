/*=========================================================
  RGMS APPLICATION CORE
  Shared application constants and helpers.
=========================================================*/
(function () {
    window.RGMS = window.RGMS || {};

    window.RGMS.STORAGE_KEYS = {
        RESIDENTS: "rgms_residents",
        DEVELOPMENT_FUND: "rgms_development_fund",
        DEVELOPMENT_FUND_SEQUENCE: "developmentFundSequence",
        EXPENDITURES: "rgms_expenditures",
        FESTIVAL_FUND: "rgms_festival_fund",
        GANESH_FESTIVAL: "rgms_ganesh_festival",
        VISITORS: "rgms_visitors",
        COMPLAINTS: "rgms_complaints",
        MEETINGS: "rgms_meetings",
        DOCUMENTS: "rgms_documents",
        NOTICES: "rgms_notices",
        COMMUNICATIONS: "rgms_communications",
        GENERAL_INFORMATION: "rgms_general_information",
        GREETINGS: "rgms_greetings",
        SETTINGS: "rgms_settings",
        USER_PROFILES: "rgms_user_profiles",
        HOME_SERVICES: "rgms_home_services",
        SERVICE_PROVIDERS: "rgms_service_providers",
        BILLERS: "rgms_billers",
        OFFICE_BEARERS: "rgms_office_bearers",
        ASSOCIATION_SETTINGS: "rgms_association_settings",
        PAYMENT_MODES: "rgms_payment_modes",
        FINANCIAL_YEARS: "rgms_financial_years",
        FUND_TYPES: "rgms_fund_types",
        EXPENSE_HEADS: "rgms_expense_heads",
        COMPLAINT_CATEGORIES: "rgms_complaint_categories",
        DOCUMENT_CATEGORIES: "rgms_document_categories",
        NOTICE_CATEGORIES: "rgms_notice_categories",
        VISITOR_TYPES: "rgms_visitor_types",
        MEETING_TYPES: "rgms_meeting_types",
        COMMUNICATION_TEMPLATES: "rgms_communication_templates",
        REPORTS_MASTER: "rgms_reports_master",
        DATA_ENTRY_FIELDS: "rgms_data_entry_fields"
    };

    window.RGMS.DEFAULT_FUND_AMOUNT = 500;
    window.STORAGE_KEYS = window.RGMS.STORAGE_KEYS;
    window.DEFAULT_FUND_AMOUNT = window.RGMS.DEFAULT_FUND_AMOUNT;

    window.App = {
        name: "Rose Gardens",
        shortName: "Rose Gardens",
        version: "1.2.284",
        developer: "Rose Gardens Residents Welfare Association"
    };

    window.getAllRecords = key => window.RGMS.store.getAllRecords(key);
    window.insertRecord = (key, record) => window.RGMS.store.insertRecord(key, record);
    window.updateRecord = (key, idField, idValue, record) => {
        const rows = getAllRecords(key);
        const found = rows.find(r => String(r[idField]) === String(idValue));
        return found ? window.RGMS.store.setRecord(key, found.id, record) : Promise.resolve(false);
    };
    window.deleteRecord = (key, idField, idValue) => {
        const rows = getAllRecords(key).filter(r => String(r[idField]) === String(idValue));
        return Promise.all(rows.map(r => window.RGMS.store.deleteRecord(key, r.id)));
    };
    window.findRecord = (key, idField, idValue) =>
        getAllRecords(key).find(r => String(r[idField]) === String(idValue));

    window.formatCurrency = value =>
        "₹ " + Number(value || 0).toLocaleString("en-IN");

    window.getFinancialYear = function (date = new Date()) {
        const d = new Date(date);
        const y = d.getFullYear();
        return d.getMonth() >= 3
            ? `${y}-${String(y + 1).slice(2)}`
            : `${y - 1}-${String(y).slice(2)}`;
    };

    window.getFinancialYearOptions = function (count = 6) {
        const current = Number(String(window.getFinancialYear()).slice(0, 4));
        const total = Math.max(1, Number(count) || 6);
        return Array.from({ length: total }, (_, i) => {
            const y = current - i;
            return `${y}-${String(y + 1).slice(2)}`;
        });
    };

    window.getCollectionPeriod = function (date = new Date()) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };

    window.normalizePhone = function (value) {
        const digits = String(value || "").replace(/\D/g, "");
        if (!digits) return "";
        if (digits.length === 10) return `+91${digits}`;
        if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
        return digits.startsWith("+") ? digits : `+${digits}`;
    };

    window.formatDate = function (date) {
        if (!date) return "";
        const d = date?.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    window.RGMS.SOCIETY = {
        name: "Rose Gardens Residents Welfare Association",
        shortName: "Rose Gardens",
        address: "Rose Gardens, Cheeryal Ward, Keesara Circle, Medchal Malkajgiri District -501303",
        treasurerName: "S. Krishna Kishore",
        treasurerMobile: "8074689415",
        treasurerWhatsApp: "8074689415",
        upiId: "sriharipriya1209@okhdfcbank",
        upiRecipientName: "S Sri Hari Priya",
        paymentMobile: "+919704035400",
        upiIntentMode: "P2P_SAFE_HANDOFF",
        developmentFund: 500
    };



    /*=========================================================
      RGMS 1.2.284 - AUTHORITATIVE DASHBOARD CALCULATIONS

      One shared calculation is used by both Association Dashboard and
      Colony Fund Dashboard. This prevents navigation order / module script
      collisions from changing the figures.
    =========================================================*/
    const rgDashText = value => String(value ?? '').trim();
    const rgDashNorm = value => rgDashText(value).toLowerCase();
    const rgDashField = (row, names) => {
        for (const name of names) {
            if (row && row[name] !== undefined && row[name] !== null && rgDashText(row[name]) !== '') return row[name];
        }
        const wanted = names.map(n => String(n).toLowerCase().replace(/[\s_.-]/g, ''));
        for (const key of Object.keys(row || {})) {
            const normalizedKey = String(key).toLowerCase().replace(/[\s_.-]/g, '');
            if (wanted.includes(normalizedKey) && row[key] !== undefined && row[key] !== null && rgDashText(row[key]) !== '') return row[key];
        }
        return '';
    };
    const rgDashHouseKey = row => {
        const raw = rgDashText(rgDashField(row, ['houseNo','HouseNo','House No','H.No.','H.No','plotNo','PlotNo','Plot No','plotNumber']));
        if (!raw) return '';
        const formatted = typeof window.formatHNo === 'function' ? window.formatHNo(raw) : raw;
        return rgDashNorm(formatted).replace(/^2-1\//, '');
    };
    const rgDashResidentType = row => rgDashNorm(rgDashField(row, ['residentType','ResidentType','Resident Type','resident_type','type','Type']));
    const rgDashOccupation = row => rgDashNorm(rgDashField(row, ['occupationStatus','OccupationStatus','Occupation Status','occupation_status','occupancyStatus','Occupancy Status','status','Status']));
    const rgDashResidentId = row => rgDashNorm(rgDashField(row, ['residentId','ResidentId','Resident ID','Resident Id','resident_id','id','ID']));
    const rgDashResidentName = row => rgDashNorm(rgDashField(row, ['ownerName','OwnerName','Owner Name','name','Name','residentName','Resident Name']));

    window.RGMS.isColonyFundEligibleOwner = function (row) {
        if (!row || rgDashResidentType(row) !== 'owner') return false;
        // RGMS 1.2.284 Colony Fund rule: Resident Type = Owner is eligible for
        // every Occupation Status. Tenant/Family Member are excluded. Occupation
        // Status must never remove an Owner from Expected/Pending calculations.
        return !!rgDashResidentName(row);
    };

    window.RGMS.getAssociationHouseSummary = function (residentRows = []) {
        const groups = new Map();
        (Array.isArray(residentRows) ? residentRows : []).forEach(row => {
            const key = rgDashHouseKey(row);
            if (!key) return;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(row);
        });

        let owners = 0, tenants = 0, vacant = 0;
        const details = [];
        groups.forEach((rows, houseKey) => {
            const occupations = rows.map(rgDashOccupation).filter(Boolean);
            const types = rows.map(rgDashResidentType).filter(Boolean);
            let classification = 'vacant';
            // Tenant wins when the house is explicitly occupied by a tenant.
            if (occupations.includes('tenant')) classification = 'tenant';
            else if (occupations.includes('owner')) classification = 'owner';
            else if (occupations.includes('occupied')) classification = types.includes('tenant') ? 'tenant' : 'owner';
            else if (rows.some(r => r?.isVacant !== true && rgDashOccupation(r) !== 'vacant')) {
                if (types.includes('tenant')) classification = 'tenant';
                else if (types.includes('owner')) classification = 'owner';
            }
            if (classification === 'owner') owners++;
            else if (classification === 'tenant') tenants++;
            else vacant++;
            details.push({ houseKey, classification, rows });
        });

        return {
            totalHouses: groups.size,
            occupiedHouses: owners + tenants,
            ownerOccupiedHouses: owners,
            tenantOccupiedHouses: tenants,
            vacantHouses: vacant,
            details
        };
    };

    // Colony Fund obligation starts from July 2026. April-June 2026 must never
    // be included in Expected/Pending Fund, dashboard drill-downs or reports.
    window.RGMS.COLONY_FUND_START_PERIOD = '2026-07';
    window.RGMS.getColonyFundMonthsForFY = function (financialYear, asOf = new Date()) {
        const fy = rgDashText(financialYear || window.getFinancialYear(asOf));
        const match = fy.match(/^(\d{4})-(\d{2})$/);
        if (!match) return [];
        const startYear = Number(match[1]);
        const currentFY = window.getFinancialYear(asOf);
        let count = 12;
        if (fy > currentFY) count = 0;
        else if (fy === currentFY) {
            const d = new Date(asOf);
            count = d.getMonth() >= 3 ? d.getMonth() - 2 : d.getMonth() + 10;
        }
        const startPeriod = String(window.RGMS.COLONY_FUND_START_PERIOD || '2026-07');
        return Array.from({ length: count }, (_, i) => {
            const d = new Date(startYear, 3 + i, 1);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }).filter(monthKey => monthKey >= startPeriod);
    };

    window.RGMS.colonyFundPaymentPeriod = function (row) {
        const cp = rgDashText(rgDashField(row, ['collectionPeriod','CollectionPeriod','Collection Period','monthKey','MonthKey','paymentMonth','month','Month']));
        if (/^\d{4}-\d{2}$/.test(cp)) return cp;
        if (/^\d{4}-\d{2}-\d{2}/.test(cp)) return cp.slice(0, 7);
        const date = rgDashText(rgDashField(row, ['paymentDate','Payment Date','dateOfPayment','Date of Payment','date','Date','createdOn']));
        return /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : '';
    };

    window.RGMS.colonyFundPaymentMatchesResident = function (payment, resident) {
        if (!payment || !resident) return false;
        const paymentType = rgDashResidentType(payment);
        if (paymentType === 'tenant' || paymentType === 'family member' || paymentType === 'family') return false;

        const ph = rgDashHouseKey(payment), rh = rgDashHouseKey(resident);
        const pt = paymentType || 'owner', rt = rgDashResidentType(resident) || 'owner';
        // House + type is authoritative for Colony Fund. Legacy data contains
        // duplicated Resident IDs, so an ID must never join two different houses.
        if (ph && rh) return ph === rh && (!pt || !rt || pt === rt || (pt === 'occupied' && rt === 'owner'));

        const pid = rgDashResidentId(payment), rid = rgDashResidentId(resident);
        if (pid && rid && pid === rid) return true;
        const pn = rgDashResidentName(payment), rn = rgDashResidentName(resident);
        return !!(pn && rn && pn === rn);
    };

    window.RGMS.getColonyFundSummary = function (options = {}) {
        const residents = Array.isArray(options.residents) ? options.residents : [];
        const payments = Array.isArray(options.payments) ? options.payments : [];
        const expenditures = Array.isArray(options.expenditures) ? options.expenditures : [];
        const financialYear = rgDashText(options.financialYear || window.getFinancialYear());
        const selectedMonth = rgDashText(options.month || window.getCollectionPeriod()).slice(0, 7);
        const monthlyAmount = Number(options.monthlyAmount || window.RGMS.DEFAULT_FUND_AMOUNT || 500);
        const houseSummary = window.RGMS.getAssociationHouseSummary(residents);

        const ownerMap = new Map();
        residents.filter(window.RGMS.isColonyFundEligibleOwner).forEach(row => {
            const key = rgDashHouseKey(row) || rgDashResidentId(row) || rgDashResidentName(row);
            if (key && !ownerMap.has(key)) ownerMap.set(key, row);
        });
        const eligibleOwners = [...ownerMap.values()];
        const fyMonths = window.RGMS.getColonyFundMonthsForFY(financialYear);

        const paidFor = (resident, monthKey) => {
            const rows = payments.filter(p => window.RGMS.colonyFundPaymentMatchesResident(p, resident) && window.RGMS.colonyFundPaymentPeriod(p) === monthKey);
            const amount = rows.reduce((sum, row) => sum + Number(rgDashField(row, ['amountPaid','Amount Paid','paidAmount','Paid Amount','paymentAmount','amount','Amount']) || 0), 0);
            const explicitlyPaid = rows.some(row => rgDashNorm(rgDashField(row, ['paymentStatus','Payment Status','status','Status'])) === 'paid');
            return explicitlyPaid || amount >= monthlyAmount;
        };

        let paidFYUnits = 0;
        for (const owner of eligibleOwners) {
            for (const monthKey of fyMonths) if (paidFor(owner, monthKey)) paidFYUnits++;
        }
        const monthIsDue = fyMonths.includes(selectedMonth);
        const paidMonthUnits = monthIsDue ? eligibleOwners.filter(owner => paidFor(owner, selectedMonth)).length : 0;

        const expectedFY = eligibleOwners.length * monthlyAmount * fyMonths.length;
        const expectedMonth = monthIsDue ? eligibleOwners.length * monthlyAmount : 0;
        const collectedFY = paidFYUnits * monthlyAmount;
        const collectedMonth = paidMonthUnits * monthlyAmount;

        const expenseVariant = row => rgDashNorm(rgDashField(row, ['expenditureVariant','fundType','fund','variant','module','expenseType']));
        const isColonyExpense = row => {
            const v = expenseVariant(row);
            return v.includes('colony') || v.includes('development') || v.includes('maintenance');
        };
        const expenseMonth = row => {
            const d = rgDashText(rgDashField(row, ['date','expenditureDate','expenseDate','paymentDate','createdOn']));
            return /^\d{4}-\d{2}/.test(d) ? d.slice(0, 7) : '';
        };
        const expensePaid = row => {
            const direct = rgDashField(row, ['advancePaid','advance','paidAmount','amountPaid']);
            if (direct !== '') return Number(direct) || 0;
            const committed = Number(rgDashField(row, ['amountCommitted','amount','totalAmount']) || 0) || 0;
            return rgDashNorm(rgDashField(row, ['paymentStatus','status'])) === 'paid' ? committed : 0;
        };
        const colonyExpenses = expenditures.filter(isColonyExpense);
        const expenditureFY = colonyExpenses.filter(row => fyMonths.includes(expenseMonth(row))).reduce((sum, row) => sum + expensePaid(row), 0);
        const expenditureMonth = monthIsDue ? colonyExpenses.filter(row => expenseMonth(row) === selectedMonth).reduce((sum, row) => sum + expensePaid(row), 0) : 0;

        return {
            financialYear,
            selectedMonth,
            monthlyAmount,
            totalHouses: houseSummary.totalHouses,
            eligibleOwnerCount: eligibleOwners.length,
            eligibleOwners,
            fyMonths,
            expectedFY,
            expectedMonth,
            collectedFY,
            collectedMonth,
            pendingFY: Math.max(0, expectedFY - collectedFY),
            pendingMonth: Math.max(0, expectedMonth - collectedMonth),
            expenditureFY,
            expenditureMonth,
            balanceFY: collectedFY - expenditureFY,
            balanceMonth: collectedMonth - expenditureMonth,
            houseSummary
        };
    };
    window.SOCIETY = window.RGMS.SOCIETY;
})();


// House Number display/normalization: user-facing H.No. is always 2-1/<plot>.
function formatHNo(value){
  const v=String(value??'').trim();
  if(!v) return '';
  const m=v.match(/^(?:2-1\/)?(.+)$/i);
  return '2-1/'+(m?m[1].trim():v);
}
function extractPlotNo(value){
  const v=String(value??'').trim();
  if(!v) return '';
  return v.replace(/^2-1\//i,'').trim();
}
window.formatHNo=formatHNo; window.extractPlotNo=extractPlotNo;

/* Universal register scrolling: every dynamically loaded register/table gets
   independent left-right and top-bottom scrolling. */
(function enableRegisterScrolling(){
    function wrapTables(root=document){
        root.querySelectorAll?.('table').forEach(table=>{
            if (table.closest('.rg-register-scroll')) return;
            // Avoid wrapping tiny layout tables used by receipts/dialogs.
            const rows = table.querySelectorAll('tbody tr').length;
            const cells = table.querySelectorAll('thead th').length;
            if (!rows && !cells) return;
            const wrap=document.createElement('div');
            wrap.className='rg-register-scroll';
            table.parentNode.insertBefore(wrap,table);
            wrap.appendChild(table);
        });
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>wrapTables());
    else wrapTables();
    const observer=new MutationObserver(mutations=>{
        mutations.forEach(m=>m.addedNodes.forEach(n=>{
            if(n.nodeType===1) wrapTables(n);
        }));
    });
    observer.observe(document.body,{childList:true,subtree:true});
    window.RGMS=window.RGMS||{};
    window.RGMS.refreshRegisterScrolling=wrapTables;
})();


/*=========================================================
  RGMS 1.2.284 - GLOBAL DATA / LAYOUT CONSISTENCY
  - Resident/name dropdowns display Name only.
  - In resident-linked tables H.No. is placed immediately after Name.
  - Registers/reports with a person-name column are alphabetically sorted.
  This is a presentation rule only; Firestore IDs remain the selection keys.
=========================================================*/
(function enforceGlobalPresentationConsistency(){
  const clean=v=>String(v??'').trim();
  const norm=v=>clean(v).toLowerCase().replace(/\s+/g,' ');
  const isHouseHeader=t=>/^(h\.?\s*no\.?|house\s*no\.?|plot\s*no\.?)$/i.test(clean(t));
  const isNameHeader=t=>/^(name|resident|resident name|owner|owner name|winner|winner name|visitor|visitor name|chairperson)$/i.test(clean(t));

  function labelForSelect(select){
    if(!select) return '';
    const group=select.closest('.form-group,.field,.input-group,td,th,div');
    const label=group?.querySelector?.('label');
    return clean(label?.textContent||'');
  }
  function looksResidentNameSelect(select){
    const id=clean(select?.id||select?.name).toLowerCase();
    const label=labelForSelect(select).toLowerCase();
    return /(resident|owner|winner|sponsor).*name|(^|[-_])name($|[-_])/.test(id) || /^(name|resident name|owner name|winner name)$/i.test(label);
  }
  function nameOnlyOptionText(text){
    let t=clean(text);
    if(!t || /^select\b/i.test(t)) return t;
    // Remove only an appended Rose Gardens H.No.; ordinary hyphenated names are untouched.
    t=t.replace(/\s+[\-–—]\s+(?:h\.?\s*no\.?\s*)?2-1\/[^()\s]+(?:\s*\([^)]*\))?\s*$/i,'');
    t=t.replace(/\s*\((?:owner|tenant|family member)\)\s*$/i,'');
    return clean(t);
  }
  function cleanResidentDropdowns(root=document){
    root.querySelectorAll?.('select').forEach(sel=>{
      if(!looksResidentNameSelect(sel)) return;
      [...sel.options].forEach(opt=>{
        const cleaned=nameOnlyOptionText(opt.textContent);
        if(cleaned && cleaned!==opt.textContent) opt.textContent=cleaned;
      });
    });
  }

  function reorderAndSortTable(table){
    if(!table || table.dataset.rgConsistencyBusy==='1') return;
    const headRows=[...table.querySelectorAll('thead tr')];
    // Use the last conventional header row; section-title rows usually have one colspan cell.
    const headerRow=[...headRows].reverse().find(r=>r.children.length>1);
    if(!headerRow) return;
    let headers=[...headerRow.children];
    let nameIndex=headers.findIndex(c=>isNameHeader(c.textContent));
    let houseIndex=headers.findIndex(c=>isHouseHeader(c.textContent));
    table.dataset.rgConsistencyBusy='1';
    try{
      if(nameIndex>=0 && houseIndex>=0 && houseIndex!==nameIndex+1){
        const targetIndex=nameIndex+1;
        const moveCell=(row,from,to)=>{
          const cells=[...row.children];
          if(from<0||from>=cells.length) return;
          const cell=cells[from];
          const remaining=[...row.children].filter(x=>x!==cell);
          const before=remaining[to]||null;
          row.insertBefore(cell,before);
        };
        moveCell(headerRow,houseIndex,targetIndex);
        table.querySelectorAll('tbody tr').forEach(row=>{
          if(row.children.length===headers.length) moveCell(row,houseIndex,targetIndex);
        });
        headers=[...headerRow.children];
        nameIndex=headers.findIndex(c=>isNameHeader(c.textContent));
      }
      if(nameIndex>=0){
        const tbody=table.tBodies?.[0];
        if(tbody){
          const sortable=[...tbody.rows].filter(r=>{
            if(r.classList.contains('empty')||r.classList.contains('report-section-title')||r.classList.contains('report-section-head')||r.classList.contains('report-section-spacer')||r.classList.contains('colony-month-total')) return false;
            return r.children.length===headers.length && ![...r.children].some(c=>Number(c.colSpan||1)>1);
          });
          if(sortable.length>1){
            // IMPORTANT: never append rows again when they are already in the
            // requested order. appendChild() itself creates a childList mutation;
            // the global MutationObserver below would otherwise schedule this
            // sorter forever and freeze the page after a dashboard drill-down.
            const current=sortable.slice();
            const ordered=sortable.slice().sort((a,b)=>{
              const an=clean(a.children[nameIndex]?.textContent);
              const bn=clean(b.children[nameIndex]?.textContent);
              return an.localeCompare(bn,'en',{sensitivity:'base',numeric:true});
            });
            const orderChanged=ordered.some((r,i)=>r!==current[i]);
            if(orderChanged) ordered.forEach(r=>tbody.appendChild(r));
            // Re-number S.No. after sorting, but write only when the value differs
            // so the observer remains idempotent.
            const firstHeader=clean(headers[0]?.textContent).toLowerCase();
            if(/^(s\.?no\.?|no\.?)$/.test(firstHeader)) ordered.forEach((r,i)=>{if(r.children[0]&&r.children[0].textContent!==String(i+1))r.children[0].textContent=String(i+1);});
          }
        }
      }
    } finally { table.dataset.rgConsistencyBusy='0'; }
  }
  function apply(root=document){
    cleanResidentDropdowns(root);
    root.querySelectorAll?.('table').forEach(reorderAndSortTable);
  }
  let timer=0;
  const schedule=root=>{
    clearTimeout(timer);
    timer=setTimeout(()=>apply(root&&root.nodeType===1?root:document),25);
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>apply(document)); else apply(document);
  const observer=new MutationObserver(ms=>{
    if(ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1))) schedule(document);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.RGMS=window.RGMS||{};
  window.RGMS.applyDataPresentationConsistency=apply;
})();

/* Rose Gardens 1.2.28 - Dashboard card navigation */
(function(){
  function go(key){
    var map={
      residents:['residents','Residents'], visitors:['visitors','Visitors'], complaints:['complaints','Complaints'], meetings:['meetings','Meetings'], documents:['documents','Documents'], notices:['notices','Notices'], communications:['communications','Communications'], developmentFundPayments:['developmentFundPayments','Colony Fund'], festivalFundPayments:['festivalFundPayments','Ganesh Festival'], ganeshFestivalCelebrations:['ganeshFestivalCelebrations','Ganesh Festival'], homeServices:['homeServices','Home Services'], serviceProviders:['serviceProviders','Service Providers'], billers:['billers','Utility Billers'], expenses:['expenses','Expenditure']
    };
    var x=map[key]; if(!x)return;
    try{ if(typeof window.showRegister==='function'){window.showRegister(x[0]);return;} if(typeof window.loadRegister==='function'){window.loadRegister(x[0]);return;} if(typeof window.navigateTo==='function'){window.navigateTo(x[0]);return;} if(typeof window.showSection==='function'){window.showSection(x[0]);return;} }catch(e){console.error(e);}
    var el=document.querySelector('[data-register="'+x[0]+'"], [data-module="'+x[0]+'"]'); if(el){el.click();return;}
    var buttons=[...document.querySelectorAll('button,a,[role="button"]')]; var b=buttons.find(function(n){return (n.textContent||'').trim().toLowerCase().indexOf(x[1].toLowerCase())>=0}); if(b)b.click();
  }
  document.addEventListener('click',function(e){var card=e.target.closest('[data-dashboard-card],[data-card-key]'); if(!card||card.closest('.association-dashboard-page'))return; var k=card.dataset.dashboardCard||card.dataset.cardKey; if(k)go(k);});
  window.RGMS=window.RGMS||{}; window.RGMS.dashboardCardNavigate=go;
})();


/* RGMS 1.2.227 — align dynamic register/report data under the correct headings */
(function(){
  function normHeader(v){return String(v||'').replace(/\s+/g,' ').trim().toLowerCase();}
  function headerKind(text){
    const h=normHeader(text);
    if(!h) return 'text';
    if(/action|select|view|edit|delete/.test(h)) return 'action';
    if(/amount|paid|due|balance|total|fund|chanda|laddu|expenditure|projected|advance|₹|rs\.?/.test(h) && !/status|type/.test(h)) return 'num';
    if(/^(s\.?\s*no\.?|no\.?|id|fy|date|month|year|h\.?\s*no\.?|plot|plot no\.?|mobile|phone|cell no\.?|status|type|mode|resident type|occupation status|records|period)$/.test(h)) return 'center';
    if(/date|status|mode|mobile|phone|h\.no|h no|resident id|financial year|payment status/.test(h)) return 'center';
    return 'text';
  }
  function expandedKinds(cells){
    const out=[];
    Array.from(cells).forEach(cell=>{
      const kind=headerKind(cell.textContent);
      const span=Math.max(1,Number(cell.colSpan||1));
      for(let i=0;i<span;i++) out.push(kind);
    });
    return out;
  }
  function clearKinds(cell){cell.classList.remove('rg-col-text','rg-col-center','rg-col-num','rg-col-action');}
  function addKind(cell,kind){clearKinds(cell);cell.classList.add('rg-col-'+(kind||'text'));}
  function alignTable(table){
    if(!table || table.dataset.rgAligning==='1') return;
    table.dataset.rgAligning='1';
    try{
      let activeKinds=[];
      Array.from(table.rows||[]).forEach(row=>{
        const ths=Array.from(row.cells||[]).filter(c=>c.tagName==='TH');
        if(ths.length){
          const isSection=ths.length===1 && Number(ths[0].colSpan||1)>1;
          if(!isSection){
            activeKinds=expandedKinds(ths);
            let pos=0;
            ths.forEach(th=>{
              const kind=headerKind(th.textContent); addKind(th,kind);
              pos += Math.max(1,Number(th.colSpan||1));
            });
          }
          return;
        }
        if(!activeKinds.length) return;
        let visual=0;
        Array.from(row.cells||[]).forEach(td=>{
          if(td.tagName!=='TD') return;
          const span=Math.max(1,Number(td.colSpan||1));
          const kinds=activeKinds.slice(visual,visual+span);
          const kind=kinds.includes('num')?'num':kinds.includes('action')?'action':kinds.includes('center')?'center':'text';
          addKind(td,kind);
          visual += span;
        });
      });
    } finally { delete table.dataset.rgAligning; }
  }
  function alignAll(root){
    const scope=root&&root.querySelectorAll?root:document;
    if(scope.matches?.('table')) alignTable(scope);
    scope.querySelectorAll?.('table').forEach(alignTable);
  }
  let queued=false;
  function queueAlign(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;alignAll(document);});}
  document.addEventListener('DOMContentLoaded',queueAlign);
  const obs=new MutationObserver(queueAlign);
  obs.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.RGMS=window.RGMS||{};
  window.RGMS.alignRegisterReportTables=()=>alignAll(document);
})();
