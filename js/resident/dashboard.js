function escD(value){
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function residentPaidAmount(p){
  const vals=[p?.amountPaid,p?.paidAmount,p?.amount,p?.Amount,p?.['Amount Paid'],p?.paymentAmount,p?.collectedAmount];
  for(const v of vals){const n=Number(String(v??'').replace(/[^0-9.-]/g,''));if(Number.isFinite(n)&&n!==0)return n;}
  return 0;
}
function residentFestivalAmount(p){
  const type=String(p?.recordType||p?.type||'').toLowerCase();
  if(type.includes('laddu')||type.includes('auction')) return Number(p?.auctionAmount??p?.ladduAuctionAmount??p?.ladduAmount??p?.amountPaid??p?.paidAmount??p?.amount??0)||0;
  return Number(p?.chandaAmount??p?.amountPaid??p?.paidAmount??p?.amount??p?.Amount??0)||0;
}
function residentPeriod(p){return String(p?.collectionPeriod||p?.paymentDate||p?.date||p?.month||'').slice(0,7);}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    let session = RGMS.auth.getSession();
    while (window.RGMS?.firebaseConfigReady === undefined) await new Promise(r => setTimeout(r, 25));
    if (!RGMS.firebaseConfigReady) throw new Error('Firebase could not be initialized.');
    if (RGMS.authPersistenceReady) await RGMS.authPersistenceReady;

    const officerRoles = ['Admin','President','Vice President','Secretary','Joint Secretary 1','Joint Secretary 2','Treasurer'];
    if (!session || (!officerRoles.includes(session.role) && session.role !== 'Resident')) {
      window.location.replace('index.html'); return;
    }
    if (session.role !== 'Resident' && !session.plotNo) throw new Error('This office bearer account is not linked to a resident profile.');

    let firebaseUser = await RGMS.auth.waitForAuthReady();
    if (!firebaseUser && RGMS.isNativeAndroid) {
      const nativePlugin = await RGMS.nativeFirebaseAuthReady;
      if (nativePlugin) { const nativeCurrent = await nativePlugin.getCurrentUser(); firebaseUser = nativeCurrent?.user || null; }
    }
    if (!firebaseUser) {
      await new Promise(r => setTimeout(r, 500));
      if (!RGMS.auth.currentUser() && !(RGMS.isNativeAndroid && await RGMS.nativeFirebaseAuthReady)) throw new Error('Authentication could not be restored. Please login again.');
    }

    // Load only the Firebase collections required to paint the resident's
    // financial cards first. Loading every portal collection before these figures
    // made the paid/due amounts appear late. Firebase remains authoritative.
    await Promise.allSettled([
      STORAGE_KEYS.RESIDENTS,
      STORAGE_KEYS.DEVELOPMENT_FUND,
      STORAGE_KEYS.FESTIVAL_FUND,
      STORAGE_KEYS.GANESH_FESTIVAL
    ].filter(Boolean).map(key => RGMS.store.loadCollection(key,{retries:3})));
    const master = RGMS.store.getResidentMaster({includeVacant:true}) || [];
    const keyId = String(session.residentId || session.plotNo || '').trim().toLowerCase();
    const keyHouse = normalizeHNo(session.houseNo || session.plotNo);
    const keyName = String(session.ownerName || '').trim().toLowerCase();
    const residentMaster = master.find(r => String(r.residentId || r.id || '').trim().toLowerCase() === keyId)
      || master.find(r => normalizeHNo(r.houseNo || r.plotNo) === keyHouse)
      || master.find(r => String(r.ownerName || r.name || '').trim().toLowerCase() === keyName);
    const linkedResidentType = String(residentMaster?.residentType || session.residentType || 'Owner').trim().toLowerCase();
    const isColonyFundOwner = ['owner','owners','property owner','propertyowner'].includes(linkedResidentType);
    const isResidentLoginType = [
      'owner','owners','property owner','propertyowner',
      'tenant','tenants',
      'family member','family members','familymember','familymembers'
    ].includes(linkedResidentType);
    if (!isResidentLoginType) throw new Error('Resident login is not enabled for this Resident Type.');

    // Always use the canonical master record for the logged-in resident.
    if (residentMaster) {
      session = {...session, residentId:residentMaster.residentId || residentMaster.id || session.residentId, plotNo:residentMaster.plotNo || residentMaster.houseNo || session.plotNo, houseNo:residentMaster.houseNo || residentMaster.plotNo || session.houseNo, ownerName:residentMaster.ownerName || residentMaster.name || session.ownerName, residentType:residentMaster.residentType || session.residentType};
      RGMS.auth.saveSession?.(session);
    }

    const hno = formatHNo(session.houseNo || session.plotNo) || '--';
    document.getElementById('residentName').textContent = session.ownerName || 'Resident';
    document.getElementById('plotNumberDisplay').textContent = hno;

    // Payment collections were loaded with the resident master above, so the
    // dashboard can calculate immediately without a second Firebase round-trip.

    // Colony Fund is strictly Resident Type = Owner, regardless of Occupation
    // Status. Tenant and Family Member logins must never inherit an Owner's
    // payment history merely because they share the same H.No.
    const residentPayments = isColonyFundOwner ? getResidentRecords(STORAGE_KEYS.DEVELOPMENT_FUND, session) : [];
    const current = residentPayments.filter(p => residentPeriod(p) === String(getCollectionPeriod()).slice(0,7));
    const paidCurrent = current.reduce((sum,p) => sum + residentPaidAmount(p), 0);
    const totalPaid = residentPayments.reduce((sum,p) => sum + residentPaidAmount(p), 0);
    const due = isColonyFundOwner ? Math.max(0, Number(DEFAULT_FUND_AMOUNT || 0) - paidCurrent) : 0;
    document.getElementById('developmentFundAmount').textContent = isColonyFundOwner ? formatCurrency(totalPaid) : '—';
    document.getElementById('developmentFundDue').textContent = isColonyFundOwner ? formatCurrency(due) : '—';

    const festivalLegacy = getResidentRecords(STORAGE_KEYS.FESTIVAL_FUND, session);
    const festivalModern = getAllRecords(STORAGE_KEYS.GANESH_FESTIVAL).filter(p => residentRecordMatches(p, session) || sameHNo(p.winnerPlotNo, session.plotNo));
    const festival = [...festivalLegacy, ...festivalModern];
    const festivalTotalPaid = festival.reduce((sum,p) => sum + residentFestivalAmount(p), 0);
    document.getElementById('festivalAmount').textContent = formatCurrency(festivalTotalPaid);

    renderPaymentAction(session, due, isColonyFundOwner);
    loadResidentPortalData(session).catch(e=>console.warn('Resident portal background load failed:',e));
    initializeColonyFundReminder(session, due);
    initializeResidentNoticePopups();
    bindResidentTabs();
    bindDashboardCards();
    initializeResidentProfile(session, residentMaster);

    document.getElementById('btnResidentLogout')?.addEventListener('click', async () => { await RGMS.auth.signOut(); window.location.replace('index.html'); });
  } catch (error) {
    console.error('Resident dashboard initialization failed:', error);
    const notice = document.getElementById('noticeList');
    if (notice) notice.innerHTML = `<div class="message error">${escD(error.message || 'Unable to load the Resident Dashboard.')}</div>`;
  }
});

