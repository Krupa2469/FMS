let communicationResidents=[];
let communicationPayments=[];

async function initializeCommunications(){
    const session=RGMS.auth.getSession();
    const officerRoles=['Admin','President','Secretary','Treasurer'];
    const allowed=officerRoles.includes(session?.role);
    const notice=document.getElementById('communicationAccessNotice');
    document.getElementById('commUpiId')?.replaceChildren(document.createTextNode(SOCIETY.upiId||''));
    document.getElementById('commPaymentMobile')?.replaceChildren(document.createTextNode(SOCIETY.paymentMobile||'+919704035400'));
    if(!allowed){
        if(notice) notice.textContent='Communications are available to office bearers only.';
        document.querySelectorAll('.office-bearer-communication-only').forEach(el=>el.remove());
        return;
    }
    if(notice) notice.textContent='Manual SMS / WhatsApp communication is available to all office bearers. Each WhatsApp message is personalised before opening WhatsApp.';

    try{
        await Promise.all([
            RGMS.store.loadCollection(STORAGE_KEYS.RESIDENTS),
            RGMS.store.loadCollection(STORAGE_KEYS.DEVELOPMENT_FUND)
        ]);
        communicationResidents=RGMS.store.getResidentMaster({includeVacant:true}).filter(r=>String(r.status||'').toLowerCase()!=='vacant' && String(r.occupancyStatus||'').toLowerCase()!=='vacant');
        communicationPayments=getAllRecords(STORAGE_KEYS.DEVELOPMENT_FUND);
        renderPendingResidents();
    }catch(e){
        console.error('Communication Firestore load failed:',e);
        if(notice) notice.textContent='Unable to load resident/payment data from Firestore. Please refresh after signing in again.';
    }

    document.getElementById('btnPublishAssociationNotice')?.addEventListener('click', publishAssociationNotice);
    document.getElementById('btnRefreshAssociationNotices')?.addEventListener('click', loadAssociationNotices);
    await loadAssociationNotices();

    document.getElementById('btnRefreshPending')?.addEventListener('click',async()=>{
        try{
            await Promise.all([RGMS.store.loadCollection(STORAGE_KEYS.RESIDENTS),RGMS.store.loadCollection(STORAGE_KEYS.DEVELOPMENT_FUND)]);
            communicationResidents=RGMS.store.getResidentMaster({includeVacant:true}).filter(r=>String(r.status||'').toLowerCase()!=='vacant' && String(r.occupancyStatus||'').toLowerCase()!=='vacant');
            communicationPayments=getAllRecords(STORAGE_KEYS.DEVELOPMENT_FUND);
            renderPendingResidents();
            setCommStatus('Pending resident list refreshed from Firestore.');
        }catch(e){setCommStatus(e.message||'Unable to refresh.',true);}
    });

    document.getElementById('btnTestSms')?.addEventListener('click',async()=>{
        const out=document.getElementById('smsTestStatus');
        try{
            const variables=JSON.parse(document.getElementById('testSmsVariables').value||'{}');
            const r=await RGMS.communication.sendSms({number:document.getElementById('testSmsNumber').value,templateId:document.getElementById('testSmsTemplate').value.trim(),variables});
            out.textContent='SMS request accepted.';out.style.color='#2e7d32';console.log(r);
        }catch(e){out.textContent=e.message||'SMS failed.';out.style.color='#c62828';}
    });

    document.getElementById('btnTestWa')?.addEventListener('click', async () => {
        const out = document.getElementById('waTestStatus');
        try {
            const number = document.getElementById('testWaNumber').value.trim();
            const message = document.getElementById('testWaMessage').value;
            if (!number) throw new Error('Enter the resident WhatsApp number.');
            if (!message.trim()) throw new Error('Enter the WhatsApp message.');
            const opened = RGMS.communication.openWhatsAppComposer(number, message, 'WhatsApp Custom Message');
            if (opened) {
                out.textContent = 'WhatsApp opened in manual mode.';
                out.style.color = '#2e7d32';
                await RGMS.communication.logCommunication({ number, module: 'Communications', type: 'Custom Message', status: 'Opened', sentBy: session?.role||'' });
            } else { out.textContent = 'WhatsApp message cancelled.'; out.style.color = '#687585'; }
        } catch (e) { out.textContent = e.message || 'Unable to open WhatsApp.'; out.style.color = '#c62828'; }
    });

    document.getElementById('btnOpenNextPending')?.addEventListener('click',openNextPending);
    document.getElementById('btnPrepareAllPending')?.addEventListener('click',()=>{
        const rows=getPendingResidents();
        document.getElementById('pendingCount').textContent=String(rows.length);
        setCommStatus(`${rows.length} pending residents are listed. Use Open WhatsApp on each row to send personalised messages manually.`);
    });
}

