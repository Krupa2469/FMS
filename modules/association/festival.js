/*=========================================================
  RGMS - Ganesh Festival Celebrations
  Ganesh Festival contribution + Laddu Auction + Sponsors
=========================================================*/

/* RGMS 1.2.236 - enforce one dashboard card order everywhere:
   Icon -> Label -> Amount/Figure. Inline !important styles avoid conflicts
   from older cached theme/mobile stylesheets. */
function rg235ApplyGaneshDashboardLayout(){
  const grid=document.querySelector('.ganesh-summary-grid');
  if(!grid)return;
  grid.querySelectorAll(':scope > .summary-card').forEach(card=>{
    card.style.setProperty('display','flex','important');
    card.style.setProperty('flex-direction','column','important');
    card.style.setProperty('align-items','center','important');
    card.style.setProperty('justify-content','flex-start','important');
    card.style.setProperty('text-align','center','important');
    const icon=card.querySelector('.summary-card-icon');
    if(icon){icon.style.setProperty('position','static','important');icon.style.setProperty('order','1','important');icon.style.setProperty('margin','0 0 8px','important');icon.style.setProperty('font-size','28px','important');icon.style.setProperty('line-height','1','important');}
    const label=card.querySelector('h4');
    if(label){label.style.setProperty('order','2','important');label.style.setProperty('width','100%','important');label.style.setProperty('margin','0','important');label.style.setProperty('text-align','center','important');}
    const amount=card.querySelector('.dashboard-number');
    if(amount){amount.style.setProperty('order','3','important');amount.style.setProperty('margin-top','auto','important');amount.style.setProperty('width','100%','important');amount.style.setProperty('text-align','center','important');}
  });
}

let ganeshRows=[];
let ganeshResidents=[];
const escG=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const todayG=()=>new Date().toISOString().slice(0,10);
const festivalYearG=()=>getFinancialYear(new Date());
const statusG=r=>String(r?.paymentStatus??r?.status??r?.PaymentStatus??r?.payment_status??'Unpaid').trim().toLowerCase();
function normalizeGaneshRow(r){
  const x={...(r||{})};
  const pick=(...keys)=>{for(const k of keys){if(x[k]!==undefined&&x[k]!==null&&String(x[k]).trim()!=='')return x[k];}return '';};
  x.houseNo=pick('houseNo','HouseNo','House No','H.No.','hNo','plotNo','PlotNo','Plot No','winnerPlotNo','WinnerPlotNo');
  x.plotNo=pick('plotNo','PlotNo','Plot No','houseNo','HouseNo','House No','winnerPlotNo','WinnerPlotNo');
  x.ownerName=pick('ownerName','OwnerName','Owner Name','name','Name','residentName','Resident Name');
  x.residentId=pick('residentId','ResidentId','Resident ID','id');
  const explicitStatus=pick('paymentStatus','PaymentStatus','Payment Status','status','Status');
  x.paymentDate=pick('paymentDate','PaymentDate','Payment Date','date','Date','collectionDate');
  x.paymentMode=pick('paymentMode','PaymentMode','Payment Mode','mode','Mode');
  const amount=Number(pick('chandaAmount','amountPaid','paidAmount','amount','Amount','chanda','Chanda Amount')||0);
  x.chandaAmount=amount;
  x.amountPaid=Number(pick('amountPaid','paidAmount','chandaAmount','amount','Amount')||amount||0);
  x.paidAmount=Number(pick('paidAmount','amountPaid','chandaAmount','amount')||0);
  x.toBePaidAmount=Number(pick('toBePaidAmount','dueAmount','amountDue','pendingAmount')||0);
  x.expectedAmount=Number(pick('expectedAmount','ExpectedAmount')||0);
  const explicitAuction=pick('auctionAmount','Auction Amount','ladduAuctionAmount','Laddu Auction Amount','ladduAmount','Laddu Amount','AuctionAmount','winningBid','winningAmount','bidAmount');
  x.sponsorType=pick('sponsorType','SponsorType','Sponsor Type');
  let type=String(pick('recordType','RecordType','record_type','type')||'').trim().toLowerCase();
  if(!type){
    if(x.sponsorType) type='sponsor';
    else if(Number(explicitAuction||0)>0 || pick('winnerName','WinnerName','winner','auctionWinner','ladduWinner')) type='ladduauction';
    else type='chanda';
  }
  x.recordType=type.includes('sponsor')?'Sponsor':(type.includes('laddu')||type.includes('auction'))?'LadduAuction':'Chanda';
  // Sponsor is an independent attribute, not a mutually exclusive payment type.
  // A sponsor may also contribute cash; preserve any historical/new cash amount
  // so the same person can appear in both Contributions and Sponsors.
  x.cashContributionAmount=Number(pick('cashContributionAmount','Cash Contribution Amount','sponsorCashContribution','Sponsor Cash Contribution','contributionAmount','Contribution Amount') || (x.recordType==='Sponsor'?amount:0) || 0);
  // Older Laddu Auction documents often stored the winning amount only in
  // amountPaid/paidAmount/amount. Reuse those Firestore fields instead of
  // displaying Rs.0 on the dashboard.
  x.auctionAmount=Number(explicitAuction || (x.recordType==='LadduAuction'?pick('amountPaid','paidAmount','amount','Amount'):0) || 0);
  // Payment Status was added later. Existing auction rows with a positive
  // collected amount are legacy-paid records; new rows still default to Unpaid.
  x.paymentStatus=explicitStatus || ((x.recordType==='LadduAuction'&&x.auctionAmount>0)||(x.recordType==='Sponsor'&&x.cashContributionAmount>0)?'Paid':'Unpaid');
  x.winnerName=pick('winnerName','WinnerName','winner','auctionWinner','ladduWinner','ownerName','residentName','name');
  x.winnerPlotNo=pick('winnerPlotNo','WinnerPlotNo','winnerHouseNo','auctionHouseNo','houseNo','plotNo');
  x.auctionDate=pick('auctionDate','AuctionDate','Auction Date','ladduDate','date','Date','paymentDate');
  return x;
}
let ganeshLegacyRows=[];
function ganeshAuctionIdentity(r){
  return String(r?.id||r?._id||r?.docId||r?.documentId||'').trim() || [r?.recordType,r?.auctionDate||r?.paymentDate,r?.winnerName||r?.ownerName,r?.winnerPlotNo||r?.houseNo||r?.plotNo,r?.auctionAmount||r?.amountPaid].map(v=>String(v??'').trim().toLowerCase()).join('|');
}
function allGaneshAuctionRows(){
  const seen=new Set();
  return [...ganeshRows,...ganeshLegacyRows].map(normalizeGaneshRow).filter(r=>r.recordType==='LadduAuction').filter(r=>{const k=ganeshAuctionIdentity(r);if(seen.has(k))return false;seen.add(k);return true;});
}
function paidGaneshAuctionRows(){return allGaneshAuctionRows().filter(r=>statusG(r)==='paid');}
function sponsorCashContributionG(row){
  const r=normalizeGaneshRow(row);
  if(r.recordType!=='Sponsor') return 0;
  const direct=Number(r.cashContributionAmount??r.sponsorCashContribution??r.contributionAmount??r.chandaAmount??r.amountPaid??r.paidAmount??r.amount??0)||0;
  return Math.max(0,direct);
}
function isGaneshCashContributionG(row){
  const r=normalizeGaneshRow(row);
  return r.recordType==='Chanda' || (r.recordType==='Sponsor' && sponsorCashContributionG(r)>0);
}
const chandaRowsG=()=>ganeshRows.filter(isGaneshCashContributionG).map(r=>{
  const n=normalizeGaneshRow(r);
  if(n.recordType==='Sponsor'){
    const cash=sponsorCashContributionG(n);
    return {...n,isSponsorContribution:true,chandaAmount:cash,amountPaid:String(n.paymentStatus||'').toLowerCase()==='paid'?cash:Number(n.amountPaid||0)};
  }
  return n;
});
const sponsorRowsG=()=>ganeshRows.filter(r=>normalizeGaneshRow(r).recordType==='Sponsor').map(normalizeGaneshRow);

