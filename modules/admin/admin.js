let adminRoles=[];let homeServiceRows=[];let providerRows=[];let billerRows=[];let selectedHomeServiceId=null;let selectedProviderId=null;let selectedBillerId=null;let adminResidents=[];let colonyDirectoryAssignments={};
const aesc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const RGMS_MODULE_LABELS={dashboard:'Association Dashboard',"development-fund":'Colony Fund',festival:'Festival Chanda & Laddu Amount',complaints:'Complaints',meetings:'Meetings',documents:'Documents',"general-information":'General Information',"public-services":'Citizen Services',reports:'Reports',residents:'Residents',visitors:'Visitors',communications:'Communications',settings:'Settings'};
const OFFICE_BEARER_FALLBACKS={
 Admin:{displayName:'Krupakar Arakala',role:'Admin'},
 President:{displayName:'Sreekanth Karimilla',role:'President'},
 Secretary:{displayName:'Rajeshwari Yanamandla',role:'Secretary'},
 'Joint Secretary 1':{displayName:'Sekhar Babu Kasoji',role:'Joint Secretary 1'},
 'Joint Secretary 2':{displayName:'Vamshi Reddy Kasula',role:'Joint Secretary 2'},
 Treasurer:{displayName:'Krishna Kishore Sankarabanda',role:'Treasurer'}
};
function officerPhone(profile){
  const phone=String(profile?.phoneE164||profile?.mobile||'').replace(/\D/g,'');
  return phone.length>=10 ? phone.slice(-10) : '';
}
function renderOfficeBearerPreviews(){
  const box=document.getElementById('officeBearerPreviewGrid'); if(!box)return;
  const rows=ACCESS_ROLES.map(role=>{
    const profile=adminRoles.find(r=>String(r.role)===role)||{};
    const fallback=OFFICE_BEARER_FALLBACKS[role]||{displayName:role};
    const name=profile.displayName||profile.ownerName||fallback.displayName;
    const phone=officerPhone(profile);
    const dashboard=profile.primaryDashboard==='resident-dashboard'?'Resident Dashboard':'Association Dashboard';
    return {role,name,phone,dashboard};
  });
  box.innerHTML=rows.map(r=>`<article class="rg-office-preview-card"><div class="rg-office-preview-icon">${r.role==='Admin'?'⚙️':r.role==='President'?'👤':r.role==='Secretary'?'📋':'💰'}</div><div class="rg-office-preview-body"><strong>${aesc(r.role)}</strong><h4>${aesc(r.name)}</h4><small>${aesc(r.dashboard)}</small>${r.phone?`<div class="rg-office-preview-actions"><a href="tel:${aesc(r.phone)}">📞 Call</a><a href="https://wa.me/91${aesc(r.phone)}" target="_self" rel="noopener noreferrer">💬 WhatsApp</a></div>`:'<span class="rg-preview-unconfigured">Phone not configured</span>'}</div></article>`).join('');
}
function renderColonyDirectoryAssignments(){
 const body=document.querySelector('#colonyDirectoryAssignmentTable tbody'); if(!body)return;
 const rows=[...homeServiceRows].sort((a,b)=>Number(a.displayOrder||999)-Number(b.displayOrder||999));
 body.innerHTML=rows.map(r=>{const checked=colonyDirectoryAssignments[String(r.id)]!==false;return `<tr><td><label class="rg-check-cell"><input type="checkbox" class="rg-directory-assignment-check" data-service-id="${aesc(r.id)}" ${checked?'checked':''} aria-label="Include ${aesc(r.serviceName)} in Colony Directory"><span>Include</span></label></td><td><b>${aesc(r.icon||'🛠️')} ${aesc(r.serviceName)}</b></td><td>${aesc(r.type||'Normal')}</td><td>${aesc(r.status||'Active')}</td></tr>`;}).join('')||'<tr><td colspan="4">No Home Service Masters found.</td></tr>';
}
async function loadColonyDirectoryAssignments(){
 colonyDirectoryAssignments={};
 try{await RGMS.store.loadCollection(STORAGE_KEYS.SETTINGS);const rows=getAllRecords(STORAGE_KEYS.SETTINGS);const saved=rows.find(r=>String(r.id)==='colonyDirectoryAssignments');if(saved?.assignments&&typeof saved.assignments==='object') colonyDirectoryAssignments={...saved.assignments};}catch(e){console.warn('Colony Directory assignments load failed',e);}
 renderColonyDirectoryAssignments();
}
function collectColonyDirectoryAssignments(){
 const out={};document.querySelectorAll('.rg-directory-assignment-check').forEach(el=>{out[String(el.dataset.serviceId)]=!!el.checked;});return out;
}
async function saveColonyDirectoryAssignments(){
 if(RGMS.auth.getSession?.()?.role!=='Admin')return;
 const assignments=collectColonyDirectoryAssignments();
 try{await RGMS.store.setRecord(STORAGE_KEYS.SETTINGS,'colonyDirectoryAssignments',{id:'colonyDirectoryAssignments',type:'colonyDirectoryAssignments',assignments,updatedOn:new Date().toISOString(),updatedBy:RGMS.auth.getSession()?.uid||''});colonyDirectoryAssignments=assignments;const m=document.getElementById('colonyDirectoryAssignmentMessage');if(m)m.textContent='Colony Directory assignments saved successfully.';}
 catch(e){const m=document.getElementById('colonyDirectoryAssignmentMessage');if(m)m.textContent=e.message||'Unable to save Colony Directory assignments.';}
}
function renderDashboardAssignment(){
 const role=document.getElementById('staffRole')?.value, box=document.getElementById('dashboardAccessChecks'); if(!box||!role)return;
 const current=adminRoles.find(r=>String(r.role)===String(role));
 const selected=new Set(Array.isArray(current?.assignedModules)?current.assignedModules:[]);
 if(role!=='Resident') selected.add('dashboard');
 const primary=document.getElementById('primaryDashboard');
 if(primary) primary.value=current?.primaryDashboard||'dashboard';
 box.innerHTML=Object.entries(RGMS_MODULE_LABELS).map(([key,label])=>`<label class="rg-access-option"><input type="checkbox" value="${key}" ${selected.has(key)?'checked':''}> <span>${label}</span></label>`).join('');
}
function adminResidentSelectionKey(r){return String(r?.residentDocId||r?.id||r?.residentId||[r?.houseNo||r?.plotNo||'',r?.residentType||'',r?.ownerName||r?.name||''].join('::'));}
function populateStaffResidents(){
 const el=document.getElementById('staffResident'); if(!el)return;
 const source=(RGMS?.store?.getResidentMaster?.({includeVacant:true})||adminResidents||[]).slice();
 const occupied=r=>{const v=String(r.occupationStatus||r.status||'').trim().toLowerCase();return !r.isVacant && v!=='vacant';};
 el.innerHTML='<option value="">Select resident name</option>'+source.filter(occupied).sort((a,b)=>String(a.ownerName||a.name||'').localeCompare(String(b.ownerName||b.name||''),'en',{sensitivity:'base',numeric:true})||String(a.houseNo||a.plotNo||'').localeCompare(String(b.houseNo||b.plotNo||''),undefined,{numeric:true})).map(r=>`<option value="${aesc(adminResidentSelectionKey(r))}">${aesc(r.ownerName||r.name)}</option>`).join('');
}
if(!window.__rgAdminResidentSync){window.__rgAdminResidentSync=true;window.addEventListener('rgms:resident-directory-changed',()=>{try{adminResidents=RGMS.store.getResidentMaster({includeVacant:true});populateStaffResidents();}catch(e){console.warn('Admin resident dropdown refresh failed',e);}});}
function normalizePersonName(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function findResidentForOfficer(role,displayName){
 const explicit={Admin:'KRUPAKAR ARAKALA',President:'SREEKANTH KARIMILLA',Treasurer:'KRISHNA KISHORE SANKARABANDA',Secretary:''};
 const target=normalizePersonName(explicit[role]||displayName);
 if(!target)return null;
 let found=adminResidents.find(r=>normalizePersonName(r.ownerName)===target);
 if(found)return found;
 const tokens=target.match(/[a-z]+/g)||[];
 if(tokens.length>=2){
   found=adminResidents.find(r=>{const n=normalizePersonName(r.ownerName);return tokens.filter(t=>n.includes(t)).length>=Math.min(2,tokens.length);});
 }
 return found||null;
}
function nextUserAccountId(){
 const nums=adminRoles.map(r=>String(r.accountId||r.userAccountId||'').match(/^RGRWA-(\d+)$/i)).filter(Boolean).map(m=>Number(m[1])||0);
 const next=(nums.length?Math.max(...nums):0)+1;
 return `RGRWA-${String(next).padStart(4,'0')}`;
}
function ensureUserAccountId(){
 const el=document.getElementById('staffUid'); if(!el)return '';
 if(!String(el.value||'').trim()) el.value=nextUserAccountId();
 return String(el.value||'').trim();
}
function selectRoleProfile(uid){
 const r=adminRoles.find(x=>String(x.id||x.uid)===String(uid)); if(!r)return;
 document.getElementById('staffRole').value=r.role||''; document.getElementById('staffUid').value=r.accountId||r.userAccountId||nextUserAccountId(); const docId=document.getElementById('staffProfileDocId'); if(docId)docId.value=r.id||r.uid||''; if(document.getElementById('staffDisplayName'))document.getElementById('staffDisplayName').value=r.displayName||''; document.getElementById('staffEmail').value=r.email||''; const linkedResident=adminResidents.find(x=>String(x.residentId||'')===String(r.residentId||''))||findResidentForOfficer(r.role,r.displayName); document.getElementById('staffResident').value=linkedResident?adminResidentSelectionKey(linkedResident):''; const ridEl=document.getElementById('staffResidentId'); if(ridEl)ridEl.value=linkedResident?.residentId||''; if(document.getElementById('primaryDashboard')) document.getElementById('primaryDashboard').value=r.primaryDashboard||'dashboard'; renderDashboardAssignment(); window.scrollTo({top:0,behavior:'smooth'});
}
window.selectRoleProfile=selectRoleProfile;
function renderRoles(){
 const body=document.getElementById('roleRegisterBody'); if(!body)return;
 const q=String(document.getElementById('roleSearch')?.value||'').toLowerCase().trim();
 const rows=adminRoles.filter(r=>!q||[r.displayName,r.role,r.email,r.id].some(v=>String(v||'').toLowerCase().includes(q)));
 body.innerHTML=rows.sort((a,b)=>String(a.role||'').localeCompare(String(b.role||''))).map(r=>`<tr><td>${aesc(r.role||'—')}</td><td>${aesc(r.ownerName||r.displayName||'—')}</td><td><button class="rg-admin-view" type="button" onclick="selectRoleProfile('${aesc(r.id||r.uid)}')">View</button></td></tr>`).join('')||'<tr><td colspan="3">No officer profiles found.</td></tr>';
}

async function deleteRoleProfile(uid){
 const session=RGMS.auth.getSession?.();
 if(session?.role!=='Admin')return;
 const r=adminRoles.find(x=>String(x.id||x.uid)===String(uid));
 if(!r)return;
 if(!confirm(`Delete officer profile for ${r.displayName||r.email||'this officer'}?`))return;
 try{await RGMS.store.deleteRecord(STORAGE_KEYS.USER_PROFILES,uid);await loadRoles();document.getElementById('staffRoleMessage').textContent='Officer profile deleted.';}catch(e){document.getElementById('staffRoleMessage').textContent=e.message||'Unable to delete officer profile.';}
}
window.deleteRoleProfile=deleteRoleProfile;
async function loadRoles(){
 await RGMS.store.loadCollection(STORAGE_KEYS.USER_PROFILES);
 adminRoles=getAllRecords(STORAGE_KEYS.USER_PROFILES).filter(r=>['Admin','President','Vice President','Secretary','Joint Secretary 1','Joint Secretary 2','Treasurer'].includes(RGMS.auth.normalizeStaffRole(r.role))).map(r=>({...r,role:RGMS.auth.normalizeStaffRole(r.role)}));
 renderRoles(); renderDashboardAssignment(); renderOfficeBearerPreviews();
}
async function loadAdminResidents(){
 try{
   await RGMS.store.refreshCollection(STORAGE_KEYS.RESIDENTS,{retries:2});
   adminResidents=RGMS.store.getResidentMaster({includeVacant:true});
   if(!adminResidents.length) throw new Error('Residents Master is empty in Firebase.');
 }catch(e){
   adminResidents=[];
   console.error('Resident mapping data unavailable from Firebase:',e);
 }
 populateStaffResidents();
}
async function seedResidents(){
 const out=document.getElementById('residentSeedMessage');
 const button=document.getElementById('btnSeedResidents');
 try{
   const session=RGMS.auth.getSession?.();
   if(session?.role!=='Admin') throw new Error('Only Admin can refresh the Residents Master.');
   if(button) button.disabled=true;
   await RGMS.store.refreshCollection(STORAGE_KEYS.RESIDENTS,{retries:3});
   adminResidents=RGMS.store.getResidentMaster({includeVacant:true});
   populateStaffResidents();
   if(out) out.textContent=`Residents Master refreshed from Firebase: ${adminResidents.length} record(s).`;
   await loadRoles();
   ensureUserAccountId();
 }catch(e){
   console.error('Resident refresh failed:',e);
   if(out) out.textContent=e?.message||'Unable to load the latest Residents Master from Firebase.';
 }finally{
   if(button) button.disabled=false;
 }
}

async function saveStaffRole(){
 const accountId=ensureUserAccountId(),role=document.getElementById('staffRole').value,displayName=(document.getElementById('staffDisplayName')?.value||'').trim(),email=document.getElementById('staffEmail').value.trim(),residentSelectionKey=document.getElementById('staffResident').value,primaryDashboard=document.getElementById('primaryDashboard')?.value||'dashboard',out=document.getElementById('staffRoleMessage');
 const existingDocId=String(document.getElementById('staffProfileDocId')?.value||'').trim();
 const assignedModules=[...document.querySelectorAll('#dashboardAccessChecks input:checked')].map(x=>x.value); if(role!=='Admin'&&!assignedModules.includes('dashboard')) assignedModules.unshift('dashboard');
 if(!role){out.textContent='Please select a role.';return;} if(!residentSelectionKey&&role!=='Admin'){out.textContent='Please select the resident profile to link with this user account.';return;}
 const resident=adminResidents.find(r=>adminResidentSelectionKey(r)===String(residentSelectionKey))||findResidentForOfficer(role,displayName);
 const docId=existingDocId||accountId;
 try{
   await RGMS.store.setRecord(STORAGE_KEYS.USER_PROFILES,docId,{accountId,userAccountId:accountId,role,displayName:displayName||resident?.ownerName||'',email:String(email||'').trim().toLowerCase(),primaryDashboard:role==='Admin'?'dashboard':primaryDashboard,assignedModules:role==='Admin'?Object.keys(RGMS_MODULE_LABELS).concat(['resident-dashboard']):assignedModules.filter(x=>x!=='resident-dashboard'),residentId:resident?.residentId||'',plotNo:resident?.plotNo||'',ownerName:resident?.ownerName||'',phoneE164:resident?.phoneE164||'',updatedOn:new Date().toISOString()});
   const hid=document.getElementById('staffProfileDocId'); if(hid)hid.value=docId;
   out.textContent=`${accountId} linked to ${resident?.residentId||'the selected profile'} and saved for ${role}.`;await loadRoles();renderDashboardAssignment();renderOfficeBearerPreviews();
 }catch(e){console.error(e);out.textContent=e.message||'Unable to save role profile.';}
}

const ACCESS_ROLES=['Admin','President','Vice President','Secretary','Joint Secretary 1','Joint Secretary 2','Treasurer'];
const ACCESS_ACTIONS=['view','add','update','delete','export','share','publish','approve','assign'];
const ACCESS_ACTION_LABELS={view:'View',add:'Add / Save',update:'Update',delete:'Delete',export:'Export',share:'Share',publish:'Publish',approve:'Approve',assign:'Assign'};
const ACCESS_CATALOG=window.RGMS_ROLE_ACCESS_CATALOG||[{key:'associationDashboard',label:'Association Dashboard',nav:'dashboard',actions:["view", "export"]},{key:'residentDashboard',label:'Resident Dashboard',nav:'resident-dashboard',actions:["view"]},{key:'residents',label:'Residents',nav:'residents',actions:["view", "add", "update", "delete", "export", "share"]},{key:'visitors',label:'Visitors',nav:'visitors',actions:["view", "add", "update", "delete", "export"]},{key:'colonyFund',label:'Colony Fund',nav:'development-fund',actions:["view", "add", "update", "delete", "export", "share"]},{key:'ganeshFestival',label:'Ganesh Festival Fund',nav:'festival',actions:["view", "add", "update", "delete", "export", "share"]},{key:'ladduAuction',label:'Laddu Auction',nav:null,actions:["view", "add", "update", "delete", "export", "share"]},{key:'sponsorDetails',label:'Sponsor Details',nav:null,actions:["view", "add", "update", "delete", "export", "share"]},{key:'expenditure',label:'Expenditure',nav:null,actions:["view", "add", "update", "delete", "export", "share"]},{key:'complaints',label:'Complaints',nav:'complaints',actions:["view", "add", "update", "delete", "export", "assign", "approve"]},{key:'meetings',label:'Meetings',nav:'meetings',actions:["view", "add", "update", "delete", "export", "publish"]},{key:'documents',label:'Documents',nav:'documents',actions:["view", "add", "update", "delete", "export", "share"]},{key:'noticeBoard',label:'Notice Board',nav:'notice-board',actions:["view", "add", "update", "delete", "publish", "share"]},{key:'generalInformation',label:'General Information',nav:'general-information',actions:["view", "add", "update", "delete"]},{key:'citizenServices',label:'Citizen Services',nav:'public-services',actions:["view"]},{key:'billPayments',label:'Bill Payments',nav:null,actions:["view"]},{key:'reports',label:'Reports',nav:'reports',actions:["view", "export", "share"]},{key:'reportsMaster',label:'Reports Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'dataEntryFieldsMaster',label:'Data Entry Fields Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'communications',label:'Communications',nav:'communications',actions:["view"]},{key:'sms',label:'SMS',nav:null,actions:["view", "share"]},{key:'whatsapp',label:'WhatsApp',nav:null,actions:["view", "share"]},{key:'greetings',label:'Greetings',nav:null,actions:["view", "add", "update", "delete", "share"]},{key:'settings',label:'Settings',nav:'settings',actions:["view", "update"]},{key:'adminMasters',label:'Admin Masters',nav:'admin',actions:["view"]},{key:'roleMaster',label:'Role Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'roleAccessMaster',label:'Role Access Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'dashboardAssignment',label:'Dashboard Assignment',nav:null,actions:["view", "update"]},{key:'passwordReset',label:'Office Bearer Password Reset',nav:null,actions:["view", "update"]},{key:'colonyDirectory',label:'Colony Directory Assignment',nav:null,actions:["view", "add", "update", "delete"]},{key:'homeServices',label:'Home Services Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'serviceProviders',label:'Service Provider Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'utilityBillers',label:'Utility Billers Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'officeBearers',label:'Office Bearers Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'associationSettings',label:'Association Settings Master',nav:null,actions:["view", "update"]},{key:'paymentModes',label:'Payment Modes Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'financialYears',label:'Financial Years Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'fundTypes',label:'Fund / Collection Types Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'expenseHeads',label:'Expense Heads Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'complaintCategories',label:'Complaint Categories Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'documentCategories',label:'Document Categories Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'noticeCategories',label:'Notice Categories Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'visitorTypes',label:'Visitor Types Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'meetingTypes',label:'Meeting Types Master',nav:null,actions:["view", "add", "update", "delete"]},{key:'communicationTemplates',label:'Communication Templates Master',nav:null,actions:["view", "add", "update", "delete"]}];
function permissionTemplate(value='NO'){const o={};ACCESS_ACTIONS.forEach(a=>o[a]=value);return o;}
function buildDefaultAccess(role){
  const row={associationDashboard:'YES',residentDashboard:'YES',sms:'YES',whatsapp:'YES',greetings:'YES',roleManagement:role==='Admin'?'YES':'NO',permissions:{}};
  ACCESS_CATALOG.forEach(c=>{const p=permissionTemplate('NO');c.actions.forEach(a=>p[a]='NO');row.permissions[c.key]=p;});
  if(role==='Admin'){ACCESS_CATALOG.forEach(c=>c.actions.forEach(a=>row.permissions[c.key][a]='YES'));return row;}
  const viewKeys=new Set(['associationDashboard','residentDashboard','residents','visitors','colonyFund','ganeshFestival','ladduAuction','sponsorDetails','expenditure','complaints','meetings','documents','noticeBoard','generalInformation','citizenServices','billPayments','reports','communications','sms','whatsapp','greetings']);
  viewKeys.forEach(k=>{if(row.permissions[k])row.permissions[k].view='YES';});
  ['sms','whatsapp','greetings'].forEach(k=>{if(row.permissions[k])row.permissions[k].share='YES';});
  if(role==='Treasurer') ['colonyFund','ganeshFestival','ladduAuction','sponsorDetails','expenditure'].forEach(k=>['add','update','delete','export','share'].forEach(a=>{if(row.permissions[k]&&ACCESS_CATALOG.find(c=>c.key===k)?.actions.includes(a))row.permissions[k][a]='YES';}));
  if(['President','Secretary'].includes(role)) ['complaints','meetings','documents','noticeBoard'].forEach(k=>['add','update','publish','approve','assign','export','share'].forEach(a=>{if(row.permissions[k]&&ACCESS_CATALOG.find(c=>c.key===k)?.actions.includes(a))row.permissions[k][a]='YES';}));
  return syncLegacyAccess(row);
}
function syncLegacyAccess(row){row.associationDashboard=row.permissions?.associationDashboard?.view||row.associationDashboard||'NO';row.residentDashboard=row.permissions?.residentDashboard?.view||row.residentDashboard||'NO';row.sms=row.permissions?.sms?.view||row.sms||'NO';row.whatsapp=row.permissions?.whatsapp?.view||row.whatsapp||'NO';row.greetings=row.permissions?.greetings?.view||row.greetings||'NO';row.roleManagement=row.permissions?.roleMaster?.view||row.roleManagement||'NO';return row;}
function normalizeAccessRow(role,row){const out=buildDefaultAccess(role);if(row&&typeof row==='object'){Object.assign(out,row);out.permissions=out.permissions||{};ACCESS_CATALOG.forEach(c=>{out.permissions[c.key]={...permissionTemplate('NO'),...(buildDefaultAccess(role).permissions[c.key]||{}),...(row.permissions?.[c.key]||{})};});if(!row.permissions){out.permissions.associationDashboard.view=row.associationDashboard||out.permissions.associationDashboard.view;out.permissions.residentDashboard.view=row.residentDashboard||out.permissions.residentDashboard.view;out.permissions.sms.view=row.sms||out.permissions.sms.view;out.permissions.whatsapp.view=row.whatsapp||out.permissions.whatsapp.view;out.permissions.greetings.view=row.greetings||out.permissions.greetings.view;out.permissions.roleMaster.view=row.roleManagement||out.permissions.roleMaster.view;}}if(role==='Admin')return buildDefaultAccess('Admin');return syncLegacyAccess(out);}
const DEFAULT_ACCESS_MATRIX=Object.fromEntries(ACCESS_ROLES.map(role=>[role,buildDefaultAccess(role)]));
let accessMatrix=JSON.parse(JSON.stringify(DEFAULT_ACCESS_MATRIX));
function yesNoSelect(role,key,value){const checked=value==='YES';return `<label class="rg-matrix-check"><input type="checkbox" class="rg-access-check" data-role="${aesc(role)}" data-key="${aesc(key)}" ${checked?'checked':''} aria-label="${aesc(role)} ${aesc(key)}"><span>${checked?'Enabled':'Disabled'}</span></label>`;}
function accessSummaryModules(role){const a=normalizeAccessRow(role,accessMatrix[role]);return ACCESS_CATALOG.map(c=>`<span class="rg-access-chip ${a.permissions[c.key]?.view==='YES'?'on':'off'}">${a.permissions[c.key]?.view==='YES'?'✓':'○'} ${aesc(c.label)}</span>`).join(' ');}
function accessActionSummary(role){const a=normalizeAccessRow(role,accessMatrix[role]);return ACCESS_ACTIONS.filter(x=>x!=='view').map(action=>{const n=ACCESS_CATALOG.filter(c=>c.actions.includes(action)&&a.permissions[c.key]?.[action]==='YES').length;return n?`<span>${aesc(ACCESS_ACTION_LABELS[action])}: <b>${n}</b></span>`:''}).filter(Boolean).join(' · ')||'View only';}
function renderAccessTables(){
 const dbody=document.querySelector('#dashboardAssignmentTable tbody');
 const rbody=document.querySelector('#roleAccessTable tbody');
 if(dbody) dbody.innerHTML=ACCESS_ROLES.map(role=>{const a=normalizeAccessRow(role,accessMatrix[role]);return `<tr><td><b>${aesc(role)}</b></td><td>${yesNoSelect(role,'associationDashboard',a.associationDashboard)}</td><td>${yesNoSelect(role,'residentDashboard',a.residentDashboard)}</td></tr>`;}).join('');
 if(rbody) rbody.innerHTML=ACCESS_ROLES.map(role=>`<tr><td><b>${aesc(role)}</b>${role==='Admin'?'<div class="rg-admin-fixed">Full access (fixed)</div>':''}</td><td class="rg-access-module-list">${accessSummaryModules(role)}</td><td class="rg-access-actions-summary">${accessActionSummary(role)}</td><td><button type="button" class="rg-admin-view" data-admin-view="access" data-role="${aesc(role)}">View</button></td></tr>`).join('');
 const can=RGMS.auth.getSession?.()?.role==='Admin';
 document.querySelectorAll('#adminAccessMatrixSection input.rg-access-check').forEach(x=>x.disabled=!can);
 document.getElementById('btnSaveDashboardAssignments')?.toggleAttribute('disabled',!can);
}
function nativeRoleAccessRequest(method,args=[]){
 return new Promise((resolve,reject)=>{
   const bridge=window.RGMSNativeAuth;
   if(!window.RGMS?.isNativeAndroid||!bridge||typeof bridge[method]!=='function'){
     reject(new Error('Native Role Access bridge is unavailable.'));
     return;
   }
   const requestId='rgms_role_access_'+Date.now()+'_'+Math.random().toString(36).slice(2);
   const callbacks=window.RGMSNativeAuthCallbacks=window.RGMSNativeAuthCallbacks||{};
   const timeout=setTimeout(()=>{delete callbacks[requestId];reject(new Error('Role Access request timed out.'));},30000);
   callbacks[requestId]={
     resolve:value=>{clearTimeout(timeout);delete callbacks[requestId];resolve(value);},
     reject:error=>{clearTimeout(timeout);delete callbacks[requestId];reject(error instanceof Error?error:new Error(String(error||'Role Access request failed.')));}
   };
   if(typeof callbacks.onRoleAccess!=='function'){
     callbacks.onRoleAccess=function(id,json){
       const cb=callbacks[id]; if(!cb)return;
       try{cb.resolve(typeof json==='string'?JSON.parse(json):json);}catch(e){cb.reject(new Error('Invalid Role Access response from Android Firebase.'));}
     };
   }
   if(typeof callbacks.onError!=='function'){
     callbacks.onError=function(id,message){const cb=callbacks[id];if(cb)cb.reject(new Error(message||'Firebase request failed.'));};
   }
   try{bridge[method](...(args||[]),requestId);}catch(e){clearTimeout(timeout);delete callbacks[requestId];reject(e);}
 });
}
async function roleAccessBackend(action,payload={}){
 if(window.RGMS?.isNativeAndroid&&window.RGMSNativeAuth){
   if(action==='get'&&typeof window.RGMSNativeAuth.getRoleAccessMatrix==='function'){
     return await nativeRoleAccessRequest('getRoleAccessMatrix',[]);
   }
   if(action==='save'&&typeof window.RGMSNativeAuth.saveRoleAccessRole==='function'){
     return await nativeRoleAccessRequest('saveRoleAccessRole',[String(payload.role||''),JSON.stringify(payload.row||{})]);
   }
 }
 if(!window.RGMS?.firebase?.functions) throw new Error('Firebase Functions is not initialized.');
 const {httpsCallable}=await import('https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js');
 const name=action==='save'?'saveRoleAccessRole':'getRoleAccessMatrix';
 const callable=httpsCallable(window.RGMS.firebase.functions,name);
 const result=await callable(payload);
 return result?.data||{};
}
async function loadAccessMatrix(force=false){
 accessMatrix=JSON.parse(JSON.stringify(DEFAULT_ACCESS_MATRIX));
 try{
   // The settings/roleDashboardAccess Firestore document is the authoritative
   // source. Do not block Role Access on optional callable Functions; that made
   // Save appear dead when a callable was unavailable or had a CORS/session issue.
   if(force) await RGMS.store.refreshCollection(STORAGE_KEYS.SETTINGS,{retries:3});
   else await RGMS.store.loadCollection(STORAGE_KEYS.SETTINGS,{retries:3});
   const rows=getAllRecords(STORAGE_KEYS.SETTINGS);
   const saved=rows.find(r=>String(r.id)==='roleDashboardAccess');
   if(saved?.matrix) ACCESS_ROLES.forEach(role=>accessMatrix[role]=normalizeAccessRow(role,saved.matrix[role]));
 }catch(e){
   console.warn('Role access settings load failed; displaying safe defaults.',e);
 }
 accessMatrix.Admin=buildDefaultAccess('Admin');
 renderAccessTables();
}
function roleAccessSame(a,b){
 // Firestore does not guarantee the insertion order of keys inside nested maps.
 // Comparing JSON.stringify() output therefore produced false mismatches even
 // when every saved permission had the correct YES/NO value. Compare the
 // supported permission values semantically instead.
 const left=normalizeAccessRow('__VERIFY__',a), right=normalizeAccessRow('__VERIFY__',b);
 for(const item of ACCESS_CATALOG){
   for(const action of item.actions){
     const lv=String(left?.permissions?.[item.key]?.[action]||'NO').toUpperCase();
     const rv=String(right?.permissions?.[item.key]?.[action]||'NO').toUpperCase();
     if(lv!==rv) return false;
   }
 }
 return true;
}
async function persistRoleAccessRole(role, requestedRow){
 const target=String(role||'').trim();
 if(!target||target==='Admin') throw new Error('Select a non-Admin officer role to update.');
 const requested=normalizeAccessRow(target,requestedRow);

 // Read the current canonical matrix, update exactly one role and replace the
 // document through RGMS.store. store.replaceRecord uses direct Firestore on
 // Web and the native Firebase bridge on Android, then verifies the remote copy.
 await RGMS.store.refreshCollection(STORAGE_KEYS.SETTINGS,{retries:3});
 const rows=getAllRecords(STORAGE_KEYS.SETTINGS);
 const current=rows.find(r=>String(r.id)==='roleDashboardAccess')||{};
 const matrix=JSON.parse(JSON.stringify(DEFAULT_ACCESS_MATRIX));
 if(current?.matrix) ACCESS_ROLES.forEach(r=>matrix[r]=normalizeAccessRow(r,current.matrix[r]));
 matrix[target]=syncLegacyAccess(normalizeAccessRow(target,requested));
 matrix.Admin=buildDefaultAccess('Admin');

 const writer=RGMS.store.replaceRecord||RGMS.store.setRecord;
 const saved=await writer(STORAGE_KEYS.SETTINGS,'roleDashboardAccess',{
   ...current,
   id:'roleDashboardAccess',
   type:'roleDashboardAccess',
   matrix,
   updatedOn:new Date().toISOString(),
   updatedBy:RGMS.auth.getSession()?.uid||''
 });
 const verifiedMatrix=saved?.matrix||matrix;
 const savedRow=verifiedMatrix?.[target];
 if(!savedRow||!roleAccessSame(savedRow,requested)) throw new Error('Saved Role Access does not match the selected permissions. Please try again.');
 ACCESS_ROLES.forEach(r=>accessMatrix[r]=normalizeAccessRow(r,verifiedMatrix[r]));
 accessMatrix.Admin=buildDefaultAccess('Admin');
 try{await window.RGMS?.roleAccess?.refresh?.();}catch(e){console.warn('Role Access runtime refresh skipped.',e);}
 renderAccessTables();
 return {matrix:verifiedMatrix};
}
async function saveAccessMatrix(){
 if(RGMS.auth.getSession?.()?.role!=='Admin') return;
 const requested={};
 document.querySelectorAll('#adminAccessMatrixSection input.rg-access-check').forEach(el=>{const role=el.dataset.role,key=el.dataset.key;if(role&&key&&role!=='Admin'){requested[role]=requested[role]||{};requested[role][key]=el.checked?'YES':'NO';}});
 const msg=document.getElementById('dashboardAssignmentMessage');
 try{
   await RGMS.store.refreshCollection(STORAGE_KEYS.SETTINGS,{retries:3});
   const rows=getAllRecords(STORAGE_KEYS.SETTINGS), current=rows.find(r=>String(r.id)==='roleDashboardAccess')||{};
   const matrix=JSON.parse(JSON.stringify(DEFAULT_ACCESS_MATRIX));
   if(current?.matrix) ACCESS_ROLES.forEach(r=>matrix[r]=normalizeAccessRow(r,current.matrix[r]));
   Object.entries(requested).forEach(([role,values])=>{const a=normalizeAccessRow(role,matrix[role]);Object.entries(values).forEach(([key,val])=>{a[key]=val;if(a.permissions?.[key])a.permissions[key].view=val;});matrix[role]=syncLegacyAccess(a);});
   matrix.Admin=buildDefaultAccess('Admin');
   const writer=RGMS.store.replaceRecord||RGMS.store.setRecord;
   await writer(STORAGE_KEYS.SETTINGS,'roleDashboardAccess',{...current,id:'roleDashboardAccess',type:'roleDashboardAccess',matrix,updatedOn:new Date().toISOString(),updatedBy:RGMS.auth.getSession()?.uid||''});
   await loadAccessMatrix(true);
   await window.RGMS?.roleAccess?.refresh?.();
   if(msg){msg.textContent='Dashboard assignments saved and verified successfully.';msg.className='message ok';}
 }catch(e){console.error('Access matrix save failed',e);if(msg){msg.textContent='Unable to save dashboard assignments. Please try again.';msg.className='message error';}}
}
function bindRoleAccessRuntimeEvents(){
  // The Role Access form handlers live inside the consolidated Admin-master IIFE.
  // Calling them directly from this outer scope caused a runtime ReferenceError
  // (saveAccessForm is not defined) and aborted the entire Admin module.
  const runtime=window.RGMSAdminRoleAccessRuntime;
  if(runtime&&typeof runtime.bind==='function') return runtime.bind();
}
function initializeDashboardAssignment(){document.getElementById('staffRole')?.addEventListener('change',renderDashboardAssignment);document.getElementById('btnSaveDashboardAssignments')?.addEventListener('click',saveAccessMatrix);renderDashboardAssignment();loadAccessMatrix();}
async function initializeAdmin(){
  // Global startup already initializes non-critical collections in the background.
  // Do not await the entire application bootstrap here: the Admin Masters home
  // should become interactive immediately and each master loads only its own data.
 const session=RGMS.auth.getSession();
 const sessionRole=String(session?.role||'').trim();
 if(!ACCESS_ROLES.includes(sessionRole))return;
 const current=document.getElementById('adminCurrentUser');
 if(current) current.textContent=`${sessionRole} - ${session.displayName||session.email||''}`;

 // Role Access must be initialized for every authenticated office-bearer who
 // is allowed to open the Admin module. Older builds returned here for every
 // non-Admin officer, leaving the form on defaults and making Save verification
 // fail even after Firestore accepted the update.
 bindRoleAccessRuntimeEvents();
 await loadAccessMatrix(true);
 window.RGMSAdminMasterRegisters?.renderAccessRegister?.();

 document.getElementById('btnSaveStaffRole')?.addEventListener('click',saveStaffRole);
 document.getElementById('btnRefreshRoles')?.addEventListener('click',loadRoles);
 document.getElementById('roleSearch')?.addEventListener('input',renderRoles);
 document.getElementById('btnSeedResidents')?.addEventListener('click',seedResidents);
 document.getElementById('btnSaveColonyDirectoryAssignments')?.addEventListener('click',saveColonyDirectoryAssignments);
 if(sessionRole==='Admin') initializeDashboardAssignment();
 else renderDashboardAssignment();

 // Render the Admin module immediately. Read operations are safe for officers;
 // the Role Access matrix and Firestore rules decide which actions remain usable.
 renderRoles();
 renderOfficeBearerPreviews();
 Promise.resolve().then(()=>loadAdminResidents()).catch(e=>console.warn('Admin resident load skipped:',e));
 Promise.resolve().then(()=>loadRoles()).then(()=>ensureUserAccountId()).catch(e=>console.warn('Admin role load skipped:',e));
 Promise.resolve().then(()=>initializeMasters()).catch(e=>console.warn('Admin master initialization skipped:',e));
 Promise.resolve().then(()=>loadColonyDirectoryAssignments()).catch(e=>console.warn('Colony Directory assignments load skipped:',e));
}

async function initializeMasters(){
  try{
    await Promise.all([
      RGMS.store.loadCollection(STORAGE_KEYS.HOME_SERVICES),
      RGMS.store.loadCollection(STORAGE_KEYS.SERVICE_PROVIDERS),
      RGMS.store.loadCollection(STORAGE_KEYS.BILLERS)
    ]);
    homeServiceRows=getAllRecords(STORAGE_KEYS.HOME_SERVICES);
    providerRows=getAllRecords(STORAGE_KEYS.SERVICE_PROVIDERS);
    billerRows=getAllRecords(STORAGE_KEYS.BILLERS);

    // Firebase/Firestore is authoritative. Do not repopulate missing master
    // rows from packaged JSON; an empty/failed Firebase collection stays visible
    // as empty/error until an authorized user creates the records in Firestore.

    bindMasterEvents(); renderHomeServices(); renderProviders(); renderBillers();
    clearHomeService(); clearProvider(); clearBiller();
  }catch(e){console.error('Master initialization failed',e); masterMsg('homeServiceMessage',e.message||'Master initialization failed.',true);}
}
async function seedPackagedMasterData(options={}){
  if(options.manualMigration!==true) throw new Error('Packaged master migration is disabled. Use Firebase Master CRUD.');
  const sources=[
    {url:'data/masters/home-services.json', key:STORAGE_KEYS.HOME_SERVICES, idField:'id'},
    {url:'data/masters/service-providers.json', key:STORAGE_KEYS.SERVICE_PROVIDERS, idField:'id'},
    {url:'data/masters/billers.json', key:STORAGE_KEYS.BILLERS, idField:'id'}
  ];
  let added={services:0,providers:0,billers:0};
  const labels={ [STORAGE_KEYS.HOME_SERVICES]:'services', [STORAGE_KEYS.SERVICE_PROVIDERS]:'providers', [STORAGE_KEYS.BILLERS]:'billers' };
  for(const source of sources){
    try{
      const response=await fetch(source.url,{cache:'no-store'});
      if(!response.ok) throw new Error(`Unable to load ${source.url}`);
      const rows=await response.json();
      const existing=getAllRecords(source.key);
      for(const row of (Array.isArray(rows)?rows:[])){
        const id=String(row[source.idField]||'').trim();
        if(!id) continue;
        const existingRow=existing.find(x=>String(x.id)===id);
        if(existingRow){
          if(source.key===STORAGE_KEYS.BILLERS && ['BL-mobile-postpaid','BL-gas-booking'].includes(id)){
            await RGMS.store.setRecord(source.key,id,{...existingRow,billerName:row.billerName,category:row.category,status:'Active',displayOrder:row.displayOrder,requiredFields:row.requiredFields,customerNumberLabel:row.customerNumberLabel,apiStatus:existingRow.apiStatus||row.apiStatus});
          }
          continue;
        }
        const clean={...row, createdOn:row.createdOn||new Date().toISOString(), initializedFromPackagedMaster:true};
        await RGMS.store.setRecord(source.key,id,clean);
        added[labels[source.key]]++;
      }
    }catch(e){
      console.warn(`Packaged master seed skipped for ${source.url}:`,e);
    }
  }
  if(added.services||added.providers||added.billers){
    masterMsg('homeServiceMessage',`Setup complete: ${added.services} services, ${added.providers} providers and ${added.billers} billers are ready to use.`);
  }
}
function bindMasterEvents(){
  [['homeServiceSave',saveHomeService],['homeServiceUpdate',updateHomeService],['homeServiceDelete',deleteHomeService],['homeServiceClear',clearHomeService],
   ['providerSave',saveProvider],['providerUpdate',updateProvider],['providerDelete',deleteProvider],['providerClear',clearProvider],
   ['billerSave',saveBiller],['billerUpdate',updateBiller],['billerDelete',deleteBiller],['billerClear',clearBiller]]
  .forEach(([id,fn])=>document.getElementById(id)?.addEventListener('click',fn));
  document.getElementById('providerSearch')?.addEventListener('input',renderProviders);
  document.getElementById('providerFilter')?.addEventListener('change',renderProviders);
}
function slugifyMaster(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function validMobile(v){return /^\d{10}$/.test(String(v||'').replace(/\D/g,''));}
function masterMsg(id,text,error=false){const x=document.getElementById(id);if(x){x.textContent=text;x.style.color=error?'#c62828':'#2e7d32';}}
function serviceForm(){
  const g=id=>document.getElementById(id);
  return {serviceName:g('homeServiceName')?.value.trim()||'',icon:g('homeServiceIcon')?.value.trim()||'🛠️',type:g('homeServiceType')?.value||'Normal',description:g('homeServiceDescription')?.value.trim()||'',displayOrder:Number(g('homeServiceOrder')?.value||0),status:g('homeServiceStatus')?.value||'Active'};
}
async function saveHomeService(){try{if(selectedHomeServiceId){await updateHomeService();return;}
  const r=serviceForm();
  if(!r.serviceName||!Number.isInteger(r.displayOrder)||r.displayOrder<1)return masterMsg('homeServiceMessage','Service Name and a valid Display Order are required.',true);
  if(homeServiceRows.some(x=>String(x.serviceName).toLowerCase()===r.serviceName.toLowerCase()))return masterMsg('homeServiceMessage','A service with this name already exists.',true);
  const id=slugifyMaster(r.serviceName); r.updatedOn=new Date().toISOString(); r.createdOn=r.updatedOn;
  await RGMS.store.setRecord(STORAGE_KEYS.HOME_SERVICES,id,r); await reloadMasters(); masterMsg('homeServiceMessage','Service added successfully.'); clearHomeService();
}catch(e){console.error('Save Home Service failed',e);masterMsg('homeServiceMessage',e?.message||'Unable to save Home Service.',true);}}

async function updateHomeService(){
  if(!selectedHomeServiceId)return masterMsg('homeServiceMessage','Select a service first.',true);
  const r=serviceForm();
  if(!r.serviceName||!Number.isInteger(r.displayOrder)||r.displayOrder<1)return masterMsg('homeServiceMessage','Service Name and a valid Display Order are required.',true);
  const dup=homeServiceRows.find(x=>String(x.serviceName).toLowerCase()===r.serviceName.toLowerCase()&&String(x.id)!==String(selectedHomeServiceId));
  if(dup)return masterMsg('homeServiceMessage','A service with this name already exists.',true);
  r.updatedOn=new Date().toISOString(); await RGMS.store.setRecord(STORAGE_KEYS.HOME_SERVICES,selectedHomeServiceId,r); await reloadMasters(); masterMsg('homeServiceMessage','Service updated successfully.'); clearHomeService();
}
async function deleteHomeService(){
  if(!selectedHomeServiceId)return masterMsg('homeServiceMessage','Select a service first.',true);
  if(!confirm('Delete this service master? Existing providers will remain but may lose their category. Deactivate is safer.'))return;
  await RGMS.store.deleteRecord(STORAGE_KEYS.HOME_SERVICES,selectedHomeServiceId); await reloadMasters(); masterMsg('homeServiceMessage','Service deleted.'); clearHomeService();
}
function clearHomeService(){selectedHomeServiceId=null;if(document.getElementById('homeServiceName')){homeServiceName.value='';homeServiceIcon.value='🛠️';homeServiceType.value='Normal';homeServiceDescription.value='';homeServiceOrder.value=(homeServiceRows.length+1);homeServiceStatus.value='Active';const d=document.getElementById('homeServiceDelete');if(d)d.disabled=true;}}
function renderHomeServices(){
  homeServiceRows.sort((a,b)=>Number(a.displayOrder||999)-Number(b.displayOrder||999));
  const b=document.getElementById('homeServicesBody'); if(!b)return;
  b.innerHTML=homeServiceRows.map(r=>`<tr><td>${aesc(r.displayOrder)}</td><td>${aesc(r.icon||'🛠️')} ${aesc(r.serviceName)}</td><td>${aesc(r.type)}</td><td>${aesc(r.description||'')}</td><td><span class="${r.status==='Active'?'badge-active':'badge-inactive'}">${aesc(r.status)}</span></td><td><div class="rg-grid-actions"><button class="rg-admin-view" title="View service" aria-label="View service" onclick="selectHomeService('${aesc(r.id)}')">👁️ View</button><button class="rg-admin-edit" title="Update service" aria-label="Update service" onclick="selectHomeService('${aesc(r.id)}')">✏️</button><button class="rg-admin-delete" title="Delete service" aria-label="Delete service" onclick="deleteHomeServiceById('${aesc(r.id)}')">🗑️</button></div></td></tr>`).join('')||'<tr><td colspan="6">No services found.</td></tr>';
  populateProviderServiceSelects();
  renderColonyDirectoryAssignments();
}
async function deleteHomeServiceById(id){const r=homeServiceRows.find(x=>String(x.id)===String(id));if(!r)return;if(!confirm(`Delete service ${r.serviceName||""}?`))return;await RGMS.store.deleteRecord(STORAGE_KEYS.HOME_SERVICES,id);await reloadMasters();if(String(selectedHomeServiceId)===String(id))clearHomeService();masterMsg("homeServiceMessage","Service deleted.");}
window.deleteHomeServiceById=deleteHomeServiceById;
function selectHomeService(id){const r=homeServiceRows.find(x=>String(x.id)===String(id));if(!r)return;selectedHomeServiceId=r.id;homeServiceName.value=r.serviceName||'';homeServiceIcon.value=r.icon||'🛠️';homeServiceType.value=r.type||'Normal';homeServiceDescription.value=r.description||'';homeServiceOrder.value=r.displayOrder||1;homeServiceStatus.value=r.status||'Active';const d=document.getElementById('homeServiceDelete');if(d)d.disabled=false;}
function providerForm(){
  const g=id=>document.getElementById(id);
  return {providerName:g('providerName')?.value.trim()||'',serviceId:g('providerService')?.value||'',mobile:(g('providerMobile')?.value||'').replace(/\D/g,''),whatsapp:(g('providerWhatsapp')?.value||'').replace(/\D/g,''),address:g('providerAddress')?.value.trim()||'',workingHours:g('providerHours')?.value.trim()||'',charges:g('providerCharges')?.value===''?'':Number(g('providerCharges')?.value),experience:g('providerExperience')?.value.trim()||'',status:g('providerStatus')?.value||'Active',remarks:g('providerRemarks')?.value.trim()||''};
}
async function saveProvider(){try{if(selectedProviderId){await updateProvider();return;}
  const r=providerForm(); if(!r.providerName||!r.serviceId||!validMobile(r.mobile))return masterMsg('providerMessage','Provider Name, Service and a valid 10-digit Mobile are required.',true);
  if(r.whatsapp&&!validMobile(r.whatsapp))return masterMsg('providerMessage','WhatsApp number must be 10 digits.',true);
  if(providerRows.some(x=>String(x.mobile||'')===r.mobile))return masterMsg('providerMessage','This mobile number already exists in the provider master.',true);
  const id='SP-'+Date.now(); r.createdOn=new Date().toISOString(); await RGMS.store.setRecord(STORAGE_KEYS.SERVICE_PROVIDERS,id,r); await reloadMasters(); masterMsg('providerMessage','Provider added successfully.'); clearProvider();
}catch(e){console.error('Save Provider failed',e);masterMsg('providerMessage',e?.message||'Unable to save Provider.',true);}}

async function updateProvider(){
  if(!selectedProviderId)return masterMsg('providerMessage','Select a provider first.',true);
  const r=providerForm(); if(!r.providerName||!r.serviceId||!validMobile(r.mobile))return masterMsg('providerMessage','Provider Name, Service and a valid 10-digit Mobile are required.',true);
  if(r.whatsapp&&!validMobile(r.whatsapp))return masterMsg('providerMessage','WhatsApp number must be 10 digits.',true);
  if(providerRows.some(x=>String(x.mobile||'')===r.mobile&&String(x.id)!==String(selectedProviderId)))return masterMsg('providerMessage','This mobile number already exists in the provider master.',true);
  r.updatedOn=new Date().toISOString(); await RGMS.store.setRecord(STORAGE_KEYS.SERVICE_PROVIDERS,selectedProviderId,r); await reloadMasters(); masterMsg('providerMessage','Provider updated successfully.'); clearProvider();
}
async function deleteProvider(){if(!selectedProviderId)return masterMsg('providerMessage','Select a provider first.',true);if(!confirm('Delete this provider?'))return;await RGMS.store.deleteRecord(STORAGE_KEYS.SERVICE_PROVIDERS,selectedProviderId);await reloadMasters();masterMsg('providerMessage','Provider deleted.');clearProvider();}
function clearProvider(){selectedProviderId=null;if(document.getElementById('providerName')){providerName.value='';providerMobile.value='';providerWhatsapp.value='';providerAddress.value='';providerHours.value='';providerCharges.value='';providerExperience.value='';providerStatus.value='Active';providerRemarks.value='';if(providerService.options.length)providerService.selectedIndex=0;const d=document.getElementById('providerDelete');if(d)d.disabled=true;}}
function populateProviderServiceSelects(){
  const active=homeServiceRows.filter(r=>r.status==='Active').sort((a,b)=>Number(a.displayOrder)-Number(b.displayOrder));
  const providerServiceEl=document.getElementById('providerService');
  const providerFilterEl=document.getElementById('providerFilter');
  if(!providerServiceEl || !providerFilterEl) return;
  const cur=providerServiceEl.value, curFilter=providerFilterEl.value;
  providerServiceEl.innerHTML=active.map(r=>`<option value="${aesc(r.id)}">${aesc(r.icon||'')} ${aesc(r.serviceName)}</option>`).join('');
  providerFilterEl.innerHTML='<option value="">All Services</option>'+active.map(r=>`<option value="${aesc(r.id)}">${aesc(r.serviceName)}</option>`).join('');
  if(active.some(r=>String(r.id)===cur))providerServiceEl.value=cur;
  if(active.some(r=>String(r.id)===curFilter))providerFilterEl.value=curFilter;
}
function serviceNameById(id){return homeServiceRows.find(x=>String(x.id)===String(id))?.serviceName||'—';}
function renderProviders(){
  const searchEl=document.getElementById('providerSearch');
  const filterEl=document.getElementById('providerFilter');
  const body=document.getElementById('providersBody');
  if(!body)return;
  const search=(searchEl?.value||'').toLowerCase(), f=filterEl?.value||'';
  const rows=providerRows.filter(r=>(!f||String(r.serviceId)===f)&&[r.providerName,r.mobile,r.address,serviceNameById(r.serviceId)].some(v=>String(v||'').toLowerCase().includes(search)));
  body.innerHTML=rows.map(r=>`<tr><td>${aesc(r.providerName)}</td><td>${aesc(serviceNameById(r.serviceId))}</td><td>${aesc(r.mobile)}</td><td>${aesc(r.whatsapp||'')}</td><td>${aesc(r.address||'')}</td><td><span class="${r.status==='Active'?'badge-active':'badge-inactive'}">${aesc(r.status)}</span></td><td><div class="rg-grid-actions"><button class="rg-admin-view" title="View provider" aria-label="View provider" onclick="selectProvider('${aesc(r.id)}')">👁️ View</button><button class="rg-admin-edit" title="Update provider" aria-label="Update provider" onclick="selectProvider('${aesc(r.id)}')">✏️</button><button class="rg-admin-delete" title="Delete provider" aria-label="Delete provider" onclick="deleteProviderById('${aesc(r.id)}')">🗑️</button></div></td></tr>`).join('')||'<tr><td colspan="7">No providers found.</td></tr>';
}
async function deleteProviderById(id){const r=providerRows.find(x=>String(x.id)===String(id));if(!r)return;if(!confirm(`Delete provider ${r.providerName||""}?`))return;await RGMS.store.deleteRecord(STORAGE_KEYS.SERVICE_PROVIDERS,id);await reloadMasters();if(String(selectedProviderId)===String(id))clearProvider();masterMsg("providerMessage","Provider deleted.");}
window.deleteProviderById=deleteProviderById;
function selectProvider(id){const r=providerRows.find(x=>String(x.id)===String(id));if(!r)return;selectedProviderId=r.id;providerName.value=r.providerName||'';providerService.value=r.serviceId||'';providerMobile.value=r.mobile||'';providerWhatsapp.value=r.whatsapp||'';providerAddress.value=r.address||'';providerHours.value=r.workingHours||'';providerCharges.value=r.charges??'';providerExperience.value=r.experience||'';providerStatus.value=r.status||'Active';providerRemarks.value=r.remarks||'';const d=document.getElementById('providerDelete');if(d)d.disabled=false;}
function billerForm(){
  const g=id=>document.getElementById(id);
  return {billerName:g('billerName')?.value.trim()||'',category:g('billerCategory')?.value||'',apiProvider:g('billerProvider')?.value||'BBPS',billerCode:(g('gatewayBillerId')?.value||'').trim(),razorpayBillerId:(g('razorpayBillerId')?.value||'').trim(),gatewayBillerId:(g('gatewayBillerId')?.value||'').trim(),paymentGateway:(g('paymentGateway')?.value||'bbps').trim().toLowerCase(),customerNumberLabel:g('billerCustomerLabel')?.value.trim()||'Consumer Number',displayOrder:Number(g('billerOrder')?.value||0),requiredFields:(g('billerFields')?.value||'consumerNumber').split(',').map(x=>x.trim()).filter(Boolean),status:g('billerStatus')?.value||'Active',apiStatus:g('billerApiStatus')?.value||'Not Configured',notes:g('billerNotes')?.value.trim()||''};
}
async function saveBiller(){try{if(selectedBillerId){await updateBiller();return;}const r=billerForm();if(!r.billerName||!r.category||!Number.isInteger(r.displayOrder)||r.displayOrder<1)return masterMsg('billerMessage','Biller Name, Category and a valid Display Order are required.',true);if(billerRows.some(x=>String(x.billerName).toLowerCase()===r.billerName.toLowerCase()))return masterMsg('billerMessage','A biller with this name already exists.',true);const id='BL-'+slugifyMaster(r.billerName);r.createdOn=new Date().toISOString();await RGMS.store.setRecord(STORAGE_KEYS.BILLERS,id,r);await reloadMasters();masterMsg('billerMessage','Biller added successfully.');clearBiller();}catch(e){console.error('Save Biller failed',e);masterMsg('billerMessage',e?.message||'Unable to save Biller.',true);}}
async function updateBiller(){if(!selectedBillerId)return masterMsg('billerMessage','Select a biller first.',true);const r=billerForm();if(!r.billerName||!r.category||!Number.isInteger(r.displayOrder)||r.displayOrder<1)return masterMsg('billerMessage','Biller Name, Category and a valid Display Order are required.',true);r.updatedOn=new Date().toISOString();await RGMS.store.setRecord(STORAGE_KEYS.BILLERS,selectedBillerId,r);await reloadMasters();masterMsg('billerMessage','Biller updated successfully.');clearBiller();}
async function deleteBiller(){if(!selectedBillerId)return masterMsg('billerMessage','Select a biller first.',true);if(!confirm('Delete this biller? Deactivating is safer when transaction history exists.'))return;await RGMS.store.deleteRecord(STORAGE_KEYS.BILLERS,selectedBillerId);await reloadMasters();masterMsg('billerMessage','Biller deleted.');clearBiller();}
function clearBiller(){
  selectedBillerId=null;
  const g=id=>document.getElementById(id);
  const set=(id,v)=>{const e=g(id);if(e)e.value=v;};
  if(!g('billerName'))return;
  set('billerName',''); set('billerCategory','Electricity'); set('billerProvider','Razorpay BBPS');
  set('razorpayBillerId',''); set('gatewayBillerId',''); set('paymentGateway','bbps'); set('billerCode','');
  set('billerCustomerLabel','Consumer Number'); set('billerOrder',billerRows.length+1); set('billerFields','consumerNumber');
  set('billerStatus','Active'); set('billerApiStatus','Not Configured'); set('billerNotes',''); const d=document.getElementById('billerDelete'); if(d)d.disabled=true;
}

function renderBillers(){billerRows.sort((a,b)=>Number(a.displayOrder||999)-Number(b.displayOrder||999));const b=document.getElementById('billersBody');if(!b)return;b.innerHTML=billerRows.map(r=>`<tr><td>${aesc(r.displayOrder)}</td><td>${aesc(r.billerName)}</td><td>${aesc(r.category)}</td><td>${aesc(r.apiProvider)}</td><td>${aesc(r.billerCode||'—')}</td><td>${aesc(r.apiStatus||'Not Configured')}</td><td><span class="${r.status==='Active'?'badge-active':'badge-inactive'}">${aesc(r.status)}</span></td><td><div class="rg-grid-actions"><button class="rg-admin-view" title="View biller" aria-label="View biller" onclick="selectBiller('${aesc(r.id)}')">👁️ View</button><button class="rg-admin-edit" title="Update biller" aria-label="Update biller" onclick="selectBiller('${aesc(r.id)}')">✏️</button><button class="rg-admin-delete" title="Delete biller" aria-label="Delete biller" onclick="deleteBillerById('${aesc(r.id)}')">🗑️</button></div></td></tr>`).join('')||'<tr><td colspan="8">No billers found.</td></tr>';}
async function deleteBillerById(id){const r=billerRows.find(x=>String(x.id)===String(id));if(!r)return;if(!confirm(`Delete biller ${r.billerName||""}?`))return;await RGMS.store.deleteRecord(STORAGE_KEYS.BILLERS,id);await reloadMasters();if(String(selectedBillerId)===String(id))clearBiller();masterMsg("billerMessage","Biller deleted.");}
window.deleteBillerById=deleteBillerById;
function selectBiller(id){const r=billerRows.find(x=>String(x.id)===String(id));if(!r)return;selectedBillerId=r.id;document.getElementById('billerDelete')?.removeAttribute('disabled');billerName.value=r.billerName||'';billerCategory.value=r.category||'Other';billerProvider.value=r.apiProvider||'Razorpay BBPS';if(document.getElementById('razorpayBillerId'))razorpayBillerId.value=r.razorpayBillerId||'';if(document.getElementById('gatewayBillerId'))gatewayBillerId.value=r.gatewayBillerId||r.billerCode||'';if(document.getElementById('paymentGateway'))paymentGateway.value=r.paymentGateway||'bbps';billerCode.value=r.billerCode||r.gatewayBillerId||'';billerCustomerLabel.value=r.customerNumberLabel||'Consumer Number';billerOrder.value=r.displayOrder||1;billerFields.value=(r.requiredFields||[]).join(', ');billerStatus.value=r.status||'Active';billerApiStatus.value=r.apiStatus||'Not Configured';billerNotes.value=r.notes||'';}
async function fetchTGSPDCLFromRazorpay(){
  try{
    masterMsg('billerMessage','Fetching active electricity billers from Razorpay BBPS...');
    const {httpsCallable}=await import('https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js');
    const callable=httpsCallable(window.RGMS.firebase.functions,'bbpsBillers');
    let result=await callable({category:'electricity',state:'TS',status:'active',count:100,skip:0});
    let rows=Array.isArray(result?.data?.billers)?result.data.billers:[];
    if(!rows.length){result=await callable({category:'electricity',status:'active',count:100,skip:0});rows=Array.isArray(result?.data?.billers)?result.data.billers:[];}
    const match=rows.find(r=>/tgspdcl|telangana state southern power/i.test(String(r.name||r.alias_name||'')));
    if(!match) return masterMsg('billerMessage','TGSPDCL was not returned by the configured Razorpay BBPS account. Please verify BBPS access and the configured Razorpay account.',true);
    const id=String(match.id||''); const gatewayId=String(match.gateway_biller_id||'');
    const target=billerRows.find(x=>x.id==='BL-tgspdcl-electricity')||billerRows.find(x=>/tgspdcl/i.test(x.billerName||''));
    const record={id:target?.id||'BL-tgspdcl-electricity',billerName:match.name||'TGSPDCL Electricity Bill',category:'Electricity',apiProvider:'Razorpay BBPS',billerCode:gatewayId,razorpayBillerId:id,gatewayBillerId:gatewayId,paymentGateway:String(match.gateway||'bbps'),customerNumberLabel:'USC Number',displayOrder:target?.displayOrder||1,requiredFields:['consumerNumber'],status:'Active',apiStatus:'Live',notes:'Auto-populated from Razorpay BBPS biller catalogue.',gatewayBillerName:match.name||'',gatewayStatus:match.status||'active',lastBbpsSyncOn:new Date().toISOString()};
    await RGMS.store.setRecord(STORAGE_KEYS.BILLERS,record.id,record); await reloadMasters(); selectBiller(record.id);
    masterMsg('billerMessage',`TGSPDCL configured. Razorpay Biller ID: ${id} | BBPS/NPCI Gateway Biller ID: ${gatewayId} | Gateway: ${record.paymentGateway}`);
  }catch(e){console.error('TGSPDCL Razorpay BBPS lookup failed:',e);masterMsg('billerMessage',e?.message||'Unable to fetch TGSPDCL from Razorpay BBPS.',true);}
}
async function reloadMasters(){await Promise.all([RGMS.store.loadCollection(STORAGE_KEYS.HOME_SERVICES),RGMS.store.loadCollection(STORAGE_KEYS.SERVICE_PROVIDERS),RGMS.store.loadCollection(STORAGE_KEYS.BILLERS)]);homeServiceRows=getAllRecords(STORAGE_KEYS.HOME_SERVICES);providerRows=getAllRecords(STORAGE_KEYS.SERVICE_PROVIDERS);billerRows=getAllRecords(STORAGE_KEYS.BILLERS);renderHomeServices();renderProviders();renderBillers();}
async function seedHomeServices(){if(homeServiceRows.length&&!confirm('Home Service Master already has records. Add missing initial services only?'))return;const seeds=[
{id:'electrician',serviceName:'Electrician',icon:'⚡',type:'Normal',description:'Electrical repairs and maintenance',displayOrder:1,status:'Active'},
{id:'plumber',serviceName:'Plumber',icon:'🔧',type:'Normal',description:'Plumbing repairs and maintenance',displayOrder:2,status:'Active'},
{id:'painter',serviceName:'Painter',icon:'🎨',type:'Normal',description:'Painting and related work',displayOrder:3,status:'Active'},
{id:'house-maid',serviceName:'House Maid',icon:'🧹',type:'Normal',description:'Domestic assistance',displayOrder:4,status:'Active'},
{id:'general-worker',serviceName:'General Worker',icon:'🛠️',type:'Normal',description:'General maintenance and helper services',displayOrder:5,status:'Active'},
{id:'snake-catcher',serviceName:'Snake Catcher',icon:'🐍',type:'Emergency',description:'Snake rescue / removal service',displayOrder:6,status:'Active'}
];for(const r of seeds){if(!homeServiceRows.some(x=>x.id===r.id||String(x.serviceName).toLowerCase()===r.serviceName.toLowerCase())){r.createdOn=new Date().toISOString();await RGMS.store.setRecord(STORAGE_KEYS.HOME_SERVICES,r.id,r);}}await reloadMasters();masterMsg('homeServiceMessage','Initial Home Services populated.');}
async function seedBillers(){const seeds=[
{id:'BL-tgspdcl-electricity',billerName:'TGSPDCL Electricity Bill',category:'Electricity',apiProvider:'Razorpay BBPS',billerCode:'',razorpayBillerId:'',gatewayBillerId:'',paymentGateway:'bbps',customerNumberLabel:'USC Number',displayOrder:1,requiredFields:['consumerNumber'],status:'Active',apiStatus:'Not Configured',notes:'Configure the approved BBPS/API provider biller code and backend credentials.'},
{id:'BL-water-bill',billerName:'Water Bill',category:'Water',apiProvider:'BBPS',billerCode:'',customerNumberLabel:'Consumer Number',displayOrder:2,requiredFields:['consumerNumber'],status:'Active',apiStatus:'Not Configured',notes:'Select the supported Telangana water biller in the BBPS provider.'},
{id:'BL-property-tax',billerName:'Property Tax',category:'Property Tax',apiProvider:'BBPS',billerCode:'',customerNumberLabel:'Property / Assessment Number',displayOrder:3,requiredFields:['propertyNumber'],status:'Active',apiStatus:'Not Configured',notes:'Configure only when the selected provider exposes the relevant municipal biller.'},
{id:'BL-mobile-postpaid',billerName:'Mobile Bill',category:'Mobile Bill',apiProvider:'BBPS',billerCode:'',customerNumberLabel:'Mobile Number',displayOrder:4,requiredFields:['mobileNumber'],status:'Active',apiStatus:'Not Configured',notes:'Ready to activate when required.'},
{id:'BL-gas-booking',billerName:'Gas Booking',category:'Gas Booking',apiProvider:'BBPS',billerCode:'',customerNumberLabel:'Consumer Number / Mobile Number',displayOrder:5,requiredFields:['consumerNumber','mobileNumber'],status:'Active',apiStatus:'Not Configured',notes:'LPG booking integration requires an approved provider/backend endpoint.'},
{id:'BL-dth',billerName:'DTH',category:'DTH',apiProvider:'BBPS',billerCode:'',customerNumberLabel:'Customer ID',displayOrder:6,requiredFields:['customerId'],status:'Inactive',apiStatus:'Not Configured',notes:'Ready to activate when required.'},
{id:'BL-broadband-landline',billerName:'Broadband / Landline',category:'Broadband / Landline',apiProvider:'BBPS',billerCode:'',customerNumberLabel:'Customer Number',displayOrder:7,requiredFields:['customerNumber'],status:'Inactive',apiStatus:'Not Configured',notes:'Ready to activate when required.'}
];let added=0;for(const r of seeds){const existing=billerRows.find(x=>x.id===r.id);if(!existing){r.createdOn=new Date().toISOString();await RGMS.store.setRecord(STORAGE_KEYS.BILLERS,r.id,r);added++;}else if(['BL-mobile-postpaid','BL-gas-booking'].includes(r.id)){await RGMS.store.setRecord(STORAGE_KEYS.BILLERS,r.id,{...existing,billerName:r.billerName,category:r.category,status:'Active',displayOrder:r.displayOrder,requiredFields:r.requiredFields,customerNumberLabel:r.customerNumberLabel});}}await reloadMasters();masterMsg('billerMessage',`${added} initial billers populated. Configure API credentials server-side before enabling payments.`);}
window.selectHomeService=selectHomeService;window.selectProvider=selectProvider;window.selectBiller=selectBiller;

/* 1.2.121 Clean Admin Master Register navigation. */
(function(){
  const configs={
    residents:{title:'Residents Register',section:'adminResidentMasterSection',newAction:'residents-module'},
    roles:{title:'Roles Register',section:'adminRoleSection',newAction:'role-form'},
    dashboards:{title:'Dashboard Assignments',section:'adminAccessMatrixSection',newAction:'dashboard-form'},
    access:{title:'Role Access Register',section:'adminRoleAccessSection',newAction:'access-form'},
    'home-services':{title:'Home Service Master',section:'mastersSection',panel:'homeServiceMasterPanel',newAction:'home-service-form'},
    providers:{title:'Service Provider Register',section:'mastersSection',panel:'serviceProviderMasterPanel',newAction:'provider-form'},
    billers:{title:'Utility Biller Master',section:'mastersSection',panel:'utilityBillerMasterPanel',newAction:'biller-form'},
    directory:{title:'Colony Directory Assignments',section:'mastersSection',panel:'colonyDirectoryAssignmentPanel',newAction:'directory-form'}
  };
  let activeKey=null;
  function q(s){return document.querySelector(s)}
  function showResidentRegister(){
    const sec=q('#adminResidentMasterSection'); if(!sec)return;
    let box=q('#adminResidentRegister');
    if(!box){box=document.createElement('div');box.id='adminResidentRegister';box.className='table-wrap';sec.appendChild(box)}
    const rows=(adminResidents||[]).slice().sort((a,b)=>String(a.ownerName||a.name||'').localeCompare(String(b.ownerName||b.name||''),undefined,{sensitivity:'base'}));
    box.innerHTML='<table class="table"><thead><tr><th>S.No.</th><th>Name</th><th>H.No.</th><th>Resident ID</th><th>Mobile</th><th>Type</th><th>Status</th></tr></thead><tbody>'+
      (rows.map((r,i)=>`<tr><td>${i+1}</td><td>${aesc(r.ownerName||r.name||'')}</td><td>${aesc(r.houseNo||r.plotNo||'')}</td><td>${aesc(r.residentId||r.id||'')}</td><td>${aesc(r.mobile?.[0]||r.whatsapp||'')}</td><td>${aesc(r.residentType||'Owner')}</td><td>${aesc(r.occupationStatus||r.status||'')}</td></tr>`).join('')||'<tr><td colspan="7">No residents found.</td></tr>')+'</tbody></table>';
  }
  function setSection(key){
    document.querySelectorAll('#adminRoleSection,#dashboardAssignmentSection,#adminAccessMatrixSection,#adminRoleAccessSection,#adminResidentMasterSection,#mastersSection').forEach(e=>e.classList.remove('admin-active'));
    document.querySelectorAll('#mastersSection .master-panel').forEach(e=>e.classList.remove('admin-active'));
    const c=configs[key]; if(!c)return;
    const sec=q('#'+c.section); if(sec)sec.classList.add('admin-active');
    if(c.panel){const p=q('#'+c.panel);if(p)p.classList.add('admin-active');}
    if(key==='residents')showResidentRegister();
    if(key==='roles')q('#adminRoleSection')?.classList.remove('admin-new-mode');
    if(key==='home-services')q('#homeServiceMasterPanel')?.classList.remove('admin-new-mode');
    if(key==='providers')q('#serviceProviderMasterPanel')?.classList.remove('admin-new-mode');
    if(key==='billers')q('#utilityBillerMasterPanel')?.classList.remove('admin-new-mode');
    q('#adminMasterHub')?.setAttribute('hidden','');
    q('#adminRegisterHeader')?.removeAttribute('hidden');
    const title=q('#adminRegisterTitle'); if(title)title.textContent=c.title;
    q('#adminRegisterNew')?.removeAttribute('hidden');
    activeKey=key;
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function closeRegister(){
    activeKey=null;
    document.querySelectorAll('#adminRoleSection,#dashboardAssignmentSection,#adminAccessMatrixSection,#adminRoleAccessSection,#adminResidentMasterSection,#mastersSection').forEach(e=>e.classList.remove('admin-active','admin-new-mode'));
    document.querySelectorAll('#mastersSection .master-panel').forEach(e=>e.classList.remove('admin-active','admin-new-mode'));
    q('#adminRegisterHeader')?.setAttribute('hidden','');
    q('#adminMasterHub')?.removeAttribute('hidden');
    q('#adminRegisterNew')?.removeAttribute('hidden');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  async function newRecord(){
    const c=configs[activeKey]; if(!c)return;
    if(c.newAction==='residents-module'){window.RGMS?.navigation?.loadModule?.('residents',{pushHistory:true});return;}
    if(c.newAction==='role-form'){q('#adminRoleSection')?.classList.add('admin-new-mode');q('#staffRole')?.focus();return;}
    if(c.newAction==='dashboard-form'){q('#dashboardAssignmentSection')?.classList.add('admin-active');q('#staffRole')?.focus();return;}
    if(c.newAction==='access-form'){q('#adminRoleAccessSection')?.classList.add('admin-new-mode');return;}
    if(c.panel){q('#'+c.panel)?.classList.add('admin-new-mode');const first=q('#'+c.panel+' input');first?.focus();}
  }
  document.addEventListener('click',e=>{
    const card=e.target.closest('[data-admin-register]'); if(card){e.preventDefault();setSection(card.dataset.adminRegister);return;}
    if(e.target.closest('#adminRegisterBack')){e.preventDefault();closeRegister();return;}
    if(e.target.closest('#adminRegisterNew')){e.preventDefault();newRecord();return;}
  });
  window.RGMSAdminMasterUI={setSection,closeRegister,newRecord,refreshResidentsRegister:showResidentRegister};
})();

/* 1.2.122 Admin master registers: grid first, Firebase-backed form second. */
(function(){
  'use strict';
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  let selectedAdminResidentId=null, selectedDashboardRole='', selectedAccessRole='', selectedDirectoryServiceId='';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const moduleLabels=RGMS_MODULE_LABELS;

  function showMessage(id,text,error=false){const e=q('#'+id);if(e){e.textContent=text;e.style.color=error?'#c62828':'#2e7d32';}}
  function adminResidentForm(r={}){
    const g=id=>q('#'+id); const set=(id,v)=>{if(g(id))g(id).value=v??''};
    set('adminResidentId',r.residentId||r.id||'');set('adminResidentPlotNo',r.houseNo||r.plotNo||'');set('adminResidentOwnerName',r.ownerName||r.name||'');set('adminResidentMobile',r.mobile?.[0]||r.whatsapp||'');set('adminResidentType',r.residentType||'Owner');{const occ=String(r.occupationStatus||'').trim();set('adminResidentStatus',occ==='Vacant'?'Vacant':occ==='Tenant'?'Tenant':'Owner');}set('adminResidentRemarks',r.remarks||'');
    selectedAdminResidentId=r.id||r.residentId||null; const d=q('#adminResidentDelete');if(d)d.disabled=!selectedAdminResidentId;
  }
  function renderAdminResidents(){
    const body=q('#adminResidentsBody');if(!body)return;const term=String(q('#adminResidentSearch')?.value||'').toLowerCase().trim();
    const rows=(adminResidents||[]).filter(r=>!term||[r.residentId,r.id,r.houseNo,r.plotNo,r.ownerName,r.name,r.mobile?.[0],r.whatsapp,r.residentType,r.occupationStatus,r.status].some(v=>String(v??'').toLowerCase().includes(term))).sort((a,b)=>String(a.ownerName||a.name||'').localeCompare(String(b.ownerName||b.name||''),undefined,{sensitivity:'base'}));
    body.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.ownerName||r.name||'')}</td><td>${esc(r.houseNo||r.plotNo||'')}</td><td>${esc(r.residentId||r.id||'')}</td><td>${esc(r.mobile?.[0]||r.whatsapp||'')}</td><td>${esc(r.residentType||'Owner')}</td><td>${esc(r.occupationStatus||r.status||'')}</td><td><div class="rg-grid-actions"><button type="button" class="rg-admin-view" data-admin-view="resident" data-id="${esc(r.id||r.residentId)}">👁️ View</button><button type="button" class="rg-admin-edit" data-admin-edit="resident" data-id="${esc(r.id||r.residentId)}">✏️ Edit</button><button type="button" class="rg-admin-delete" data-admin-delete="resident" data-id="${esc(r.id||r.residentId)}">🗑️ Delete</button></div></td></tr>`).join('')||'<tr><td colspan="8">No residents found in Firebase.</td></tr>';
  }
  async function refreshAdminResidents(){try{await RGMS.store.refreshCollection(STORAGE_KEYS.RESIDENTS,{retries:3});adminResidents=RGMS.store.getResidentMaster({includeVacant:true});renderAdminResidents();showMessage('adminResidentMessage',`${adminResidents.length} resident records loaded from Firebase.`);}catch(e){showMessage('adminResidentMessage',e.message||'Unable to load residents.',true)}}
  async function saveAdminResident(){
    try{
      const g=id=>q('#'+id), plot=g('adminResidentPlotNo')?.value.trim(), name=g('adminResidentOwnerName')?.value.trim(); if(!plot||!name){showMessage('adminResidentMessage','H.No. and Name are required.',true);return}
      const id=selectedAdminResidentId; const mobile=(g('adminResidentMobile')?.value||'').replace(/\D/g,''); const occ=g('adminResidentStatus')?.value||'Owner'; const payload={residentId:g('adminResidentId')?.value.trim()||id||`RGRWA-${String(Date.now()).slice(-8)}`,houseNo:plot,plotNo:plot,ownerName:name,name,mobile:mobile?[mobile]:[],whatsapp:mobile,residentType:g('adminResidentType')?.value||'Owner',occupationStatus:occ,status:occ==='Vacant'?'Vacant':'Occupied',isVacant:occ==='Vacant',remarks:g('adminResidentRemarks')?.value.trim()||'',role:'Resident',updatedOn:new Date().toISOString()};
      const key=id||payload.residentId; payload.id=key; if(id){const old=adminResidents.find(r=>String(r.id||r.residentId)===String(id));await RGMS.store.setRecord(STORAGE_KEYS.RESIDENTS,key,{...old,...payload});}else{payload.createdDate=new Date().toISOString().slice(0,10);payload.developmentFund=true;payload.festivalChanda=true;await RGMS.store.setRecord(STORAGE_KEYS.RESIDENTS,key,payload)}
      await refreshAdminResidents(); adminResidentForm({}); showMessage('adminResidentMessage',id?'Resident updated successfully in Firebase.':'Resident saved successfully in Firebase.');
    }catch(e){console.error(e);showMessage('adminResidentMessage',e.message||'Unable to save resident.',true)}
  }
  async function deleteAdminResident(){if(!selectedAdminResidentId){showMessage('adminResidentMessage','Select a resident first.',true);return} const r=adminResidents.find(x=>String(x.id||x.residentId)===String(selectedAdminResidentId));if(!r)return;if(!confirm(`Delete ${r.ownerName||r.name||'resident'}?`))return;try{await RGMS.store.deleteRecord(STORAGE_KEYS.RESIDENTS,selectedAdminResidentId);await refreshAdminResidents();adminResidentForm({});showMessage('adminResidentMessage','Resident deleted from Firebase.')}catch(e){showMessage('adminResidentMessage',e.message||'Unable to delete resident.',true)}}

  function renderRoleRegister(){
    const body=q('#roleRegisterBody');if(!body)return; const term=String(q('#roleSearch')?.value||'').toLowerCase().trim();
    const roleFilter=String(q('#roleMasterFilter')?.value||'').trim();
    const rows=adminRoles.filter(r=>(!roleFilter||String(r.role||'')===roleFilter) && (!term||[r.displayName,r.ownerName,r.role,r.email,r.id].some(v=>String(v||'').toLowerCase().includes(term))));
    body.innerHTML=rows.sort((a,b)=>String(a.role||'').localeCompare(String(b.role||''))).map(r=>`<tr><td>${esc(r.role||'—')}</td><td>${esc(r.residentId||'—')}</td><td>${esc(r.ownerName||r.displayName||'—')}</td><td>${esc(r.email||'—')}</td><td><div class="rg-grid-actions"><button type="button" class="rg-admin-view" data-admin-view="role" data-id="${esc(r.id||r.uid)}">👁️ View</button><button type="button" class="rg-admin-edit" data-admin-edit="role" data-id="${esc(r.id||r.uid)}">✏️ Edit</button><button type="button" class="rg-admin-delete" data-admin-delete="role" data-id="${esc(r.id||r.uid)}">🗑️ Delete</button></div></td></tr>`).join('')||'<tr><td colspan="5">No officer profiles found in Firebase.</td></tr>';
  }
  function selectRole(id){selectRoleProfile(id);q('#btnDeleteStaffRole')?.removeAttribute('disabled');}
  function clearRole(){['staffRole','staffUid','staffProfileDocId','staffDisplayName','staffEmail','primaryDashboard','staffResident','staffResidentId'].forEach(id=>{const e=q('#'+id);if(e)e.value=id==='primaryDashboard'?'dashboard':''});qa('#dashboardAccessChecks input').forEach(x=>x.checked=false);q('#btnDeleteStaffRole')?.setAttribute('disabled','');q('#staffRoleMessage').textContent='';ensureUserAccountId();}
  async function deleteSelectedRole(){const docId=String(q('#staffProfileDocId')?.value||'').trim();const accountId=String(q('#staffUid')?.value||'').trim();if(!docId){showMessage('staffRoleMessage','Select an officer first.',true);return}const r=adminRoles.find(x=>String(x.id||x.uid)===docId||String(x.accountId||x.userAccountId)===accountId);if(!r)return;if(!confirm(`Delete officer profile for ${r.displayName||r.email||r.role}?`))return;try{await RGMS.store.deleteRecord(STORAGE_KEYS.USER_PROFILES,docId);await loadRoles();clearRole();showMessage('staffRoleMessage','Officer role deleted from Firebase.')}catch(e){showMessage('staffRoleMessage',e.message||'Unable to delete role.',true)}}

  function renderDashboardRegister(){
    const body=q('#dashboardAssignmentTable tbody');if(!body)return; const head=body.closest('table')?.querySelector('thead');if(head)head.innerHTML='<tr><th>Resident / Officer</th><th>Role</th><th>Primary Dashboard</th><th>Action</th></tr>'; const selected=String(q('#dashboardMasterRoleFilter')?.value||'').trim();
    const roles=selected?[selected]:ACCESS_ROLES; const rows=roles.map(role=>adminRoles.find(r=>String(r.role)===role)).filter(Boolean);
    body.innerHTML=rows.map(r=>`<tr><td>${esc(r.displayName||r.role)}</td><td>${esc(r.role)}</td><td>${esc(r.primaryDashboard==='resident-dashboard'?'Resident Dashboard':'Association Dashboard')}</td><td><div class="rg-grid-actions"><button type="button" class="rg-admin-view" data-admin-view="dashboard" data-role="${esc(r.role)}">👁️ View</button><button type="button" class="rg-admin-edit" data-admin-edit="dashboard" data-role="${esc(r.role)}">✏️ Edit</button></div></td></tr>`).join('')||'<tr><td colspan="4">No dashboard assignments found in Firebase.</td></tr>';
  }
  function populateDashboardForm(role){
    selectedDashboardRole=role||'';const r=adminRoles.find(x=>String(x.role)===String(role));q('#adminDashboardRole').value=role||'';q('#adminDashboardPrimary').value=r?.primaryDashboard||'dashboard';
    const selected=new Set(Array.isArray(r?.assignedModules)?r.assignedModules:[]); if(role==='Admin')moduleLabels&&Object.keys(moduleLabels).forEach(k=>selected.add(k));
    q('#adminDashboardModules').innerHTML=Object.entries(moduleLabels).map(([k,label])=>`<label class="rg-access-option"><input type="checkbox" value="${esc(k)}" ${selected.has(k)?'checked':''}> <span>${esc(label)}</span></label>`).join('');q('#adminDashboardDelete').disabled=!r;
  }
  async function saveDashboardForm(){const role=q('#adminDashboardRole').value;if(!role){showMessage('adminDashboardFormMessage','Select an officer role.',true);return}const r=adminRoles.find(x=>String(x.role)===role);if(!r){showMessage('adminDashboardFormMessage','Select an existing officer from the grid first.',true);return}const modules=qa('#adminDashboardModules input:checked').map(x=>x.value);if(role!=='Admin'&&!modules.includes('dashboard'))modules.unshift('dashboard');try{await RGMS.store.setRecord(STORAGE_KEYS.USER_PROFILES,r.id,{...r,primaryDashboard:q('#adminDashboardPrimary').value,assignedModules:role==='Admin'?Object.keys(moduleLabels).concat(['resident-dashboard']):modules.filter(x=>x!=='resident-dashboard'),updatedOn:new Date().toISOString()});await loadRoles();populateDashboardForm(role);renderDashboardRegister();showMessage('adminDashboardFormMessage','Dashboard assignment saved directly to Firebase.')}catch(e){showMessage('adminDashboardFormMessage',e.message||'Unable to save dashboard assignment.',true)}}
  async function deleteDashboardForm(){const r=adminRoles.find(x=>String(x.role)===String(selectedDashboardRole));if(!r)return;if(!confirm(`Delete dashboard/role profile for ${r.displayName||r.role}?`))return;try{await RGMS.store.deleteRecord(STORAGE_KEYS.USER_PROFILES,r.id);await loadRoles();clearDashboardForm();renderDashboardRegister();showMessage('adminDashboardFormMessage','Dashboard assignment deleted from Firebase.')}catch(e){showMessage('adminDashboardFormMessage',e.message||'Unable to delete assignment.',true)}}
  function clearDashboardForm(){selectedDashboardRole='';q('#adminDashboardRole').value='';q('#adminDashboardPrimary').value='dashboard';q('#adminDashboardModules').innerHTML='';q('#adminDashboardDelete').disabled=true;q('#adminDashboardFormMessage').textContent='';}

  function renderAccessRegister(){
    const body=q('#roleAccessTable tbody');if(!body)return;const selected=String(q('#roleAccessMasterFilter')?.value||'').trim();const roles=selected?[selected]:ACCESS_ROLES;
    body.innerHTML=roles.map(role=>`<tr><td><b>${esc(role)}</b>${role==='Admin'?'<div class="rg-admin-fixed">Full access (fixed)</div>':''}</td><td class="rg-access-module-list">${accessSummaryModules(role)}</td><td class="rg-access-actions-summary">${accessActionSummary(role)}</td><td><div class="rg-grid-actions"><button type="button" class="rg-admin-view" data-admin-view="access" data-role="${esc(role)}">👁️ View</button>${role!=='Admin'?`<button type="button" class="rg-admin-edit" data-admin-edit="access" data-role="${esc(role)}">✏️ Edit</button><button type="button" class="rg-admin-delete" data-admin-delete="access" data-role="${esc(role)}">↺ Reset</button>`:''}</div></td></tr>`).join('');
  }
  function populateAccessForm(role){
    selectedAccessRole=role||'';q('#adminAccessRole').value=role||'';const a=normalizeAccessRow(role,accessMatrix[role]);const isAdmin=role==='Admin';
    const head='<div class="rg-permission-head"><span>Module / Feature</span>'+ACCESS_ACTIONS.map(x=>`<span>${esc(ACCESS_ACTION_LABELS[x])}</span>`).join('')+'</div>';
    const rows=ACCESS_CATALOG.map(c=>`<div class="rg-permission-row"><strong>${esc(c.label)}</strong>${ACCESS_ACTIONS.map(action=>c.actions.includes(action)?`<label title="${esc(c.label)} — ${esc(ACCESS_ACTION_LABELS[action])}"><input type="checkbox" data-access-module="${esc(c.key)}" data-access-action="${action}" ${a.permissions[c.key]?.[action]==='YES'?'checked':''} ${isAdmin?'disabled':''}><span class="rg-mobile-action-label">${esc(ACCESS_ACTION_LABELS[action])}</span></label>`:'<span class="rg-permission-na">—</span>').join('')}</div>`).join('');
    q('#adminAccessFields').innerHTML=`${isAdmin?'<div class="rg-admin-access-note">Admin always has full access and cannot be restricted.</div>':''}<div class="rg-permission-table">${head}${rows}</div>`;
    q('#adminAccessDelete').disabled=!role||isAdmin;
  }
  function currentOfficerCanManageRoleAccess(action='update'){
    const sessionRole=String(RGMS.auth.getSession?.()?.role||'').trim();
    if(sessionRole==='Admin')return true;
    const own=normalizeAccessRow(sessionRole,accessMatrix[sessionRole]);
    return String(own?.permissions?.roleAccessMaster?.[action]||'NO').toUpperCase()==='YES';
  }
  async function saveAccessForm(){
    const role=q('#adminAccessRole').value;if(!role){showMessage('adminAccessFormMessage','Select a role.',true);return}if(role==='Admin'){accessMatrix.Admin=buildDefaultAccess('Admin');showMessage('adminAccessFormMessage','Admin always retains full access.');return;}
    if(!currentOfficerCanManageRoleAccess('update')){showMessage('adminAccessFormMessage','Your role does not have permission to update Role Access.',true);return;}
    const requested=normalizeAccessRow(role,accessMatrix[role]);
    qa('#adminAccessFields input[data-access-module]').forEach(x=>{requested.permissions[x.dataset.accessModule][x.dataset.accessAction]=x.checked?'YES':'NO'});
    syncLegacyAccess(requested);
    try{
      showMessage('adminAccessFormMessage','Saving Role Access…');
      await persistRoleAccessRole(role,requested);
      renderAccessRegister();populateAccessForm(role);
      showMessage('adminAccessFormMessage','Role access saved and verified successfully in Firebase.');
    }catch(e){console.error('Role access save failed',e);const msg=String(e?.message||'').replace(/^FirebaseError:\s*/i,'').replace(/^functions\/[^:]+:\s*/i,'');showMessage('adminAccessFormMessage',msg&&msg.length<180?msg:'Unable to save Role Access. Please try again.',true)}
  }
  async function deleteAccessForm(){
    if(!selectedAccessRole||selectedAccessRole==='Admin')return;
    if(!currentOfficerCanManageRoleAccess('delete')){showMessage('adminAccessFormMessage','Your role does not have permission to reset Role Access.',true);return;}
    const role=selectedAccessRole;
    try{
      await persistRoleAccessRole(role,buildDefaultAccess(role));
      renderAccessRegister();clearAccessForm();showMessage('adminAccessFormMessage','Role access reset to defaults and verified successfully.');
    }catch(e){console.error('Role access reset failed',e);showMessage('adminAccessFormMessage','Unable to reset Role Access. Please try again.',true)}
  }
  function clearAccessForm(){selectedAccessRole='';q('#adminAccessRole').value='';q('#adminAccessFields').innerHTML='<div class="muted">Select an officer role and click View to configure permissions.</div>';q('#adminAccessDelete').disabled=true;q('#adminAccessFormMessage').textContent='';}

  // Bridge the consolidated Role Access handlers to initializeAdmin without
  // leaking lexical-scope assumptions. This keeps both the initial script load
  // and subsequent Admin navigation free of ReferenceError failures.
  window.RGMSAdminRoleAccessRuntime={
    bind(){
      const bind=(id,event,handler)=>{const el=document.getElementById(id);if(!el)return;const key=`rgBound267${event}`;if(el.dataset[key])return;el.addEventListener(event,handler);el.dataset[key]='1';};
      bind('adminAccessRole','change',e=>populateAccessForm(e.target.value));
      bind('adminAccessSave','click',saveAccessForm);
      bind('btnSaveRoleAccess','click',saveAccessForm);
      bind('adminAccessDelete','click',deleteAccessForm);
      bind('adminAccessClear','click',clearAccessForm);
    },
    populateAccessForm,saveAccessForm,deleteAccessForm,clearAccessForm,renderAccessRegister
  };

  function renderDirectoryForm(){const s=q('#adminDirectoryService');if(!s)return;const cur=s.value;s.innerHTML='<option value="">Select service master</option>'+homeServiceRows.map(r=>`<option value="${esc(r.id)}">${esc(r.serviceName||r.id)}</option>`).join('');if(homeServiceRows.some(r=>String(r.id)===cur))s.value=cur;}
  function populateDirectoryForm(id){selectedDirectoryServiceId=id||'';renderDirectoryForm();q('#adminDirectoryService').value=id||'';q('#adminDirectoryIncluded').checked=colonyDirectoryAssignments[String(id)]!==false;q('#adminDirectoryDelete').disabled=!id;}
  async function saveDirectoryForm(){const id=q('#adminDirectoryService').value;if(!id){showMessage('adminDirectoryFormMessage','Select a service master.',true);return}colonyDirectoryAssignments[String(id)]=q('#adminDirectoryIncluded').checked;try{await saveColonyDirectoryAssignments();populateDirectoryForm(id);showMessage('adminDirectoryFormMessage','Directory assignment saved directly to Firebase.')}catch(e){showMessage('adminDirectoryFormMessage',e.message||'Unable to save directory assignment.',true)}}
  async function deleteDirectoryForm(){const id=selectedDirectoryServiceId;if(!id)return;delete colonyDirectoryAssignments[String(id)];try{await saveColonyDirectoryAssignments();clearDirectoryForm();showMessage('adminDirectoryFormMessage','Directory assignment removed from Firebase.')}catch(e){showMessage('adminDirectoryFormMessage',e.message||'Unable to remove assignment.',true)}}
  function clearDirectoryForm(){selectedDirectoryServiceId='';q('#adminDirectoryService').value='';q('#adminDirectoryIncluded').checked=false;q('#adminDirectoryDelete').disabled=true;q('#adminDirectoryFormMessage').textContent='';}

  function renderDirectoryGrid(){
    const body=q('#colonyDirectoryAssignmentTable tbody');if(!body)return;body.innerHTML=homeServiceRows.map(r=>`<tr><td>${colonyDirectoryAssignments[String(r.id)]!==false?'Yes':'No'}</td><td>${esc(r.serviceName||r.id)}</td><td>${esc(r.type||'Normal')}</td><td>${esc(r.status||'Active')}</td><td><div class="rg-grid-actions"><button type="button" class="rg-admin-view" data-admin-view="directory" data-id="${esc(r.id)}">👁️ View</button><button type="button" class="rg-admin-edit" data-admin-edit="directory" data-id="${esc(r.id)}">✏️ Edit</button><button type="button" class="rg-admin-delete" data-admin-delete="directory" data-id="${esc(r.id)}">🗑️ Delete</button></div></td></tr>`).join('')||'<tr><td colspan="5">No Home Service Masters found.</td></tr>';
  }

  const MASTER_TITLES={
    residents:'Residents Master',
    roles:'Role Master',
    dashboards:'Dashboard Assignment',
    access:'Role Access Master',
    'home-services':'Home Services Master',
    providers:'Service Providers Master',
    billers:'Utility Billers Master',
    directory:'Directory Master'
  };
  function cardActivate(key){
    q('#genericMasterSection')?.setAttribute('hidden',''); q('#genericMasterSection')?.classList.remove('admin-active');
    const map={residents:'#adminResidentMasterSection',roles:'#adminRoleSection',dashboards:'#adminAccessMatrixSection',access:'#adminRoleAccessSection','home-services':'#mastersSection',providers:'#mastersSection',billers:'#mastersSection',directory:'#mastersSection'};
    const panels={'home-services':'homeServiceMasterPanel',providers:'serviceProviderMasterPanel',billers:'utilityBillerMasterPanel',directory:'colonyDirectoryAssignmentPanel'};
    const target=q(map[key]);
    if(!target){console.warn('Admin master target not found:',key);return false;}
    qa('#adminRoleSection,#dashboardAssignmentSection,#adminAccessMatrixSection,#adminRoleAccessSection,#adminResidentMasterSection,#mastersSection').forEach(x=>x.classList.remove('admin-active','admin-new-mode'));
    qa('#mastersSection .master-panel').forEach(x=>x.classList.remove('admin-active','admin-new-mode'));
    target.classList.add('admin-active');
    if(panels[key]) q('#'+panels[key])?.classList.add('admin-active');
    q('#adminMasterHub')?.setAttribute('hidden','');
    q('#adminRegisterHeader')?.setAttribute('hidden','');
    const title=q('.admin-page-title'); if(title){title.textContent=MASTER_TITLES[key]||'Master';title.style.display='none';} const screen=q('.rg-page-screen-title'); if(screen) screen.textContent=MASTER_TITLES[key]||'Master';
    if(key==='residents'){renderAdminResidents();}
    if(key==='roles'){renderRoleRegister();}
    if(key==='dashboards'){renderDashboardRegister();}
    if(key==='access'){renderAccessRegister();}
    if(key==='home-services'){renderHomeServices();}
    if(key==='providers'){renderProviders();}
    if(key==='billers'){renderBillers();}
    if(key==='directory'){renderDirectoryForm();renderDirectoryGrid();}
    window.scrollTo({top:0,behavior:'smooth'});
    return true;
  }

  document.addEventListener('click',function(e){
    const adminBack=e.target.closest('.rg-page-toolbar .rg-back-btn');
    if(adminBack && document.querySelector('#adminRoleSection.admin-active,#adminAccessMatrixSection.admin-active,#adminRoleAccessSection.admin-active,#adminResidentMasterSection.admin-active,#mastersSection.admin-active')){
      e.preventDefault();e.stopImmediatePropagation();
      qa('#adminRoleSection,#dashboardAssignmentSection,#adminAccessMatrixSection,#adminRoleAccessSection,#adminResidentMasterSection,#mastersSection').forEach(x=>x.classList.remove('admin-active'));
      qa('#mastersSection .master-panel').forEach(x=>x.classList.remove('admin-active'));
      q('#adminMasterHub')?.removeAttribute('hidden');
      const title=q('.admin-page-title'); if(title){title.textContent='Masters';title.style.display='block';} const screen=q('.rg-page-screen-title'); if(screen)screen.textContent='Admin';
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    const card=e.target.closest('[data-admin-register]');if(card){e.preventDefault();e.stopImmediatePropagation();cardActivate(card.dataset.adminRegister);return;}
    const v=e.target.closest('[data-admin-view],[data-admin-edit],[data-admin-delete]');if(!v)return;e.preventDefault();e.stopPropagation();
    const op=v.classList.contains('rg-admin-delete')?'delete':v.classList.contains('rg-admin-edit')?'edit':'view';
    const type=v.dataset.adminView||v.dataset.adminEdit||v.dataset.adminDelete,id=v.dataset.id,role=v.dataset.role;
    if(type==='resident'){
      const r=adminResidents.find(x=>String(x.id||x.residentId)===String(id));
      if(op==='delete'){if(r){adminResidentForm(r);deleteAdminResident();}return;}
      if(r)adminResidentForm(r);
    }
    if(type==='role'){if(op==='delete'){selectRole(id);deleteSelectedRole();return;}selectRole(id);}
    if(type==='dashboard'){populateDashboardForm(role);}
    if(type==='access'){if(op==='delete'){populateAccessForm(role);deleteAccessForm();return;}populateAccessForm(role);}
    if(type==='directory'){if(op==='delete'){populateDirectoryForm(id);deleteDirectoryForm();return;}populateDirectoryForm(id);}
  },true);

  document.addEventListener('input',e=>{if(e.target.id==='adminResidentSearch')renderAdminResidents();if(e.target.id==='roleSearch')renderRoleRegister();});
  q('#homeServiceDelete')?.addEventListener('click',deleteHomeService);
  q('#providerDelete')?.addEventListener('click',deleteProvider);
  q('#billerDelete')?.addEventListener('click',deleteBiller);
  q('#adminResidentRefresh')?.addEventListener('click',refreshAdminResidents);q('#adminResidentSave')?.addEventListener('click',saveAdminResident);q('#adminResidentDelete')?.addEventListener('click',deleteAdminResident);q('#adminResidentClear')?.addEventListener('click',()=>adminResidentForm({}));
  q('#btnDeleteStaffRole')?.addEventListener('click',deleteSelectedRole);q('#btnClearStaffRole')?.addEventListener('click',clearRole);
  q('#staffResident')?.addEventListener('change',e=>{const r=adminResidents.find(x=>adminResidentSelectionKey(x)===String(e.target.value));const rid=q('#staffResidentId');if(rid)rid.value=r?.residentId||r?.id||'';const dn=q('#staffDisplayName');if(dn)dn.value=r?.ownerName||r?.name||'';});q('#adminDashboardRole')?.addEventListener('change',e=>populateDashboardForm(e.target.value));q('#adminDashboardSave')?.addEventListener('click',saveDashboardForm);q('#adminDashboardDelete')?.addEventListener('click',deleteDashboardForm);q('#adminDashboardClear')?.addEventListener('click',clearDashboardForm);
  bindRoleAccessRuntimeEvents();
  // 1.2.160 master-level Role dropdowns are functional selectors.
  q('#roleMasterFilter')?.addEventListener('change',e=>{renderRoleRegister(); if(e.target.value){const r=adminRoles.find(x=>String(x.role)===String(e.target.value)); if(r) selectRole(r.id||r.uid);}});
  q('#dashboardMasterRoleFilter')?.addEventListener('change',e=>{renderDashboardRegister(); populateDashboardForm(e.target.value);});
  q('#roleAccessMasterFilter')?.addEventListener('change',e=>{renderAccessRegister(); populateAccessForm(e.target.value);});
  q('#adminDirectoryService')?.addEventListener('change',e=>populateDirectoryForm(e.target.value));q('#adminDirectorySave')?.addEventListener('click',saveDirectoryForm);q('#adminDirectoryDelete')?.addEventListener('click',deleteDirectoryForm);q('#adminDirectoryClear')?.addEventListener('click',clearDirectoryForm);

  // Keep admin registers synchronized after Firebase refreshes initiated by the existing code.
  const originalLoadRoles=window.loadRoles; if(typeof originalLoadRoles==='function')window.loadRoles=async function(){const r=await originalLoadRoles.apply(this,arguments);renderRoleRegister();renderDashboardRegister();return r};
  const originalLoadAdminResidents=window.loadAdminResidents; if(typeof originalLoadAdminResidents==='function')window.loadAdminResidents=async function(){const r=await originalLoadAdminResidents.apply(this,arguments);renderAdminResidents();return r};
  const originalReloadMasters=window.reloadMasters; if(typeof originalReloadMasters==='function')window.reloadMasters=async function(){const r=await originalReloadMasters.apply(this,arguments);renderDirectoryForm();renderDirectoryGrid();return r};
  const originalLoadColony=window.loadColonyDirectoryAssignments; if(typeof originalLoadColony==='function')window.loadColonyDirectoryAssignments=async function(){const r=await originalLoadColony.apply(this,arguments);renderDirectoryForm();renderDirectoryGrid();return r};
  window.RGMSAdminMasterRegisters={renderAdminResidents,renderRoleRegister,renderDashboardRegister,renderAccessRegister,renderDirectoryGrid};
})();


// Module loader entry point.
window.initializeAdmin = initializeAdmin;

/* 1.2.174 consolidated Admin master UX + configurable Firebase masters. */
(function(){
  'use strict';
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const MASTER_CONFIG={
    officeBearers:{title:'Office Bearers Master',key:'OFFICE_BEARERS',fields:[['role','Role','select',['President','Vice President','Secretary','Joint Secretary 1','Joint Secretary 2','Treasurer']],['residentId','Resident ID','text'],['residentName','Resident','text'],['mobile','Mobile','text'],['email','Email','email'],['fromDate','From Date','date'],['toDate','To Date','date'],['displayOrder','Display Order','number'],['status','Status','select',['Active','Inactive']]]},
    associationSettings:{title:'Association Settings Master',key:'ASSOCIATION_SETTINGS',fields:[['associationName','Association Name','text'],['address','Address','text'],['contactPhone','Contact Phone','text'],['contactEmail','Contact Email','email'],['financialYear','Current Financial Year','text'],['colonyFundAmount','Colony Fund Amount','number'],['status','Status','select',['Active','Inactive']]]},
    paymentModes:{title:'Payment Modes Master',key:'PAYMENT_MODES',fields:[['name','Payment Mode','text'],['displayOrder','Display Order','number'],['status','Status','select',['Active','Inactive']]]},
    financialYears:{title:'Financial Year Master',key:'FINANCIAL_YEARS',fields:[['name','Financial Year','text'],['startDate','Start Date','date'],['endDate','End Date','date'],['isCurrent','Current FY','select',['Yes','No']],['status','Status','select',['Active','Inactive']]]},
    fundTypes:{title:'Fund / Collection Type Master',key:'FUND_TYPES',fields:[['name','Fund / Collection Type','text'],['defaultAmount','Default Amount','number'],['eligibility','Eligibility','select',['Owners','Owners + Tenants','All Residents']],['displayOrder','Display Order','number'],['status','Status','select',['Active','Inactive']]]},
    expenseHeads:{title:'Expense Head Master',key:'EXPENSE_HEADS',fields:[['name','Expense Head','text'],['description','Description','text'],['displayOrder','Display Order','number'],['status','Status','select',['Active','Inactive']]]},
    complaintCategories:{title:'Complaint Category Master',key:'COMPLAINT_CATEGORIES',fields:[['name','Complaint Category','text'],['priority','Default Priority','select',['Normal','High','Emergency']],['displayOrder','Display Order','number'],['status','Status','select',['Active','Inactive']]]},
    documentCategories:{title:'Document Category Master',key:'DOCUMENT_CATEGORIES',fields:[['name','Document Category','text'],['description','Description','text'],['displayOrder','Display Order','number'],['status','Status','select',['Active','Inactive']]]},
    noticeCategories:{title:'Notice Category Master',key:'NOTICE_CATEGORIES',fields:[['name','Notice Category','text'],['description','Description','text'],['displayOrder','Display Order','number'],['status','Status','select',['Active','Inactive']]]},
    visitorTypes:{title:'Visitor Type Master',key:'VISITOR_TYPES',fields:[['name','Visitor Type','text'],['description','Description','text'],['displayOrder','Display Order','number'],['status','Status','select',['Active','Inactive']]]},
    meetingTypes:{title:'Meeting Type Master',key:'MEETING_TYPES',fields:[['name','Meeting Type','text'],['description','Description','text'],['displayOrder','Display Order','number'],['status','Status','select',['Active','Inactive']]]},
    dataEntryFields:{title:'Data Entry Fields Master',key:'DATA_ENTRY_FIELDS',fields:[['module','Module','select',['Residents','Visitors','Colony Fund','Ganesh Festival','Complaints','Meetings','Documents','Notice Board','General Information','Reports / Expenditure','Communications','Settings','Admin / Masters','Home Services','Service Providers','Utility Billers','Colony Directory','Office Bearers','Role Master','Role Access Master','Dashboard Assignment']],['section','Section / Form','text'],['controlId','Existing Control ID','text'],['fieldKey','Field Key','text'],['fieldLabel','Field Label','text'],['fieldType','Field Type','select',['text','number','date','time','email','tel','textarea','select']],['options','Options (comma separated)','text'],['required','Required','select',['No','Yes']],['visible','Visible','select',['Yes','No']],['displayOrder','Display Order','number'],['status','Status','select',['Active','Inactive']],['remarks','Remarks','textarea']]},
    reportsMaster:{title:'Reports Master',key:'REPORTS_MASTER',fields:[['reportName','Report Name','text'],['reportType','Report Type','select',['Colony Fund','Ganesh Festival','Expenditure','Daily Ledger','Residents','Complaints','Visitors','Meetings','Documents','Custom']],['modules','Modules / Sections','text'],['fieldsByModule','Fields to Display','text'],['calculatedFields','Calculated Fields','text'],['formats','Export Formats','text'],['displayOrder','Display Order','number'],['status','Status','select',['Active','Inactive']],['remarks','Remarks','textarea']]},
    communicationTemplates:{title:'Communication Template Master',key:'COMMUNICATION_TEMPLATES',fields:[['name','Template Name','text'],['channel','Channel','select',['WhatsApp','SMS','Both']],['category','Category','text'],['message','Message Template','textarea'],['status','Status','select',['Active','Inactive']]]}
  };
  let active=null, selectedId='';
  function keyFor(c){return window.RGMS?.STORAGE_KEYS?.[c.key]||c.key}
  function fieldControl([id,label,type,opts]){
    if(type==='select')return `<div class="form-group"><label>${esc(label)}</label><select class="form-control" data-generic-field="${esc(id)}">${opts.map(x=>`<option>${esc(x)}</option>`).join('')}</select></div>`;
    if(type==='textarea')return `<div class="form-group rg-wide-field"><label>${esc(label)}</label><textarea class="form-control" rows="3" data-generic-field="${esc(id)}"></textarea></div>`;
    return `<div class="form-group"><label>${esc(label)}</label><input class="form-control" type="${esc(type)}" data-generic-field="${esc(id)}"></div>`;
  }
  async function activate(name){
    const c=MASTER_CONFIG[name]; if(!c)return;
    active=name; selectedId='';
    qa('#adminRoleSection,#dashboardAssignmentSection,#adminAccessMatrixSection,#adminRoleAccessSection,#adminResidentMasterSection,#mastersSection').forEach(x=>x.classList.remove('admin-active'));
    q('#genericMasterSection')?.removeAttribute('hidden'); q('#genericMasterSection')?.classList.add('admin-active'); q('#adminMasterHub')?.setAttribute('hidden','');
    const title=q('.admin-page-title'); if(title){title.textContent=c.title;title.style.display='none';} const screen=q('.rg-page-screen-title'); if(screen)screen.textContent=c.title;
    q('#genericMasterFields').innerHTML=c.fields.map(fieldControl).join('');
    await RGMS.store.loadCollection(keyFor(c)); if(name==='reportsMaster'&&typeof window.RGMSSeedDefaultReports==='function')await window.RGMSSeedDefaultReports(); if(name==='dataEntryFields'&&typeof window.RGMSSeedDataEntryFields==='function')await window.RGMSSeedDataEntryFields(); render(); clear(); window.scrollTo({top:0,behavior:'smooth'});
  }
  function rows(){const c=MASTER_CONFIG[active];return c?RGMS.store.getAllRecords(keyFor(c)):[]}
  function render(){
    const c=MASTER_CONFIG[active]; if(!c)return; const data=rows();
    const visible=c.fields.slice(0,4);
    q('#genericMasterHead').innerHTML='<tr><th>S.No.</th>'+visible.map(f=>`<th>${esc(f[1])}</th>`).join('')+'<th>Actions</th></tr>';
    q('#genericMasterBody').innerHTML=data.map((r,i)=>`<tr><td>${i+1}</td>${visible.map(f=>`<td>${esc(r[f[0]]??'')}</td>`).join('')}<td><div class="rg-grid-actions"><button type="button" class="rg-admin-view" data-generic-view="${esc(r.id)}">View</button><button type="button" class="rg-admin-edit" data-generic-edit="${esc(r.id)}">Update</button><button type="button" class="rg-admin-delete" data-generic-delete="${esc(r.id)}">Delete</button></div></td></tr>`).join('')||`<tr><td colspan="${visible.length+2}">No records found.</td></tr>`;
  }
  function values(){const o={};qa('[data-generic-field]').forEach(e=>{o[e.dataset.genericField]=e.value});return o}
  function populate(id){const r=rows().find(x=>String(x.id)===String(id));if(!r)return;selectedId=id;qa('[data-generic-field]').forEach(e=>e.value=r[e.dataset.genericField]??'');q('#genericMasterDelete').disabled=false}
  function clear(){selectedId='';qa('[data-generic-field]').forEach(e=>{if(e.tagName==='SELECT')e.selectedIndex=0;else e.value=''});q('#genericMasterDelete').disabled=true;q('#genericMasterMessage').textContent=''}
  async function save(isUpdate){const c=MASTER_CONFIG[active];if(!c)return;const payload=values();let id=selectedId;if(isUpdate&&!id){msg('Select a record from the grid first.',true);return}if(!id)id=`${active}-${Date.now()}`;payload.id=id;payload.updatedOn=new Date().toISOString();if(!selectedId)payload.createdOn=payload.updatedOn;try{await RGMS.store.setRecord(keyFor(c),id,{...(rows().find(x=>String(x.id)===String(id))||{}),...payload});await RGMS.store.refreshCollection(keyFor(c),{retries:2});render();clear();msg(isUpdate?'Record updated successfully.':'Record saved successfully.')}catch(e){msg(e.message||'Unable to save record.',true)}}
  async function del(id=selectedId){const c=MASTER_CONFIG[active];if(!c||!id)return;if(!confirm('Delete this master record?'))return;try{await RGMS.store.deleteRecord(keyFor(c),id);await RGMS.store.refreshCollection(keyFor(c),{retries:2});render();clear();msg('Record deleted successfully.')}catch(e){msg(e.message||'Unable to delete record.',true)}}
  function msg(t,err=false){const e=q('#genericMasterMessage');if(e){e.textContent=t;e.style.color=err?'#c62828':'#2e7d32'}}
  document.addEventListener('click',e=>{const back=e.target.closest('.rg-page-toolbar .rg-back-btn');if(back&&q('#genericMasterSection')?.classList.contains('admin-active')){e.preventDefault();e.stopImmediatePropagation();q('#genericMasterSection').setAttribute('hidden','');q('#genericMasterSection').classList.remove('admin-active');q('#adminMasterHub')?.removeAttribute('hidden');const title=q('.admin-page-title');if(title){title.textContent='Masters';title.style.display='block';}const screen=q('.rg-page-screen-title');if(screen)screen.textContent='Admin';window.scrollTo({top:0,behavior:'smooth'});return;}const card=e.target.closest('[data-generic-master]');if(card){e.preventDefault();activate(card.dataset.genericMaster);return}const vw=e.target.closest('[data-generic-view]');if(vw){populate(vw.dataset.genericView);q('#genericMasterForm')?.scrollIntoView({behavior:'smooth',block:'start'});return}const ed=e.target.closest('[data-generic-edit]');if(ed){populate(ed.dataset.genericEdit);q('#genericMasterForm')?.scrollIntoView({behavior:'smooth',block:'start'});return}const de=e.target.closest('[data-generic-delete]');if(de){del(de.dataset.genericDelete);return}},true);
  q('#genericMasterSave')?.addEventListener('click',()=>save(false));q('#genericMasterUpdate')?.addEventListener('click',()=>save(true));q('#genericMasterDelete')?.addEventListener('click',()=>del());q('#genericMasterClear')?.addEventListener('click',clear);

  function applyRequestedLayout(){
    const roleHead=q('#roleRegisterBody')?.closest('table')?.querySelector('thead'); if(roleHead) roleHead.innerHTML='<tr><th>Role</th><th>Resident ID</th><th>Resident</th><th>Email</th><th>Action</th></tr>';
    // Role Master: grid first; no master filter/search/dashboard assignment.
    q('#roleMasterFilter')?.closest('.form-group')?.remove();q('#roleSearch')?.closest('.module-toolbar')?.remove();q('#primaryDashboard')?.closest('.form-group')?.remove();
    const roleSec=q('#adminRoleSection'), roleTable=q('#roleRegisterBody')?.closest('.table-wrap');if(roleSec&&roleTable){const h=roleSec.querySelector('.section-heading');h?.remove();roleSec.insertBefore(roleTable,roleSec.querySelector('.form-row'));}
    roleSec?.querySelectorAll(':scope > p').forEach(x=>x.remove());
    // Role Access: grid first, compact, dashboard assignment is a dropdown, no Association/Resident checkboxes.
    q('#roleAccessMasterFilter')?.closest('.form-group')?.remove();q('#adminRoleAccessSection')?.querySelectorAll(':scope > p').forEach(x=>x.remove());
    const at=q('#roleAccessTable');if(at){at.querySelector('thead').innerHTML='<tr><th>Role</th><th>All Modules / Features</th><th>Allowed Actions</th><th>Action</th></tr>'}
    // Grid-first for services/providers/billers/directory and remove unrelated descriptions/titles/search.
    [['homeServiceMasterPanel','#homeServicesBody'],['serviceProviderMasterPanel','#providersBody'],['utilityBillerMasterPanel','#billersBody'],['colonyDirectoryAssignmentPanel','#colonyDirectoryAssignmentTable tbody']].forEach(([pid,bodySel])=>{const p=q('#'+pid),tw=q(bodySel)?.closest('.table-wrap');if(!p||!tw)return;p.querySelector('h4')?.remove();p.querySelectorAll(':scope > p').forEach(x=>x.remove());p.querySelector('.module-toolbar')?.remove();p.insertBefore(tw,p.firstChild)});
    q('#mastersSection')?.querySelector(':scope > h3')?.remove();q('#mastersSection')?.querySelector(':scope > p')?.remove();
  }
  // Override access register renderer after original code has initialized.
  const originalInit=window.initializeAdmin;
  window.initializeAdmin=async function(){const r=await originalInit.apply(this,arguments);applyRequestedLayout();return r};
  window.addEventListener('load',()=>setTimeout(applyRequestedLayout,50));

})();


/* Admin-only Firebase Authentication password reset for office bearers. */
(function(){
  'use strict';
  const STAFF_ROLES=new Set(['Admin','President','Vice President','Secretary','Joint Secretary 1','Joint Secretary 2','Treasurer']);
  const el=id=>document.getElementById(id);
  function message(text,error=false){const x=el('passwordResetMessage');if(x){x.textContent=text;x.style.color=error?'#c62828':'#2e7d32';}}
  function resetRows(){
    const select=el('passwordResetOfficer'); if(!select)return;
    const rows=(typeof adminRoles!=='undefined'?adminRoles:[]).filter(r=>STAFF_ROLES.has(String(r.role||'').trim())&&String(r.email||'').trim());
    const current=select.value;
    select.innerHTML='<option value="">Select office bearer</option>'+rows.sort((a,b)=>String(a.role).localeCompare(String(b.role))).map(r=>`<option value="${String(r.email).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" data-role="${String(r.role).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${String(r.role)} — ${String(r.displayName||r.ownerName||r.email)}</option>`).join('');
    if([...select.options].some(o=>o.value===current))select.value=current;
  }
  async function invokeReset(targetEmail,targetRole,newPassword){
    if(window.RGMS?.isNativeAndroid && window.RGMSNativeAuth && typeof window.RGMSNativeAuth.resetOfficerPassword==='function'){
      const requestId='rgms_pwd_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      return await new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>{delete window.RGMSNativeAuthCallbacks[requestId];reject(new Error('Password reset timed out.'));},30000);
        window.RGMSNativeAuthCallbacks=window.RGMSNativeAuthCallbacks||{};
        window.RGMSNativeAuthCallbacks[requestId]={resolve:v=>{clearTimeout(timeout);delete window.RGMSNativeAuthCallbacks[requestId];resolve(v);},reject:e=>{clearTimeout(timeout);delete window.RGMSNativeAuthCallbacks[requestId];reject(e);}};
        try{window.RGMSNativeAuth.resetOfficerPassword(targetEmail,targetRole,newPassword,requestId);}catch(e){clearTimeout(timeout);delete window.RGMSNativeAuthCallbacks[requestId];reject(e);}
      });
    }
    const {httpsCallable}=await import('https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js');
    const callable=httpsCallable(window.RGMS.firebase.functions,'resetOfficerPassword');
    const result=await callable({targetEmail,targetRole,newPassword});
    return result?.data||{};
  }
  async function reset(useDefault=false){
    if(String(window.RGMS?.auth?.getSession?.()?.role||'')!=='Admin'){message('Only Admin can reset office-bearer passwords.',true);return;}
    const select=el('passwordResetOfficer'); const option=select?.selectedOptions?.[0];
    const targetEmail=String(select?.value||'').trim(); const targetRole=String(option?.dataset?.role||'').trim();
    const input=el('passwordResetValue'); const newPassword=String(input?.value||'');
    if(!targetEmail){message('Select an office bearer first.',true);return;}
    if(newPassword.length<12){message('Password must contain at least 12 characters.',true);return;}
    if(!/[A-Z]/.test(newPassword)||!/[a-z]/.test(newPassword)||!/[0-9]/.test(newPassword)){message('Use uppercase, lowercase and a number.',true);return;}
    const button=el('btnResetOfficerPassword');
    if(!confirm(`Reset ${targetRole||'office bearer'} password?`))return;
    if(button)button.disabled=true; message('Resetting Firebase Authentication password...');
    try{await invokeReset(targetEmail,targetRole,newPassword); if(input)input.value=''; message(`Password reset successful for ${targetRole}. The new password is active immediately.`);}
    catch(e){console.error('Office-bearer password reset failed',e);message(e?.message||'Unable to reset password.',true);}
    finally{if(button)button.disabled=false;}
  }
  function bind(){const panel=el('adminPasswordResetPanel');if(!panel||panel.dataset.resetBound==='1'){resetRows();return;}panel.dataset.resetBound='1';el('btnResetOfficerPassword')?.addEventListener('click',()=>reset(false));resetRows();}
  const original=window.initializeAdmin;
  if(typeof original==='function') window.initializeAdmin=async function(){const out=await original.apply(this,arguments);setTimeout(()=>{resetRows();bind();},0);return out;};
  window.addEventListener('load',()=>setTimeout(bind,150));
  const body=el('roleRegisterBody');if(body)new MutationObserver(resetRows).observe(body,{childList:true});
})();