async function loadAssociationNotices(){
    try{
        await RGMS.store.loadCollection(STORAGE_KEYS.NOTICES,{retries:3});
        const rows=getAllRecords(STORAGE_KEYS.NOTICES).filter(r=>String(r.status||'Published').toLowerCase()!=='inactive').sort((a,b)=>String(b.createdOn||b.date||'').localeCompare(String(a.createdOn||a.date||'')));
        const body=document.getElementById('associationNoticesBody');
        if(body) body.innerHTML=rows.slice(0,50).map(r=>`<tr><td>${escComm(r.date||r.createdOn||'')}</td><td>${escComm(r.type||'Notice')}</td><td><strong>${escComm(r.title||'')}</strong></td><td>${escComm(r.message||r.description||r.content||'')}</td><td>${escComm(r.publishedByName||r.createdBy||'')}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">No published messages.</td></tr>';
    }catch(e){ setCommStatus(e.message||'Unable to load notices.',true); }
}
async function publishAssociationNotice(){
    const title=document.getElementById('associationNoticeTitle')?.value.trim()||'';
    const message=document.getElementById('associationNoticeMessage')?.value.trim()||'';
    const type=document.getElementById('associationNoticeType')?.value||'Notice';
    if(!title||!message){setCommStatus('Title and message are required.',true);return;}
    const session=RGMS.auth.getSession()||{};
    const rec={title,message,type,status:'Published',date:new Date().toISOString().slice(0,10),createdOn:new Date().toISOString(),createdBy:session.role||'',publishedByName:session.ownerName||session.name||session.role||'Office Bearer',audience:'All Residents'};
    const btn=document.getElementById('btnPublishAssociationNotice');
    try{btn&&(btn.disabled=true);await insertRecord(STORAGE_KEYS.NOTICES,rec);await RGMS.store.loadCollection(STORAGE_KEYS.NOTICES,{retries:3});document.getElementById('associationNoticeTitle').value='';document.getElementById('associationNoticeMessage').value='';await loadAssociationNotices();setCommStatus('Published to all residents. It is now visible in the Resident Notice Board.');alert('Notice published successfully. Residents will receive an in-app pop-up while their Resident Dashboard is open.');}catch(e){setCommStatus(e.message||'Unable to publish notice.',true);}finally{btn&&(btn.disabled=false);}
}
function escComm(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function normalizePhone(n){const d=String(n||'').replace(/\D/g,'');return d.length===10?'91'+d:d.startsWith('91')?d:d;}
function phoneOf(r){return Array.isArray(r?.mobile)?r.mobile[0]:r?.mobile||r?.whatsapp||r?.phoneE164||r?.phone||'';}
function hnoOf(r){return `2-1/${String(r?.plotNo||r?.houseNo||r?.hNo||'').replace(/^2-1\//i,'')}`;}
function ownerOf(r){return r?.ownerName||r?.name||'Resident';}
function currentPeriod(){return getCollectionPeriod();}
function amountPaidForCurrentMonth(plot){return communicationPayments.filter(p=>String(p.plotNo)===String(plot)&&String(p.collectionPeriod||'')===currentPeriod()).reduce((s,p)=>s+Number(p.amountPaid||0),0);}
function getPendingResidents(){return communicationResidents.filter(r=>Number(amountPaidForCurrentMonth(r.plotNo))<Number(DEFAULT_FUND_AMOUNT)).slice().sort((a,b)=>String(ownerOf(a)).localeCompare(String(ownerOf(b)),'en',{sensitivity:'base',numeric:true})||String(a.houseNo||a.plotNo||'').localeCompare(String(b.houseNo||b.plotNo||''),undefined,{numeric:true}));}
function renderPendingResidents(){
    const body=document.getElementById('pendingResidentsBody'); if(!body)return;
    const rows=getPendingResidents();
    document.getElementById('pendingCount').textContent=String(rows.length);
    body.innerHTML=rows.map((r,i)=>{
        const due=Math.max(0,Number(DEFAULT_FUND_AMOUNT)-amountPaidForCurrentMonth(r.plotNo));
        const phone=normalizePhone(phoneOf(r));
        return `<tr><td>${i+1}</td><td>${escC(ownerOf(r))}</td><td>${escC(hnoOf(r))}</td><td>${escC(phone||'No mobile')}</td><td>₹ ${due.toLocaleString('en-IN')}</td><td><button class="btn btn-success btn-sm" type="button" data-wa-pending="${escC(r.residentId||r.plotNo)}">Open WhatsApp</button></td></tr>`;
    }).join('')||'<tr><td colspan="6">No pending Colony Fund payments for the current month.</td></tr>';
    body.querySelectorAll('[data-wa-pending]').forEach(btn=>btn.addEventListener('click',()=>openPending(btn.dataset.waPending)));
}
function pendingMessage(r,due){
    const paymentId=String(SOCIETY.upiId||'').trim();
    const paymentMobile=String(SOCIETY.paymentMobile||'+919704035400').trim();
    const tpl=document.getElementById('pendingMessageTemplate')?.value?.trim() || `Dear {name},\n\nGreetings from Rose Gardens.\n\nOur records indicate that your Colony Fund for {month} is pending.\nAmount Due: ₹{amount}\nPayment Link / UPI ID: {paymentLink}\nPhonePe / GPay No.: {paymentMobile}\n(Same payment account)\n\nIf you have already paid, kindly ignore this message.\n\nRegards,\n{sender}\nTreasurer, Rose Gardens`;
    let message=tpl.replaceAll('{name}',ownerOf(r)).replaceAll('{hno}',hnoOf(r)).replaceAll('{month}',new Date().toLocaleString('en-IN',{month:'long',year:'numeric'})).replaceAll('{amount}',Number(due).toLocaleString('en-IN')).replaceAll('{paymentLink}',paymentId).replaceAll('{paymentMobile}',paymentMobile).replaceAll('{sender}',SOCIETY.treasurerName||'Treasurer');
    const dueLine=/(Amount\s+Due\s*:?[^\n]*)/i;
    const details=[];
    if(paymentId && !message.includes(paymentId)) details.push(`Payment Link / UPI ID: ${paymentId}`);
    if(paymentMobile && !message.includes(paymentMobile)) details.push(`PhonePe / GPay No.: ${paymentMobile}`);
    if(details.length){
        details.push('(Same payment account)');
        message=dueLine.test(message)?message.replace(dueLine,`$1\n${details.join('\n')}`):`${message}\n\n${details.join('\n')}`;
    }
    return message;
}
function openPending(id){
    const r=communicationResidents.find(x=>String(x.residentId||x.plotNo)===String(id)); if(!r)return;
    const digits=normalizePhone(phoneOf(r)); if(!digits){alert(`No WhatsApp/mobile number is stored for ${ownerOf(r)} (${hnoOf(r)}).`);return;}
    const due=Math.max(0,Number(DEFAULT_FUND_AMOUNT)-amountPaidForCurrentMonth(r.plotNo));
    const msg=window.prompt(`Personalised WhatsApp for ${ownerOf(r)} (${hnoOf(r)})`,pendingMessage(r,due));
    if(msg===null)return;
    window.RGMS?.openExternal ? window.RGMS.openExternal(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`) : window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`,'_blank','noopener,noreferrer');
    RGMS.communication.logCommunication({number:digits,module:'Communications',type:'Colony Fund Pending Reminder',status:'Opened',recipient:ownerOf(r),plotNo:r.plotNo,sentBy:RGMS.auth.getSession()?.role||''}).catch(console.warn);
}
let pendingIndex=0;
function openNextPending(){
    const rows=getPendingResidents(); if(!rows.length){setCommStatus('No pending residents for the current month.');return;}
    if(pendingIndex>=rows.length)pendingIndex=0;
    const r=rows[pendingIndex++]; openPending(r.residentId||r.plotNo); setCommStatus(`Prepared ${pendingIndex} of ${rows.length}. Continue with Open Next WhatsApp after sending the current message.`);
}
function setCommStatus(t,err=false){const x=document.getElementById('bulkCommunicationStatus');if(x){x.textContent=t;x.style.color=err?'#c62828':'#2e7d32';}}
function escC(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
window.initializeCommunications=initializeCommunications;
