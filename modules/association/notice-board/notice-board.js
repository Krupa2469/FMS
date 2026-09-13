let noticeBoardRows=[];
let selectedNoticeBoardId='';
const nbEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function canNoticeBoard(action){
  const ra=window.RGMS?.roleAccess;
  if(ra?.isConfigured?.())return ra.can('noticeBoard',action);
  const role=String(RGMS.auth.getSession()?.role||'');
  return ['Admin','President','Secretary','Treasurer'].includes(role)&&['view','add','update','delete','publish'].includes(action);
}
async function initializeNoticeBoard(){
  const role=String(RGMS.auth.getSession()?.role||'');
  if(!['Admin','President','Secretary','Treasurer'].includes(role)){document.querySelector('.notice-board-module').innerHTML='<div class="message error">Notice Board publishing is available to office bearers only.</div>';return;}
  bindNoticeBoard(); await refreshNoticeBoard(); clearNoticeBoard();
}
function bindNoticeBoard(){
 document.getElementById('nbPublish')?.addEventListener('click',publishNoticeBoard);
 document.getElementById('nbDelete')?.addEventListener('click',()=>deleteNoticeBoardById(selectedNoticeBoardId));
 document.getElementById('nbClear')?.addEventListener('click',clearNoticeBoard);
 document.getElementById('nbRefresh')?.addEventListener('click',refreshNoticeBoard);
}
async function refreshNoticeBoard(){
 try{await RGMS.store.loadCollection(STORAGE_KEYS.NOTICES,{retries:3});noticeBoardRows=getAllRecords(STORAGE_KEYS.NOTICES).filter(r=>String(r.status||'Published').toLowerCase()!=='inactive').sort((a,b)=>String(b.createdOn||b.date||'').localeCompare(String(a.createdOn||a.date||'')));renderNoticeBoard();}catch(e){nbStatus(e.message||'Unable to load notices.',true);}}
function renderNoticeBoard(){
 const body=document.getElementById('nbBody');if(!body)return;
 body.innerHTML=noticeBoardRows.slice(0,100).map(r=>{
   const id=nbEsc(r.id||'');
   return `<tr data-rg-id="${id}"><td>${nbEsc(r.date||r.createdOn||'')}</td><td>${nbEsc(r.type||'Notice')}</td><td><strong>${nbEsc(r.title||'')}</strong></td><td>${nbEsc(r.message||r.description||r.content||'')}</td><td>${nbEsc(r.publishedByName||r.createdBy||'')}</td><td><div class="rg-grid-actions"><button type="button" class="rg-icon-btn" onclick="selectNoticeBoard('${id}',true)">👁️ View</button>${canNoticeBoard('update')?`<button type="button" class="rg-icon-btn" onclick="selectNoticeBoard('${id}',false)">✏️ Edit</button>`:''}${canNoticeBoard('delete')?`<button type="button" class="rg-icon-btn rg-delete" onclick="deleteNoticeBoardById('${id}')">🗑️ Delete</button>`:''}</div></td></tr>`;
 }).join('')||'<tr><td colspan="6" class="empty">No published messages.</td></tr>';
}
function setNoticeFormDisabled(disabled){
 ['nbTitle','nbType','nbMessage'].forEach(id=>{const e=document.getElementById(id);if(e)e.disabled=disabled;});
 const publish=document.getElementById('nbPublish');if(publish)publish.disabled=disabled;
}
function selectNoticeBoard(id,viewOnly=false){
 const r=noticeBoardRows.find(x=>String(x.id)===String(id));if(!r)return;
 selectedNoticeBoardId=String(r.id||'');
 document.getElementById('nbTitle').value=r.title||'';
 document.getElementById('nbType').value=r.type||'Notice';
 document.getElementById('nbMessage').value=r.message||r.description||r.content||'';
 const del=document.getElementById('nbDelete');if(del)del.disabled=viewOnly||!canNoticeBoard('delete');
 setNoticeFormDisabled(viewOnly);
 const pub=document.getElementById('nbPublish');if(pub){pub.textContent=viewOnly?'View Only':'Update Notice';pub.disabled=viewOnly;}
 nbStatus(viewOnly?'Notice opened in view-only mode. Click Clear to return.':'Notice selected. Edit the fields and click Update Notice.');
 document.querySelector('.notice-board-module .form-card')?.scrollIntoView({behavior:'smooth',block:'start'});
}
async function publishNoticeBoard(){
 const title=document.getElementById('nbTitle')?.value.trim()||'',message=document.getElementById('nbMessage')?.value.trim()||'',type=document.getElementById('nbType')?.value||'Notice';
 if(!title||!message){nbStatus('Title and message are required.',true);return;}
 const isUpdate=!!selectedNoticeBoardId;
 if(!canNoticeBoard(isUpdate?'update':'add')&&!canNoticeBoard('publish')){nbStatus('This role does not have permission to publish or update notices.',true);return;}
 const s=RGMS.auth.getSession()||{};
 const old=isUpdate?noticeBoardRows.find(x=>String(x.id)===String(selectedNoticeBoardId)):null;
 const rec={...(old||{}),title,message,type,status:'Published',audience:'All Residents',date:old?.date||new Date().toISOString().slice(0,10),createdOn:old?.createdOn||new Date().toISOString(),createdBy:old?.createdBy||s.role||'',publishedByName:old?.publishedByName||s.ownerName||s.name||s.role||'Office Bearer',updatedOn:new Date().toISOString(),updatedBy:s.ownerName||s.name||s.role||''};
 const btn=document.getElementById('nbPublish');
 try{
   btn&&(btn.disabled=true);
   if(isUpdate){await RGMS.store.setRecord(STORAGE_KEYS.NOTICES,selectedNoticeBoardId,rec);nbStatus('Notice updated successfully.');}
   else{await insertRecord(STORAGE_KEYS.NOTICES,rec);nbStatus('Published successfully. All residents can now see this message in their Notice Board.');alert('Notice published successfully. Residents will receive an in-app pop-up while their Resident Dashboard is open.');}
   await refreshNoticeBoard();clearNoticeBoard();
 }catch(e){nbStatus(e.message||'Unable to save notice.',true);}finally{btn&&(btn.disabled=false);}
}
async function deleteNoticeBoardById(id){
 if(!id)return nbStatus('Select a notice first.',true);
 if(!canNoticeBoard('delete'))return nbStatus('This role does not have permission to delete notices.',true);
 const r=noticeBoardRows.find(x=>String(x.id)===String(id));if(!r)return;
 if(!confirm(`Delete notice ${r.title||''}?`))return;
 try{await RGMS.store.deleteRecord(STORAGE_KEYS.NOTICES,id);await refreshNoticeBoard();clearNoticeBoard();nbStatus('Notice deleted successfully.');}catch(e){nbStatus(e.message||'Unable to delete notice.',true);}
}
function clearNoticeBoard(){
 selectedNoticeBoardId='';
 ['nbTitle','nbMessage'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
 if(document.getElementById('nbType'))document.getElementById('nbType').value='Notice';
 setNoticeFormDisabled(false);
 const pub=document.getElementById('nbPublish');if(pub){pub.textContent='Publish to All Residents';pub.disabled=false;}
 const del=document.getElementById('nbDelete');if(del)del.disabled=true;
}
function nbStatus(t,error=false){const e=document.getElementById('nbStatus');if(e){e.textContent=t;e.style.color=error?'#c62828':'#2e7d32';}}
window.initializeNoticeBoard=initializeNoticeBoard;
window.selectNoticeBoard=selectNoticeBoard;
window.deleteNoticeBoardById=deleteNoticeBoardById;