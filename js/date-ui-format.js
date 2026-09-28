(function(){
  'use strict';
  function pad(n){return String(n).padStart(2,'0');}
  function isoToDisplay(v){
    const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m?`${m[3]}/${m[2]}/${m[1]}`:String(v||'');
  }
  function displayToIso(v){
    const s=String(v||'').trim(); if(!s) return '';
    let m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if(m){const d=+m[1],mo=+m[2],y=+m[3],x=new Date(y,mo-1,d);if(x.getFullYear()===y&&x.getMonth()===mo-1&&x.getDate()===d)return `${y}-${pad(mo)}-${pad(d)}`;return null;}
    m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/); return m?s:null;
  }
  function adapt(el){
    if(!el || el.dataset.fmsDdMmYyyy==='1') return;
    el.dataset.fmsDdMmYyyy='1';
    const visible=document.createElement('input');
    visible.type='text'; visible.className=el.className; visible.placeholder='DD/MM/YYYY';
    visible.autocomplete='off'; visible.inputMode='numeric'; visible.value=isoToDisplay(el.value);
    visible.dataset.fmsDateDisplayFor=el.id||'';
    if(el.disabled) visible.disabled=true; if(el.readOnly) visible.readOnly=true;
    el.style.display='none'; el.insertAdjacentElement('afterend',visible);
    let last=el.value;
    function fromVisible(){const iso=displayToIso(visible.value);if(iso===null){visible.setCustomValidity('Enter date as DD/MM/YYYY');return;}visible.setCustomValidity('');if(el.value!==iso){el.value=iso;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}last=el.value;visible.value=isoToDisplay(el.value);}
    visible.addEventListener('input',()=>{const v=visible.value.trim();if(!v || /^\d{2}\/\d{2}\/\d{4}$/.test(v))fromVisible();}); visible.addEventListener('change',fromVisible); visible.addEventListener('blur',fromVisible);
    setInterval(()=>{if(el.value!==last && document.activeElement!==visible){last=el.value;visible.value=isoToDisplay(el.value);} visible.disabled=el.disabled; visible.readOnly=el.readOnly;},250);
  }
  function init(){document.querySelectorAll('input[type="date"]').forEach(adapt);}
  function syncAll(){document.querySelectorAll('[data-fms-date-display-for]').forEach(visible=>{const id=visible.dataset.fmsDateDisplayFor;if(!id)return;const el=document.getElementById(id);if(!el)return;const iso=displayToIso(visible.value);if(iso!==null){visible.setCustomValidity('');el.value=iso;}else visible.setCustomValidity('Enter date as DD/MM/YYYY');});}
  document.addEventListener('click',e=>{const b=e.target.closest('button,input[type="button"],input[type="submit"]');if(!b)return;const label=String(b.textContent||b.value||'').trim().toLowerCase();if(label.includes('save')||label.includes('update'))syncAll();},true);
  document.addEventListener('submit',syncAll,true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  new MutationObserver(init).observe(document.documentElement,{childList:true,subtree:true});
  window.FMSDateUI={isoToDisplay,displayToIso,refresh:init,syncAll};
})();
