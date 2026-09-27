(function(){
  'use strict';
  const q=new URLSearchParams(location.search);
  const module=(document.body.dataset.fmsModule||'').toLowerCase();
  const requested=q.get('fullscreenForm')==='1'||!!q.get('id')||['new','view','edit','delete'].includes((q.get('mode')||'').toLowerCase());
  function target(){
    if(module==='rti') return document.querySelector('.form-container');
    if(module==='disha') return document.getElementById('dishaDataEntryFocus');
    if(module==='cpgrams') return document.getElementById('cpgramsForm')?.closest('.container-fluid');
    return document.querySelector('form')?.parentElement;
  }
  function closeFocus(){
    if(history.length>1) history.back();
    else if(module==='rti') location.href='rti-register.html';
    else if(module==='disha') location.href='disha-register.html';
    else location.href='cpgrams-register.html';
  }
  function activate(){
    const box=target(); if(!box) return;
    document.body.classList.add('fms-form-focus-active');
    box.classList.add('fms-form-focus-panel');
    if(!box.querySelector('.fms-form-focus-close')){
      const bar=document.createElement('div'); bar.className='fms-form-focus-closebar';
      const b=document.createElement('button'); b.type='button'; b.className='btn btn-secondary fms-form-focus-close'; b.innerHTML='&larr; Back to Register'; b.addEventListener('click',closeFocus);
      bar.appendChild(b); box.insertBefore(bar,box.firstChild);
    }
    box.scrollTop=0; window.scrollTo(0,0);
  }
  const style=document.createElement('style');
  style.textContent=`body.fms-form-focus-active{overflow:hidden!important;background:#eef2f6!important}.fms-form-focus-active .fms-form-focus-panel{position:fixed!important;inset:0!important;z-index:2147483000!important;display:block!important;overflow:auto!important;background:#f4f6f9!important;margin:0!important;max-width:none!important;width:100%!important;height:100vh!important;padding:18px 24px 40px!important;border-radius:0!important}.fms-form-focus-closebar{position:sticky;top:0;z-index:2147483001;display:flex;justify-content:flex-end;padding:4px 0 12px;background:#f4f6f9}.fms-form-focus-panel .fms-action-toolbar{top:0}.fms-form-focus-panel>h4{margin-top:0!important}@media(max-width:768px){.fms-form-focus-active .fms-form-focus-panel{padding:10px!important}}`;
  document.head.appendChild(style);
  if(requested){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',activate); else activate(); }
  window.FMSFormFocus={activate,close:closeFocus};
})();