/* 1.2.282 Data Entry Fields Master baseline catalog. */
(function(){
'use strict';const D=[];let n=0;const add=(m,sec,a)=>a.forEach(x=>{const [controlId,fieldKey,fieldLabel,fieldType='text',options='']=x;D.push({id:`DEF-${String(++n).padStart(3,'0')}`,module:m,section:sec,controlId,fieldKey,fieldLabel,fieldType,options,required:'No',visible:'Yes',displayOrder:n,status:'Active',remarks:'Built-in field definition; editable in Data Entry Fields Master'});});
add('Residents','Main',[['residentId','residentId','Resident ID'],['plotNo','houseNo','H.No.'],['ownerName','ownerName','Name'],['mobile','mobile','Cell No.','tel'],['residentType','residentType','Resident Type','select','Owner,Tenant,Family Member'],['residentStatus','occupationStatus','Occupation Status','select','Owner,Tenant,Vacant'],['residentRemarks','remarks','Remarks','textarea']]);
add('Visitors','Main',[['visitDate','visitDate','Visit Date','date'],['visitorName','visitorName','Visitor Name'],['visitorMobile','visitorMobile','Mobile','tel'],['visitorPlot','residentName','Name','select'],['visitorHouse','houseNo','H.No.'],['visitorPurpose','purpose','Purpose','select','Personal Visit,Delivery,Service / Repair,Domestic Help,Official,Other'],['visitorVehicle','vehicleNo','Vehicle No.'],['visitorPersons','persons','No. of Persons','number'],['visitorEntry','entryTime','Entry Time','time'],['visitorExit','exitTime','Exit Time','time'],['visitorRemarks','remarks','Remarks','textarea']]);
add('Colony Fund','Payment',[['dfPaymentFinancialYear','financialYear','Financial Year','select'],['dfPaymentMonth','collectionPeriod','Month','select'],['txtReceiptNo','receiptNo','Receipt Number'],['cmbResidentName','ownerName','Name','select'],['txtMobileNumber','mobile','Mobile Number','tel'],['txtFundAmount','fundAmount','Fund Amount','number'],['txtAmountPaid','amountPaid','Amount Paid','number'],['txtBalance','balance','Balance','number'],['dtPaymentDate','paymentDate','Payment Date','date'],['cmbPaymentStatus','paymentStatus','Payment Status','select','Paid,Pending'],['cmbPaymentMode','paymentMode','Payment Mode','select','Cash,UPI,Cheque,Bank Transfer,Register Import'],['txtTransactionNo','transactionNo','Transaction Number']]);
add('Ganesh Festival','Contributions',[['ganeshChandaName','ownerName','Name','select'],['ganeshChandaHouse','houseNo','H.No.'],['ganeshChandaAmount','amount','Amount','number'],['ganeshChandaStatus','paymentStatus','Payment Status','select','Unpaid,To be paid,Paid'],['ganeshChandaMode','paymentMode','Mode of Payment','select','Cash,UPI,Cheque,Bank Transfer'],['ganeshChandaDate','paymentDate','Date of Payment','date'],['ganeshChandaRemarks','remarks','Remarks']]);
add('Ganesh Festival','Laddu Auction',[['ganeshAuctionYear','financialYear','Financial Year','select'],['ganeshAuctionDate','auctionDate','Auction Date','date'],['ganeshAuctionAmount','auctionAmount','Auction Amount','number'],['ganeshWinnerName','winnerName','Winner Name','select'],['ganeshWinnerHouse','houseNo','H.No.'],['ganeshAuctionStatus','paymentStatus','Payment Status','select','Unpaid,Paid'],['ganeshWinnerMobile','winnerMobile','Winner Mobile','tel'],['ganeshAuctionRemarks','remarks','Auction Remarks','textarea']]);
add('Ganesh Festival','Sponsor Details',[['ganeshSponsorName','ownerName','Name','select'],['ganeshSponsorHouse','houseNo','H.No.'],['ganeshSponsorType','sponsorType','Sponsor Type'],['ganeshSponsorCashAmount','cashContributionAmount','Cash Contribution Amount','number'],['ganeshSponsorPaymentStatus','paymentStatus','Payment Status','select','Unpaid,To be Paid,Paid'],['ganeshSponsorPaymentDate','paymentDate','Date of Payment','date']]);
add('Complaints','Main',[['complaintNo','complaintNo','Complaint No.'],['complaintDate','complaintDate','Date','date'],['complaintPlot','residentName','Name','select'],['complaintHouse','houseNo','H.No.'],['complaintCategory','category','Category','select'],['complaintPriority','priority','Priority','select'],['complaintStatus','status','Status','select'],['complaintSubject','subject','Subject'],['complaintAssigned','assignedTo','Assigned To','select'],['complaintDescription','description','Description','textarea'],['complaintResolution','resolution','Resolution / Action Taken','textarea'],['complaintDue','dueDate','Due Date','date'],['complaintClosedDate','closedDate','Closed Date','date'],['complaintRemarks','remarks','Remarks']]);
add('Meetings','Main',[['meetingNo','meetingNo','Meeting No.'],['meetingDate','meetingDate','Meeting Date','date'],['meetingTime','meetingTime','Time','time'],['meetingType','meetingType','Meeting Type','select'],['meetingStatus','status','Status','select'],['meetingVenue','venue','Venue'],['meetingChair','chairperson','Chairperson'],['meetingSecretary','secretary','Secretary / Recorder'],['meetingQuorum','quorum','Quorum / Expected Attendees','number'],['meetingAgenda','agenda','Agenda','textarea'],['meetingAttendance','attendance','Attendance / Participants','textarea'],['meetingMinutes','minutes','Minutes / Proceedings','textarea'],['meetingActions','actions','Action Items / Decisions','textarea'],['meetingNextDate','nextMeetingDate','Next Meeting Date','date'],['meetingLink','meetingLink','Meeting Link']]);
add('Documents','Main',[['docTitle','title','Document Title'],['docCategory','category','Category','select'],['docDate','documentDate','Document Date','date'],['docFile','fileName','Select File'],['docDescription','description','Description','textarea']]);
add('General Information','Main',[['infoType','serviceType','Service Type','select'],['infoName','name','Service / Hospital Name'],['infoDepartment','department','Department'],['infoPhone','phone','Phone','tel'],['infoEmergencyNo','emergencyNo','Emergency Number','tel'],['infoWebsite','website','Website'],['infoAddress','address','Address','textarea'],['infoNotes','notes','Notes / Services','textarea'],['infoStatus','status','Status','select','Active,Inactive']]);
add('Reports / Expenditure','Expenditure',[['expenditureVariant','expenditureVariant','Expenditure Variant','select','Colony Fund,Ganesh Festival Fund'],['expenditureFY','financialYear','Financial Year','select'],['expenditureAdvance','advancePaid','Advance','number'],['expenditureVoucher','voucherNo','Voucher No.'],['expenditureDate','date','Date','date'],['expenditureParticulars','description','Description'],['expenditureAmount','amountCommitted','Amount','number'],['expenditureBalance','amountDue','Balance to be paid','number'],['expenditureRemarks','remarks','Remarks']]);
add('Notice Board','Main',[['nbTitle','title','Notice Title'],['nbType','noticeType','Notice Type','select'],['nbMessage','message','Message','textarea']]);
add('Communications','Pending Colony Fund',[['pendingMessageTemplate','pendingMessageTemplate','Pending Message Template','textarea'],['associationNoticeTitle','associationNoticeTitle','Notice Title'],['associationNoticeType','associationNoticeType','Notice Type','select'],['associationNoticeMessage','associationNoticeMessage','Notice Message','textarea'],['commUpiId','upiId','UPI ID'],['commPaymentMobile','paymentMobile','PhonePe / GPay No.','tel']]);
add('Settings','Password',[['currentPassword','currentPassword','Current Password'],['newPassword','newPassword','New Password'],['confirmPassword','confirmPassword','Confirm Password']]);
add('Admin / Masters','Resident Master',[['adminResidentId','residentId','Resident ID'],['adminResidentPlotNo','houseNo','H.No.'],['adminResidentOwnerName','ownerName','Name'],['adminResidentMobile','mobile','Cell No.','tel'],['adminResidentType','residentType','Resident Type','select','Owner,Tenant,Family Member'],['adminResidentStatus','occupationStatus','Occupation Status','select','Owner,Tenant,Vacant'],['adminResidentRemarks','remarks','Remarks','textarea']]);
add('Home Services','Master',[['homeServiceName','name','Service Name'],['homeServiceIcon','icon','Icon'],['homeServiceType','type','Service Type'],['homeServiceDescription','description','Description','textarea'],['homeServiceOrder','displayOrder','Display Order','number'],['homeServiceStatus','status','Status','select','Active,Inactive']]);
add('Service Providers','Master',[['providerName','name','Provider Name'],['providerService','service','Service'],['providerMobile','mobile','Mobile','tel'],['providerWhatsapp','whatsapp','WhatsApp','tel'],['providerAddress','address','Address'],['providerHours','hours','Working Hours'],['providerCharges','charges','Charges'],['providerExperience','experience','Experience'],['providerStatus','status','Status','select','Active,Inactive'],['providerRemarks','remarks','Remarks','textarea']]);
add('Utility Billers','Master',[['billerName','name','Biller Name'],['billerCategory','category','Category'],['billerProvider','provider','Provider'],['billerCustomerLabel','customerLabel','Customer Label'],['billerOrder','displayOrder','Display Order','number'],['billerStatus','status','Status','select','Active,Inactive'],['billerNotes','notes','Notes','textarea']]);
add('Role Master','Main',[['staffRole','role','Role','select'],['staffResidentId','residentId','Resident ID'],['staffResident','residentName','Resident Name','select'],['staffEmail','email','Email','email']]);
add('Role Access Master','Main',[['adminAccessRole','role','Role','select']]);
add('Dashboard Assignment','Main',[['adminDashboardRole','role','Role','select'],['adminDashboardPrimary','primaryDashboard','Primary Dashboard','select']]);

window.RGMS_DATA_ENTRY_DEFAULTS=D;window.RGMSSeedDataEntryFields=async function(){const key=window.STORAGE_KEYS?.DATA_ENTRY_FIELDS;if(!key||!window.RGMS?.store)return 0;const current=window.RGMS.store.getAllRecords(key);if(current.length)return current.length;if(window.RGMS.store.upsertRecords)await window.RGMS.store.upsertRecords(key,D);else for(const r of D)await window.RGMS.store.setRecord(key,r.id,r);await window.RGMS.store.loadCollection(key,{force:true,retries:2});return D.length;};
})();