async function initializeFestival(){

  rg235ApplyGaneshDashboardLayout();
  await Promise.all([
    RGMS.store.loadCollection(STORAGE_KEYS.RESIDENTS,{retries:2}),
    RGMS.store.loadCollection(STORAGE_KEYS.GANESH_FESTIVAL,{retries:2}),
    RGMS.store.loadCollection(STORAGE_KEYS.FESTIVAL_FUND,{retries:2}),
    RGMS.store.loadCollection(STORAGE_KEYS.EXPENDITURES,{retries:2})
  ]);
  ganeshRows=getAllRecords(STORAGE_KEYS.GANESH_FESTIVAL).map(normalizeGaneshRow);
  ganeshLegacyRows=getAllRecords(STORAGE_KEYS.FESTIVAL_FUND).map(normalizeGaneshRow);
  // All resident pickers start from the same authoritative Residents Master.
  // getResidentMaster preserves distinct Firestore documents even when a legacy
  // Resident ID is duplicated, so Owner/Tenant records sharing one H.No. and
  // residents such as Pavan Alapati remain available everywhere.
  ganeshResidents=RGMS.store.getResidentMaster({includeVacant:true})
    .map(normalizeGaneshResident)
    .filter(r=>r.ownerName && r.houseNo && ['owner','tenant'].includes(String(r.residentType||'').trim().toLowerCase()))
    .sort((a,b)=>String(a.ownerName||a.name||'').localeCompare(String(b.ownerName||b.name||''),'en',{sensitivity:'base',numeric:true})||String(a.houseNo||a.plotNo||'').localeCompare(String(b.houseNo||b.plotNo||''),undefined,{numeric:true}));
  // H.No. is display data only. Resident/document identity is used for selection.
  populateGaneshResidents();
  setGaneshDefaults();
  bindGaneshEvents();
  renderGanesh();
  renderGaneshAuctions();
  renderGaneshSponsors();
  rg235ApplyGaneshDashboardLayout();
  requestAnimationFrame(rg235ApplyGaneshDashboardLayout);
}

