(function(){
  'use strict';
  function pad(n){return String(n).padStart(2,'0');}
  function isoToDisplay(v){const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(v||'');}
  function displayToIso(v){const s=String(v||'').trim();if(!s)return '';let m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(m){const d=+m[1],mo=+m[2],y=+m[3],x=new Date(y,mo-1,d);if(x.getFullYear()===y&&x.getMonth()===mo-1&&x.getDate()===d)return `${y}-${pad(mo)}-${pad(d)}`;return null;}m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?s:null;}
  function adapt(el){
    if(!el||el.dataset.fmsDdMmYyyy==='1'||el.dataset.fmsDateUiSkip==='1'||el.classList.contains('fms-date-ui-skip'))return; el.dataset.fmsDdMmYyyy='1';
    const wrap=document.createElement('div');wrap.className='fms-date-wrap';
    const visible=document.createElement('input');visible.type='text';visible.className=el.className;visible.placeholder='DD/MM/YYYY';visible.autocomplete='off';visible.inputMode='numeric';visible.value=isoToDisplay(el.value);visible.dataset.fmsDateDisplayFor=el.id||'';
    const pick=document.createElement('button');pick.type='button';pick.className='fms-date-picker-btn';pick.setAttribute('aria-label','Open calendar');pick.title='Open calendar';pick.innerHTML='&#128197;';
    el.parentNode.insertBefore(wrap,el);wrap.appendChild(visible);wrap.appendChild(pick);wrap.appendChild(el);
    el.classList.add('fms-native-date-picker');
    if(el.disabled)visible.disabled=true;if(el.readOnly){visible.readOnly=true;pick.disabled=true;}
    let last=el.value;
    function fromVisible(){const iso=displayToIso(visible.value);if(iso===null){visible.setCustomValidity('Enter date as DD/MM/YYYY');return false;}visible.setCustomValidity('');if(el.value!==iso){el.value=iso;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}last=el.value;visible.value=isoToDisplay(el.value);return true;}
    visible.addEventListener('input',()=>{const v=visible.value.trim();if(!v||/^\d{2}\/\d{2}\/\d{4}$/.test(v))fromVisible();});visible.addEventListener('change',fromVisible);visible.addEventListener('blur',fromVisible);
    pick.addEventListener('click',()=>{if(pick.disabled)return;try{if(typeof el.showPicker==='function')el.showPicker();else el.click();}catch(_){el.click();}});
    el.addEventListener('change',()=>{last=el.value;visible.value=isoToDisplay(el.value);visible.setCustomValidity('');});
    setInterval(()=>{if(el.value!==last&&document.activeElement!==visible){last=el.value;visible.value=isoToDisplay(el.value);}visible.disabled=el.disabled;visible.readOnly=el.readOnly;pick.disabled=el.disabled||el.readOnly;},200);
  }
  function init(){document.querySelectorAll('input[type="date"]:not([data-fms-date-ui-skip="1"]):not(.fms-date-ui-skip)').forEach(adapt);}
  function syncAll(){document.querySelectorAll('[data-fms-date-display-for]').forEach(visible=>{const id=visible.dataset.fmsDateDisplayFor;if(!id)return;const el=document.getElementById(id);if(!el)return;const iso=displayToIso(visible.value);if(iso!==null){visible.setCustomValidity('');el.value=iso;}else visible.setCustomValidity('Enter date as DD/MM/YYYY');});}
  function refreshDisplays(){document.querySelectorAll('[data-fms-date-display-for]').forEach(v=>{const el=document.getElementById(v.dataset.fmsDateDisplayFor||'');if(el){v.value=isoToDisplay(el.value);v.setCustomValidity('');}});}
  const style=document.createElement('style');style.textContent='.fms-date-wrap{position:relative;display:flex;align-items:stretch;width:100%}.fms-date-wrap>input[data-fms-date-display-for]{padding-right:46px}.fms-date-picker-btn{position:absolute;right:1px;top:1px;bottom:1px;width:42px;border:0;border-left:1px solid #dee2e6;background:#fff;border-radius:0 .375rem .375rem 0;cursor:pointer;font-size:20px;line-height:1}.fms-date-picker-btn:hover{background:#f3f6f9}.fms-date-picker-btn:disabled{opacity:.45;cursor:not-allowed}.fms-native-date-picker{position:absolute!important;right:0!important;bottom:0!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}';document.head.appendChild(style);
  document.addEventListener('click',e=>{const b=e.target.closest('button,input[type="button"],input[type="submit"]');if(!b)return;const label=String(b.textContent||b.value||'').trim().toLowerCase();if(label.includes('save')||label.includes('update'))syncAll();},true);document.addEventListener('submit',syncAll,true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();new MutationObserver(init).observe(document.documentElement,{childList:true,subtree:true});
  window.FMSDateUI={isoToDisplay,displayToIso,refresh:init,syncAll,refreshDisplays};
})();