function normalizeHNo(v){
  const x = String(v ?? '').trim();
  if (!x) return '';
  return formatHNo(x).toLowerCase();
}
function sameHNo(a,b){ return normalizeHNo(a) && normalizeHNo(a) === normalizeHNo(b); }
function residentRecordMatches(r, session){
  const rid = String(session?.residentId || '').trim();
  const plot = String(session?.plotNo || '').trim();
  const house = normalizeHNo(session?.houseNo || session?.plotNo);
  const owner = String(session?.ownerName || '').trim().toLowerCase();
  return (rid && String(r?.residentId || r?.id || '').trim() === rid)
    || (plot && (String(r?.plotNo || '').trim() === plot || String(r?.houseNo || '').trim() === plot))
    || (house && normalizeHNo(r?.houseNo || r?.plotNo) === house)
    || (owner && String(r?.ownerName || r?.name || '').trim().toLowerCase() === owner);
}
function getResidentRecords(key, session){ return getAllRecords(key).filter(r => residentRecordMatches(r, session)); }

function renderPaymentAction(session, due, isColonyFundOwner=true){
  const action = document.getElementById('developmentPaymentAction');
  if (!action) return;
  if (!isColonyFundOwner) {
    action.innerHTML = '<div class="resident-payment-actions"><p class="card-subtitle">Colony Fund is applicable only to Resident Type = Owner.</p></div>';
    return;
  }
  const details = `<p class="portal-message rg-upi-payment-id"><strong>Payment Account — S Sri Hari Priya</strong><br><strong>UPI ID:</strong> ${escD(SOCIETY.upiId)}<br><strong>PhonePe / GPay No.:</strong> ${escD(SOCIETY.paymentMobile || '+919704035400')}<br><small>Both identifiers belong to the same payment account.</small></p>`;
  if (due > 0) {
    action.innerHTML = `<div class="resident-payment-actions">${details}<div style="display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap"><button id="btnUpiPayment" class="btn btn-primary" type="button">Pay ${escD(formatCurrency(due))} — Choose UPI App</button><button id="btnPhonePePayment" class="btn btn-success" type="button">Pay with PhonePe</button><button id="btnGPayPayment" class="btn btn-success" type="button">Pay with GPay</button><button id="btnCopyUpiId" class="btn btn-secondary" type="button">Copy UPI ID</button><button id="btnPaidWhatsApp" class="btn btn-secondary" type="button">I Have Paid</button></div><p id="onlinePaymentMessage" class="portal-message"></p></div>`;
    bindPaymentAccountActions(session, due);
    document.getElementById('btnPaidWhatsApp')?.addEventListener('click', () => RGMS.communication.openWhatsApp(SOCIETY.treasurerWhatsApp, `Dear Treasurer, I have made the Colony Fund payment of ₹${due} for H.No. ${formatHNo(session.houseNo || session.plotNo)}. Please verify and issue the acknowledgement. Name: ${session.ownerName}.`));
  } else {
    action.innerHTML = `<div class="resident-payment-actions"><p class="card-subtitle">No outstanding amount for the current month.</p>${details}<div style="display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:8px;"><label for="additionalPaymentAmount" class="card-subtitle" style="margin:0;">Additional / Advance:</label><input id="additionalPaymentAmount" type="number" min="1" step="1" placeholder="Amount ₹" style="max-width:140px;padding:8px;border:1px solid #ccd4df;border-radius:7px;"><button id="btnUpiPayment" class="btn btn-primary" type="button">Pay with UPI</button><button id="btnPhonePePayment" class="btn btn-success" type="button">Pay with PhonePe</button><button id="btnGPayPayment" class="btn btn-success" type="button">Pay with GPay</button><button id="btnCopyUpiId" class="btn btn-secondary" type="button">Copy UPI ID</button></div><p id="onlinePaymentMessage" class="portal-message"></p></div>`;
    bindPaymentAccountActions(session, 0);
  }
}

async function copyPaymentText(text){
  try{
    if(navigator.clipboard?.writeText){ await navigator.clipboard.writeText(String(text||'')); return true; }
  }catch(_){}
  return false;
}

function normalizedPaymentMobile(){
  const full=String(SOCIETY.paymentMobile || '+919704035400').trim();
  const digits=full.replace(/\D/g,'');
  return digits.replace(/^91(?=\d{10}$)/,'');
}

window.RGMS = window.RGMS || {};
window.RGMS.onPaymentAppReturn = function(){
  try{ sessionStorage.removeItem('rgmsPaymentHandoff'); }catch(_){}
  const m=document.getElementById('onlinePaymentMessage');
  if(m){
    m.textContent='Returned to Rose Gardens. If you completed the UPI payment, tap I Have Paid so the Treasurer can verify it.';
    m.style.color='#2e7d32';
    try{ m.scrollIntoView({behavior:'smooth',block:'center'}); }catch(_){}
  }
};

function buildResidentUpiUri(session, amount){
  const resident={houseNo:session?.houseNo, plotNo:session?.plotNo, ownerName:session?.ownerName};
  if(window.RGMS?.communication?.generateUPIPaymentLink){
    return window.RGMS.communication.generateUPIPaymentLink(resident, amount, getCollectionPeriod());
  }
  const period=String(getCollectionPeriod()||'');
  const house=formatHNo(session?.houseNo||session?.plotNo||'');
  const periodKey=period.replace(/\D/g,'').slice(-6)||'000000';
  const houseKey=String(house||'NA').replace(/\D/g,'').slice(-8)||'NA';
  const tr=(`RGMSCF${periodKey}${houseKey}${String(Date.now()).slice(-8)}`).slice(0,35);
  const params=new URLSearchParams({pa:String(SOCIETY.upiId||''),pn:String(SOCIETY.upiRecipientName||'S Sri Hari Priya'),tr,am:Number(amount||0).toFixed(2),cu:'INR',tn:`Colony Fund ${period}${house?' - '+house:''}`.slice(0,80)});
  return `upi://pay?${params.toString()}`;
}

function bindPaymentAccountActions(session, outstandingAmount){
  const getAmount=()=>{
    const input=document.getElementById('additionalPaymentAmount');
    return outstandingAmount>0 ? Number(outstandingAmount) : Number(input?.value||0);
  };
  const show=(text,color='#2e7d32')=>{const m=document.getElementById('onlinePaymentMessage');if(m){m.textContent=text;m.style.color=color;}};
  const validate=()=>{
    const amount=getAmount();
    if(!amount || amount<=0){show('Please enter a valid amount.','#c62828');document.getElementById('additionalPaymentAmount')?.focus();return null;}
    return {amount};
  };

  const rememberHandoff=(app,amount,uri)=>{
    try{sessionStorage.setItem('rgmsPaymentHandoff',JSON.stringify({app:app||'upi',amount,upiId:SOCIETY.upiId,uri,startedAt:Date.now()}));}catch(_){}
  };
  const clearHandoff=()=>{try{sessionStorage.removeItem('rgmsPaymentHandoff');}catch(_){}};

  // v1.2.284: real UPI payment intent. The payer app receives the beneficiary,
  // amount, currency, Colony Fund note and unique RGMS transaction reference.
  // The selected UPI app owns the secure PIN screen; Rose Gardens stays behind it.
  const launchUpiPayment=async app=>{
    const payment=validate(); if(!payment)return;
    const uri=buildResidentUpiUri(session,payment.amount);
    rememberHandoff(app,payment.amount,uri);
    let opened=false;
    try{
      opened=app
        ? !!window.RGMS?.openUpiApp?.(app,uri)
        : !!window.RGMS?.openUpiChooser?.(uri);
    }catch(_){opened=false;}

    if(opened){
      const target=app==='phonepe'?'PhonePe':app==='gpay'?'Google Pay':'your UPI app';
      show(`Opening ${target} with S Sri Hari Priya, ${SOCIETY.upiId}, and ${formatCurrency(payment.amount)} pre-filled. Review the details and enter your UPI PIN in the payment app.`);
      return;
    }

    clearHandoff();
    const copied=await copyPaymentText(SOCIETY.upiId);
    show(`No compatible UPI payment app could be opened. UPI ID ${SOCIETY.upiId}${copied?' has been copied as a fallback':''}.`,'#c62828');
  };

  document.getElementById('btnUpiPayment')?.addEventListener('click',()=>launchUpiPayment(null));
  document.getElementById('btnPhonePePayment')?.addEventListener('click',()=>launchUpiPayment('phonepe'));
  document.getElementById('btnGPayPayment')?.addEventListener('click',()=>launchUpiPayment('gpay'));
  document.getElementById('btnCopyUpiId')?.addEventListener('click',async()=>{
    const copied=await copyPaymentText(SOCIETY.upiId);
    show(`UPI ID: ${SOCIETY.upiId}${copied?' — copied':''}. PhonePe / GPay No.: ${SOCIETY.paymentMobile || '+919704035400'} (same account).`);
  });
}


