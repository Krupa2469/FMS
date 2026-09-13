
/* RGMS 1.2.170 - runtime layout enforcement.
   CSS accumulated across historical releases can conflict in Android WebView.
   Apply the final card geometry as inline !important declarations so dashboard
   values cannot be pushed outside the card by any older stylesheet. */
function rg170ApplyAssociationCardLayout(){
    const grid=document.querySelector('.association-dashboard-page .association-summary-grid');
    if(!grid) return;
    const mobile=window.matchMedia('(max-width:600px)').matches;
    grid.style.setProperty('display','grid','important');
    grid.style.setProperty('grid-template-columns','repeat(2,minmax(0,1fr))','important');
    grid.style.setProperty('gap',mobile?'10px':'12px','important');
    grid.querySelectorAll(':scope > .summary-card').forEach(card=>{
        const detail=card.querySelector('.dashboard-dual-values');
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

/* RGMS 1.2.284: Colony Fund calculations are centralized in js/core/app.js.
   Keep this module free of duplicate top-level const/function names so visiting
   Association Dashboard and Colony Fund in either order cannot change values. */

async function initializeDashboard(){
    rg170ApplyAssociationCardLayout();

    const keys = [
        STORAGE_KEYS.RESIDENTS,
        STORAGE_KEYS.DEVELOPMENT_FUND,
        STORAGE_KEYS.FESTIVAL_FUND,
        STORAGE_KEYS.GANESH_FESTIVAL,
        STORAGE_KEYS.COMPLAINTS,
        STORAGE_KEYS.VISITORS,
        STORAGE_KEYS.MEETINGS,
        STORAGE_KEYS.DOCUMENTS,
        STORAGE_KEYS.EXPENDITURES
    ];

    // Navigation already performs an authoritative refresh for dashboard data.
    // Reuse that snapshot here, but if Residents is unexpectedly empty perform
    // one forced retry so first-open values never require a browser refresh.
    const loadErrors=[];
    await Promise.all(keys.map(async key => {
        try { await RGMS.store.loadCollection(key, {retries: 2, ttlMs: 10000}); }
        catch (e) { loadErrors.push({key,error:e}); console.warn('Association Dashboard Firebase load failed:', key, e); }
    }));
    let residents=RGMS.store.getResidentMaster({includeVacant:true});
    if (!residents.length) {
        try {
            await RGMS.store.refreshCollection(STORAGE_KEYS.RESIDENTS, {retries: 3});
            residents=RGMS.store.getResidentMaster({includeVacant:true});
        } catch (e) { loadErrors.push({key:STORAGE_KEYS.RESIDENTS,error:e}); }
    }
    const houseSummary = RGMS.getAssociationHouseSummary(residents);
    const festivalModern=getAllRecords(STORAGE_KEYS.GANESH_FESTIVAL);
    const festivalLegacy=getAllRecords(STORAGE_KEYS.FESTIVAL_FUND);
    const complaints=getAllRecords(STORAGE_KEYS.COMPLAINTS);
    const visitors=getAllRecords(STORAGE_KEYS.VISITORS);
    const meetings=getAllRecords(STORAGE_KEYS.MEETINGS);
    const docs=getAllRecords(STORAGE_KEYS.DOCUMENTS);
    const today=new Date().toISOString().slice(0,10);

    const setText=(id,value)=>{ const el=document.getElementById(id); if(el) el.textContent=value; };
    const status=document.getElementById('statusText');
    if(status){
        const counts={residents:residents.length,developmentFund:getAllRecords(STORAGE_KEYS.DEVELOPMENT_FUND).length,festival:getAllRecords(STORAGE_KEYS.FESTIVAL_FUND).length,ganesh:getAllRecords(STORAGE_KEYS.GANESH_FESTIVAL).length,complaints:complaints.length,visitors:visitors.length,meetings:meetings.length,documents:docs.length};
        console.log('RGMS Association Dashboard Firebase counts:', counts, 'errors:', loadErrors);
        status.textContent=loadErrors.length ? `Firebase data load issue: ${loadErrors[0].error?.message || 'read failed'}` : `Firebase data loaded — ${residents.length} residents`;
    }
    setText('associationTotalHouses',houseSummary.totalHouses);
    setText('associationResidents',houseSummary.occupiedHouses);
    setText('associationOwners',houseSummary.ownerOccupiedHouses);
    setText('associationTenants',houseSummary.tenantOccupiedHouses);
    setText('associationVacant',houseSummary.vacantHouses);
    // Current-FY/current-month Colony Fund figures use exactly the same owner-only
    // business rules as the Colony Fund Dashboard.
    const currentFY=String(getFinancialYear());
    const currentMonth=String(getCollectionPeriod()).slice(0,7);
    setText('associationColonyFYLabel', currentFY);
    const currentMonthLabel=new Date(Number(currentMonth.slice(0,4)),Number(currentMonth.slice(5,7))-1,1).toLocaleDateString('en-IN',{month:'long'});
    setText('associationColonyMonthLabel', currentMonthLabel);
    setText('associationPendingFYLabel', currentFY);
    setText('associationPendingMonthLabel', currentMonthLabel);
    const rowPeriod=r=>String(r?.collectionPeriod||r?.paymentDate||r?.auctionDate||r?.date||r?.createdOn||'').slice(0,7);
    const rowFY=r=>{if(r?.financialYear)return String(r.financialYear);const q=rowPeriod(r);if(/^\d{4}-\d{2}$/.test(q)){const y=Number(q.slice(0,4)),m=Number(q.slice(5,7));return m>=4?`${y}-${String(y+1).slice(2)}`:`${y-1}-${String(y).slice(2)}`;}return '';};
    const devRows=getAllRecords(STORAGE_KEYS.DEVELOPMENT_FUND);
    const allExpenditures=getAllRecords(STORAGE_KEYS.EXPENDITURES);
    const colonySummary=RGMS.getColonyFundSummary({
        residents, payments:devRows, expenditures:allExpenditures,
        financialYear:currentFY, month:currentMonth
    });
    const colonyFY=colonySummary.collectedFY;
    const colonyMonth=colonySummary.collectedMonth;
    const pendingFY=colonySummary.pendingFY;
    const pendingMonth=colonySummary.pendingMonth;
    // Keep Ganesh dashboard figures aligned with the exact records shown by the
    // clickable paid registers. Legacy Chanda/Laddu records can have missing or old
    // financialYear metadata even though the paid record itself is valid. A strict FY
    // filter made the card show ₹0 while the drill-down correctly showed the amount.
    const paidGanesh=festivalModern.filter(r=>String(r.paymentStatus||r.status||'Paid').toLowerCase()==='paid');
    const ganeshChanda=paidGanesh.filter(r=>{const t=String(r.recordType||r.type||'chanda').toLowerCase();const cash=Number(r.cashContributionAmount??r.sponsorCashContribution??r.contributionAmount??r.chandaAmount??r.amountPaid??r.paidAmount??r.amount??0)||0;return !t.includes('laddu')&&!t.includes('auction')&&(!t.includes('sponsor')||cash>0);}).reduce((a,r)=>a+Number(String(r.recordType||r.type||'').toLowerCase().includes('sponsor')?(r.cashContributionAmount??r.sponsorCashContribution??r.contributionAmount??r.chandaAmount??r.amountPaid??r.paidAmount??r.amount??0):(r.amountPaid??r.paidAmount??r.chandaAmount??r.amount??0)),0);
    const rawAuctionRows=[...festivalModern,...festivalLegacy].filter(r=>{const t=String(r.recordType||r.type||'').toLowerCase();const explicit=Number(r.auctionAmount??r.ladduAuctionAmount??r.ladduAmount??r.winningBid??r.winningAmount??0)||0;return t.includes('laddu')||t.includes('auction')||explicit>0||Boolean(r.auctionDate||r.winnerName||r.auctionWinner||r.ladduWinner);});
    const seenAuction=new Set();
    const paidAuctionRows=rawAuctionRows.filter(r=>{const amt=Number(r.auctionAmount??r.ladduAuctionAmount??r.ladduAmount??r.amountPaid??r.paidAmount??r.amount??0)||0;const explicitStatus=String(r.paymentStatus||r.status||'').trim().toLowerCase();const paid=explicitStatus?explicitStatus==='paid':amt>0;const k=String(r.id||r._id||r.docId||r.documentId||'').trim()||[r.auctionDate||r.paymentDate,r.winnerName||r.ownerName,r.winnerPlotNo||r.houseNo||r.plotNo,amt].map(v=>String(v??'').trim().toLowerCase()).join('|');if(!paid||seenAuction.has(k))return false;seenAuction.add(k);return true;});
    const ganeshLaddu=paidAuctionRows.reduce((a,r)=>a+Number(r.auctionAmount??r.ladduAuctionAmount??r.ladduAmount??r.amountPaid??r.paidAmount??r.amount??0),0);
    const ganeshSponsors=festivalModern.filter(r=>String(r.recordType||r.type||'').toLowerCase().includes('sponsor')).length;
    const expRows=allExpenditures.filter(r=>rowFY(r)===currentFY);
    const advanceOf=r=>{const d=r.advancePaid??r.advance??r.paidAmount??r.amountPaid;if(d!==undefined&&d!==null&&String(d)!=='')return Number(d)||0;const c=Number(r.amountCommitted??r.amount??r.totalAmount??0)||0;return String(r.paymentStatus||'').toLowerCase()==='paid'?c:0;};const ganeshExp=expRows.filter(r=>{const f=String(r.expenditureVariant||r.fundType||r.fund||r.variant||'').toLowerCase();return f.includes('ganesh')||f.includes('festival');}).reduce((a,r)=>a+advanceOf(r),0);
    const colonyExp=colonySummary.expenditureFY;
    setText('associationColonyFY',formatCurrency(colonyFY));
    setText('associationColonyMonth',formatCurrency(colonyMonth));
    setText('associationPendingFY',formatCurrency(pendingFY));
    setText('associationPendingMonth',formatCurrency(pendingMonth));
    setText('associationGaneshChanda',formatCurrency(ganeshChanda));
    setText('associationGaneshLaddu',formatCurrency(ganeshLaddu));
    setText('associationGaneshSponsors',ganeshSponsors);
    setText('associationGaneshExpenditure',formatCurrency(ganeshExp));
    setText('associationColonyExpenditure',formatCurrency(colonyExp));
    setText('associationGaneshBalance',formatCurrency(ganeshChanda+ganeshLaddu-ganeshExp));
    setText('associationColonyBalance',formatCurrency(colonySummary.balanceFY));
    const openComplaints=complaints.filter(r=>!['Resolved','Closed'].includes(r.status)).length;
    const todayVisitors=visitors.filter(r=>r.visitDate===today).length;
    const upcomingMeetings=meetings.filter(r=>r.meetingDate>=today&&r.status==='To be held').length;
    setText('associationComplaints',openComplaints);
    setText('associationVisitors',todayVisitors);
    setText('associationMeetings',upcomingMeetings);
    setText('associationDocuments',docs.length);
    rg170ApplyAssociationCardLayout();
    requestAnimationFrame(rg170ApplyAssociationCardLayout);
    setTimeout(rg170ApplyAssociationCardLayout,120);

}

window.initializeDashboard=initializeDashboard;
window.addEventListener('rgms:data-changed', async function(e){
    const key=e?.detail?.key;
    const dashboardKeys=[STORAGE_KEYS.RESIDENTS,STORAGE_KEYS.DEVELOPMENT_FUND,STORAGE_KEYS.EXPENDITURES,STORAGE_KEYS.FESTIVAL_FUND,STORAGE_KEYS.GANESH_FESTIVAL,STORAGE_KEYS.COMPLAINTS,STORAGE_KEYS.VISITORS,STORAGE_KEYS.MEETINGS,STORAGE_KEYS.DOCUMENTS];
    if(!dashboardKeys.includes(key)) return;
    const active=document.querySelector('.menu-item.active')?.dataset.module;
    if(active!=='dashboard') return;
    try{ await initializeDashboard(); }catch(err){ console.warn('Association Dashboard refresh failed:',err); }
});

/* Rose Gardens 1.2.52 - dashboard number -> resident detail drill-down */
(function(){
    const norm=v=>String(v??'').trim().toLowerCase();
    const amount=v=>Number(v||0);
    const money=v=>typeof formatCurrency==='function'?formatCurrency(v):('₹'+amount(v).toLocaleString('en-IN'));
    const hno=r=>typeof formatHNo==='function'?formatHNo(r?.houseNo||r?.plotNo||''):(r?.houseNo||r?.plotNo||'');
    const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const residents=()=>RGMS.store.getResidentMaster({includeVacant:true});
    const payments=()=>getAllRecords(STORAGE_KEYS.DEVELOPMENT_FUND);
    const period=p=>{const x=String(p?.collectionPeriod||'').slice(0,7); if(/^\d{4}-\d{2}$/.test(x))return x; return String(p?.paymentDate||p?.createdOn||'').slice(0,7);};
    const monthLabel=k=>{if(!/^\d{4}-\d{2}$/.test(k))return k;const [y,m]=k.split('-').map(Number);return new Date(y,m-1,1).toLocaleDateString('en-IN',{month:'short',year:'numeric'});};
    const matches=(p,r)=>{const pid=norm(p?.residentId),rid=norm(r?.residentId);if(pid&&rid&&pid===rid)return true;const a=norm(p?.houseNo||p?.plotNo),b=norm(r?.houseNo||r?.plotNo);return a&&b&&a===b;};
    function getSelectedFY(){return String(document.getElementById('dfFinancialYear')?.value||getFinancialYear()).trim();}
    function fyOf(p){const x=period(p);if(/^\d{4}-\d{2}$/.test(x)){const y=+x.slice(0,4),m=+x.slice(5);return m>=4?`${y}-${String(y+1).slice(2)}`:`${y-1}-${String(y).slice(2)}`;}return '';}
    function ownerResidents(){return residents().filter(r=>norm(r.residentType)==='owner');}
    function show(title,subtitle,head,body){
      const sec=document.getElementById('associationDashboardDetailSection');if(!sec)return;
      document.getElementById('associationDashboardDetailHead').innerHTML=head;
      document.getElementById('associationDashboardDetailBody').innerHTML=body||'<tr><td colspan="20" class="empty">No matching records found.</td></tr>';const sb=document.getElementById('associationFilteredSummary');if(sb){sb.innerHTML='';sb.style.display='none';}
      sec.style.display='block'; sec.classList.add('dashboard-dropdown-open'); window.RGMS?.refreshRegisterScrolling?.();
    }
    function sortHouses(rows){
      return rows.slice().sort((a,b)=>{
        const an=String(a?.ownerName||a?.residentName||a?.name||'');
        const bn=String(b?.ownerName||b?.residentName||b?.name||'');
        return an.localeCompare(bn,'en',{sensitivity:'base',numeric:true}) || String(hno(a)).localeCompare(String(hno(b)),undefined,{numeric:true});
      });
    }
    function findResidentForRow(row){
      const rs=residents();
      const rid=norm(row?.residentId||row?.winnerResidentId||row?.residentID||row?.['Resident ID']);
      if(rid){
        const direct=rs.find(r=>norm(r?.residentId||r?.residentID||r?.id||r?.['Resident ID'])===rid);
        if(direct)return direct;
      }
      const house=norm(row?.houseNo||row?.plotNo||row?.winnerPlotNo||row?.['H.No.']);
      const name=norm(row?.ownerName||row?.residentName||row?.winnerName||row?.name);
      return rs.find(r=>house&&norm(r?.houseNo||r?.plotNo||r?.['H.No.'])===house&&name&&norm(r?.ownerName||r?.residentName||r?.name)===name)
        || rs.find(r=>house&&norm(r?.houseNo||r?.plotNo||r?.['H.No.'])===house)
        || null;
    }
    function houseRows(filterFn=()=>true){
      const all=residents().filter(r=>String(r?.houseNo||r?.plotNo||'').trim());
      const map=new Map();
      all.forEach(r=>map.set(String(r.houseNo||r.plotNo).trim().toLowerCase(),r));
      return Array.from(map.values()).filter(filterFn);
    }
    function show(title,subtitle,head,body){
      const sec=document.getElementById('associationDashboardDetailSection');if(!sec)return;
      const titleEl=document.getElementById('associationDashboardDetailTitle');
      if(titleEl) titleEl.textContent=title;
      document.getElementById('associationDashboardDetailHead').innerHTML=head;
      document.getElementById('associationDashboardDetailBody').innerHTML=body||'<tr><td colspan="20" class="empty">No matching records found.</td></tr>';const sb=document.getElementById('associationFilteredSummary');if(sb){sb.innerHTML='';sb.style.display='none';}
      sec.style.display='block';sec.classList.add('dashboard-dropdown-open');
      document.getElementById('associationDashboardPage')?.classList.add('dashboard-drill-open');
      window.RGMS?.refreshRegisterScrolling?.();
    }
    function residentRegister(rows,title){
      const ordered=sortHouses(rows);
      const head='<tr><th>S.No.</th><th>Name</th><th>H.No.</th><th>Phone</th></tr>';
      const body=ordered.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.ownerName||r.name||'')}</td><td>${esc(hno(r))}</td><td>${esc(r.mobile?.[0]||r.phone||r.cellNo||r.whatsapp||'')}</td></tr>`).join('');
      show(title,'Filtered from the authoritative Residents Master.',head,body);
    }
    function classifiedHouseRows(kind='all'){
      const summary=window.RGMS?.getAssociationHouseSummary?.(residents())||{details:[]};
      return (summary.details||[]).filter(d=>kind==='all'||d.classification===kind).map(d=>{
        if(kind==='tenant') return d.rows.find(r=>norm(r.occupationStatus||r.status||r.occupancyStatus)==='tenant'||norm(r.residentType)==='tenant')||d.rows[0];
        if(kind==='owner') return d.rows.find(r=>norm(r.occupationStatus||r.status||r.occupancyStatus)==='owner'||norm(r.residentType)==='owner')||d.rows[0];
        if(kind==='vacant') return d.rows.find(r=>norm(r.occupationStatus||r.status||r.occupancyStatus)==='vacant'||r.isVacant===true)||d.rows[0];
        return d.rows[0];
      });
    }
    function occupied(){residentRegister([...classifiedHouseRows('owner'),...classifiedHouseRows('tenant')],'Occupied Houses');}
    function ownersOccupied(){residentRegister(classifiedHouseRows('owner'),'Occupied Owner Houses');}
    function tenantsOccupied(){residentRegister(classifiedHouseRows('tenant'),'Occupied Tenant Houses');}
    function vacant(){residentRegister(classifiedHouseRows('vacant'),'Vacant Houses');}
    function totalHouses(){residentRegister(classifiedHouseRows('all'),'All Houses');}
    function colonyFund(scope='fy'){
      const rs=residents().filter(r=>window.RGMS?.isColonyFundEligibleOwner?.(r)), ps=payments(), fy=getFinancialYear();
      let cols=(window.RGMS?.getColonyFundMonthsForFY?.(getFinancialYear())||[]);
      if(scope==='month' && cols.length) cols=[cols[cols.length-1]];
      const head='<tr><th>S.No.</th><th>Name</th><th>H.No.</th>'+cols.map(m=>`<th>${esc(monthLabel(m))}</th>`).join('')+'<th>Total Amount</th></tr>';
      const detail=sortHouses(rs).map(r=>{let total=0;const vals=cols.map(m=>{const v=ps.filter(p=>period(p)===m&&window.RGMS.colonyFundPaymentMatchesResident(p,r)).reduce((sum,p)=>sum+amount(p.amountPaid??p.amount),0);total+=v;return v;});return {r,vals,total};}).filter(x=>x.total>0);
      const body=detail.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.r.ownerName||x.r.name||'')}</td><td>${esc(hno(x.r))}</td>${x.vals.map(v=>`<td class="amount">${money(v)}</td>`).join('')}<td class="amount month-total">${money(x.total)}</td></tr>`).join('');
      const currentMonth=getCollectionPeriod();const monthText=monthLabel(currentMonth);show(scope==='month'?`Contributed Colony Fund – ${monthText}`:`Contributed Colony Fund – ${fy}`,scope==='month'?`${monthText} owner contributions at Rs. 500 each.`:`Rs. 500 per eligible occupied Owner per month.`,head,body);
    }
    function colonyFundPending(scope='fy'){
      const rs=residents().filter(r=>window.RGMS?.isColonyFundEligibleOwner?.(r)),ps=payments();let cols=(window.RGMS?.getColonyFundMonthsForFY?.(getFinancialYear())||[]);
      if(scope==='month' && cols.length) cols=[cols[cols.length-1]];
      const head='<tr><th>S.No.</th><th>Name</th><th>H.No.</th>'+cols.map(m=>`<th>${esc(monthLabel(m))}</th>`).join('')+'<th>Total Amount</th></tr>';
      const detail=sortHouses(rs).map(r=>{let total=0;const vals=cols.map(m=>{const paid=ps.filter(p=>period(p)===m&&window.RGMS.colonyFundPaymentMatchesResident(p,r)).reduce((sum,p)=>sum+amount(p.amountPaid??p.amount),0);const due=Math.max(0,Number(window.RGMS?.DEFAULT_FUND_AMOUNT||500)-paid);total+=due;return due;});return {r,vals,total};}).filter(x=>x.total>0);
      const body=detail.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.r.ownerName||x.r.name||'')}</td><td>${esc(hno(x.r))}</td>${x.vals.map(v=>`<td class="amount">${money(v)}</td>`).join('')}<td class="amount month-total">${money(x.total)}</td></tr>`).join('');
      const fy=getFinancialYear(),currentMonth=getCollectionPeriod(),monthText=monthLabel(currentMonth);show(scope==='month'?`Pending Colony Fund – ${monthText}`:`Pending Colony Fund – ${fy}`,scope==='month'?`${monthText} pending for eligible occupied Owners.`:`Pending = expected owner obligations less contributed fund.`,head,body);
    }
    function ganeshRegister(kind='chanda'){
      const all=kind==='laddu'?[...getAllRecords(STORAGE_KEYS.GANESH_FESTIVAL),...getAllRecords(STORAGE_KEYS.FESTIVAL_FUND)]:getAllRecords(STORAGE_KEYS.GANESH_FESTIVAL);
      const seenLaddu=new Set();
      const ps=all.filter(p=>{
        const rt=norm(p.recordType||p.type||'chanda');
        const explicit=Number(p.auctionAmount??p.ladduAuctionAmount??p.ladduAmount??p.winningBid??p.winningAmount??0)||0;
        const isLaddu=rt.includes('laddu')||rt.includes('auction')||explicit>0||Boolean(p.auctionDate||p.winnerName||p.auctionWinner||p.ladduWinner);
        const amt=amount(p.auctionAmount??p.ladduAuctionAmount??p.ladduAmount??p.amountPaid??p.paidAmount??p.amount);
        const rawStatus=String(p.paymentStatus||p.status||'').trim();
        const paid=rawStatus?norm(rawStatus)==='paid':(isLaddu?amt>0:true);
        const sponsorCash=rt.includes('sponsor')?amount(p.cashContributionAmount??p.sponsorCashContribution??p.contributionAmount??p.chandaAmount??p.amountPaid??p.paidAmount??p.amount):0;
        if(!(kind==='laddu'?isLaddu:(!isLaddu&&(!rt.includes('sponsor')||sponsorCash>0)))||!paid)return false;
        if(kind==='laddu'){const k=String(p.id||p._id||p.docId||p.documentId||'').trim()||[p.auctionDate||p.paymentDate,p.winnerName||p.ownerName,p.winnerPlotNo||p.houseNo||p.plotNo,amt].map(v=>String(v??'').trim().toLowerCase()).join('|');if(seenLaddu.has(k))return false;seenLaddu.add(k);}
        return true;
      }).map(p=>{
        const resident=findResidentForRow(p);
        return {...p,__name:resident?.ownerName||resident?.name||p.winnerName||p.ownerName||p.residentName||p.name||'',__house:hno(resident||p)};
      }).sort((a,b)=>String(a.__name||'').localeCompare(String(b.__name||''),'en',{sensitivity:'base',numeric:true})||String(a.__house||'').localeCompare(String(b.__house||''),undefined,{numeric:true}));
      const head='<tr><th>S.No.</th><th>Name</th><th>H.No.</th><th>Amount</th><th>Payment Status</th><th>Date</th><th>Remarks</th></tr>';
      const body=ps.map((p,i)=>`<tr><td>${i+1}</td><td>${esc(p.__name)}</td><td>${esc(p.__house)}</td><td class="amount">${money(amount(p.amountPaid??p.paidAmount??p.chandaAmount??p.auctionAmount??p.amount))}</td><td>Paid</td><td>${esc(p.paymentDate||p.auctionDate||p.date||'')}</td><td>${esc(p.remarks||'')}</td></tr>`).join('');
      show(kind==='laddu'?'Ganesh Laddu Amount – Paid Register':'Ganesh Chanda – Paid Register',kind==='laddu'?'Only the paid Laddu/Auction records included in the clicked dashboard amount.':'Only the paid contribution records included in the clicked dashboard amount.',head,body);
    }

    function ganeshSponsorRegister(){
      const list=getAllRecords(STORAGE_KEYS.GANESH_FESTIVAL).filter(r=>norm(r.recordType||r.type||'')==='sponsor').sort((a,b)=>String(a.ownerName||a.name||'').localeCompare(String(b.ownerName||b.name||''),undefined,{sensitivity:'base'}));
      const head='<tr><th>S.No.</th><th>Name</th><th>H.No.</th><th>Sponsor Type</th><th>Cash Contribution</th><th>Payment Status</th></tr>';
      const body=list.map((r,i)=>{const cash=amount(r.cashContributionAmount??r.sponsorCashContribution??r.contributionAmount??r.chandaAmount??r.amountPaid??r.paidAmount??r.amount);return `<tr><td>${i+1}</td><td>${esc(r.ownerName||r.name||'')}</td><td>${esc(hno(r))}</td><td>${esc(r.sponsorType||r.sponsor||'')}</td><td class="amount">${money(cash)}</td><td>${esc(cash>0?(r.paymentStatus||r.status||'Paid'):'—')}</td></tr>`;}).join('');
      show('Ganesh Festival Sponsors',`${list.length} sponsor(s). Clickable count is sourced from Sponsor Details.`,head,body);
    }

    function expenditureRegister(kind,fund='all'){
      const allExp=getAllRecords(STORAGE_KEYS.EXPENDITURES);
      const isGanesh=r=>{const f=norm(r.expenditureVariant||r.fundType||r.fund||r.variant||'');return f.includes('ganesh')||f.includes('festival');};
      const isColony=r=>{const f=norm(r.expenditureVariant||r.fundType||r.fund||r.variant||'');return f.includes('colony')||f.includes('development')||f.includes('maintenance');};
      if(kind==='balance' && fund==='colony'){
        const cols=(window.RGMS?.getColonyFundMonthsForFY?.(getFinancialYear())||[]);
        const expRows=allExp.filter(isColony);
        const monthOf=r=>String(r?.date||r?.paymentDate||r?.createdOn||r?.expenseDate||'').slice(0,7);
        const ps=payments();
        const head='<tr><th>S.No.</th><th>Month</th><th>Contributed Colony Fund</th><th>Colony Expenditure</th><th>Balance</th></tr>';
        let running=0;
        const body=cols.map((m,i)=>{const summary=window.RGMS.getColonyFundSummary({residents:residents(),payments:ps,expenditures:allExp,financialYear:getFinancialYear(),month:m});const contributed=summary.collectedMonth;const expenditure=summary.expenditureMonth;running+=contributed-expenditure;return `<tr><td>${i+1}</td><td>${esc(monthLabel(m))}</td><td class="amount">${money(contributed)}</td><td class="amount">${money(expenditure)}</td><td class="amount month-total">${money(running)}</td></tr>`;}).join('');
        show('Colony Fund Balance Details','Ganesh Fund is excluded. Balance = Contributed Colony Fund − Colony Expenditure.',head,body);
        return;
      }
      let rows=allExp;
      if(fund==='ganesh') rows=rows.filter(isGanesh);
      else if(fund==='colony') rows=rows.filter(isColony);
      const head='<tr><th>S.No.</th><th>Date</th><th>Fund</th><th>Particulars</th><th>Amount</th><th>Advance</th><th>Balance to be paid</th></tr>';
      const body=rows.map((r,i)=>{const committed=Number(r.amountCommitted??r.amount??r.totalAmount??0)||0;const advance=Number(r.advancePaid??r.advance??r.paidAmount??r.amountPaid??((String(r.paymentStatus||'').toLowerCase()==='paid')?committed:0))||0;return `<tr><td>${i+1}</td><td>${esc(r.date||'')}</td><td>${esc(r.expenditureVariant||r.fundType||r.fund||'')}</td><td>${esc(r.description||r.particulars||'')}</td><td class="amount">${money(committed)}</td><td class="amount">${money(advance)}</td><td class="amount">${money(Math.max(0,committed-advance))}</td></tr>`;}).join('');
      show(kind==='balance'?(fund==='ganesh'?'Ganesh Fund Balance Details':'Fund Balance – Expenditure Register'):(fund==='ganesh'?'Ganesh Fund Expenditure':fund==='colony'?'Colony Fund Expenditure':'Expenditure Register'),fund==='all'?'Ganesh and Colony Fund expenditure records.':fund.charAt(0).toUpperCase()+fund.slice(1)+' Fund filtered expenditure records.',head,body);
    }
    function generic(key){
      const maps={complaintsOpen:[STORAGE_KEYS.COMPLAINTS,'Open Complaints',r=>!['resolved','closed'].includes(norm(r.status)),['S.No.','Name','H.No.','Status','Remarks']],visitorsToday:[STORAGE_KEYS.VISITORS,'Visitors Today',r=>String(r.visitDate||'')===new Date().toISOString().slice(0,10),['S.No.','Name','H.No.','Visit Date','Purpose']],meetingsUpcoming:[STORAGE_KEYS.MEETINGS,'Upcoming Meetings',r=>String(r.meetingDate||'')>=new Date().toISOString().slice(0,10)&&norm(r.status)==='to be held',['S.No.','Date','Title','Status','Remarks']],documents:[STORAGE_KEYS.DOCUMENTS,'Documents',()=>true,['S.No.','Title','Date','Type','Remarks']]};
      const cfg=maps[key];if(!cfg)return;const rows=getAllRecords(cfg[0]).filter(cfg[2]).slice().sort((a,b)=>String(a.ownerName||a.residentName||a.name||a.visitorName||a.title||'').localeCompare(String(b.ownerName||b.residentName||b.name||b.visitorName||b.title||''),'en',{sensitivity:'base',numeric:true}));const head='<tr>'+cfg[3].map(x=>`<th>${x}</th>`).join('')+'</tr>';const body=rows.map((r,i)=>{const vals=key==='complaintsOpen'?[i+1,r.residentName||r.ownerName||r.name,hno(r),r.status,r.remarks]:key==='visitorsToday'?[i+1,r.residentName||r.ownerName||r.visitorName||r.name,hno(r),r.visitDate,r.purpose]:key==='meetingsUpcoming'?[i+1,r.meetingDate,r.title||r.subject,r.status,r.remarks]:[i+1,r.title||r.name,r.date||r.documentDate,r.type||r.documentType,r.remarks];return '<tr>'+vals.map((v,j)=>`<td class="${typeof v==='number'?'amount':''}">${esc(v)}</td>`).join('')+'</tr>';}).join('');show(cfg[1],`Filtered from the ${cfg[0]} register.`,head,body);
    }
    let activeKey='';
    function closeDrill(){
      const sec=document.getElementById('associationDashboardDetailSection');
      sec?.classList.remove('dashboard-dropdown-open');
      if(sec)sec.style.display='none';
      document.getElementById('associationDashboardPage')?.classList.remove('dashboard-drill-open');
      document.querySelectorAll('.association-dashboard-page .dashboard-clickable').forEach(card=>card.classList.remove('is-expanded'));
      activeKey='';
    }
    function drill(key){
      const sec=document.getElementById('associationDashboardDetailSection');
      if(activeKey===key && sec?.style.display==='block'){closeDrill();return;}
      activeKey=key;
      document.querySelectorAll('.association-dashboard-page .dashboard-clickable').forEach(card=>card.classList.toggle('is-expanded',card.dataset.dashboardCard===key));
      if(key==='totalHouses')totalHouses();
      else if(key==='residentsOccupied')occupied();
      else if(key==='ownersOccupied')ownersOccupied();
      else if(key==='tenantsOccupied')tenantsOccupied();
      else if(key==='vacant')vacant();
      else if(key==='colonyFundFY')colonyFund('fy');
      else if(key==='colonyFundMonth')colonyFund('month');
      else if(key==='colonyFundPendingFY')colonyFundPending('fy');
      else if(key==='colonyFundPendingMonth')colonyFundPending('month');
      else if(key==='ganeshChanda')ganeshRegister('chanda');
      else if(key==='ganeshLaddu')ganeshRegister('laddu');
      else if(key==='ganeshSponsors')ganeshSponsorRegister();
      else if(key==='expenditureGanesh')expenditureRegister('expenditure','ganesh');
      else if(key==='expenditureColony')expenditureRegister('expenditure','colony');
      else if(key==='balanceGanesh')expenditureRegister('balance','ganesh');
      else if(key==='balanceColony')expenditureRegister('balance','colony');
      else generic(key);
    }
    const old=window.RGMS?.dashboardCardNavigate;
    window.RGMS=window.RGMS||{};
    window.RGMS.dashboardCardNavigate=function(key){drill(key);};
    /* 4.5.36 / 1.2.195: bind drill-down handling on the Association Dashboard
       container itself.  A page-level listener runs before older document-level
       dashboard navigation handlers, so Association cards can never be hijacked
       into the Colony Fund module. */
    const dashboardPage=document.getElementById('associationDashboardPage');
    if(dashboardPage && dashboardPage.dataset.rgAssociationDrillBound!=='1'){
      dashboardPage.dataset.rgAssociationDrillBound='1';
      dashboardPage.addEventListener('click',e=>{
        const x=e.target.closest('[data-dashboard-card]');
        if(!x || !dashboardPage.contains(x)) return;
        e.preventDefault();
        e.stopPropagation();
        drill(x.dataset.dashboardCard);
      });
      dashboardPage.addEventListener('keydown',e=>{
        const x=e.target.closest('[data-dashboard-card]');
        if(!x || !dashboardPage.contains(x) || (e.key!=='Enter'&&e.key!==' ')) return;
        e.preventDefault();
        e.stopPropagation();
        drill(x.dataset.dashboardCard);
      });
    }
    document.getElementById('associationDashboardDetailClose')?.addEventListener('click',closeDrill);
    document.getElementById('associationDashboardDetailSection')?.addEventListener('mouseleave',()=>{if(window.matchMedia('(hover:hover)').matches)closeDrill();});
    document.addEventListener('click',e=>{
      const sec=document.getElementById('associationDashboardDetailSection');
      if(sec?.classList.contains('dashboard-dropdown-open') && e.target===sec)closeDrill();
    });
})();