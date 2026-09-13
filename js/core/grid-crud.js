/* Rose Gardens - Grid CRUD Form Workflow v1.2.79
   Every management grid uses View / Edit / Delete actions.
   Clicking an action hides the grid and opens the existing module form.
*/
(function(){
'use strict';

const CONFIG={
  residentsBody:{select:'selectResident',del:'deleteResidentById',save:'saveResident',clear:'clearResidentForm',form:'.module-container .form-card:first-of-type'},
  visitorsBody:{select:'selectVisitor',del:'deleteVisitorById',save:'saveVisitor',clear:'clearVisitorForm',form:'.module-container .form-card:first-of-type'},
  complaintsBody:{select:'selectComplaint',del:'deleteComplaintById',save:'saveComplaint',clear:'clearComplaintForm',form:'.module-container .form-card:first-of-type'},
  meetingsBody:{select:'selectMeeting',del:'deleteMeetingById',save:'saveMeeting',clear:'clearMeetingForm',form:'.module-container .form-card:first-of-type'},
  documentsBody:{select:'selectDocument',del:'deleteDocumentById',save:'updateSelectedDocument',clear:'clearDocumentForm',form:'#docAdminForm'},
  infoBody:{select:'selectInfo',del:'deleteInfoById',save:'saveInfo',clear:'clearInfo',form:'.module-container .form-card:first-of-type'},
  roleRegisterBody:{select:'selectRoleProfile',del:'deleteRoleProfile',save:'saveStaffRole',form:'ROLE_SUMMARY'},
  homeServicesBody:{select:'selectHomeService',del:'deleteHomeServiceById',save:'saveHomeService',clear:'clearHomeService',form:'#homeServicesBody'},
  providersBody:{select:'selectProvider',del:'deleteProviderById',save:'saveProvider',clear:'clearProvider',form:'#providersBody'},
  billersBody:{select:'selectBiller',del:'deleteBillerById',save:'saveBiller',clear:'clearBiller',form:'#billersBody'},
  expenditureBody:{select:'selectExpenditure',del:'deleteExpenditureById',save:'saveExpenditure',clear:'clearExpenditureForm',form:'#expenditureRegisterSection'},
  paymentHistoryBody:{select:'selectPayment',del:'deletePaymentById',save:'savePayment',clear:'clearForm',form:'#paymentContent'},
  ganeshBody:{select:'selectGaneshRecord',del:'deleteGaneshRecord',save:'saveGaneshChanda',clear:'resetChandaForm',form:'[data-ganesh-form="collection"]'},
  ganeshSponsorBody:{select:'selectGaneshSponsor',del:'deleteGaneshSponsor',save:'saveGaneshSponsor',clear:'resetSponsorForm',form:'[data-ganesh-form="sponsor"]'}
};

function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function getCfg(body){return CONFIG[body?.id]||null;}
function rowId(tr){return tr?.dataset?.rgId||tr?.querySelector('[data-id]')?.dataset?.id||'';}
function parseInlineId(button){
  const text=button?.getAttribute('onclick')||'';
  const m=text.match(/\((['"])(.*?)\1\)/);
  return m?m[2]:'';
}
function resolveId(button,tr){return rowId(tr)||parseInlineId(button);}
function findForm(cfg,tbody){
  if(!cfg)return null;
  if(cfg.form==='ROLE_SUMMARY')return tbody.closest('.summary-section');
  if(cfg.form==='#paymentContent')return document.getElementById('paymentContent');
  if(cfg.form==='[data-ganesh-form="collection"]')return document.querySelector('.ganesh-module [data-ganesh-form="collection"]')||tbody.closest('.form-card')?.previousElementSibling;
  if(cfg.form==='[data-ganesh-form="sponsor"]')return document.querySelector('.ganesh-module [data-ganesh-form="sponsor"]')||tbody.closest('.form-card')?.previousElementSibling;
  if(cfg.form==='#expenditureRegisterSection')return document.getElementById('expenditureRegisterSection');
  if(cfg.form==='#homeServicesBody'||cfg.form==='#providersBody'||cfg.form==='#billersBody')return tbody.closest('.master-panel');
  if(cfg.form==='#docAdminForm')return document.getElementById('docAdminForm');
  if(cfg.form==='#dashboardAssignmentSection ~ *')return tbody.closest('.summary-section');
  return tbody.closest('.module-container')?.querySelector(cfg.form)||tbody.closest('.module-container')?.querySelector('.form-card');
}
function findGridParts(tbody){
  const wrap=tbody.closest('.table-wrap');
  if(!wrap)return {wrap:null,toolbar:null};
  let toolbar=wrap.previousElementSibling;
  if(toolbar && toolbar.classList.contains('module-toolbar'))return {wrap,toolbar};
  return {wrap,toolbar:null};
}
function disableFormControls(form,disabled){
  form?.querySelectorAll('input,select,textarea,button').forEach(el=>{
    if(el.closest('.rg-crud-toolbar')||el.dataset.rgCrudKeep==='1')return;
    el.disabled=disabled;
  });
}
function addToolbar(form,cfg,tbody,id,mode){
  form.querySelector('.rg-crud-toolbar')?.remove();
  const bar=document.createElement('div');
  bar.className='rg-crud-toolbar';
  bar.innerHTML=`<div><strong>${mode==='view'?'View Record':mode==='edit'?'Edit Record':'Delete Record'}</strong><span class="rg-crud-note">Grid hidden while the form is open.</span></div><div class="rg-crud-buttons"><button type="button" class="btn btn-light rg-crud-back">Back to Grid</button>${mode==='edit'?'<button type="button" class="btn btn-primary rg-crud-save">Save Changes</button>':''}${mode==='delete'?'<button type="button" class="btn btn-danger rg-crud-confirm-delete">Confirm Delete</button>':''}</div>`;
  form.insertBefore(bar,form.firstChild);
  bar.querySelector('.rg-crud-back').onclick=()=>closeForm(form,tbody);
  if(mode==='edit')bar.querySelector('.rg-crud-save').onclick=async()=>{
    try{
      const fn=window[cfg.save];
      if(typeof fn!=='function')throw new Error('Save operation is not available for this grid.');
      const result=fn();
      if(result&&typeof result.then==='function')await result;
      closeForm(form,tbody);
    }catch(e){console.error(e);alert(e?.message||'Unable to save record.');}
  };
  if(mode==='delete')bar.querySelector('.rg-crud-confirm-delete').onclick=async()=>{
    try{
      const fn=window[cfg.del];
      if(typeof fn!=='function')throw new Error('Delete operation is not available for this grid.');
      const result=fn(id);
      if(result&&typeof result.then==='function')await result;
      closeForm(form,tbody);
    }catch(e){console.error(e);alert(e?.message||'Unable to delete record.');}
  };
}
function openForm(tbody,button,mode){
  const cfg=getCfg(tbody);if(!cfg)return;
  const id=resolveId(button,button.closest('tr'));if(!id)return;
  const form=findForm(cfg,tbody);if(!form)return;
  const select=window[cfg.select];
  if(typeof select!=='function')return;
  try{select(id);}catch(e){console.error(e);return;}
  const parts=findGridParts(tbody);
  parts.wrap?.classList.add('rg-grid-hidden');
  parts.toolbar?.classList.add('rg-grid-hidden');
  const panel=tbody.closest('.master-panel');
  if(panel){panel.querySelector('.table-wrap')?.classList.add('rg-grid-hidden');panel.querySelector('.module-toolbar')?.classList.add('rg-grid-hidden');}
  if(form.id==='paymentContent'&&typeof window.openTab==='function')window.openTab('payment');
  form.classList.add('rg-crud-form-open');
  disableFormControls(form,mode!=='edit');
  addToolbar(form,cfg,tbody,id,mode);
  form.scrollIntoView({behavior:'smooth',block:'start'});
}
function closeForm(form,tbody){
  form?.querySelector('.rg-crud-toolbar')?.remove();
  disableFormControls(form,false);
  const parts=findGridParts(tbody);
  parts.wrap?.classList.remove('rg-grid-hidden');
  parts.toolbar?.classList.remove('rg-grid-hidden');
  const panel=tbody.closest('.master-panel');
  if(panel){panel.querySelector('.table-wrap')?.classList.remove('rg-grid-hidden');panel.querySelector('.module-toolbar')?.classList.remove('rg-grid-hidden');}
  form?.classList.remove('rg-crud-form-open');
  if(form?.id==='paymentContent' && typeof window.openTab==='function')window.openTab('history');
}
function enhance(){
  Object.keys(CONFIG).forEach(id=>{
    const tbody=document.getElementById(id);if(!tbody)return;
    tbody.querySelectorAll('tr').forEach(tr=>{
      if(tr.classList.contains('empty')||tr.querySelector('.empty'))return;
      const rid=rowId(tr)||parseInlineId(tr.querySelector('.rg-update,.rg-view,.rg-delete'));if(!rid)return;
      tr.dataset.rgId=rid;
      const action=tr.lastElementChild;
      if(!action||action.dataset.rgCrudEnhanced==='1')return;
      action.innerHTML=`<div class="rg-grid-actions"><button type="button" class="rg-icon-btn rg-view" title="View" aria-label="View">👁️ View</button><button type="button" class="rg-icon-btn rg-update" title="Edit" aria-label="Edit">✏️</button><button type="button" class="rg-icon-btn rg-delete" title="Delete" aria-label="Delete">🗑️</button></div>`;
      action.dataset.rgCrudEnhanced='1';
    });
  });
}

document.addEventListener('click',e=>{
  const b=e.target.closest('.rg-view,.rg-update,.rg-delete');if(!b)return;
  const tbody=b.closest('tbody');const cfg=getCfg(tbody);if(!cfg)return;
  e.preventDefault();e.stopPropagation();
  openForm(tbody,b,b.classList.contains('rg-view')?'view':b.classList.contains('rg-update')?'edit':'delete');
},true);

const st=document.createElement('style');st.textContent=`
.rg-grid-hidden{display:none!important}
.rg-crud-form-open{display:block!important}
.rg-crud-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 14px;margin-bottom:14px;border:2px solid #0b4f8a;border-radius:10px;background:#eef6fc;position:relative;z-index:3}
.rg-crud-toolbar>div:first-child{display:flex;flex-direction:column;gap:3px}.rg-crud-note{font-size:.85rem;color:#5d6d7e}.rg-crud-buttons{display:flex;gap:8px;flex-wrap:wrap}.rg-crud-buttons .btn{min-height:40px}
`;document.head.appendChild(st);
new MutationObserver(()=>enhance()).observe(document.body,{childList:true,subtree:true});
window.addEventListener('load',()=>setTimeout(enhance,300));
window.RGMSGridCRUD={enhance,openForm,closeForm};
})();