// Colony Fund payment reminder for eligible resident owners.
// Business rule: show only from the 6th of the month onward and only when the
// logged-in resident still has a current-month balance due.
let colonyFundReminderShown=false;
function ensureColonyFundReminderPopup(){
  let box=document.getElementById('rgColonyFundReminderPopup');
  if(box)return box;
  const style=document.createElement('style');
  style.id='rg-colony-fund-reminder-style';
  style.textContent='.rg-colony-reminder-overlay{position:fixed;inset:0;background:rgba(15,30,40,.50);z-index:51000;display:none;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}.rg-colony-reminder-overlay.show{display:flex}.rg-colony-reminder{width:min(500px,100%);background:#fff;border-radius:18px;box-shadow:0 18px 55px rgba(0,0,0,.30);overflow:hidden}.rg-colony-reminder-head{padding:17px 18px 13px;background:#f7f3e8;border-bottom:1px solid #eadfbd}.rg-colony-reminder-head strong{display:block;color:#6b5116;font-size:19px}.rg-colony-reminder-head small{display:block;color:#7a7468;margin-top:4px}.rg-colony-reminder-body{padding:18px;color:#263238;font-size:15px;line-height:1.55}.rg-colony-reminder-amount{font-size:25px;font-weight:900;color:#8a5d00;margin:8px 0}.rg-colony-reminder-actions{display:flex;justify-content:flex-end;gap:8px;padding:0 18px 18px;flex-wrap:wrap}.rg-colony-reminder-actions button{border:0;border-radius:10px;padding:10px 16px;font-weight:800;cursor:pointer}.rg-colony-reminder-later{background:#eef1f3;color:#37474f}.rg-colony-reminder-pay{background:#287b32;color:#fff}';
  document.head.appendChild(style);
  box=document.createElement('div');
  box.id='rgColonyFundReminderPopup';
  box.className='rg-colony-reminder-overlay';
  box.innerHTML='<div class="rg-colony-reminder" role="dialog" aria-modal="true" aria-labelledby="rgColonyReminderTitle"><div class="rg-colony-reminder-head"><strong id="rgColonyReminderTitle">Colony Fund Payment Reminder</strong><small id="rgColonyReminderPeriod"></small></div><div class="rg-colony-reminder-body"><div>Dear <strong id="rgColonyReminderName">Resident</strong>, your Colony Fund payment for the current month is pending.</div><div id="rgColonyReminderAmount" class="rg-colony-reminder-amount"></div><div><strong>UPI ID:</strong> <span id="rgColonyReminderUpi"></span></div><div><strong>PhonePe / GPay No.:</strong> <span id="rgColonyReminderMobile"></span><br><small>Both identifiers belong to the same payment account.</small></div><div>Please make the payment at your convenience. If you have already paid, please use <strong>I Have Paid</strong> in Colony Payments so the Treasurer can verify it.</div></div><div class="rg-colony-reminder-actions"><button type="button" class="rg-colony-reminder-later">Remind Me Later</button><button type="button" class="rg-colony-reminder-pay">Pay Now / View Colony Payments</button></div></div>';
  document.body.appendChild(box);
  const close=()=>box.classList.remove('show');
  box.querySelector('.rg-colony-reminder-later').addEventListener('click',close);
  box.querySelector('.rg-colony-reminder-pay').addEventListener('click',()=>{
    close();
    document.querySelector('[data-resident-tab="payments"]')?.click();
    setTimeout(()=>document.getElementById('btnUpiPayment')?.scrollIntoView({behavior:'smooth',block:'center'}),180);
  });
  return box;
}
function initializeColonyFundReminder(session,due){
  if(colonyFundReminderShown)return;
  const amount=Number(due||0);
  const today=new Date();
  // "After the 5th" means reminder starts on the 6th local calendar day.
  if(today.getDate()<=5 || amount<=0)return;
  colonyFundReminderShown=true;
  const box=ensureColonyFundReminderPopup();
  document.getElementById('rgColonyReminderName').textContent=session?.ownerName||'Resident';
  document.getElementById('rgColonyReminderAmount').textContent=`Pending: ${formatCurrency(amount)}`;
  document.getElementById('rgColonyReminderUpi').textContent=SOCIETY.upiId||'';
  document.getElementById('rgColonyReminderMobile').textContent=SOCIETY.paymentMobile||'+919704035400';
  const period=String(getCollectionPeriod?.()||'').slice(0,7);
  document.getElementById('rgColonyReminderPeriod').textContent=period?`For ${period}`:'Current month';
  setTimeout(()=>box.classList.add('show'),500);
}

async function loadResidentPortalData(session){
  const keys=[STORAGE_KEYS.DOCUMENTS, STORAGE_KEYS.COMPLAINTS, STORAGE_KEYS.GENERAL_INFORMATION, STORAGE_KEYS.NOTICES, STORAGE_KEYS.MEETINGS, STORAGE_KEYS.COMMUNICATIONS].filter(Boolean);
  await Promise.allSettled(keys.map(key=>RGMS.store.loadCollection(key,{retries:3})));
  renderResidentDocuments(); renderResidentComplaints(session); renderResidentInfo(); renderResidentNotices(); bindResidentComplaint(session);
}

