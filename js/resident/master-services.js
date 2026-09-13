
(function(){
  let services=[], providers=[], billers=[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const digits=v=>String(v||'').replace(/\D/g,'');
  function serviceById(id){return services.find(x=>String(x.id)===String(id));}
  function openModal(){document.getElementById('rgServiceModal')?.classList.add('open');document.getElementById('rgServiceModalBackdrop')?.classList.add('open');}
  function closeModal(){document.getElementById('rgServiceModal')?.classList.remove('open');document.getElementById('rgServiceModalBackdrop')?.classList.remove('open');}
  function callUrl(v){const d=digits(v);return d?`tel:+91${d}`:'#';}
  function waUrl(v){const d=digits(v);return d?`https://wa.me/91${d}`:'#';}

  async function loadMasters(){
    try{
      await Promise.all([
        RGMS.store.loadCollection(STORAGE_KEYS.HOME_SERVICES),
        RGMS.store.loadCollection(STORAGE_KEYS.SERVICE_PROVIDERS),
        RGMS.store.loadCollection(STORAGE_KEYS.BILLERS)
      ]);
      services=getAllRecords(STORAGE_KEYS.HOME_SERVICES).filter(x=>x.status==='Active').sort((a,b)=>Number(a.displayOrder||999)-Number(b.displayOrder||999));
      providers=getAllRecords(STORAGE_KEYS.SERVICE_PROVIDERS);
      billers=getAllRecords(STORAGE_KEYS.BILLERS).filter(x=>x.status==='Active').sort((a,b)=>Number(a.displayOrder||999)-Number(b.displayOrder||999));
      renderSidebar();
    }catch(e){
      console.error('Master-driven services failed to load',e);
      const x=document.getElementById('rgHomeServicesList'); if(x)x.innerHTML='<div class="rg-side-empty">Services are temporarily unavailable.</div>';
    }
  }

  function renderSidebar(){
    const b=document.getElementById('rgBillersList');
    const h=document.getElementById('rgHomeServicesList');
    if(b)b.innerHTML=billers.map(r=>`<a href="#" class="rg-side-item" data-biller-id="${esc(r.id)}"><span class="rg-side-icon">${r.category==='Electricity'?'⚡':r.category==='Water'?'💧':r.category==='Property Tax'?'🏠':r.category==='Gas Booking'?'🔥':r.category==='Mobile Bill'?'📱':'💳'}</span><span><strong>${esc(r.billerName)}</strong><small>${esc(r.customerNumberLabel||'Pay Bill')} · ${esc(r.apiStatus||'Not Configured')}</small></span></a>`).join('')||'<div class="rg-side-empty">No active billers configured.</div>';
    if(h)h.innerHTML=services.map(r=>`<a href="#" class="rg-side-item" data-home-service-id="${esc(r.id)}"><span class="rg-side-icon">${esc(r.icon||'🛠️')}</span><span><strong>${esc(r.serviceName)}</strong><small>${esc(r.type==='Emergency'?'Emergency service':'Direct contact with provider')}</small></span></a>`).join('')||'<div class="rg-side-empty">No active home services configured.</div>';
    b?.querySelectorAll('[data-biller-id]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();showBiller(el.dataset.billerId);}));
    h?.querySelectorAll('[data-home-service-id]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();showProviders(el.dataset.homeServiceId);}));
  }

  function showProviders(serviceId){
    const service=serviceById(serviceId);
    if(!service)return;
    const rows=providers.filter(p=>p.status==='Active'&&String(p.serviceId)===String(serviceId));
    document.getElementById('rgServiceModalTitle').textContent=`${service.icon||'🛠️'} ${service.serviceName}`;
    document.getElementById('rgServiceModalSubtitle').textContent='Select a provider and contact them directly. Rose Gardens does not assign providers.';
    const body=document.getElementById('rgServiceModalBody');
    body.innerHTML=rows.map(p=>{
      const call=callUrl(p.mobile), wa=p.whatsapp?waUrl(p.whatsapp):'';
      return `<div class="rg-provider-card"><div class="rg-provider-name">${esc(p.providerName)}</div><div class="rg-provider-meta">${esc(p.address||'Area not specified')}${p.workingHours?' · '+esc(p.workingHours):''}${p.charges!==''&&p.charges!=null?' · ₹'+esc(p.charges)+'/visit':''}</div>${p.experience?`<div class="rg-provider-meta">Experience: ${esc(p.experience)}</div>`:''}<div class="rg-provider-actions"><a href="${call}" aria-label="Call ${esc(p.providerName)}">📞 Call</a>${wa?`<a class="rg-whatsapp" href="${wa}" target="_self" rel="noopener noreferrer">💬 WhatsApp</a>`:''}</div></div>`;
    }).join('')||`<div class="rg-bill-note">No active ${esc(service.serviceName)} providers are currently maintained in the Rose Gardens master.</div>`;
    openModal();
  }

  function showBiller(id){
    const biller=billers.find(x=>String(x.id)===String(id)); if(!biller)return;
    document.getElementById('rgServiceModalTitle').textContent=`💳 ${biller.billerName}`;
    document.getElementById('rgServiceModalSubtitle').textContent='Enter your bill/customer details. Payment is processed only after the approved API/BBPS integration is configured.';
    const fields=Array.isArray(biller.requiredFields)&&biller.requiredFields.length?biller.requiredFields:['consumerNumber'];
    const labels={consumerNumber:biller.customerNumberLabel||'Consumer Number',propertyNumber:'Property / Assessment Number',mobileNumber:'Mobile Number',customerId:'Customer ID',accountNumber:'Account Number'};
    document.getElementById('rgServiceModalBody').innerHTML=`<div class="rg-bill-form">${fields.map(f=>`<label for="rgBill_${esc(f)}">${esc(labels[f]||f)}</label><input id="rgBill_${esc(f)}" inputmode="${f.toLowerCase().includes('mobile')?'numeric':'text'}" placeholder="${esc(labels[f]||f)}">`).join('')}<button id="rgBillFetch" class="btn btn-primary" style="margin-top:14px;width:100%;">Fetch Bill</button><div id="rgBillMessage" class="rg-bill-note">${biller.apiStatus==='Live'?'The biller is marked Live. Backend API wiring is required to fetch the live bill.':'API status: '+esc(biller.apiStatus||'Not Configured')+'. Ask Admin to configure the approved bill-payment API before enabling live bill fetch/payment.'}</div></div>`;
    document.getElementById('rgBillFetch')?.addEventListener('click',()=>fetchBillPlaceholder(biller,fields));
    openModal();
  }
  function fetchBillPlaceholder(biller,fields){
    const values={}; let missing=false;
    fields.forEach(f=>{const v=document.getElementById('rgBill_'+f)?.value.trim();values[f]=v;if(!v)missing=true;});
    const m=document.getElementById('rgBillMessage');
    if(missing){m.textContent='Please enter all required biller details.';m.style.color='#c62828';return;}
    m.textContent=biller.apiStatus==='Live'
      ? 'Customer details validated locally. Connect the server-side BBPS bill-fetch endpoint to retrieve the live bill before enabling payment.'
      : 'This biller is not yet configured for live API/BBPS bill fetch. No payment has been initiated.';
  }
  function init(){
    const sidebar=document.getElementById('rgServicesSidebar'),backdrop=document.getElementById('rgSideBackdrop'),trigger=document.getElementById('rgSidebarTrigger'),close=document.getElementById('rgSideClose');
    const open=()=>{sidebar?.classList.add('open');backdrop?.classList.add('open');document.body.style.overflow='hidden';};
    const shut=()=>{sidebar?.classList.remove('open');backdrop?.classList.remove('open');document.body.style.overflow='';};
    trigger?.addEventListener('click',open);close?.addEventListener('click',shut);backdrop?.addEventListener('click',shut);
    document.getElementById('rgServiceModalClose')?.addEventListener('click',closeModal);
    document.getElementById('rgServiceModalBackdrop')?.addEventListener('click',closeModal);
    loadMasters();
  }
  document.addEventListener('DOMContentLoaded',init);
})();
