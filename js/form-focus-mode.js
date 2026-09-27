(function(){
  'use strict';

  const params = new URLSearchParams(location.search);
  const moduleName = String(document.body?.dataset?.fmsModule || '').toLowerCase();
  const mode = String(params.get('mode') || (params.get('id') ? 'view' : '')).toLowerCase();
  const requested = params.get('fullscreenForm') === '1' || params.get('formFullscreen') === '1' || !!(params.get('id') || params.get('recordId') || params.get('docId')) || ['new','view','edit','delete'].includes(mode);
  let overlay = null;
  let movedTarget = null;
  let placeholder = null;
  let originalParent = null;
  let originalNext = null;
  let retryTimer = null;

  function target(){
    if(moduleName === 'rti') return document.querySelector('.form-container');
    if(moduleName === 'disha') return document.getElementById('dishaDataEntryFocus');
    if(moduleName === 'cpgrams') return document.getElementById('cpgramsForm');
    return document.querySelector('form');
  }

  function rememberReturnUrl(){
    try {
      if(document.referrer && new URL(document.referrer).origin === location.origin){
        const ref = new URL(document.referrer);
        if(!/\/(cpgrams|rti|disha)(\.html)?$/.test(ref.pathname) || ref.searchParams.get('fullscreenForm') !== '1'){
          sessionStorage.setItem('fmsCrudReturnUrl', ref.href);
        }
      }
    } catch(_) {}
  }

  function restoreMovedTarget(){
    if(!movedTarget) return;
    try {
      if(placeholder?.parentNode) placeholder.parentNode.replaceChild(movedTarget, placeholder);
      else if(originalParent) originalParent.insertBefore(movedTarget, originalNext || null);
    } catch(_) {}
    movedTarget.classList.remove('fms-form-focus-content');
    movedTarget = null;
    placeholder = null;
    originalParent = null;
    originalNext = null;
  }

  function closeFocus(){
    restoreMovedTarget();
    overlay?.remove();
    overlay = null;
    document.body.classList.remove('fms-form-focus-active');
    try {
      const returnUrl = sessionStorage.getItem('fmsCrudReturnUrl');
      if(returnUrl){
        sessionStorage.removeItem('fmsCrudReturnUrl');
        location.href = returnUrl;
        return;
      }
    } catch(_) {}
    if(history.length > 1){ history.back(); return; }
    if(moduleName === 'rti') location.href = 'rti-register.html';
    else if(moduleName === 'disha') location.href = 'disha-register.html';
    else location.href = 'cpgrams-register.html';
  }

  function proxyButton(sourceId, text, className){
    const source = document.getElementById(sourceId);
    if(!source) return null;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `btn ${className}`;
    b.innerHTML = text;
    b.addEventListener('click', () => source.click());
    return b;
  }

  function addModeActions(bar){
    const actions = document.createElement('div');
    actions.className = 'fms-form-focus-actions';
    const effectiveMode = mode || (params.get('id') ? 'view' : 'new');
    let action = null;
    if(effectiveMode === 'new') action = proxyButton('btnSave','<i class="bi bi-save"></i> Save','btn-success');
    if(effectiveMode === 'edit') action = proxyButton('btnUpdate','<i class="bi bi-pencil-square"></i> Update','btn-primary');
    if(effectiveMode === 'delete') action = proxyButton('btnDelete','<i class="bi bi-trash"></i> Delete','btn-danger');
    if(action) actions.appendChild(action);

    const label = document.createElement('span');
    label.className = 'badge bg-dark fms-form-focus-mode-label';
    label.textContent = `${moduleName.toUpperCase()} ${effectiveMode.toUpperCase()}`;
    actions.appendChild(label);

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'btn btn-secondary';
    back.innerHTML = '&larr; Back to Register';
    back.addEventListener('click', closeFocus);
    actions.appendChild(back);
    bar.appendChild(actions);
  }

  function makeViewReadOnly(box){
    if(mode !== 'view') return;
    box.querySelectorAll('input,select,textarea,button').forEach(el => {
      if(el.closest('.fms-form-focus-header')) return;
      if(el.type === 'hidden') return;
      el.dataset.fmsFocusPrevDisabled = el.disabled ? '1' : '0';
      el.disabled = true;
    });
  }

  function activate(){
    if(!requested || overlay) return !!overlay;
    const box = target();
    if(!box) return false;

    rememberReturnUrl();
    document.body.classList.add('fms-form-focus-active');

    overlay = document.createElement('div');
    overlay.className = 'fms-form-focus-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');

    const shell = document.createElement('div');
    shell.className = 'fms-form-focus-shell';
    const header = document.createElement('div');
    header.className = 'fms-form-focus-header';
    addModeActions(header);
    shell.appendChild(header);

    originalParent = box.parentNode;
    originalNext = box.nextSibling;
    placeholder = document.createComment('fms-form-focus-placeholder');
    originalParent?.insertBefore(placeholder, box);
    movedTarget = box;
    box.classList.add('fms-form-focus-content');
    shell.appendChild(box);
    overlay.appendChild(shell);
    document.body.appendChild(overlay);

    makeViewReadOnly(box);
    overlay.scrollTop = 0;
    try { window.scrollTo(0,0); } catch(_) {}
    return true;
  }

  function ensureActivated(){
    if(!requested || overlay) return;
    if(activate()) return;
    clearTimeout(retryTimer);
    retryTimer = setTimeout(ensureActivated, 120);
  }

  const style = document.createElement('style');
  style.textContent = `
    body.fms-form-focus-active{overflow:hidden!important}
    .fms-form-focus-overlay{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:2147483646!important;background:#eef2f6!important;overflow:auto!important;padding:0!important;isolation:isolate!important}
    .fms-form-focus-shell{min-height:100vh!important;width:100%!important;background:#f4f6f9!important}
    .fms-form-focus-header{position:sticky!important;top:0!important;z-index:2147483647!important;background:#fff!important;border-bottom:1px solid #d9dee5!important;box-shadow:0 2px 8px rgba(0,0,0,.12)!important;padding:10px 16px!important}
    .fms-form-focus-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:10px!important;flex-wrap:wrap!important}
    .fms-form-focus-mode-label{font-size:.9rem!important;padding:.6rem .75rem!important;margin-right:auto!important}
    .fms-form-focus-content{display:block!important;position:relative!important;inset:auto!important;z-index:auto!important;width:min(1400px,calc(100% - 28px))!important;max-width:1400px!important;height:auto!important;min-height:calc(100vh - 72px)!important;overflow:visible!important;margin:14px auto 30px!important;padding:18px 22px 36px!important;background:#fff!important;border-radius:8px!important;box-shadow:0 2px 14px rgba(0,0,0,.10)!important}
    .fms-form-focus-content .fms-action-toolbar{position:static!important}
    .fms-form-focus-content footer{display:none!important}
    @media(max-width:768px){.fms-form-focus-content{width:calc(100% - 12px)!important;margin:6px auto 18px!important;padding:12px!important}.fms-form-focus-header{padding:8px!important}.fms-form-focus-actions{gap:6px!important}.fms-form-focus-mode-label{width:100%!important;margin:0!important;text-align:center!important}}
  `;
  document.head.appendChild(style);

  if(requested){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureActivated, {once:true});
    else ensureActivated();
    window.addEventListener('load', ensureActivated, {once:true});
    window.addEventListener('pageshow', ensureActivated);
    window.addEventListener('popstate', ensureActivated);
    const observer = new MutationObserver(() => { if(requested && !overlay) ensureActivated(); });
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(() => observer.disconnect(), 5000);
  }

  window.FMSFormFocus = { activate: ensureActivated, close: closeFocus };
})();