function renderResidentDocuments(){
  const body=document.getElementById('residentDocumentsBody'); if(!body)return;
  const rows=getAllRecords(STORAGE_KEYS.DOCUMENTS).sort((a,b)=>String(b.documentDate||b.uploadedOn||'').localeCompare(String(a.documentDate||a.uploadedOn||'')));
  body.innerHTML=rows.length?rows.map(r=>`<tr><td>${escD(formatDate(r.documentDate||r.uploadedOn||''))}</td><td><strong>${escD(r.title||'Document')}</strong>${r.description?`<div class="small">${escD(r.description)}</div>`:''}</td><td>${escD(r.category||'Association')}</td><td>${r.downloadUrl?`<a class="file-link" href="${escD(r.downloadUrl)}" target="_self" rel="noopener noreferrer">${escD(r.fileName||'Open File')}</a>`:'—'}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">No documents available.</td></tr>';
}
let selectedResidentComplaintId='';
function residentComplaintEditable(r){
  const status=String(r?.status||'Open').trim().toLowerCase();
  return status==='open' && !String(r?.assignedTo||'').trim() && !String(r?.resolution||'').trim();
}
function renderResidentComplaints(session){
  const body=document.getElementById('residentComplaintsBody'); if(!body)return;
  const rows=getResidentRecords(STORAGE_KEYS.COMPLAINTS,session).sort((a,b)=>String(b.complaintDate||b.createdOn||'').localeCompare(String(a.complaintDate||a.createdOn||'')));
  body.innerHTML=rows.length?rows.map(r=>{
    const id=escD(r.id||'');
    const editable=residentComplaintEditable(r);
    return `<tr data-rg-id="${id}"><td>${escD(r.complaintNo||'')}</td><td>${escD(formatDate(r.complaintDate||r.createdOn||''))}</td><td>${escD(r.subject||'')}</td><td>${escD(r.priority||'')}</td><td>${escD(r.status||'Open')}</td><td>${escD(r.assignedTo||'')}</td><td>${escD(r.resolution||'')}</td><td><div class="rg-grid-actions"><button type="button" class="rg-icon-btn" onclick="viewResidentComplaint('${id}')" title="View complaint">👁️ View</button>${editable?`<button type="button" class="rg-icon-btn" onclick="editResidentComplaint('${id}')" title="Edit complaint">✏️ Edit</button><button type="button" class="rg-icon-btn rg-delete" onclick="deleteResidentComplaint('${id}')" title="Delete complaint">🗑️ Delete</button>`:'<span class="small muted">Locked after action</span>'}</div></td></tr>`;
  }).join(''):'<tr><td colspan="8" class="empty">No complaints registered.</td></tr>';
}
function setResidentComplaintFormDisabled(disabled){
  ['residentComplaintCategory','residentComplaintPriority','residentComplaintSubject','residentComplaintDescription'].forEach(id=>{const e=document.getElementById(id);if(e)e.disabled=disabled;});
  const save=document.getElementById('residentComplaintSave'); if(save)save.disabled=disabled;
}
function populateResidentComplaintForm(r,viewOnly=false){
  if(!r)return;
  selectedResidentComplaintId=String(r.id||'');
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v??'';};
  set('residentComplaintCategory',r.category||'Maintenance');
  set('residentComplaintPriority',r.priority||'Medium');
  set('residentComplaintSubject',r.subject||'');
  set('residentComplaintDescription',r.description||'');
  setResidentComplaintFormDisabled(viewOnly);
  const save=document.getElementById('residentComplaintSave');
  if(save)save.textContent=viewOnly?'View Only':'Update Complaint';
  rcm(viewOnly?'Complaint opened in view-only mode. Use Clear to return to entry mode.':'Complaint selected. Update the details and click Update Complaint.');
  document.querySelector('[data-resident-panel="complaints"] .resident-form')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function currentResidentComplaint(id){
  const session=RGMS.auth.getSession?.()||{};
  return getResidentRecords(STORAGE_KEYS.COMPLAINTS,session).find(r=>String(r.id||'')===String(id))||null;
}
function viewResidentComplaint(id){const r=currentResidentComplaint(id);if(r)populateResidentComplaintForm(r,true);}
function editResidentComplaint(id){const r=currentResidentComplaint(id);if(!r)return;if(!residentComplaintEditable(r))return rcm('This complaint can no longer be edited because association action has started.',true);populateResidentComplaintForm(r,false);}
async function deleteResidentComplaint(id){
  const r=currentResidentComplaint(id);if(!r)return;
  if(!residentComplaintEditable(r))return rcm('This complaint can no longer be deleted because association action has started.',true);
  if(!confirm(`Delete complaint ${r.complaintNo||''}?`))return;
  try{
    await RGMS.store.deleteRecord(STORAGE_KEYS.COMPLAINTS,id);
    await RGMS.store.loadCollection(STORAGE_KEYS.COMPLAINTS,{retries:3});
    selectedResidentComplaintId='';
    clearResidentComplaintForm();
    renderResidentComplaints(RGMS.auth.getSession?.()||{});
    rcm('Complaint deleted successfully.');
  }catch(e){console.error(e);rcm(e.message||'Unable to delete complaint.',true);}
}
window.viewResidentComplaint=viewResidentComplaint;
window.editResidentComplaint=editResidentComplaint;
window.deleteResidentComplaint=deleteResidentComplaint;
function renderResidentInfo(){
  const body=document.getElementById('residentInfoBody'); if(!body)return;
  const rows=getAllRecords(STORAGE_KEYS.GENERAL_INFORMATION).filter(r=>String(r.status||'Active')!=='Inactive');
  body.innerHTML=rows.length?rows.map(r=>`<tr><td>${escD(r.type||'')}</td><td><strong>${escD(r.name||'')}</strong>${r.notes?`<div class="small">${escD(r.notes)}</div>`:''}</td><td>${escD(r.department||'')}</td><td>${escD(r.phone||'')}</td><td>${escD(r.emergencyNo||'')}</td><td>${escD(r.address||'')}</td><td>${r.website?`<a class="file-link" href="${escD(r.website)}" target="_self" rel="noopener noreferrer">Open</a>`:'—'}</td></tr>`).join(''):'<tr><td colspan="7" class="empty">No public utility information available.</td></tr>';
}
function renderResidentNotices(){
  const el=document.getElementById('noticeList'); if(!el)return;
  const notices=getAllRecords(STORAGE_KEYS.NOTICES).filter(n=>String(n.status||'Published').toLowerCase()!=='inactive').map(n=>({...n,_feedType:n.type||'Notice',_feedDate:n.createdOn||n.date||''}));
  const meetings=getAllRecords(STORAGE_KEYS.MEETINGS).filter(m=>String(m.status||'').toLowerCase()!=='cancelled').map(m=>({title:m.meetingType||'Association Meeting',message:[m.meetingDate?`Date: ${formatDate(m.meetingDate)}`:'',m.meetingTime?`Time: ${m.meetingTime}`:'',m.venue?`Venue: ${m.venue}`:'',m.agenda?`Agenda: ${m.agenda}`:'',m.status?`Status: ${m.status}`:''].filter(Boolean).join(' • '),type:'Meeting',_feedDate:m.createdOn||m.meetingDate||''}));
  const rows=[...notices,...meetings].sort((a,b)=>String(b._feedDate).localeCompare(String(a._feedDate)));
  el.innerHTML=rows.length?rows.slice(0,30).map(n=>`<article class="resident-notice"><strong>${escD(n.title||'Association Update')}</strong><small>${escD(n.type||n._feedType||'Notice')}${n._feedDate?` · ${escD(formatDate(n._feedDate))}`:''}</small><p>${escD(n.message||n.description||n.content||'')}</p></article>`).join(''):'<div class="empty">No association notices or meeting updates available.</div>';
}


// In-app Notice Board pop-ups for residents. The first snapshot is treated as
// the baseline; subsequent Firestore refreshes display newly published notices.
let residentNoticePopupTimer=null;
const residentNoticeSeen=new Set();
const residentNoticeQueue=[];
let residentNoticePopupOpen=false;
function residentNoticeKey(n){
  return String(n?.id||n?.noticeId||[n?.createdOn||n?.date||'',n?.type||'',n?.title||'',n?.message||n?.description||n?.content||''].join('|'));
}
function activeResidentNotices(){
  return getAllRecords(STORAGE_KEYS.NOTICES)
    .filter(n=>String(n.status||'Published').toLowerCase()!=='inactive')
    .sort((a,b)=>String(a.createdOn||a.date||'').localeCompare(String(b.createdOn||b.date||'')));
}
function ensureResidentNoticePopup(){
  let box=document.getElementById('rgResidentNoticePopup');
  if(box)return box;
  const style=document.createElement('style');
  style.id='rg-resident-notice-popup-style';
  style.textContent='.rg-notice-popup-overlay{position:fixed;inset:0;background:rgba(15,30,40,.48);z-index:50000;display:none;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}.rg-notice-popup-overlay.show{display:flex}.rg-notice-popup{width:min(520px,100%);max-height:80vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 18px 55px rgba(0,0,0,.28);padding:0}.rg-notice-popup-head{padding:16px 18px 12px;background:#f3f8f5;border-bottom:1px solid #dce6e1}.rg-notice-popup-head strong{display:block;color:#234e5b;font-size:18px}.rg-notice-popup-head small{display:block;color:#71808a;margin-top:4px}.rg-notice-popup-body{padding:18px;color:#263238;font-size:15px;line-height:1.55;white-space:pre-wrap}.rg-notice-popup-actions{display:flex;justify-content:flex-end;gap:8px;padding:0 18px 18px}.rg-notice-popup-actions button{border:0;border-radius:10px;padding:10px 18px;font-weight:800;cursor:pointer}.rg-notice-popup-view{background:#eef4f7;color:#234e5b}.rg-notice-popup-close{background:#287b32;color:#fff}';
  document.head.appendChild(style);
  box=document.createElement('div');
  box.id='rgResidentNoticePopup';
  box.className='rg-notice-popup-overlay';
  box.innerHTML='<div class="rg-notice-popup" role="dialog" aria-modal="true" aria-labelledby="rgNoticePopupTitle"><div class="rg-notice-popup-head"><strong id="rgNoticePopupTitle">New Notice</strong><small id="rgNoticePopupMeta"></small></div><div id="rgNoticePopupMessage" class="rg-notice-popup-body"></div><div class="rg-notice-popup-actions"><button type="button" class="rg-notice-popup-view">Open Notice Board</button><button type="button" class="rg-notice-popup-close">OK</button></div></div>';
  document.body.appendChild(box);
  box.querySelector('.rg-notice-popup-close').addEventListener('click',closeResidentNoticePopup);
  box.querySelector('.rg-notice-popup-view').addEventListener('click',()=>{
    closeResidentNoticePopup();
    document.querySelector('[data-resident-tab="notices"]')?.click();
  });
  return box;
}
function showNextResidentNoticePopup(){
  if(residentNoticePopupOpen||!residentNoticeQueue.length)return;
  const n=residentNoticeQueue.shift();
  const box=ensureResidentNoticePopup();
  document.getElementById('rgNoticePopupTitle').textContent=n.title||'Association Notice';
  document.getElementById('rgNoticePopupMeta').textContent=[n.type||'Notice',n.publishedByName||n.createdBy||'',n.createdOn||n.date?formatDate(n.createdOn||n.date):''].filter(Boolean).join(' · ');
  document.getElementById('rgNoticePopupMessage').textContent=n.message||n.description||n.content||'';
  box.classList.add('show'); residentNoticePopupOpen=true;
}
function closeResidentNoticePopup(){
  document.getElementById('rgResidentNoticePopup')?.classList.remove('show');
  residentNoticePopupOpen=false;
  setTimeout(showNextResidentNoticePopup,150);
}
async function checkResidentNoticePopups(){
  try{
    await RGMS.store.refreshCollection(STORAGE_KEYS.NOTICES,{retries:2});
    renderResidentNotices();
    for(const n of activeResidentNotices()){
      const key=residentNoticeKey(n);
      if(!residentNoticeSeen.has(key)){
        residentNoticeSeen.add(key);
        residentNoticeQueue.push(n);
      }
    }
    showNextResidentNoticePopup();
  }catch(_){ /* Keep resident portal usable if a background refresh fails. */ }
}
function initializeResidentNoticePopups(){
  activeResidentNotices().forEach(n=>residentNoticeSeen.add(residentNoticeKey(n)));
  if(residentNoticePopupTimer)clearInterval(residentNoticePopupTimer);
  residentNoticePopupTimer=setInterval(checkResidentNoticePopups,20000);
  window.addEventListener('focus',checkResidentNoticePopups);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkResidentNoticePopups();});
}
function clearResidentComplaintForm(){
  selectedResidentComplaintId='';
  setResidentComplaintFormDisabled(false);
  ['residentComplaintSubject','residentComplaintDescription'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  const category=document.getElementById('residentComplaintCategory');if(category)category.value='Maintenance';
  const priority=document.getElementById('residentComplaintPriority');if(priority)priority.value='Medium';
  const save=document.getElementById('residentComplaintSave');if(save){save.textContent='Register Complaint';save.disabled=false;}
}
function bindResidentComplaint(session){
  const save=document.getElementById('residentComplaintSave'),clear=document.getElementById('residentComplaintClear');
  if(!save||save.dataset.bound==='1')return;save.dataset.bound='1';
  clear?.addEventListener('click',()=>{clearResidentComplaintForm();rcm('');});
  save.addEventListener('click',async()=>{
    const subject=document.getElementById('residentComplaintSubject')?.value.trim()||'';
    const description=document.getElementById('residentComplaintDescription')?.value.trim()||'';
    if(!subject||!description){rcm('Subject and Description are required.',true);return;}
    const rows=getAllRecords(STORAGE_KEYS.COMPLAINTS);
    const existing=selectedResidentComplaintId?currentResidentComplaint(selectedResidentComplaintId):null;
    if(selectedResidentComplaintId&&!existing){rcm('Selected complaint could not be found. Refresh and try again.',true);return;}
    if(existing&&!residentComplaintEditable(existing)){rcm('This complaint can no longer be edited because association action has started.',true);return;}
    const rec={
      ...(existing||{}),
      complaintNo:existing?.complaintNo||`CMP-${new Date().getFullYear()}-${String(rows.length+1).padStart(4,'0')}`,
      complaintDate:existing?.complaintDate||new Date().toISOString().slice(0,10),
      plotNo:String(session.plotNo||''),
      houseNo:formatHNo(session.houseNo||session.plotNo),
      residentId:session.residentId||'',
      residentName:session.ownerName||'',
      phoneE164:existing?.phoneE164||session.phoneE164||RGMS.firebase?.auth?.currentUser?.phoneNumber||'',
      category:document.getElementById('residentComplaintCategory')?.value||'Maintenance',
      priority:document.getElementById('residentComplaintPriority')?.value||'Medium',
      status:existing?.status||'Open',
      subject,
      description,
      assignedTo:existing?.assignedTo||'',
      resolution:existing?.resolution||'',
      createdOn:existing?.createdOn||new Date().toISOString(),
      createdBy:existing?.createdBy||'Resident',
      updatedOn:new Date().toISOString(),
      updatedBy:'Resident'
    };
    try{
      save.disabled=true;
      if(existing){
        await RGMS.store.setRecord(STORAGE_KEYS.COMPLAINTS,selectedResidentComplaintId,rec);
        rcm(`Complaint ${rec.complaintNo} updated successfully.`);
      }else{
        await insertRecord(STORAGE_KEYS.COMPLAINTS,rec);
        rcm(`Complaint ${rec.complaintNo} registered successfully.`);
      }
      await RGMS.store.loadCollection(STORAGE_KEYS.COMPLAINTS,{retries:3});
      renderResidentComplaints(session);
      clearResidentComplaintForm();
    }catch(e){console.error(e);rcm(e.message||'Unable to save complaint.',true);}
    finally{save.disabled=false;}
  });
}
function bindResidentTabs(){
  const tabs=[...document.querySelectorAll('[data-resident-tab]')],panels=[...document.querySelectorAll('[data-resident-panel]')];
  const residentNav=[];
  const logout=async()=>{try{await RGMS.auth.signOut();}catch(e){console.warn('Logout cleanup:',e);try{RGMS.auth.clearSession();}catch(_){}}window.location.replace('index.html');};
  const closeFull=()=>{
    document.body.classList.remove('rg-resident-fullscreen');
    tabs.forEach(t=>{t.hidden=false;t.classList.remove('active');});
    panels.forEach(p=>{p.hidden=true;p.classList.remove('active','rg-resident-fullscreen-panel');});
    // The toolbar is dynamically inserted into the active panel. Always remove
    // every instance when leaving a panel; the previous selector targeted a
    // class that was never assigned to the toolbar and caused duplicate
    // Home/Back/Logout bars after repeated navigation.
    document.querySelectorAll('.rg-resident-fullscreen-toolbar').forEach(x=>x.remove());
    residentNav.length=0;
    window.scrollTo({top:0,behavior:'auto'});
  };
  const activate=(key, fromHistory=false)=>{
    const selected=tabs.find(t=>t.dataset.residentTab===key);
    const panel=panels.find(p=>p.dataset.residentPanel===key);
    if(!selected||!panel)return;
    const current=panels.find(p=>!p.hidden && p.classList.contains('active'))?.dataset.residentPanel;
    if(current===key) return;
    if(current && current!==key && !fromHistory) residentNav.push(current);
    document.body.classList.add('rg-resident-fullscreen');
    tabs.forEach(t=>{t.hidden=true;t.classList.toggle('active',t===selected);});
    panels.forEach(p=>{const on=p===panel;p.hidden=!on;p.classList.toggle('active',on);p.classList.toggle('rg-resident-fullscreen-panel',on);});
    document.querySelectorAll('.rg-resident-fullscreen-toolbar').forEach(x=>x.remove());
    const bar=document.createElement('div');
    bar.className='rg-resident-fullscreen-toolbar';
    bar.innerHTML='<button type="button" class="rg-resident-home-btn">⌂ Home</button><div class="rg-resident-fullscreen-title">'+({payments:'Colony Payments','bill-payments':'Bill Payments',complaints:'Complaints','public-services':'Citizen Services',documents:'Documents',notices:'Notice Board',profile:'My Profile'}[key]||'Resident')+'</div><div class="rg-resident-fullscreen-actions"><button type="button" class="rg-resident-back-btn">‹ Back</button><button type="button" class="rg-resident-logout-btn">Logout</button></div>';
    bar.querySelector('.rg-resident-home-btn').addEventListener('click',closeFull);
    bar.querySelector('.rg-resident-back-btn').addEventListener('click',()=>{const prev=residentNav.pop();if(prev){activate(prev,true);}else{closeFull();}});
    bar.querySelector('.rg-resident-logout-btn').addEventListener('click',logout);
    panel.insertBefore(bar,panel.firstChild);
    window.scrollTo({top:0,behavior:'auto'});
    if(key==='public-services' && window.RGMSResidentPublic?.refresh){
      setTimeout(()=>window.RGMSResidentPublic.refresh(), 0);
    }
  };
  tabs.forEach(t=>t.addEventListener('click',()=>activate(t.dataset.residentTab)));
  window.RGMS=window.RGMS||{}; window.RGMS.closeResidentTab=closeFull;
  window.RGMSResidentBack=function(){
    const active=panels.find(p=>!p.hidden && p.classList.contains('active'));
    if(!active){ closeFull(); return true; }
    const prev=residentNav.pop();
    if(prev){ activate(prev); } else { closeFull(); }
    return true;
  };
  window.RGMSAndroidBack=window.RGMSResidentBack;
  // Dashboard opens cleanly with cards only. No section content is shown until a card is tapped.
  closeFull();
}
function bindDashboardCards(){
  document.querySelectorAll('[data-resident-dashboard]').forEach(card=>{card.addEventListener('click',e=>{if(e.target.closest('button,a,input,select,textarea'))return;showResidentDashboardDetail(card.dataset.residentDashboard);});card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showResidentDashboardDetail(card.dataset.residentDashboard);}});});
}
function showResidentDashboardDetail(key){
  const sec=document.getElementById('residentDashboardDetail'); if(!sec)return; const session=RGMS.auth.getSession()||{}; const sessionType=String(session.residentType||'').trim().toLowerCase(); const colonyOwner=['owner','owners','property owner','propertyowner'].includes(sessionType); const ps=colonyOwner?getResidentRecords(STORAGE_KEYS.DEVELOPMENT_FUND,session):[]; const gs=[...getResidentRecords(STORAGE_KEYS.FESTIVAL_FUND,session),...getAllRecords(STORAGE_KEYS.GANESH_FESTIVAL).filter(p=>residentRecordMatches(p,session)||sameHNo(p.winnerPlotNo,session.plotNo))]; let title,head,body;
  if(key==='festival'){title='Ganesh Chanda – My Payments';head='<tr><th>S.No.</th><th>H.No.</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr>';body=gs.map((p,i)=>`<tr><td>${i+1}</td><td>${escD(formatHNo(p.houseNo||p.plotNo||session.plotNo))}</td><td>${escD(p.recordType||'Chanda')}</td><td class="amount">${formatCurrency(residentFestivalAmount(p))}</td><td>${escD(p.paymentStatus||'Paid')}</td><td>${escD(p.paymentDate||p.auctionDate||'')}</td></tr>`).join('');}
  else {title=key==='due'?'Colony Fund – Current Month Due':'Colony Fund – Payment History';head='<tr><th>S.No.</th><th>H.No.</th><th>Financial Year</th><th>Period</th><th>Amount Paid</th><th>Status</th><th>Payment Date</th></tr>';if(!colonyOwner){body='<tr><td colspan="7">Colony Fund is applicable only to Resident Type = Owner.</td></tr>';}else{let rows=ps;if(key==='due'){const current=String(getCollectionPeriod?.()||'').slice(0,7);const paid=ps.filter(p=>residentPeriod(p)===current).reduce((sum,p)=>sum+residentPaidAmount(p),0);rows=[{houseNo:session.houseNo||session.plotNo,collectionPeriod:current,amountPaid:Math.max(0,Number(DEFAULT_FUND_AMOUNT||0)-paid),paymentStatus:paid>0?'Part Paid':'Pending'}];}body=rows.map((p,i)=>`<tr><td>${i+1}</td><td>${escD(formatHNo(p.houseNo||p.plotNo||session.plotNo))}</td><td>${escD(p.financialYear||getFinancialYear())}</td><td>${escD(String(p.collectionPeriod||p.paymentDate||'').slice(0,7))}</td><td class="amount">${formatCurrency(residentPaidAmount(p))}</td><td>${escD(p.paymentStatus||'Paid')}</td><td>${escD(p.paymentDate||'')}</td></tr>`).join('');}}
  document.getElementById('residentDashboardDetailTitle').textContent=title;document.getElementById('residentDashboardDetailHead').innerHTML=head;document.getElementById('residentDashboardDetailBody').innerHTML=body||'<tr><td colspan="7">No matching records found.</td></tr>';sec.style.display='block';sec.classList.add('dashboard-dropdown-open');
}
function closeResidentDashboardDetail(){const sec=document.getElementById('residentDashboardDetail');if(sec){sec.style.display='none';sec.classList.remove('dashboard-dropdown-open');}}
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('residentDashboardDetailClose')?.addEventListener('click',closeResidentDashboardDetail);document.getElementById('residentDashboardDetail')?.addEventListener('mouseleave',()=>{if(window.matchMedia('(hover:hover)').matches)closeResidentDashboardDetail();});document.getElementById('residentHomeBtn')?.addEventListener('click',()=>window.RGMS?.closeResidentTab?.());document.getElementById('residentBackBtn')?.addEventListener('click',()=>window.RGMSResidentBack?.());});

// Colony Directory: approved local service providers with dial-ready and WhatsApp actions.
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const digits=v=>String(v||'').replace(/\D/g,'');
  const tel=v=>{const d=digits(v);return d?`tel:+91${d}`:'#';};
  const wa=v=>{const d=digits(v);return d?`https://wa.me/91${d}`:'#';};
  let providers=[]; let services=[]; let directoryAssignments={};
  const serviceLabels={'executive-committee':'Executive Committee'};
  const officeBearers=[
    {role:'President',name:'Sreekanth Rao Karimilla',match:['sreekanth','karimilla'],fallbackPhone:'99490 33313'},
    {role:'Secretary',name:'Rajeshwari Yanamandla',match:['rajeshwari','yanamandla'],fallbackPhone:''},
    {role:'Joint Secretary 1',name:'Sekhar Babu Kasoji',match:['sekhar','kasoji'],fallbackPhone:''},
    {role:'Joint Secretary 2',name:'Vamshi Reddy Kasula',match:['vamshi','kasula'],fallbackPhone:''},
    {role:'Treasurer',name:'Krishna Kishore Sankarabanda',match:['krishna','sankarabanda'],fallbackPhone:'80746 89415'}
  ];

  function normalizeServiceId(v){
    return String(v ?? '')
      .trim()
      .toLowerCase()
      .replace(/&/g,'and')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'');
  }

  function providerServiceId(p){
    return normalizeServiceId(
      p?.serviceId || p?.homeServiceId || p?.service || p?.serviceName ||
      p?.category || p?.serviceCategory || ''
    );
  }

  function isActiveProvider(p){
    const status=String(p?.status ?? 'Active').trim().toLowerCase();
    return status==='active' || status==='enabled' || status==='approved';
  }

  async function loadDirectoryMasters(){
    try{
      if(window.RGMS?.store?.loadCollection && typeof STORAGE_KEYS !== 'undefined'){
        // Refresh the authoritative Firebase masters each time the directory
        // opens so newly-added providers appear without reinstalling the APK.
        await Promise.all([
          STORAGE_KEYS.SERVICE_PROVIDERS&&RGMS.store.loadCollection(STORAGE_KEYS.SERVICE_PROVIDERS,{retries:3}),
          STORAGE_KEYS.HOME_SERVICES&&RGMS.store.loadCollection(STORAGE_KEYS.HOME_SERVICES,{retries:3}),
          STORAGE_KEYS.SETTINGS&&RGMS.store.loadCollection(STORAGE_KEYS.SETTINGS,{retries:3})
        ]);
      }
      providers=(typeof getAllRecords === 'function' && STORAGE_KEYS.SERVICE_PROVIDERS)
        ?getAllRecords(STORAGE_KEYS.SERVICE_PROVIDERS):[];
      services=(typeof getAllRecords === 'function' && STORAGE_KEYS.HOME_SERVICES)
        ?getAllRecords(STORAGE_KEYS.HOME_SERVICES)
          .filter(s=>String(s.status||'Active').trim().toLowerCase()==='active')
          .sort((a,b)=>Number(a.displayOrder||999)-Number(b.displayOrder||999))
        :[];
      const settings=(typeof getAllRecords === 'function' && STORAGE_KEYS.SETTINGS)
        ?getAllRecords(STORAGE_KEYS.SETTINGS):[];
      const saved=settings.find(r=>String(r.id)==='colonyDirectoryAssignments');
      directoryAssignments=(saved&&saved.assignments&&typeof saved.assignments==='object')
        ?saved.assignments:{};
      services.forEach(svc=>{
        serviceLabels[normalizeServiceId(svc.id)]=`${svc.icon||'🛠️'} ${svc.serviceName||svc.id}`;
      });

      // Include categories represented by active providers even when a matching
      // Home Service master was not created. Valid providers must never vanish.
      const knownIds=new Set(services.map(s=>normalizeServiceId(s.id)));
      providers.filter(isActiveProvider).forEach(p=>{
        const id=providerServiceId(p);
        if(!id || knownIds.has(id)) return;
        const label=String(p.serviceName||p.service||p.category||id)
          .replace(/[-_]+/g,' ')
          .replace(/\b\w/g,c=>c.toUpperCase());
        services.push({id,serviceName:label,icon:p.icon||'🛠️',type:'Normal',displayOrder:999,status:'Active',fromProviderMaster:true});
        knownIds.add(id);
        serviceLabels[id]=`${p.icon||'🛠️'} ${label}`;
      });
    }catch(e){
      console.error('Colony Directory master load failed',e);
      providers=[];services=[];directoryAssignments={};
    }
  }

  function renderDirectoryServiceButtons(){
    // The directory now shows all approved/active providers directly below
    // the Office Bearers in one consistent table. Category filter buttons are
    // intentionally not used here so no provider can disappear because of a
    // directory-assignment mismatch.
    const box=document.getElementById('rgDirectoryServices'); if(box) box.innerHTML='';
  }

  function residentPhoneForBearer(b){
    try{
      const rows=(window.RGMS?.store?.getResidentMaster)?RGMS.store.getResidentMaster({includeVacant:true}):((typeof getAllRecords==='function' && typeof STORAGE_KEYS!=='undefined' && STORAGE_KEYS.RESIDENTS)?getAllRecords(STORAGE_KEYS.RESIDENTS):[]);
      const found=rows.find(r=>{const n=String(r.name||r.ownerName||'').toLowerCase();return (b.match||[]).every(x=>n.includes(String(x).toLowerCase()));});
      const raw=found?.whatsapp || found?.mobile || found?.phone || found?.cellNo || found?.contactNumber || b.fallbackPhone || '';
      return Array.isArray(raw)?(raw[0]||''):raw;
    }catch(_){return b.fallbackPhone||'';}
  }
  function contactIcons(phone, whatsapp){
    const p=phone||''; const w=whatsapp||p;
    if(!p&&!w) return '<span class="rg-directory-no-contact" title="Contact not available">—</span>';
    return `<span class="rg-directory-inline-actions">${p?`<a class="rg-directory-icon-btn rg-directory-call" href="${tel(p)}" aria-label="Call">📞</a>`:''}${w?`<a class="rg-directory-icon-btn rg-directory-wa" href="${wa(w)}" target="_self" rel="noopener noreferrer" aria-label="WhatsApp">💬</a>`:''}</span>`;
  }

  function render(serviceId){
    const body=document.getElementById('rgColonyDirectoryBody'); if(!body)return;
    const committeeCards=officeBearers.map(p=>{
      const phone=residentPhoneForBearer(p);
      return `<div class="rg-directory-person-card"><div class="rg-directory-person-main"><strong>${esc(p.name)}</strong>${contactIcons(phone,phone)}</div><div class="rg-directory-role">${esc(p.role)}</div></div>`;
    }).join('');

    const activeProviders=providers
      .filter(isActiveProvider)
      .filter((p,i,arr)=>arr.findIndex(x=>String(x.id||x.providerId||'')===String(p.id||p.providerId||''))===i)
      .sort((a,b)=>String(a.providerName||a.name||a.businessName||'').localeCompare(String(b.providerName||b.name||b.businessName||'')));

    const providerCards=activeProviders.map(p=>{
      const phone=p.mobile||p.phone||p.contactNumber||'';
      const whatsapp=p.whatsapp||phone;
      const sid=providerServiceId(p);
      const serviceName=(serviceLabels[sid] || String(p.serviceName||p.service||p.category||'Service Provider')).replace(/^\S+\s/,'');
      return `<div class="rg-directory-person-card"><div class="rg-directory-person-main"><strong>${esc(p.providerName||p.name||p.businessName||'Service Provider')}</strong>${contactIcons(phone,whatsapp)}</div><div class="rg-directory-role">${esc(serviceName)}</div></div>`;
    }).join('');

    body.innerHTML=`<h3 class="rg-directory-section-title">Executive Committee</h3>${committeeCards}${activeProviders.length?`<h3 class="rg-directory-section-title service">Colony Service Providers</h3>${providerCards}`:''}`;
  }

  async function open(){
    const modal=document.getElementById('rgColonyDirectoryModal');
    if(!modal)return;
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
    await loadDirectoryMasters();
    renderDirectoryServiceButtons();
    render('office-bearers');
  }
  function close(){const modal=document.getElementById('rgColonyDirectoryModal');if(modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}document.body.style.overflow='';}
  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('rgColonyDirectoryCard')?.addEventListener('click',open);
    document.getElementById('rgColonyDirectoryBack')?.addEventListener('click',()=>{
      close();
      if(typeof window.RGMSResidentBack==='function') window.RGMSResidentBack();
    });
    document.getElementById('rgColonyDirectoryClose')?.addEventListener('click',close);
    document.getElementById('rgColonyDirectoryBackdrop')?.addEventListener('click',close);
    document.getElementById('rgSosButton')?.addEventListener('click',()=>{
      const telUrl='tel:112';
      if(window.RGMS?.openExternal){ window.RGMS.openExternal(telUrl); } else { window.location.href=telUrl; }
    });
  });
})();