function normalizeGaneshResident(r){
  const x={...(r||{})};
  const pick=(...keys)=>{for(const k of keys){if(x[k]!==undefined&&x[k]!==null&&String(x[k]).trim()!=='')return x[k];}return '';};
  const rawHouse=pick('houseNo','HouseNo','House No','H.No.','hNo','plotNo','PlotNo','Plot No');
  const name=pick('ownerName','OwnerName','Owner Name','name','Name','residentName','Resident Name');
  const type=pick('residentType','ResidentType','Resident Type','resident_type','type','Type')||'Owner';
  const rid=pick('residentId','ResidentId','Resident ID','Resident Id','resident_id');
  const docId=String(x.id||'').trim();
  const houseNo=typeof formatHNo==='function'?formatHNo(rawHouse):String(rawHouse||'');
  const selectionKey=docId||[String(rid||''),String(type||''),String(name||''),String(houseNo||'')].join('::');
  return {...x,id:docId||x.id,residentId:String(rid||docId||selectionKey),residentDocId:docId,ganeshSelectionKey:selectionKey,ownerName:String(name||'').trim(),name:String(name||'').trim(),houseNo,plotNo:String(pick('plotNo','PlotNo','Plot No')||rawHouse||'').trim(),residentType:String(type||'').trim()};
}
function ganeshResidentKey(r){return String(r?.ganeshSelectionKey||r?.residentDocId||r?.id||r?.residentId||'');}
function residentById(value){return ganeshResidents.find(r=>ganeshResidentKey(r)===String(value));}
function populateGaneshResidents(){
  const residentOptions='<option value="">Select Name</option>'+ganeshResidents.map(r=>`<option value="${escG(ganeshResidentKey(r))}">${escG(r.ownerName||r.name||'')}</option>`).join('');
  const chName=document.getElementById('ganeshChandaName');
  if(chName)chName.innerHTML=residentOptions;
  const chHouse=document.getElementById('ganeshChandaHouse'); if(chHouse){chHouse.value='';chHouse.readOnly=true;}
  const sponsorHouse=document.getElementById('ganeshSponsorHouse'); if(sponsorHouse){sponsorHouse.value='';sponsorHouse.readOnly=true;}
  const sponsorName=document.getElementById('ganeshSponsorName'); if(sponsorName)sponsorName.innerHTML=residentOptions;
  const winner=document.getElementById('ganeshWinnerName');
  if(winner)winner.innerHTML=residentOptions;
}
function refreshGaneshResidentDirectory(){
  ganeshResidents=RGMS.store.getResidentMaster({includeVacant:true}).map(normalizeGaneshResident)
    .filter(r=>r.ownerName&&r.houseNo&&['owner','tenant'].includes(String(r.residentType||'').trim().toLowerCase()))
    .sort((a,b)=>String(a.ownerName||a.name||'').localeCompare(String(b.ownerName||b.name||''),'en',{sensitivity:'base',numeric:true})||String(a.houseNo||a.plotNo||'').localeCompare(String(b.houseNo||b.plotNo||''),undefined,{numeric:true}));
  populateGaneshResidents();
}
if(!window.__rgGaneshResidentSync){window.__rgGaneshResidentSync=true;window.addEventListener('rgms:resident-directory-changed',()=>{try{refreshGaneshResidentDirectory();}catch(e){console.warn('Ganesh resident dropdown refresh failed',e);}});}
function setGaneshDefaults(){
  const ay=document.getElementById('ganeshAuctionYear');
  if(ay){ay.innerHTML=getFinancialYearOptions(6).map(y=>`<option value="${escG(y)}">${escG(y)}</option>`).join('');ay.value=festivalYearG();}
  const ad=document.getElementById('ganeshAuctionDate');if(ad)ad.value=todayG();
  resetChandaForm();
  resetSponsorForm();
}
function bindGaneshEvents(){
  document.getElementById('ganeshChandaName')?.addEventListener('change',loadGaneshName);
  document.getElementById('ganeshSponsorName')?.addEventListener('change',loadGaneshSponsorName);
  document.getElementById('ganeshSponsorPaymentStatus')?.addEventListener('change',updateGaneshSponsorPaymentFields);
  document.getElementById('ganeshSponsorCashAmount')?.addEventListener('input',updateGaneshSponsorPaymentFields);
  document.getElementById('ganeshWinnerName')?.addEventListener('change',()=>loadGaneshWinner());
  document.getElementById('ganeshChandaStatus')?.addEventListener('change',updateGaneshPaymentFields);
  document.getElementById('ganeshChandaSave')?.addEventListener('click',saveGaneshChanda);
  document.getElementById('ganeshChandaUpdate')?.addEventListener('click',updateSelectedGaneshChanda);
  document.getElementById('ganeshChandaDelete')?.addEventListener('click',deleteSelectedGaneshChanda);
  document.getElementById('ganeshChandaClear')?.addEventListener('click',resetChandaForm);
  document.getElementById('ganeshAuctionSave')?.addEventListener('click',saveGaneshAuction);
  document.getElementById('ganeshAuctionUpdate')?.addEventListener('click',updateSelectedGaneshAuction);
  document.getElementById('ganeshAuctionDelete')?.addEventListener('click',deleteSelectedGaneshAuction);
  document.getElementById('ganeshAuctionClear')?.addEventListener('click',clearGaneshAuction);
  document.getElementById('ganeshAuctionRefresh')?.addEventListener('click',renderGaneshAuctions);
  document.getElementById('ganeshAuctionSearch')?.addEventListener('input',renderGaneshAuctions);
  document.getElementById('ganeshSponsorSave')?.addEventListener('click',saveGaneshSponsor);
  document.getElementById('ganeshSponsorUpdate')?.addEventListener('click',updateSelectedGaneshSponsor);
  document.getElementById('ganeshSponsorDelete')?.addEventListener('click',deleteSelectedGaneshSponsor);
  document.getElementById('ganeshSponsorClear')?.addEventListener('click',resetSponsorForm);
  document.getElementById('ganeshRefresh')?.addEventListener('click',refreshGanesh);
  document.getElementById('ganeshSearch')?.addEventListener('input',renderGanesh);
  document.getElementById('ganeshSponsorRefresh')?.addEventListener('click',renderGaneshSponsors);
  document.getElementById('ganeshSponsorSearch')?.addEventListener('input',renderGaneshSponsors);
}
function loadGaneshName(){
  const selected=document.getElementById('ganeshChandaName')?.value;
  const r=residentById(selected);
  const house=document.getElementById('ganeshChandaHouse');
  if(house)house.value=r?formatHNo(r.houseNo||r.plotNo):'';
  if(r){
    const sameResidentId=ganeshResidents.filter(y=>String(y.residentId||'')===String(r.residentId||'')).length===1;
    const saved=ganeshRows.find(x=>x.recordType==='Chanda' && (
      (r.residentDocId && String(x.residentDocId||'')===String(r.residentDocId)) ||
      (sameResidentId && String(x.residentId||'')===String(r.residentId||''))
    ));
    if(saved) loadGaneshChandaRecord(saved); else updateGaneshSerial();
  } else updateGaneshSerial();
}
function loadGaneshSponsorName(){
  const selected=document.getElementById('ganeshSponsorName')?.value;
  const r=residentById(selected);
  const house=document.getElementById('ganeshSponsorHouse');
  if(house)house.value=r?formatHNo(r.houseNo||r.plotNo):'';
  updateSponsorSerial();
}
function loadGaneshWinner(){
  const selected=document.getElementById('ganeshWinnerName')?.value;
  const r=residentById(selected);
  const house=document.getElementById('ganeshWinnerHouse'); if(house)house.value=r?formatHNo(r.houseNo||r.plotNo):'';
  if(document.getElementById('ganeshWinnerMobile'))document.getElementById('ganeshWinnerMobile').value=r?.mobile?.[0]||r?.whatsapp||r?.phoneE164||'';
}
function nextGaneshSerial(){return chandaRowsG().filter(r=>!r.legacy).length+1;}
function nextSponsorSerial(){return sponsorRowsG().filter(r=>!r.legacy).length+1;}
function updateGaneshSerial(){const e=document.getElementById('ganeshChandaSno');if(e)e.value=window._selectedGaneshRecordId?'':String(nextGaneshSerial());}
function updateSponsorSerial(){const e=document.getElementById('ganeshSponsorSno');if(e)e.value=window._selectedGaneshSponsorId?'':String(nextSponsorSerial());}
function updateGaneshPaymentFields(){
  const status=document.getElementById('ganeshChandaStatus')?.value||'Unpaid';
  const date=document.getElementById('ganeshChandaDate');
  const mode=document.getElementById('ganeshChandaMode');
  if(status==='Paid'){
    if(date&&!date.value)date.value=todayG();
    if(mode)mode.required=true;
  }else{
    if(mode)mode.required=false;
    if(status==='Unpaid' && date)date.value='';
  }
}
function resetChandaForm(){
  window._selectedGaneshRecordId=null;
  const save=document.getElementById('ganeshChandaSave');if(save)save.textContent='Save Fund';
  const house=document.getElementById('ganeshChandaHouse');if(house)house.value='';
  const name=document.getElementById('ganeshChandaName');if(name)name.value='';
  const amount=document.getElementById('ganeshChandaAmount');if(amount)amount.value='';
  const status=document.getElementById('ganeshChandaStatus');if(status)status.value='Unpaid';
  const mode=document.getElementById('ganeshChandaMode');if(mode)mode.value='';
  const date=document.getElementById('ganeshChandaDate');if(date)date.value='';
  const remarks=document.getElementById('ganeshChandaRemarks');if(remarks)remarks.value='';
  updateGaneshSerial();updateGaneshPaymentFields();
}
function updateGaneshSponsorPaymentFields(){
  const amount=Number(document.getElementById('ganeshSponsorCashAmount')?.value||0);
  const status=document.getElementById('ganeshSponsorPaymentStatus')?.value||'Unpaid';
  const date=document.getElementById('ganeshSponsorPaymentDate');
  if(amount>0 && status==='Paid' && date && !date.value) date.value=todayG();
  if(status==='Unpaid' && date) date.value='';
}
function resetSponsorForm(){
  window._selectedGaneshSponsorId=null;
  const save=document.getElementById('ganeshSponsorSave');if(save)save.textContent='Save Sponsor';
  const house=document.getElementById('ganeshSponsorHouse');if(house)house.value='';
  const name=document.getElementById('ganeshSponsorName');if(name)name.value='';
  const type=document.getElementById('ganeshSponsorType');if(type)type.value='';
  const cash=document.getElementById('ganeshSponsorCashAmount');if(cash)cash.value='';
  const status=document.getElementById('ganeshSponsorPaymentStatus');if(status)status.value='Unpaid';
  const date=document.getElementById('ganeshSponsorPaymentDate');if(date)date.value='';
  updateSponsorSerial();updateGaneshSponsorPaymentFields();
}
function clearGaneshAuction(){
  window._selectedGaneshAuctionId=null;
  const save=document.getElementById('ganeshAuctionSave');if(save)save.textContent='Save Laddu Auction';
  ['ganeshWinnerName','ganeshWinnerHouse','ganeshWinnerMobile','ganeshAuctionAmount','ganeshAuctionRemarks'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  const st=document.getElementById('ganeshAuctionStatus');if(st)st.value='Unpaid';
  const d=document.getElementById('ganeshAuctionDate');if(d)d.value=todayG();
  const y=document.getElementById('ganeshAuctionYear');if(y)y.value=festivalYearG();
}
function canGaneshEdit(action='add',feature='ganeshFestival'){const ra=window.RGMS?.roleAccess;if(ra?.isConfigured?.())return ra.can(feature,action);return ['Admin','Treasurer'].includes(RGMS.auth.getSession()?.role);}
function selectedResidentFromChanda(){const selected=document.getElementById('ganeshChandaName')?.value;return residentById(selected)||null;}

function updateSelectedGaneshChanda(){
  if(!window._selectedGaneshRecordId)return gm('Select a Ganesh contribution record using View/Edit first.',true);
  return saveGaneshChanda();
}
function deleteSelectedGaneshChanda(){
  if(!window._selectedGaneshRecordId)return gm('Select a Ganesh contribution record using View/Edit first.',true);
  return deleteGaneshRecord(window._selectedGaneshRecordId);
}
function updateSelectedGaneshAuction(){
  if(!window._selectedGaneshAuctionId)return ga('Select a Laddu Auction record using View/Edit first.',true);
  return saveGaneshAuction();
}
function deleteSelectedGaneshAuction(){
  if(!window._selectedGaneshAuctionId)return ga('Select a Laddu Auction record using View/Edit first.',true);
  return deleteGaneshAuction(window._selectedGaneshAuctionId);
}
function updateSelectedGaneshSponsor(){
  if(!window._selectedGaneshSponsorId)return gs('Select a Sponsor record using View/Edit first.',true);
  return saveGaneshSponsor();
}
function deleteSelectedGaneshSponsor(){
  if(!window._selectedGaneshSponsorId)return gs('Select a Sponsor record using View/Edit first.',true);
  return deleteGaneshSponsor(window._selectedGaneshSponsorId);
}

async function saveGaneshChanda(){
  if(!canGaneshEdit(window._selectedGaneshRecordId?'update':'add','ganeshFestival'))return gm('This role does not have permission to save Ganesh Festival contributions.',true);
  const resident=selectedResidentFromChanda();
  const amount=Number(document.getElementById('ganeshChandaAmount')?.value||0);
  const status=document.getElementById('ganeshChandaStatus')?.value||'Unpaid';
  const mode=document.getElementById('ganeshChandaMode')?.value||'';
  const date=document.getElementById('ganeshChandaDate')?.value||'';
  if(!resident)return gm('Select a resident name.',true);
  if(amount<=0)return gm('Enter a valid amount.',true);
  if(status==='Paid'&&!date)return gm('Date of Payment is required for a Paid record.',true);
  const paidAmount=status==='Paid'?amount:0;
  const toBePaidAmount=status==='To be paid'?amount:0;
  const expectedAmount=paidAmount+toBePaidAmount;
  const old=window._selectedGaneshRecordId?ganeshRows.find(x=>String(x.id)===String(window._selectedGaneshRecordId)):null;
  const r={
    recordType:'Chanda',
    financialYear:old?.financialYear||festivalYearG(),festivalYear:old?.festivalYear||festivalYearG(),
    serialNo:Number(document.getElementById('ganeshChandaSno')?.value||nextGaneshSerial()),
    residentId:String(resident.residentId||resident.id||''),residentDocId:String(resident.residentDocId||resident.id||''),plotNo:String(resident.plotNo||resident.houseNo),houseNo:formatHNo(resident.houseNo||resident.plotNo),ownerName:resident.ownerName,
    chandaAmount:amount,amountPaid:paidAmount,paidAmount,toBePaidAmount,expectedAmount,pendingAmount:0,
    paymentStatus:status,paymentMode:mode,paymentDate:date,remarks:document.getElementById('ganeshChandaRemarks')?.value.trim()||'',
    residentType:String(resident.residentType||'').trim(),phoneE164:normalizePhone(resident.mobile?.[0]||resident.whatsapp||''),
    receiptNo:old?.receiptNo||nextGaneshReceipt('CHANDA'),createdOn:old?.createdOn||new Date().toISOString(),createdBy:old?.createdBy||RGMS.auth.getSession()?.email||''
  };
  try{
    if(window._selectedGaneshRecordId){await RGMS.store.setRecord(STORAGE_KEYS.GANESH_FESTIVAL,window._selectedGaneshRecordId,r);gm('Ganesh Festival Fund updated and saved to Firebase.');}
    else{await RGMS.store.insertRecord(STORAGE_KEYS.GANESH_FESTIVAL,r);gm('Ganesh Festival Fund saved to Firebase.');}
    await refreshGanesh();resetChandaForm();
  }catch(e){console.error('Ganesh Chanda save failed:',e);gm(e?.message||'Unable to save Ganesh Festival Contribution to Firebase. Check Firebase authentication/permissions.',true);}
}
function nextGaneshReceipt(type){return `GANESH-${type}-${new Date().getFullYear()}-${String(ganeshRows.length+1).padStart(4,'0')}`;}
async function saveGaneshAuction(){
  if(!canGaneshEdit(window._selectedGaneshAuctionId?'update':'add','ladduAuction'))return ga('This role does not have permission to save Laddu Auction records.',true);
  const amount=Number(document.getElementById('ganeshAuctionAmount').value||0),date=document.getElementById('ganeshAuctionDate').value,winnerResident=residentById(document.getElementById('ganeshWinnerName').value),winner=winnerResident?.ownerName||'';
  const paymentStatus=document.getElementById('ganeshAuctionStatus')?.value||'Unpaid';
  if(amount<=0||!date||!winner)return ga('Auction Date, Auction Amount and Winner Name are required.',true);
  const plot=winnerResident?.plotNo||winnerResident?.houseNo||'';
  const old=window._selectedGaneshAuctionId?ganeshRows.find(x=>String(x.id)===String(window._selectedGaneshAuctionId)):null;
  const r={recordType:'LadduAuction',receiptNo:old?.receiptNo||nextGaneshReceipt('LADDU'),financialYear:document.getElementById('ganeshAuctionYear')?.value||old?.financialYear||festivalYearG(),festivalYear:document.getElementById('ganeshAuctionYear')?.value||old?.festivalYear||festivalYearG(),auctionDate:date,auctionAmount:amount,amountPaid:paymentStatus==='Paid'?amount:0,paymentStatus,winnerResidentId:String(winnerResident?.residentId||''),winnerResidentDocId:String(winnerResident?.residentDocId||winnerResident?.id||''),winnerPlotNo:plot,winnerName:winner,winnerMobile:document.getElementById('ganeshWinnerMobile').value.trim(),houseNo:formatHNo(winnerResident?.houseNo||winnerResident?.plotNo||''),remarks:document.getElementById('ganeshAuctionRemarks').value.trim(),createdOn:old?.createdOn||new Date().toISOString(),createdBy:old?.createdBy||RGMS.auth.getSession()?.email||''};
  try{if(window._selectedGaneshAuctionId){await RGMS.store.setRecord(STORAGE_KEYS.GANESH_FESTIVAL,window._selectedGaneshAuctionId,r);ga('Laddu Auction details modified and saved to Firebase.');}else{await RGMS.store.insertRecord(STORAGE_KEYS.GANESH_FESTIVAL,r);ga('Laddu Auction details saved to Firebase.');}await refreshGanesh();clearGaneshAuction();}catch(e){console.error('Laddu Auction save failed:',e);ga(e?.message||'Unable to save Laddu Auction to Firebase. Check Firebase authentication/permissions.',true);}
}
async function saveGaneshSponsor(){
  if(!canGaneshEdit(window._selectedGaneshSponsorId?'update':'add','sponsorDetails'))return gs('This role does not have permission to save Sponsor details.',true);
  const resident=residentById(document.getElementById('ganeshSponsorName')?.value);
  const type=document.getElementById('ganeshSponsorType')?.value.trim()||'';
  if(!resident)return gs('Select a resident name.',true);
  if(!type)return gs('Sponsor Type is required.',true);
  const old=window._selectedGaneshSponsorId?ganeshRows.find(x=>String(x.id)===String(window._selectedGaneshSponsorId)):null;
  const cashContributionAmount=Math.max(0,Number(document.getElementById('ganeshSponsorCashAmount')?.value||0)||0);
  const sponsorPaymentStatus=document.getElementById('ganeshSponsorPaymentStatus')?.value||'Unpaid';
  const sponsorPaymentDate=document.getElementById('ganeshSponsorPaymentDate')?.value||(cashContributionAmount>0&&sponsorPaymentStatus==='Paid'?todayG():'');
  const r={recordType:'Sponsor',serialNo:Number(document.getElementById('ganeshSponsorSno')?.value||nextSponsorSerial()),residentId:String(resident.residentId||resident.id||''),residentDocId:String(resident.residentDocId||resident.id||''),plotNo:String(resident.plotNo||resident.houseNo),houseNo:formatHNo(resident.houseNo||resident.plotNo),ownerName:resident.ownerName,sponsorType:type,cashContributionAmount,chandaAmount:cashContributionAmount,amountPaid:sponsorPaymentStatus==='Paid'?cashContributionAmount:0,paymentStatus:cashContributionAmount>0?sponsorPaymentStatus:'Unpaid',paymentDate:cashContributionAmount>0?sponsorPaymentDate:'',financialYear:old?.financialYear||festivalYearG(),festivalYear:old?.festivalYear||festivalYearG(),createdOn:old?.createdOn||new Date().toISOString(),createdBy:old?.createdBy||RGMS.auth.getSession()?.email||''};
  try{if(window._selectedGaneshSponsorId){await RGMS.store.setRecord(STORAGE_KEYS.GANESH_FESTIVAL,window._selectedGaneshSponsorId,r);gs('Sponsor details modified and saved to Firebase.');}else{await RGMS.store.insertRecord(STORAGE_KEYS.GANESH_FESTIVAL,r);gs('Sponsor details saved to Firebase.');}await refreshGanesh();resetSponsorForm();}catch(e){console.error('Sponsor save failed:',e);gs(e?.message||'Unable to save Sponsor details to Firebase. Check Firebase authentication/permissions.',true);}
}
async function refreshGanesh(){await RGMS.store.refreshCollection(STORAGE_KEYS.GANESH_FESTIVAL,{retries:2});await RGMS.store.refreshCollection(STORAGE_KEYS.FESTIVAL_FUND,{retries:2});await RGMS.store.refreshCollection(STORAGE_KEYS.EXPENDITURES,{retries:2}).catch(()=>{});ganeshRows=getAllRecords(STORAGE_KEYS.GANESH_FESTIVAL).map(normalizeGaneshRow);ganeshLegacyRows=getAllRecords(STORAGE_KEYS.FESTIVAL_FUND).map(normalizeGaneshRow);renderGanesh();renderGaneshAuctions();renderGaneshSponsors();}
function legacyChandaRows(){return getAllRecords(STORAGE_KEYS.FESTIVAL_FUND).map((r,i)=>{const n=normalizeGaneshRow(r);const st=statusG(n);const amt=Number(n.chandaAmount||n.amountPaid||0);return {...n,recordType:'Chanda',legacy:true,serialNo:n.serialNo||i+1,chandaAmount:amt,amountPaid:st==='paid'?amt:Number(n.amountPaid||0),paidAmount:st==='paid'?amt:Number(n.paidAmount||0),toBePaidAmount:st==='to be paid'?amt:Number(n.toBePaidAmount||0),expectedAmount:(st==='paid'||st==='to be paid')?amt:Number(n.expectedAmount||0),paymentStatus:n.paymentStatus||'Paid'};});}
function collectionRows(){return [...chandaRowsG(),...legacyChandaRows()];}
function ganeshExpenditureRowsG(){
  return getAllRecords(STORAGE_KEYS.EXPENDITURES).filter(r=>{
    const f=String(r.expenditureVariant||r.fundType||r.fund||r.variant||'').toLowerCase();
    return f.includes('ganesh')||f.includes('festival');
  });
}
function ganeshCommittedG(r){return Number(r?.amountCommitted??r?.committedAmount??r?.amount??r?.totalAmount??0)||0;}
function ganeshIncurredG(r){
  const d=r?.advancePaid??r?.advance??r?.paidAmount??r?.amountPaid;
  if(d!==undefined&&d!==null&&String(d)!=='')return Number(d)||0;
  const c=ganeshCommittedG(r);
  return String(r?.paymentStatus||'').trim().toLowerCase()==='paid'?c:0;
}
function ganeshExpenditureTotalsG(){
  const rows=ganeshExpenditureRowsG();
  const projected=rows.reduce((a,r)=>a+ganeshCommittedG(r),0);
  const incurred=rows.reduce((a,r)=>a+ganeshIncurredG(r),0);
  return {rows,projected,incurred};
}
function renderGanesh(){
  const rows=collectionRows();
  // 1.2.167: dashboard cards must total the SAME monetary values shown in the
  // Ganesh register. Do not recalculate from resident counts × ₹500 because
  // historical/current records can contain different Chanda amounts.
  const rowAmount=r=>{
    const st=statusG(r);
    if(st==='paid') return Number(r.chandaAmount ?? r.amountPaid ?? r.paidAmount ?? r.amount ?? 0) || 0;
    if(st==='to be paid') return Number(r.chandaAmount ?? r.toBePaidAmount ?? r.expectedAmount ?? r.amount ?? 0) || 0;
    return 0;
  };
  const paid=rows.filter(r=>statusG(r)==='paid').reduce((sum,r)=>sum+rowAmount(r),0);
  const expectedContributions=rows.filter(r=>statusG(r)==='to be paid').reduce((sum,r)=>sum+rowAmount(r),0);
  const expected=paid+expectedContributions;
  const toBePaid=expectedContributions;
  const auction=paidGaneshAuctionRows().reduce((s,r)=>s+Number(r.auctionAmount||r.amountPaid||0),0);
  const sponsors=sponsorRowsG();
  document.getElementById('ganeshTotalChanda').textContent=formatCurrency(paid);
  document.getElementById('ganeshExpectedAmount').textContent=formatCurrency(expected);
  document.getElementById('ganeshPendingAmount').textContent=formatCurrency(toBePaid);
  document.getElementById('ganeshTotalAuction').textContent=formatCurrency(auction);
  document.getElementById('ganeshTotalCollection').textContent=formatCurrency(paid+auction);
  const gx=ganeshExpenditureTotalsG();
  const balance=paid+auction-gx.incurred;
  const amountRequired=(gx.projected-gx.incurred)-balance;
  document.getElementById('ganeshProjectedExpenditure').textContent=formatCurrency(gx.projected);
  document.getElementById('ganeshExpenditure').textContent=formatCurrency(gx.incurred);
  const balanceToBePaid=Math.max(0,gx.projected-gx.incurred);
  const expenseBalanceEl=document.getElementById('ganeshBalanceToBePaid');if(expenseBalanceEl)expenseBalanceEl.textContent=formatCurrency(balanceToBePaid);
  document.getElementById('ganeshBalance').textContent=formatCurrency(balance);
  document.getElementById('ganeshAmountRequired').textContent=formatCurrency(amountRequired);
  document.getElementById('ganeshSponsorCount').textContent=String(sponsors.length);
  const dash=window.RGMS?.consumeDashboardFilter?.('festival'); const q=(document.getElementById('ganeshSearch')?.value||'').trim().toLowerCase();
  const filtered=rows.filter(r=>{
    if(dash?.filter==='__PAID__') return String(r.paymentStatus||'').toLowerCase()==='paid';
    return true;
  }).filter(r=>[r.houseNo,r.plotNo,r.ownerName,r.paymentStatus,r.remarks,r.amount,r.chandaAmount].some(v=>String(v??'').toLowerCase().includes(q)))
    .sort((a,b)=>String(a.ownerName||a.name||'').localeCompare(String(b.ownerName||b.name||''),'en',{sensitivity:'base',numeric:true})||String(a.houseNo||a.plotNo||'').localeCompare(String(b.houseNo||b.plotNo||''),undefined,{numeric:true}));
  const body=document.getElementById('ganeshBody');if(!body)return;
  body.innerHTML=filtered.map((r,i)=>`<tr><td>${i+1}</td><td>${escG(r.ownerName||'')}</td><td>${escG(formatHNo(r.houseNo||r.plotNo)||'')}</td><td class="ganesh-amount">${formatCurrency(Number(r.chandaAmount??r.amountPaid??0))}</td><td>${escG(r.paymentStatus||'Unpaid')}</td><td>${escG(r.remarks||'')}</td><td><div class="rg-grid-actions">${r.legacy?'':(r.recordType==='Sponsor'?`<button class="rg-icon-btn rg-view" title="View sponsor contribution" aria-label="View sponsor contribution" onclick="selectGaneshSponsor('${escG(r.id)}')">👁️ View</button><button class="rg-icon-btn rg-update" title="Update sponsor contribution" aria-label="Update sponsor contribution" onclick="selectGaneshSponsor('${escG(r.id)}')">✏️</button><button class="rg-icon-btn rg-delete" title="Delete sponsor record" aria-label="Delete sponsor record" onclick="deleteGaneshSponsor('${escG(r.id)}')">🗑️</button>`:`<button class="rg-icon-btn rg-view" title="View record" aria-label="View record" onclick="selectGaneshRecord('${escG(r.id)}')">👁️ View</button><button class="rg-icon-btn rg-update" title="Update record" aria-label="Update record" onclick="selectGaneshRecord('${escG(r.id)}')">✏️</button><button class="rg-icon-btn rg-delete" title="Delete record" aria-label="Delete record" onclick="deleteGaneshRecord('${escG(r.id)}')">🗑️</button>`)}</div></td></tr>`).join('')||'<tr><td colspan="7" class="empty">No Ganesh Festival Contribution records found.</td></tr>';
}
function renderGaneshAuctions(){
  const q=(document.getElementById('ganeshAuctionSearch')?.value||'').trim().toLowerCase();
  const rows=ganeshRows.filter(r=>r.recordType==='LadduAuction').slice().sort((a,b)=>String(a.winnerName||'').localeCompare(String(b.winnerName||''),'en',{sensitivity:'base'})||String(a.houseNo||a.winnerPlotNo||'').localeCompare(String(b.houseNo||b.winnerPlotNo||''),undefined,{numeric:true}));
  const filtered=rows.filter(r=>[r.financialYear,r.auctionDate,r.houseNo,r.winnerName,r.winnerMobile,r.auctionAmount,r.paymentStatus,r.remarks].some(v=>String(v??'').toLowerCase().includes(q)));
  const body=document.getElementById('ganeshAuctionBody'); if(!body)return;
  body.innerHTML=filtered.map((r,i)=>`<tr><td>${i+1}</td><td>${escG(r.winnerName||'')}</td><td>${escG(formatHNo(r.houseNo||r.winnerPlotNo||''))}</td><td>${escG(r.financialYear||r.festivalYear||'')}</td><td>${escG(r.auctionDate||'')}</td><td>${escG(r.winnerMobile||'')}</td><td>${formatCurrency(Number(r.auctionAmount||0))}</td><td>${escG(r.paymentStatus||'Unpaid')}</td><td>${escG(r.remarks||'')}</td><td><div class="rg-grid-actions"><button class="rg-icon-btn rg-view" type="button" onclick="selectGaneshAuction('${escG(r.id)}')">👁️ View</button><button class="rg-icon-btn rg-update" type="button" onclick="selectGaneshAuction('${escG(r.id)}')">✏️</button><button class="rg-icon-btn rg-delete" type="button" onclick="deleteGaneshAuction('${escG(r.id)}')">🗑️</button></div></td></tr>`).join('')||'<tr><td colspan="10" class="empty">No Laddu Auction records found.</td></tr>';
}
function selectGaneshAuction(id){
  const r=ganeshRows.find(x=>String(x.id)===String(id)&&x.recordType==='LadduAuction'); if(!r)return;
  window._selectedGaneshAuctionId=r.id;
  const resident=ganeshResidents.find(x=>(r.winnerResidentDocId&&String(x.residentDocId||x.id||'')===String(r.winnerResidentDocId))||String(x.residentId||'')===String(r.winnerResidentId||''));
  const y=document.getElementById('ganeshAuctionYear');if(y)y.value=r.financialYear||r.festivalYear||festivalYearG();
  const d=document.getElementById('ganeshAuctionDate');if(d)d.value=r.auctionDate||'';
  const a=document.getElementById('ganeshAuctionAmount');if(a)a.value=r.auctionAmount||'';
  const w=document.getElementById('ganeshWinnerName');if(w)w.value=resident?ganeshResidentKey(resident):'';
  const h=document.getElementById('ganeshWinnerHouse');if(h)h.value=formatHNo(resident?.houseNo||r.houseNo||r.winnerPlotNo||'');
  const st=document.getElementById('ganeshAuctionStatus');if(st)st.value=r.paymentStatus||'Unpaid';
  const m=document.getElementById('ganeshWinnerMobile');if(m)m.value=resident?.mobile?.[0]||resident?.whatsapp||r.winnerMobile||'';
  const rm=document.getElementById('ganeshAuctionRemarks');if(rm)rm.value=r.remarks||'';
  const save=document.getElementById('ganeshAuctionSave');if(save)save.textContent='Update Laddu Auction';
  document.getElementById('ganeshAuctionAmount')?.scrollIntoView({behavior:'smooth',block:'center'});
}
async function deleteGaneshAuction(id){
  if(!canGaneshEdit('delete','ladduAuction'))return ga('This role does not have permission to delete Laddu Auction records.',true);
  if(!confirm('Delete this Laddu Auction record?'))return;
  try{await RGMS.store.deleteRecord(STORAGE_KEYS.GANESH_FESTIVAL,id);await refreshGanesh();clearGaneshAuction();ga('Laddu Auction record deleted.');}catch(e){ga(e.message||'Unable to delete Laddu Auction record.',true);}
}
window.selectGaneshAuction=selectGaneshAuction;window.deleteGaneshAuction=deleteGaneshAuction;

function renderGaneshSponsors(){
  const rows=sponsorRowsG().slice().sort((a,b)=>String(a.ownerName||'').localeCompare(String(b.ownerName||''),'en',{sensitivity:'base'})||String(a.houseNo||a.plotNo||'').localeCompare(String(b.houseNo||b.plotNo||''),undefined,{numeric:true})).map((r,i)=>({...r,_sno:i+1}));
  const q=(document.getElementById('ganeshSponsorSearch')?.value||'').trim().toLowerCase();
  const filtered=rows.filter(r=>[r.houseNo,r.plotNo,r.ownerName,r.sponsorType,sponsorCashContributionG(r),r.paymentStatus].some(v=>String(v??'').toLowerCase().includes(q)));
  const body=document.getElementById('ganeshSponsorBody');if(!body)return;
  body.innerHTML=filtered.map(r=>`<tr><td>${r._sno}</td><td>${escG(r.ownerName||'')}</td><td>${escG(formatHNo(r.houseNo||r.plotNo)||'')}</td><td>${escG(r.sponsorType||'')}</td><td>${formatCurrency(sponsorCashContributionG(r))}</td><td>${escG(sponsorCashContributionG(r)>0?(r.paymentStatus||'Unpaid'):'—')}</td><td><div class="rg-grid-actions"><button class="rg-icon-btn rg-view" title="View sponsor" aria-label="View sponsor" onclick="selectGaneshSponsor('${escG(r.id)}')">👁️ View</button><button class="rg-icon-btn rg-update" title="Modify sponsor" aria-label="Modify sponsor" onclick="selectGaneshSponsor('${escG(r.id)}')">✏️</button><button class="rg-icon-btn rg-delete" title="Delete sponsor" aria-label="Delete sponsor" onclick="deleteGaneshSponsor('${escG(r.id)}')">🗑️</button></div></td></tr>`).join('')||'<tr><td colspan="7" class="empty">No Sponsor details found.</td></tr>';
}
function loadGaneshChandaRecord(r){
  window._selectedGaneshRecordId=r.id;
  const resident=ganeshResidents.find(x=>(r.residentDocId&&String(x.residentDocId||x.id||'')===String(r.residentDocId))||(!r.residentDocId&&String(x.residentId||'')===String(r.residentId||'')));
  document.getElementById('ganeshChandaSno').value=r.serialNo||'';
  document.getElementById('ganeshChandaHouse').value=formatHNo(resident?.houseNo||r.houseNo||r.plotNo||'');
  document.getElementById('ganeshChandaName').value=resident?ganeshResidentKey(resident):'';
  document.getElementById('ganeshChandaAmount').value=r.chandaAmount??r.amountPaid??'';
  document.getElementById('ganeshChandaStatus').value=r.paymentStatus||'Unpaid';
  document.getElementById('ganeshChandaMode').value=r.paymentMode||'';
  document.getElementById('ganeshChandaDate').value=r.paymentDate||'';
  document.getElementById('ganeshChandaRemarks').value=r.remarks||'';
  document.getElementById('ganeshChandaSave').textContent='Update Fund';
}
function selectGaneshRecord(id){const r=ganeshRows.find(x=>String(x.id)===String(id)&&isGaneshCashContributionG(x));if(!r)return;if(r.recordType==='Sponsor'){selectGaneshSponsor(id);return;}loadGaneshChandaRecord(r);gm('Fund record selected. Use Update Fund to save changes.');}
function selectGaneshSponsor(id){const r=ganeshRows.find(x=>String(x.id)===String(id)&&x.recordType==='Sponsor');if(!r)return;window._selectedGaneshSponsorId=r.id;const resident=ganeshResidents.find(x=>(r.residentDocId&&String(x.residentDocId||x.id||'')===String(r.residentDocId))||(!r.residentDocId&&String(x.residentId||'')===String(r.residentId||'')));document.getElementById('ganeshSponsorSno').value=r.serialNo||'';document.getElementById('ganeshSponsorHouse').value=formatHNo(resident?.houseNo||r.houseNo||r.plotNo||'');document.getElementById('ganeshSponsorName').value=resident?ganeshResidentKey(resident):'';document.getElementById('ganeshSponsorType').value=r.sponsorType||'';const cash=document.getElementById('ganeshSponsorCashAmount');if(cash)cash.value=sponsorCashContributionG(r)||'';const st=document.getElementById('ganeshSponsorPaymentStatus');if(st)st.value=r.paymentStatus||'Unpaid';const dt=document.getElementById('ganeshSponsorPaymentDate');if(dt)dt.value=r.paymentDate||'';document.getElementById('ganeshSponsorSave').textContent='Modify Sponsor';updateGaneshSponsorPaymentFields();gs('Sponsor record selected. Click Modify Sponsor to save changes.');}
async function deleteGaneshRecord(id){if(!canGaneshEdit('delete','ganeshFestival'))return gm('This role does not have permission to delete Ganesh Festival records.',true);const r=ganeshRows.find(x=>String(x.id)===String(id));if(!r)return;if(!confirm('Delete this Ganesh Festival Fund record?'))return;await RGMS.store.deleteRecord(STORAGE_KEYS.GANESH_FESTIVAL,id);await refreshGanesh();gm('Ganesh Festival Fund record deleted.');}
async function deleteGaneshSponsor(id){if(!canGaneshEdit('delete','sponsorDetails'))return gs('This role does not have permission to delete Sponsor details.',true);if(!confirm('Delete this Sponsor record?'))return;await RGMS.store.deleteRecord(STORAGE_KEYS.GANESH_FESTIVAL,id);await refreshGanesh();gs('Sponsor record deleted.');}
window.selectGaneshRecord=selectGaneshRecord;window.deleteGaneshRecord=deleteGaneshRecord;window.selectGaneshSponsor=selectGaneshSponsor;window.deleteGaneshSponsor=deleteGaneshSponsor;

/* Ganesh Festival dashboard drill-down */
(function(){
  const money=v=>typeof formatCurrency==='function'?formatCurrency(v):('₹'+Number(v||0).toLocaleString('en-IN'));
  const esc=v=>escG(v);
  const hno=r=>typeof formatHNo==='function'?formatHNo(r?.houseNo||r?.plotNo||''):(r?.houseNo||r?.plotNo||'');
  function show(title,head,body){
    const sec=document.getElementById('ganeshDashboardDetail'); if(!sec)return;
    document.getElementById('ganeshDashboardDetailTitle').textContent=title;
    document.getElementById('ganeshDashboardDetailHead').innerHTML=head;
    document.getElementById('ganeshDashboardDetailBody').innerHTML=body||'<tr><td colspan="10" class="empty">No matching records found.</td></tr>';
    const all=collectionRows();
    const paid=all.filter(r=>statusG(r)==='paid').reduce((a,r)=>a+Number(r.amountPaid??r.paidAmount??r.chandaAmount??0),0);
    const due=all.filter(r=>statusG(r)==='to be paid').reduce((a,r)=>a+Number(r.chandaAmount??r.toBePaidAmount??r.expectedAmount??r.amount??0),0);
    const expected=paid+due;
    const auction=paidGaneshAuctionRows().reduce((a,r)=>a+Number(r.auctionAmount||r.amountPaid||0),0);
    const gx=ganeshExpenditureTotalsG();
    const sponsors=sponsorRowsG().length;
    const totalFestivalFund=paid+auction;
    const sb=document.getElementById('ganeshFilteredSummary');
    const balance=totalFestivalFund-gx.incurred;
    const amountRequired=(gx.projected-gx.incurred)-balance;
    if(sb)sb.innerHTML=`<div class="summary-card"><h4>Expected Contributions</h4><span>${money(expected)}</span></div><div class="summary-card"><h4>Total Contributions Paid</h4><span>${money(paid)}</span></div><div class="summary-card"><h4>Contributions Due</h4><span>${money(due)}</span></div><div class="summary-card"><h4>Laddu Auction Amount</h4><span>${money(auction)}</span></div><div class="summary-card"><h4>Total Festival Fund</h4><span>${money(totalFestivalFund)}</span></div><div class="summary-card"><h4>Amount</h4><span>${money(gx.projected)}</span></div><div class="summary-card"><h4>Advance</h4><span>${money(gx.incurred)}</span></div><div class="summary-card"><h4>Balance to be paid</h4><span>${money(Math.max(0,gx.projected-gx.incurred))}</span></div><div class="summary-card"><h4>Balance</h4><span>${money(balance)}</span></div><div class="summary-card"><h4>Amount Required</h4><span>${money(amountRequired)}</span></div><div class="summary-card"><h4>Sponsors</h4><span>${sponsors}</span></div>`;
    sec.style.display='block'; sec.classList.add('dashboard-dropdown-open');
    document.querySelector('.ganesh-module')?.classList.add('ganesh-drill-open');
  }
  function chandaTable(list,title){
    const sorted=list.slice().sort((a,b)=>String(a.ownerName||a.name||'').localeCompare(String(b.ownerName||b.name||''),undefined,{sensitivity:'base'}));
    const head='<tr><th>S.No.</th><th>Name</th><th>H.No.</th><th>Amount</th><th>Payment Status</th><th>Remarks</th></tr>';
    const body=sorted.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.ownerName||r.name||'')}</td><td>${esc(hno(r))}</td><td>${money(Number(r.amountPaid??r.paidAmount??r.chandaAmount??r.toBePaidAmount??0))}</td><td>${esc(r.paymentStatus||'Unpaid')}</td><td>${esc(r.remarks||'')}</td></tr>`).join('');
    show(title,head,body);
  }
  function drill(key){
    const all=collectionRows();
    if(key==='collected') return chandaTable(all.filter(r=>statusG(r)==='paid'),'Ganesh Festival – Total Contributions Paid');
    if(key==='expected') return chandaTable(all.filter(r=>statusG(r)==='paid'||statusG(r)==='to be paid'),'Ganesh Festival – Expected Contributions');
    if(key==='due') return chandaTable(all.filter(r=>statusG(r)==='to be paid'),'Ganesh Festival – Contributions Due');
    if(key==='auction'){
      const list=paidGaneshAuctionRows().slice().sort((a,b)=>String(a.winnerName||'').localeCompare(String(b.winnerName||''),'en',{sensitivity:'base'}));
      const head='<tr><th>S.No.</th><th>Winner Name</th><th>H.No.</th><th>Auction Amount</th><th>Payment Status</th><th>Date</th><th>Remarks</th></tr>';
      const body=list.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.winnerName||'')}</td><td>${esc(hno(r))}</td><td>${money(r.auctionAmount||0)}</td><td>${esc(r.paymentStatus||'Paid')}</td><td>${esc(r.auctionDate||'')}</td><td>${esc(r.remarks||'')}</td></tr>`).join('');
      return show('Ganesh Festival – Laddu Auction Amount',head,body);
    }
    if(['projected','expenditure','expense-balance'].includes(key)){
      const list=ganeshExpenditureRowsG();
      const head='<tr><th>S.No.</th><th>Date</th><th>Description</th><th>Amount</th><th>Advance</th><th>Balance to be paid</th></tr>';
      const body=list.map((r,i)=>{const committed=ganeshCommittedG(r);const incurred=ganeshIncurredG(r);return `<tr><td>${i+1}</td><td>${esc(r.date||'')}</td><td>${esc(r.description||r.particulars||'')}</td><td>${money(committed)}</td><td>${money(incurred)}</td><td>${money(Math.max(0,committed-incurred))}</td></tr>`;}).join('');
      const titles={projected:'Ganesh Festival – Amount',expenditure:'Ganesh Festival – Advance','expense-balance':'Ganesh Festival – Balance to be paid'};
      return show(titles[key],head,body);
    }
    if(key==='required'||key==='balance'){
      const balance=totalFestivalFund-gx.incurred;
      const amountRequired=(gx.projected-gx.incurred)-balance;
      const head='<tr><th>S.No.</th><th>Description</th><th>Amount</th></tr>';
      const body=[['Amount',gx.projected],['Advance',gx.incurred],['Balance to be paid',Math.max(0,gx.projected-gx.incurred)],['Total Festival Fund',totalFestivalFund],['Balance',balance],['Amount Required',amountRequired]].map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r[0])}</td><td>${money(r[1])}</td></tr>`).join('');
      return show(key==='balance'?'Ganesh Festival – Balance':'Ganesh Festival – Amount Required',head,body);
    }
    if(key==='sponsors'){
      const list=sponsorRowsG();
      const head='<tr><th>S.No.</th><th>Name</th><th>H.No.</th><th>Sponsor Type</th></tr>';
      const body=list.slice().sort((a,b)=>String(a.ownerName||a.name||'').localeCompare(String(b.ownerName||b.name||''),'en',{sensitivity:'base'})).map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.ownerName||r.name||'')}</td><td>${esc(hno(r))}</td><td>${esc(r.sponsorType||'')}</td></tr>`).join('');
      return show('Ganesh Festival – Sponsors',head,body);
    }
    const paid=all.filter(r=>statusG(r)==='paid');
    const auctions=paidGaneshAuctionRows();
    const list=[...paid.map(r=>({...r,_type:'Chanda'})),...auctions.map(r=>({...r,_type:'Laddu Auction'}))];
    const head='<tr><th>S.No.</th><th>Name / Winner</th><th>H.No.</th><th>Type</th><th>Amount</th><th>Status</th><th>Remarks</th></tr>';
    const body=list.slice().sort((a,b)=>String(a.ownerName||a.winnerName||'').localeCompare(String(b.ownerName||b.winnerName||''),'en',{sensitivity:'base'})).map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.ownerName||r.winnerName||'')}</td><td>${esc(hno(r))}</td><td>${esc(r._type)}</td><td>${money(r.amountPaid??r.paidAmount??r.chandaAmount??r.auctionAmount)}</td><td>${esc(r.paymentStatus||'Paid')}</td><td>${esc(r.remarks||'')}</td></tr>`).join('');
    show('Ganesh Festival – Total Festival Fund',head,body);
  }
  function close(){const sec=document.getElementById('ganeshDashboardDetail');sec?.classList.remove('dashboard-dropdown-open');if(sec)sec.style.display='none';document.querySelector('.ganesh-module')?.classList.remove('ganesh-drill-open');document.querySelectorAll('.ganesh-dashboard-card').forEach(c=>c.classList.remove('is-expanded'));} window.closeGaneshDashboardDetail=close;
  document.addEventListener('click',e=>{const card=e.target.closest('.ganesh-module [data-ganesh-dashboard]');if(card){e.stopPropagation();document.querySelectorAll('.ganesh-dashboard-card').forEach(c=>c.classList.toggle('is-expanded',c===card));drill(card.dataset.ganeshDashboard);}});
  document.addEventListener('keydown',e=>{const card=e.target.closest('.ganesh-module [data-ganesh-dashboard]');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();drill(card.dataset.ganeshDashboard);}});
  document.getElementById('ganeshDashboardDetailClose')?.addEventListener('click',close);
  document.getElementById('ganeshDashboardDetail')?.addEventListener('mouseleave',()=>{if(window.matchMedia('(hover:hover)').matches)close();});
})();

function gm(t,e=false){const x=document.getElementById('ganeshChandaMessage');if(x){x.textContent=t;x.className='message '+(e?'error':'ok');}}
function ga(t,e=false){const x=document.getElementById('ganeshAuctionMessage');if(x){x.textContent=t;x.className='message '+(e?'error':'ok');}}
function gs(t,e=false){const x=document.getElementById('ganeshSponsorMessage');if(x){x.textContent=t;x.className='message '+(e?'error':'ok');}}
window.initializeFestival=initializeFestival;
