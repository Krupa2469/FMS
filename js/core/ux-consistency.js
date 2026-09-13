/* Rose Gardens v1.2.284 - global CRUD messages, filtered fullscreen and resident consistency */
(function(){
  window.RGMS=window.RGMS||{};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let toastTimer=0;
  function toast(message,error=false){
    const text=String(message||'').trim(); if(!text)return;
    let box=document.getElementById('rgGlobalUserToast');
    if(!box){box=document.createElement('div');box.id='rgGlobalUserToast';box.setAttribute('role','status');box.setAttribute('aria-live','polite');document.body.appendChild(box);}
    box.className='rg-global-toast '+(error?'rg-global-toast-error':'rg-global-toast-ok');
    box.innerHTML=`<span>${esc(text)}</span><button type="button" aria-label="Close message">×</button>`;
    box.querySelector('button').onclick=()=>box.classList.remove('show');
    requestAnimationFrame(()=>box.classList.add('show'));
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>box.classList.remove('show'), error?6500:3500);
    const status=document.getElementById('statusText'); if(status)status.textContent=text;
  }
  RGMS.notify=toast;
  RGMS.friendlyError=function(error,fallback='Unable to complete the requested action. Please try again.'){
    const raw=String(error?.message||error||'').toLowerCase();
    if(raw.includes('permission')||raw.includes('insufficient'))return 'You do not have permission to complete this action.';
    if(raw.includes('network')||raw.includes('offline')||raw.includes('failed to fetch'))return 'Unable to connect to Firebase. Please check the internet connection and try again.';
    if(raw.includes('firestore verification'))return 'The data could not be verified in Firebase. Please try again.';
    if(raw.includes('auth')||raw.includes('sign in')||raw.includes('unauth'))return 'Your login session is not ready. Please sign in again.';
    return fallback;
  };

  const collectionLabels={
    rgms_residents:'Resident', residents:'Resident', rgms_development_fund:'Colony Fund payment', developmentFundPayments:'Colony Fund payment',
    rgms_festival_fund:'Ganesh contribution', festivalFundPayments:'Ganesh contribution', rgms_ganesh_festival:'Ganesh Festival record', ganeshFestivalCelebrations:'Ganesh Festival record',
    rgms_complaints:'Complaint', complaints:'Complaint', rgms_visitors:'Visitor record', visitors:'Visitor record', rgms_meetings:'Meeting', meetings:'Meeting',
    rgms_documents:'Document', documents:'Document', rgms_expenditures:'Expenditure', expenditures:'Expenditure', rgms_notices:'Notice', notices:'Notice',
    rgms_general_information:'Information record', generalInformation:'Information record', rgms_service_providers:'Service provider', serviceProviders:'Service provider',
    rgms_home_services:'Home service', homeServices:'Home service', rgms_billers:'Biller', billers:'Biller', rgms_user_profiles:'Role record', userProfiles:'Role record', rgms_settings:'Settings', settings:'Settings'
  };
  window.addEventListener('rgms:data-changed',e=>{
    const d=e.detail||{}, label=collectionLabels[d.key]||'Record';
    const action=String(d.action||'').toLowerCase();
    const verb=action.includes('delete')?'deleted':action.includes('set')||action.includes('replace')?'updated':'saved';
    toast(`${label} ${verb} successfully.`);
    // Resident CRUD immediately invalidates/repopulates every resident dropdown.
    if(String(d.key).toLowerCase().includes('resident')){
      setTimeout(()=>{try{window.dispatchEvent(new CustomEvent('rgms:resident-directory-changed'));}catch(_){ }},0);
    }
  });
  let lastUserActionAt=0, lastDataErrorAt=0, lastRuntimeFingerprint='', lastRuntimeToastAt=0;
  document.addEventListener('click',e=>{if(e.target?.closest?.('button,a,[role="button"],.summary-card'))lastUserActionAt=Date.now();},true);
  document.addEventListener('submit',()=>{lastUserActionAt=Date.now();},true);
  window.addEventListener('rgms:data-error',e=>{const d=e.detail||{};const label=collectionLabels[d.key]||'Record';const action=String(d.action||'action');lastDataErrorAt=Date.now();toast(`${label}: ${RGMS.friendlyError(d.error,`Unable to complete the ${action}. Please try again.`)}`,true);});
  function notifyRuntimeError(error,kind){
    if(!error)return;
    console.error(kind,error);
    // Background Firebase/auth/bootstrap promises can legitimately reject while a
    // role screen is already usable. CRUD failures are reported by rgms:data-error.
    // Only surface an otherwise-unhandled runtime error when it closely follows a
    // user action, and suppress duplicates from the same thrown Promise.
    const now=Date.now();
    if(now-lastUserActionAt>5000 || now-lastDataErrorAt<1200)return;
    const fp=String(error?.code||'')+'|'+String(error?.message||error||'');
    if(fp===lastRuntimeFingerprint && now-lastRuntimeToastAt<5000)return;
    lastRuntimeFingerprint=fp;lastRuntimeToastAt=now;toast(RGMS.friendlyError(error),true);
  }
  window.addEventListener('unhandledrejection',e=>notifyRuntimeError(e?.reason,'RGMS action failed:'));
  window.addEventListener('error',e=>notifyRuntimeError(e?.error,'RGMS runtime error:'));

  // Full-screen presentation for every dedicated dashboard drill-down section.
  function syncFilteredBodyLock(){
    const open=!!document.querySelector('.rg-filter-overlay[style*="display: block"],.dashboard-dropdown-open,.module-container.rg-filtered-register-fullscreen');
    document.body?.classList.toggle('rg-filter-screen-open',open);
  }
  function enforceDetailFullscreen(){
    document.querySelectorAll('.dashboard-dropdown-open,.ganesh-dashboard-detail[style*="display: block"],.dashboard-detail-section[style*="display: block"]').forEach(sec=>{if(!sec.classList.contains('rg-filter-overlay'))sec.classList.add('rg-filter-overlay');});
    syncFilteredBodyLock();
  }
  let detailFrame=0;
  const scheduleDetailFullscreen=()=>{if(detailFrame)return;detailFrame=requestAnimationFrame(()=>{detailFrame=0;enforceDetailFullscreen();});};
  const detailObserver=new MutationObserver(scheduleDetailFullscreen);
  function observe(){const root=document.getElementById('content-area');if(root)detailObserver.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});enforceDetailFullscreen();}

  // Modules that use an ActiveFilter message instead of a separate drill-down
  // are promoted to a clean full-screen register. Cards and entry forms are
  // hidden while the filtered register is active.
  const activeFilterIds=['complaintActiveFilter','visitorActiveFilter','documentActiveFilter','meetingActiveFilter','infoActiveFilter'];
  function filterModuleScan(){
    activeFilterIds.forEach(id=>{
      const f=document.getElementById(id); if(!f)return;
      const module=f.closest('.module-container'); if(!module)return;
      const active=f.style.display!=='none' && String(f.textContent||'').trim();
      if(module.classList.contains('rg-filtered-register-fullscreen')!==!!active)module.classList.toggle('rg-filtered-register-fullscreen',!!active);
      if(!active){module.querySelector(':scope > .rg-filtered-screen-head')?.remove();}
      if(active && !module.querySelector(':scope > .rg-filtered-screen-head')){
        const h=document.createElement('div');h.className='rg-filtered-screen-head';h.innerHTML='<strong>Filtered Register</strong><button type="button" class="btn btn-secondary">Close</button>';
        h.querySelector('button').onclick=()=>{
          const totalSelectors={complaintActiveFilter:'[data-complaint-dashboard="total"]',visitorActiveFilter:'[data-visitor-dashboard="total"]',documentActiveFilter:'[data-document-dashboard="total"]',meetingActiveFilter:'[data-meeting-dashboard="total"]',infoActiveFilter:'[data-info-dashboard="total"]'};
          const total=module.querySelector(totalSelectors[id]||'');
          if(total){total.click();return;}
          f.textContent='';f.style.display='none';module.classList.remove('rg-filtered-register-fullscreen');
        };
        module.prepend(h);
      }
    });
    syncFilteredBodyLock();
  }
  let filterFrame=0;
  const scheduleFilterScan=()=>{if(filterFrame)return;filterFrame=requestAnimationFrame(()=>{filterFrame=0;filterModuleScan();});};
  const filterObserver=new MutationObserver(scheduleFilterScan);
  function startFilterObserver(){const root=document.getElementById('content-area');if(root)filterObserver.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['style','class']});filterModuleScan();}


  const residentSelectIds=new Set(['residentName','staffResident','cmbResidentName','colonyFormResident','ganeshChandaName','ganeshWinnerName','ganeshSponsorName','complaintPlot','visitorPlot']);
  function sortResidentDropdowns(){
    residentSelectIds.forEach(id=>{
      const sel=document.getElementById(id);if(!sel||sel.options.length<3)return;
      const current=sel.value, options=[...sel.options];
      const placeholders=options.filter((o,i)=>i===0||!o.value);
      const data=options.filter(o=>!placeholders.includes(o)).sort((a,b)=>String(a.textContent||'').trim().localeCompare(String(b.textContent||'').trim(),'en',{sensitivity:'base',numeric:true}));
      const desired=[...placeholders,...data];
      // Do not rewrite an already-sorted <select>. replaceChildren itself is a
      // childList mutation; repeatedly doing it from our MutationObserver caused
      // an infinite observer loop and Chrome's "This page isn't responding".
      if(desired.length===options.length && desired.every((o,i)=>o===options[i]))return;
      sel.replaceChildren(...desired);sel.value=current;
    });
  }
  window.addEventListener('rgms:resident-directory-changed',()=>setTimeout(sortResidentDropdowns,0));

  // Dashboard number/card alignment safety. Runs after every module render and
  // after resize so long currency figures stay inside mobile cards.
  function fitCards(){
    document.querySelectorAll('.summary-card').forEach(card=>{
      card.style.setProperty('min-width','0','important');card.style.setProperty('box-sizing','border-box','important');
      // Module CSS owns the font size. Global JS only guarantees alignment and
      // containment; measuring scrollWidth one pixel at a time forced thousands
      // of synchronous layouts while dashboard figures were rendering.
      card.querySelectorAll('.dashboard-number,.dashboard-figure-link').forEach(v=>{
        v.style.setProperty('max-width','100%','important');v.style.setProperty('width','100%','important');v.style.setProperty('box-sizing','border-box','important');v.style.setProperty('text-align','center','important');v.style.setProperty('font-variant-numeric','tabular-nums','important');
      });
    });
  }
  let cardFrame=0;
  const scheduleCardConsistency=()=>{if(cardFrame)return;cardFrame=requestAnimationFrame(()=>{cardFrame=0;fitCards();sortResidentDropdowns();});};
  const cardObserver=new MutationObserver(scheduleCardConsistency);
  function startCardObserver(){const root=document.getElementById('content-area');if(root)cardObserver.observe(root,{subtree:true,childList:true});fitCards();sortResidentDropdowns();}

  document.addEventListener('DOMContentLoaded',()=>{observe();startFilterObserver();startCardObserver();});
  window.addEventListener('resize',fitCards);
})();