function residentProfileMessage(text, isError=false){
  const el=document.getElementById('residentProfileMessage');
  if(!el)return;
  el.textContent=text||'';
  el.style.color=isError?'#b3261e':'#1f6b3d';
}
function setProfileForm(data, session){
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v??'';};
  set('profileResidentName', session?.ownerName||data?.ownerName||data?.name||'');
  set('profileHouseNo', formatHNo(session?.houseNo||session?.plotNo||data?.houseNo||data?.plotNo||''));
  set('profileDateOfBirth', String(data?.dateOfBirth||data?.dob||data?.birthday||'').slice(0,10));
  set('profileAnniversary', String(data?.marriageAnniversary||data?.anniversary||data?.anniversaryDate||'').slice(0,10));
  set('profileEmail', data?.email||data?.personalEmail||'');
  set('profileBloodGroup', data?.bloodGroup||'');
  set('profileOccupation', data?.occupation||data?.profession||'');
  set('profileEmergencyContact', String(data?.emergencyContact||'').replace(/\D/g,'').slice(-10));
  set('profileRemarks', data?.personalRemarks||data?.profileRemarks||'');
}
async function fetchResidentProfile(session, residentMaster){
  // Residents Master is already loaded through the authenticated store using the
  // correct Web/native FirebaseAuth session. Use that same source for My Profile
  // instead of requiring a WebView callable-function auth session on Android.
  try{
    await RGMS.store.refreshCollection?.(STORAGE_KEYS.RESIDENTS);
    const all=RGMS.store.getResidentMaster({includeVacant:true})||[];
    const wantedDoc=String(residentMaster?.residentDocId||residentMaster?.id||'').trim();
    const wantedResident=String(session?.residentId||residentMaster?.residentId||'').trim().toLowerCase();
    const wantedHouse=normalizeHNo(session?.houseNo||session?.plotNo||residentMaster?.houseNo||residentMaster?.plotNo||'');
    const wantedName=String(session?.ownerName||residentMaster?.ownerName||'').trim().toLowerCase();
    const fresh=all.find(r=>wantedDoc && String(r.residentDocId||r.id||'').trim()===wantedDoc)
      || all.find(r=>wantedResident && String(r.residentId||'').trim().toLowerCase()===wantedResident)
      || all.find(r=>wantedHouse && normalizeHNo(r.houseNo||r.plotNo)===wantedHouse && String(r.ownerName||r.name||'').trim().toLowerCase()===wantedName)
      || residentMaster;
    return fresh||session||{};
  }catch(e){
    console.warn('Resident profile refresh failed; using authenticated resident master snapshot:',e);
    return residentMaster||session||{};
  }
}