/* 4.5.49 Reports Master: aligned selectors + field display order + calculated amount fields. */
(function(){
  'use strict';
  const MODULE_FIELDS={
    'Colony Fund':[['sno','S.No.'],['residentId','Resident ID'],['plotNo','H.No.'],['ownerName','Name'],['paymentDate','Payment Date'],['collectionPeriod','Month'],['financialYear','Financial Year'],['amountPaid','Amount'],['paymentMode','Payment Mode'],['paymentStatus','Payment Status'],['remarks','Remarks']],
    'Ganesh Collection':[['serialNo','S.No.'],['residentId','Resident ID'],['houseNo','H.No.'],['ownerName','Name'],['chandaAmount','Amount'],['paymentStatus','Payment Status'],['paymentMode','Payment Mode'],['paymentDate','Payment Date'],['remarks','Remarks']],
    'Laddu Auction':[['financialYear','Financial Year'],['auctionDate','Auction Date'],['houseNo','H.No.'],['winnerResidentId','Resident ID'],['winnerName','Winner Name'],['winnerMobile','Mobile'],['auctionAmount','Auction Amount'],['remarks','Remarks']],
    'Sponsor Details':[['serialNo','S.No.'],['residentId','Resident ID'],['houseNo','H.No.'],['ownerName','Name'],['sponsorType','Sponsor Type']],
    'Expenditure':[['sno','S.No.'],['description','Description'],['amountCommitted','Amount'],['advancePaid','Advance'],['amountDue','Balance to be paid'],['remarks','Remarks']],
    'Residents':[['residentId','Resident ID'],['houseNo','H.No.'],['ownerName','Name'],['mobile','Cell No.'],['residentType','Resident Type'],['occupationStatus','Occupation Status'],['remarks','Remarks']],
    'Complaints':[['complaintNo','Complaint No.'],['complaintDate','Date'],['residentId','Resident ID'],['houseNo','H.No.'],['residentName','Name'],['subject','Subject'],['category','Category'],['priority','Priority'],['status','Status']],
    'Visitors':[['visitDate','Date'],['visitorName','Visitor'],['visitorMobile','Mobile'],['residentId','Resident ID'],['houseNo','H.No.'],['residentName','Resident'],['purpose','Purpose'],['vehicleNo','Vehicle'],['entryTime','Entry'],['exitTime','Exit']],
    'Meetings':[['meetingNo','Meeting No.'],['meetingDate','Date'],['meetingTime','Time'],['meetingType','Type'],['venue','Venue'],['chairperson','Chairperson'],['status','Status']],
    'Documents':[['documentDate','Date'],['title','Title'],['category','Category'],['fileName','File'],['uploadedBy','Uploaded By'],['uploadedOn','Uploaded On']],
    'Daily Ledger':[['date','Date'],['particulars','Particulars'],['type','Type'],['fundType','Fund'],['amount','Amount']]
  };
  const DEFAULT_REPORTS=[
    {id:'builtin-colony-fund',reportName:'Colony Fund Statement',reportType:'Colony Fund',modules:['Colony Fund']},
    {id:'builtin-ganesh-collection',reportName:'Ganesh Collection Report',reportType:'Ganesh Festival',modules:['Ganesh Collection','Expenditure','Sponsor Details']},
    {id:'builtin-ganesh-sponsors',reportName:'Ganesh Festival Sponsors',reportType:'Ganesh Festival',modules:['Sponsor Details']},
    {id:'builtin-daily-ledger',reportName:'Daily Ledger',reportType:'Daily Ledger',modules:['Daily Ledger']},
    {id:'builtin-residents',reportName:'Residents Report',reportType:'Residents',modules:['Residents']},
    {id:'builtin-complaints',reportName:'Complaints Report',reportType:'Complaints',modules:['Complaints']},
    {id:'builtin-visitors',reportName:'Visitors Report',reportType:'Visitors',modules:['Visitors']},
    {id:'builtin-meetings',reportName:'Meetings Report',reportType:'Meetings',modules:['Meetings']},
    {id:'builtin-documents',reportName:'Documents Report',reportType:'Documents',modules:['Documents']},
    {id:'builtin-expenditure',reportName:'Expenditure Report',reportType:'Expenditure',modules:['Expenditure']}
  ];
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function selectedModules(){return [...document.querySelectorAll('#rgReportModules input[type="checkbox"]:checked')].map(x=>x.value);}
  function amountFieldOptions(){
    let mods=selectedModules(); if(!mods.length){try{const hidden=document.querySelector('[data-generic-field="modules"]');const parsed=JSON.parse(hidden?.value||'[]');if(Array.isArray(parsed))mods=parsed;}catch(_){}} const amountLike=/amount|balance|advance|paid|fund|expenditure/i; const out=[];
    mods.forEach(mod=>(MODULE_FIELDS[mod]||[]).forEach(([k,l])=>{if(amountLike.test(k)||amountLike.test(l))out.push([`${mod}.${k}`,`${mod} — ${l}`]);}));
    return out;
  }
  function syncHidden(){
    const m=document.querySelector('[data-generic-field="modules"]'), f=document.querySelector('[data-generic-field="fieldsByModule"]'), c=document.querySelector('[data-generic-field="calculatedFields"]'); if(!m||!f)return;
    const modules=selectedModules(); m.value=JSON.stringify(modules);
    const fields={}; modules.forEach(mod=>{
      fields[mod]=[...document.querySelectorAll(`[data-report-fields="${CSS.escape(mod)}"] .rg-report-field-item`)]
        .filter(row=>row.querySelector('input[type="checkbox"]')?.checked)
        .sort((a,b)=>Number(a.querySelector('[data-field-order]')?.value||999)-Number(b.querySelector('[data-field-order]')?.value||999))
        .map(row=>row.querySelector('input[type="checkbox"]')?.value).filter(Boolean);
    }); f.value=JSON.stringify(fields);
    if(c){c.value=JSON.stringify([...document.querySelectorAll('.rg-calc-row')].map(row=>({name:row.querySelector('[data-calc="name"]')?.value.trim()||'Calculated Amount',field1:row.querySelector('[data-calc="field1"]')?.value||'',operator:row.querySelector('[data-calc="operator"]')?.value||'-',field2:row.querySelector('[data-calc="field2"]')?.value||'',level:row.querySelector('[data-calc="level"]')?.value||'total',display:!!row.querySelector('[data-calc="display"]')?.checked})).filter(x=>x.field1&&x.field2));}
  }
  function renderFieldPickers(saved={}){
    const host=document.getElementById('rgReportFieldPickers');if(!host)return;const modules=selectedModules();
    host.innerHTML=modules.map(mod=>{const savedOrder=Array.isArray(saved[mod])?saved[mod]:[];return `<div class="rg-report-field-group"><strong>${esc(mod)} — Fields to Display</strong><div class="rg-field-order-head"><span>Field</span><span>Display Order</span></div><div class="rg-field-checks" data-report-fields="${esc(mod)}">${(MODULE_FIELDS[mod]||[]).map(([k,l],idx)=>{const pos=savedOrder.indexOf(k);const checked=!saved[mod]||pos>=0;const order=pos>=0?pos+1:idx+1;return `<div class="rg-report-field-item"><label class="rg-report-check"><input type="checkbox" value="${esc(k)}" ${checked?'checked':''}><span>${esc(l)}</span></label><input type="number" min="1" step="1" class="form-control rg-field-order" data-field-order value="${order}" aria-label="Display order for ${esc(l)}"></div>`;}).join('')}</div></div>`}).join('')||'<small>Select one or more modules.</small>';
    host.querySelectorAll('input').forEach(x=>x.addEventListener('change',syncHidden));host.querySelectorAll('[data-field-order]').forEach(x=>x.addEventListener('input',syncHidden)); syncHidden();
  }
  function calcRowHtml(x={}){
    const options=amountFieldOptions(); const opt=v=>'<option value="">Select amount field</option>'+options.map(([k,l])=>`<option value="${esc(k)}" ${String(v||'')===k?'selected':''}>${esc(l)}</option>`).join('');
    return `<div class="rg-calc-row"><input class="form-control" data-calc="name" placeholder="Calculated field name (e.g. Balance)" value="${esc(x.name||'')}"><select class="form-control" data-calc="field1">${opt(x.field1)}</select><select class="form-control rg-calc-operator" data-calc="operator"><option value="+" ${x.operator==='+'?'selected':''}>+</option><option value="-" ${!x.operator||x.operator==='-'?'selected':''}>−</option><option value="*" ${x.operator==='*'?'selected':''}>×</option><option value="/" ${x.operator==='/'?'selected':''}>÷</option></select><select class="form-control" data-calc="field2">${opt(x.field2)}</select><select class="form-control" data-calc="level"><option value="total" ${x.level!=='row'?'selected':''}>Report Total</option><option value="row" ${x.level==='row'?'selected':''}>Row-wise</option></select><label class="rg-report-check rg-calc-display"><input type="checkbox" data-calc="display" ${x.display!==false?'checked':''}><span>Display</span></label><button type="button" class="rg-calc-remove" title="Remove">×</button></div>`;
  }
  function renderCalculated(saved=[]){
    const host=document.getElementById('rgCalculatedFields');if(!host)return;host.innerHTML=(Array.isArray(saved)?saved:[]).map(calcRowHtml).join(''); bindCalc(); syncHidden();
  }
  function bindCalc(){const host=document.getElementById('rgCalculatedFields');if(!host)return;host.querySelectorAll('input,select').forEach(x=>x.addEventListener('change',syncHidden));host.querySelectorAll('input[data-calc="name"]').forEach(x=>x.addEventListener('input',syncHidden));host.querySelectorAll('.rg-calc-remove').forEach(b=>b.addEventListener('click',()=>{b.closest('.rg-calc-row')?.remove();syncHidden();}));}
  function refreshCalcOptions(){let saved=[];const c=document.querySelector('[data-generic-field="calculatedFields"]');try{saved=JSON.parse(c?.value||'[]')}catch(_){}renderCalculated(saved);}
  function enhance(){
    const fields=document.getElementById('genericMasterFields');if(!fields||!document.querySelector('[data-generic-field="modules"]'))return;
    const mInput=document.querySelector('[data-generic-field="modules"]'), fInput=document.querySelector('[data-generic-field="fieldsByModule"]'), cInput=document.querySelector('[data-generic-field="calculatedFields"]');
    const mg=mInput.closest('.form-group'), fg=fInput.closest('.form-group'), cg=cInput?.closest('.form-group'); if(!mg||mg.dataset.enhanced==='1')return;mg.dataset.enhanced='1';mg.classList.add('rg-wide-field');fg.classList.add('rg-wide-field');cg?.classList.add('rg-wide-field');mInput.type='hidden';fInput.type='hidden';if(cInput)cInput.type='hidden';
    mg.insertAdjacentHTML('beforeend',`<div id="rgReportModules" class="rg-field-checks rg-module-checks">${Object.keys(MODULE_FIELDS).map(x=>`<label class="rg-report-check"><input type="checkbox" value="${esc(x)}"><span>${esc(x)}</span></label>`).join('')}</div>`);
    fg.insertAdjacentHTML('beforeend','<div id="rgReportFieldPickers"></div>');
    if(cg)cg.insertAdjacentHTML('beforeend','<div class="rg-calc-help">Create a formula using two amount fields. Report Total can combine amounts from different modules; Row-wise applies when both fields belong to the same module.</div><div id="rgCalculatedFields"></div><button type="button" id="rgAddCalculatedField" class="btn btn-secondary rg-add-calc">+ Add Calculated Field</button>');
    document.querySelectorAll('#rgReportModules input').forEach(x=>x.addEventListener('change',()=>{renderFieldPickers({});refreshCalcOptions();}));
    document.getElementById('rgAddCalculatedField')?.addEventListener('click',()=>{const host=document.getElementById('rgCalculatedFields');host?.insertAdjacentHTML('beforeend',calcRowHtml({display:true}));bindCalc();syncHidden();});
    const formats=document.querySelector('[data-generic-field="formats"]');if(formats){formats.value=formats.value||'JPEG, PDF, Excel';formats.placeholder='JPEG, PDF, Excel';}
    setTimeout(()=>hydrateVisuals(),0);
  }
  function hydrateVisuals(){
    const m=document.querySelector('[data-generic-field="modules"]'),f=document.querySelector('[data-generic-field="fieldsByModule"]'),c=document.querySelector('[data-generic-field="calculatedFields"]');if(!m)return;
    let mods=[],fs={},calcs=[];try{mods=JSON.parse(m.value||'[]')}catch(_){mods=String(m.value||'').split(',').map(x=>x.trim()).filter(Boolean)}try{fs=JSON.parse(f?.value||'{}')}catch(_){}try{calcs=JSON.parse(c?.value||'[]')}catch(_){}
    document.querySelectorAll('#rgReportModules input').forEach(x=>x.checked=mods.includes(x.value));renderFieldPickers(fs);renderCalculated(calcs);setTimeout(()=>renderCalculated(calcs),0);
  }
  async function seed(){
    try{
      const key=RGMS.STORAGE_KEYS.REPORTS_MASTER;
      await RGMS.store.refreshCollection(key,{retries:2,ttlMs:0}).catch(()=>RGMS.store.loadCollection(key));
      const existing=RGMS.store.getAllRecords(key)||[];
      const byId=new Set(existing.map(x=>String(x.id||'')));
      const byName=new Set(existing.map(x=>String(x.reportName||'').trim().toLowerCase()).filter(Boolean));
      let added=0;
      for(let i=0;i<DEFAULT_REPORTS.length;i++){
        const r=DEFAULT_REPORTS[i];
        const current=existing.find(x=>String(x.id||'')===String(r.id));
        const fields={};r.modules.forEach(m=>fields[m]=(MODULE_FIELDS[m]||[]).map(x=>x[0]));
        const now=new Date().toISOString();
        // Keep built-in Ganesh reports aligned with the authoritative three-section design.
        // Existing records seeded by older versions are upgraded in place so Reports Master
        // immediately shows Contributions, Expenditure and Sponsor Details.
        if(current && ['builtin-ganesh-collection','builtin-ganesh-sponsors'].includes(String(r.id))){
          await RGMS.store.setRecord(key,r.id,{...current,reportName:r.reportName,reportType:r.reportType,modules:JSON.stringify(r.modules),fieldsByModule:JSON.stringify(fields),formats:current.formats||'JPEG, PDF, Excel',status:current.status||'Active',remarks:'Built-in report - sections synchronized by RGMS',updatedOn:now});
          continue;
        }
        if(current||byName.has(String(r.reportName||'').trim().toLowerCase()))continue;
        await RGMS.store.setRecord(key,r.id,{...r,modules:JSON.stringify(r.modules),fieldsByModule:JSON.stringify(fields),calculatedFields:'[]',formats:'JPEG, PDF, Excel',displayOrder:i+1,status:'Active',remarks:'Built-in report - editable in Reports Master',createdOn:now,updatedOn:now});
        added++;
      }
      await RGMS.store.refreshCollection(key,{retries:2,ttlMs:0});
      return added;
    }catch(e){console.warn('Reports Master built-in seed skipped',e);return 0;}
  }
  document.addEventListener('click',e=>{if(e.target.closest('[data-generic-master="reportsMaster"]'))setTimeout(async()=>{await seed();enhance();},150);if(e.target.closest('[data-generic-view], [data-generic-edit]'))setTimeout(hydrateVisuals,80);},true);
  const mo=new MutationObserver(()=>enhance());mo.observe(document.documentElement,{childList:true,subtree:true});
  window.RGMS_REPORT_MODULE_FIELDS=MODULE_FIELDS;window.RGMSSeedDefaultReports=seed;
})();