function initializeResidentProfile(session, residentMaster){
  const save=document.getElementById('btnSaveResidentProfile');
  const clear=document.getElementById('btnClearResidentProfile');
  if(!save)return;
  let loaded={};
  const reload=async()=>{loaded=await fetchResidentProfile(session,residentMaster);setProfileForm(loaded,session);};
  reload();
  clear?.addEventListener('click',()=>{setProfileForm(loaded,session);residentProfileMessage('Changes cleared.');});
  save.addEventListener('click',async()=>{
    const val=id=>String(document.getElementById(id)?.value||'').trim();
    const emergency=val('profileEmergencyContact').replace(/\D/g,'');
    if(emergency && emergency.length!==10){residentProfileMessage('Enter a valid 10-digit emergency contact number.',true);return;}
    const payload={
      residentId:String(session?.residentId||loaded?.residentId||residentMaster?.residentId||residentMaster?.id||''),
      dateOfBirth:val('profileDateOfBirth'), marriageAnniversary:val('profileAnniversary'),
      email:val('profileEmail'), bloodGroup:val('profileBloodGroup'), occupation:val('profileOccupation'),
      emergencyContact:emergency, personalRemarks:val('profileRemarks')
    };
    try{
      save.disabled=true; residentProfileMessage('Saving profile...');
      const docId=String(loaded?.residentDocId||residentMaster?.residentDocId||loaded?.id||residentMaster?.id||'').trim();
      if(!docId) throw new Error('Resident profile record could not be identified. Please login again.');
      const profilePatch={
        dateOfBirth:payload.dateOfBirth,
        marriageAnniversary:payload.marriageAnniversary,
        email:payload.email,
        bloodGroup:payload.bloodGroup,
        occupation:payload.occupation,
        emergencyContact:payload.emergencyContact,
        personalRemarks:payload.personalRemarks,
        profileUpdatedOn:new Date().toISOString(),
        profileUpdatedByUid:String(window.RGMS?.firebase?.auth?.currentUser?.uid||session?.uid||session?.firebaseUid||'resident')
      };
      const saved=await RGMS.store.patchRecord(STORAGE_KEYS.RESIDENTS,docId,profilePatch);
      loaded={...loaded,...saved,...profilePatch};
      setProfileForm(loaded,session);
      residentProfileMessage('Profile saved successfully. Birthday and anniversary dates are now available for automatic greetings.');
    }catch(e){
      console.error('Resident profile save failed:',e);
      const code=String(e?.code||'').toLowerCase();
      const raw=String(e?.message||'').trim();
      let friendly='Unable to save profile right now. Please try again.';
      const lowerRaw=raw.toLowerCase();
      let nativeSignedIn=true;
      try{
        if(window.RGMS?.isNativeAndroid){
          const nativeUser=window.RGMSNativeAuth?.getCurrentUser?.();
          nativeSignedIn=!!nativeUser;
        }
      }catch(_){ nativeSignedIn=true; }
      if(code.includes('not-found')) friendly='Resident profile record was not found. Please login again.';
      else if(code.includes('unauthenticated') || lowerRaw.includes('sign in with your registered mobile')) friendly=nativeSignedIn ? 'Profile authentication needs to be refreshed. Please reopen My Profile and try Save again.' : 'Your resident session has expired. Please login again.';
      else if(code.includes('permission-denied') || lowerRaw.includes('permission denied') || lowerRaw.includes('insufficient permissions')) friendly='Profile update permission is not active for this resident session. Please login again after deploying the v1.2.284 Firestore rules.';
      else if(code.includes('failed-precondition')) friendly=raw && lowerRaw!=='internal' ? raw : 'Resident profile verification could not be completed. Please retry.';
      else if(raw && lowerRaw!=='internal') friendly=raw;
      residentProfileMessage(friendly,true);
    }finally{save.disabled=false;}
  });
}
