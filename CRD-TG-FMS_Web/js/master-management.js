/* FMS Generic Master Tables & Registers - CRUD + existing data sync */
"use strict";
(function(window,document){
const MASTER_DEFS={
 districts:{label:"Districts",fields:[f("name","District Name",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 mandals:{label:"Mandals",fields:[s("district","District",true,"districts"),f("name","Mandal Name",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 villages:{label:"Villages",fields:[s("district","District",true,"districts"),s("mandal","Mandal",true,"mandals"),f("name","Village Name",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 departments:{label:"Departments",fields:[f("name","Department Name",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 sections:{label:"Sections",fields:[f("name","Section Name",true),s("department","Department",false,"departments"),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 officers:{label:"Officers",fields:[f("name","Officer Name",true),s("designation","Designation",false,"designations"),s("section","Section",false,"sections"),f("mobile","Mobile"),f("email","Email",false,"","email"),f("code","Code"),b("active","Active")]},
 designations:{label:"Designations",fields:[f("name","Designation",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 categories:{label:"Grievance Categories",fields:[f("name","Category",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 sources:{label:"Complaint Sources",fields:[f("name","Source",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 priorityLevels:{label:"Priority Levels",fields:[f("name","Priority",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 statusMaster:{label:"General Status Master",fields:[f("name","Status",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 fileLocations:{label:"File Locations",fields:[f("name","Location",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 officeCommunicationTypes:{label:"Office Communication Types",fields:[f("name","Communication Type",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 fileStatuses:{label:"Office File Statuses",fields:[f("name","File Status",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 grievanceNature:{label:"Grievance Nature",fields:[f("name","Nature",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 contactMethods:{label:"Preferred Contact Methods",fields:[f("name","Contact Method",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 genderMaster:{label:"Gender Master",fields:[f("name","Gender",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 meetingStatuses:{label:"DISHA Meeting Statuses",fields:[f("name","Meeting Status",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]},
 billStatuses:{label:"DISHA Bill Statuses",fields:[f("name","Bill Status",true),f("code","Code"),f("description","Description",false,"","textarea"),b("active","Active")]}
};
function f(key,label,required=false,source="",type="text"){return {key,label,required,source,type};}
function s(key,label,required=false,source=""){return {key,label,required,source,type:"select"};}
function b(key,label){return {key,label,type:"checkbox",default:true};}
const DEFAULTS={
 districts:["Adilabad","Bhadradri Kothagudem","Hanumakonda","Hyderabad","Jagtial","Jangaon","Jayashankar Bhupalpally","Jogulamba Gadwal","Kamareddy","Karimnagar","Khammam","Komaram Bheem Asifabad","Mahabubabad","Mahabubnagar","Mancherial","Medak","Medchal-Malkajgiri","Mulugu","Nagarkurnool","Nalgonda","Narayanpet","Nirmal","Nizamabad","Peddapalli","Rajanna Sircilla","Rangareddy","Sangareddy","Siddipet","Suryapet","Vikarabad","Wanaparthy","Warangal","Yadadri Bhuvanagiri"],
 categories:["Roads","Drinking Water","Drainage","Housing","Pensions","MGNREGS","PMAY","Sanitation","Electricity","Agriculture","Revenue","Education","Health","Others"],
 sources:["CPGRAMS Portal","Prajavani","Email","Post","In Person","Telephone","Collector Camp Office","Other"],
 priorityLevels:["Normal","High","Urgent","Very Urgent"],
 statusMaster:["Received","Under Process","Pending Clarification","ATR Awaited","Ready for Disposal","Disposed","Closed","Rejected","Arised","Under Circulation","Despatched","Reply Obtained","Pending","Completed"],
 fileLocations:["Section","Officer","Superintendent","Assistant Director","Deputy Commissioner","Commissioner","Record Room"],
 officeCommunicationTypes:["Letter","D.O. Letter","UO Note","Memo"],
 fileStatuses:["Arised","Under Circulation","Despatched","Reply Obtained","Closed"],
 grievanceNature:["Individual","Public","Community"],contactMethods:["Mobile","Post","Email"],genderMaster:["Male","Female","Transgender","Other"],
 meetingStatuses:["Held","To be held","Postponed"],billStatuses:["Not Submitted","Submitted","Under Process","Approved","Rejected"]
};
const MODULE_SOURCES={cpgrams:{collection:"cpgrams",map:{districts:["district"],mandals:["mandal"],villages:["village"],departments:["department","departmentName"],sections:["section","assignedSection","officeReplySection"],officers:["assignedOfficer","assignedTo","officeLetterAddressedTo"],designations:["designation","officerDesignation"],categories:["category","grievanceCategory"],sources:["source","grievanceSource"],priorityLevels:["priority","priorityClassification"],statusMaster:["currentStatus","finalStatus","officeStatus","statusOfFile","status"],fileLocations:["fileLocation"],officeCommunicationTypes:["officeCommunicationType"],fileStatuses:["officeStatus","statusOfFile"],grievanceNature:["natureOfGrievance"],contactMethods:["preferredContact"],genderMaster:["gender"]}},
 rti:{collection:"rtiApplications",map:{districts:["district"],mandals:["mandal"],villages:["village"],departments:["department","departmentName"],sections:["section","officeReplySection","assignedSection"],officers:["assignedTo","assignedOfficer","officeLetterAddressedTo"],designations:["designation","officerDesignation"],statusMaster:["presentStatus","officeStatus","status"],officeCommunicationTypes:["officeCommunicationType"],fileStatuses:["officeStatus","statusOfFile"]}},
 disha:{collection:"dishaMeetings",map:{districts:["district","nameOfDistrict"],sections:["section","officeReplySection"],officers:["assignedOfficer","officeLetterAddressedTo"],statusMaster:["statusOfMeeting","statusOfBills","officeStatus","status"],officeCommunicationTypes:["officeCommunicationType"],fileStatuses:["officeStatus"],meetingStatuses:["statusOfMeeting"],billStatuses:["statusOfBills"]}}
};
let db=null,currentType="districts",selectedId=null,rows=[],started=false;
const $=id=>document.getElementById(id); const val=v=>String(v??"").trim();
function status(msg,kind="muted"){$("masterStatus").className=`ms-auto small align-self-center text-${kind}`;$("masterStatus").textContent=msg;}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function initUI(){
 const sel=$("masterType"); sel.innerHTML=Object.entries(MASTER_DEFS).map(([k,d])=>`<option value="${k}">${esc(d.label)}</option>`).join("");
 $("masterCards").innerHTML=Object.entries(MASTER_DEFS).map(([k,d])=>`<div class="col-6"><button type="button" class="btn btn-outline-primary btn-sm w-100 text-start master-card" data-master="${k}">${esc(d.label)}</button></div>`).join("");
 sel.onchange=()=>switchMaster(sel.value); document.querySelectorAll("[data-master]").forEach(b=>b.onclick=()=>{sel.value=b.dataset.master;switchMaster(b.dataset.master);});
 $("masterSearch").oninput=renderGrid; $("masterForm").onsubmit=e=>{e.preventDefault();saveRecord();}; $("btnNew").onclick=clearForm;$("btnClear").onclick=clearForm;$("btnUpdate").onclick=updateRecord;$("btnDelete").onclick=deleteRecord;$("btnSync").onclick=()=>syncExistingData(true);
 $("btnHome").onclick=()=>location.href="../../index.html";$("btnReports").onclick=()=>location.href="../reports.html";$("btnReportsMaster").onclick=()=>location.href="reports-master.html";
 $("btnExcel").onclick=()=>exportCurrent("excel");$("btnPDF").onclick=()=>exportCurrent("pdf");$("btnJPEG").onclick=()=>exportCurrent("jpeg");$("btnPrint").onclick=()=>exportCurrent("print");
}
async function switchMaster(type){currentType=type;selectedId=null;await renderForm();await loadGrid();}
async function optionsFrom(collection){try{const snap=await db.collection(collection).get();return snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.active!==false&&x.name).sort((a,b)=>val(a.name).localeCompare(val(b.name)));}catch(e){console.warn("Master option load failed",collection,e);return [];}}
async function renderForm(){
 const def=MASTER_DEFS[currentType];$("formTitle").textContent=def.label+" — Data Entry";$("registerTitle").textContent=def.label+" Register";$("selectedRecordBadge").textContent="New record";
 let html="";
 for(const field of def.fields){
   const cls=field.required?"required":"";
   if(field.type==="checkbox") html+=`<div class="col-md-3"><div class="form-check mt-4"><input class="form-check-input" type="checkbox" id="mf_${field.key}" ${field.default!==false?"checked":""}><label class="form-check-label" for="mf_${field.key}">${esc(field.label)}</label></div></div>`;
   else if(field.type==="select"){
     const opts=await optionsFrom(field.source);html+=`<div class="col-md-4"><label class="form-label ${cls}">${esc(field.label)}</label><select id="mf_${field.key}" class="form-select" ${field.required?"required":""}><option value="">Select</option>${opts.map(o=>`<option value="${esc(o.name)}">${esc(o.name)}</option>`).join("")}</select></div>`;
   } else if(field.type==="textarea") html+=`<div class="col-md-6"><label class="form-label ${cls}">${esc(field.label)}</label><textarea id="mf_${field.key}" class="form-control" rows="2" ${field.required?"required":""}></textarea></div>`;
   else html+=`<div class="col-md-4"><label class="form-label ${cls}">${esc(field.label)}</label><input id="mf_${field.key}" type="${field.type||"text"}" class="form-control" ${field.required?"required":""}></div>`;
 }
 $("dynamicFields").innerHTML=html;
 if(currentType==="villages") $("mf_district")?.addEventListener("change",async()=>{const mandal=$("mf_mandal");const opts=(await optionsFrom("mandals")).filter(x=>!$("mf_district").value||x.district===$("mf_district").value);mandal.innerHTML='<option value="">Select</option>'+opts.map(o=>`<option value="${esc(o.name)}">${esc(o.name)}</option>`).join("");});
}
function collect(){const def=MASTER_DEFS[currentType],data={};for(const f of def.fields){const el=$("mf_"+f.key);data[f.key]=f.type==="checkbox"?!!el?.checked:val(el?.value);if(f.required&&!data[f.key])throw new Error(`${f.label} is required.`);}data.modifiedOn=firebase.firestore.FieldValue.serverTimestamp();return data;}
async function loadGrid(){status("Loading register...");try{const snap=await db.collection(currentType).get();rows=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>val(a.name).localeCompare(val(b.name)));renderGrid();status(`${rows.length} ${MASTER_DEFS[currentType].label.toLowerCase()} loaded`,"success");}catch(e){console.error(e);rows=[];renderGrid();status("Unable to load master: "+(e.message||e),"danger");}}
function columns(){const def=MASTER_DEFS[currentType];const cols=def.fields.filter(x=>x.key!=="description").slice(0,6).map(x=>({key:x.key,label:x.label}));return [{key:"sl",label:"Sl.No"},...cols];}
function filteredRows(){const q=val($("masterSearch").value).toLowerCase();return !q?rows:rows.filter(r=>Object.values(r).some(v=>val(v).toLowerCase().includes(q)));}
function renderGrid(){const data=filteredRows(),cols=columns();$("recordCount").textContent=`${data.length} records`;$("masterGrid").querySelector("thead").innerHTML='<tr>'+cols.map(c=>`<th>${esc(c.label)}</th>`).join('')+'<th>Action</th></tr>';$("masterGrid").querySelector("tbody").innerHTML=data.length?data.map((r,i)=>`<tr>${cols.map(c=>`<td>${c.key==="sl"?i+1:esc(c.key==="active"?(r[c.key]===false?"Inactive":"Active"):(r[c.key]??""))}</td>`).join('')}<td class="text-nowrap"><button class="btn btn-sm btn-primary me-1" data-edit="${r.id}"><i class="bi bi-pencil"></i> Edit</button><button class="btn btn-sm btn-outline-danger" data-del="${r.id}"><i class="bi bi-trash"></i></button></td></tr>`).join(''):'<tr><td colspan="99" class="text-center text-muted p-4">No records found.</td></tr>';
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editRecord(b.dataset.edit));document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>deleteById(b.dataset.del));}
async function editRecord(id){const r=rows.find(x=>x.id===id);if(!r)return;selectedId=id;const def=MASTER_DEFS[currentType];for(const f of def.fields){const el=$("mf_"+f.key);if(!el)continue;if(f.type==="checkbox")el.checked=r[f.key]!==false;else el.value=val(r[f.key]);}$("selectedRecordBadge").textContent="Editing: "+(r.name||id);window.scrollTo({top:0,behavior:"smooth"});}
function clearForm(){selectedId=null;$("masterForm").reset();MASTER_DEFS[currentType].fields.filter(f=>f.type==="checkbox").forEach(f=>{const el=$("mf_"+f.key);if(el)el.checked=f.default!==false;});$("selectedRecordBadge").textContent="New record";}
async function duplicateExists(data,excludeId){const snap=await db.collection(currentType).get();return snap.docs.some(d=>d.id!==excludeId&&val(d.data().name).toLowerCase()===val(data.name).toLowerCase()&&(!data.district||val(d.data().district).toLowerCase()===val(data.district).toLowerCase())&&(!data.mandal||val(d.data().mandal).toLowerCase()===val(data.mandal).toLowerCase()));}
async function saveRecord(){try{const data=collect();if(await duplicateExists(data,null))throw new Error("A matching master record already exists.");data.createdOn=firebase.firestore.FieldValue.serverTimestamp();await db.collection(currentType).add(data);clearForm();await loadGrid();status("Record saved successfully.","success");}catch(e){alert(e.message||e);}}
async function updateRecord(){if(!selectedId)return alert("Select a record to update.");try{const data=collect();if(await duplicateExists(data,selectedId))throw new Error("A matching master record already exists.");await db.collection(currentType).doc(selectedId).update(data);clearForm();await loadGrid();status("Record updated successfully.","success");}catch(e){alert(e.message||e);}}
async function deleteById(id){if(!confirm("Delete this master record?"))return;try{await db.collection(currentType).doc(id).delete();if(selectedId===id)clearForm();await loadGrid();status("Record deleted successfully.","success");}catch(e){alert("Delete failed: "+(e.message||e));}}
async function deleteRecord(){if(!selectedId)return alert("Select a record to delete.");return deleteById(selectedId);}
function extract(row,fields){for(const k of fields||[]){const v=val(row?.[k]);if(v)return v;}return "";}
async function syncExistingData(showAlert=false){status("Scanning existing module data...");let added=0,skipped=0,failed=0;try{
  const existing={}; for(const key of Object.keys(MASTER_DEFS)){try{const snap=await db.collection(key).get();existing[key]=new Set(snap.docs.map(d=>val(d.data().name).toLowerCase()+"|"+val(d.data().district).toLowerCase()+"|"+val(d.data().mandal).toLowerCase()));}catch(_){existing[key]=new Set();}}
  const queue=[];
  for(const [key,names] of Object.entries(DEFAULTS)){for(const name of names)queue.push({key,data:{name,active:true,source:"Built-in FMS option"}});}
  for(const src of Object.values(MODULE_SOURCES)){
    let docs=[];try{const snap=await db.collection(src.collection).get();docs=snap.docs.map(d=>d.data());}catch(e){console.warn("Unable to scan",src.collection,e);continue;}
    for(const row of docs){for(const [key,fields] of Object.entries(src.map)){const name=extract(row,fields);if(!name)continue;const data={name,active:true,source:`Existing ${src.collection} data`};if(key==="mandals")data.district=val(row.district);if(key==="villages"){data.district=val(row.district);data.mandal=val(row.mandal);}if(key==="sections")data.department=val(row.department||row.departmentName);if(key==="officers"){data.designation=val(row.designation||row.officerDesignation);data.section=val(row.section||row.assignedSection||row.officeReplySection);}queue.push({key,data});}}
  }
  for(const item of queue){const idkey=val(item.data.name).toLowerCase()+"|"+val(item.data.district).toLowerCase()+"|"+val(item.data.mandal).toLowerCase();if(existing[item.key].has(idkey)){skipped++;continue;}try{await db.collection(item.key).add({...item.data,createdOn:firebase.firestore.FieldValue.serverTimestamp()});existing[item.key].add(idkey);added++;}catch(e){failed++;console.warn("Master sync write failed",item.key,item.data,e);}}
  await renderForm();await loadGrid();status(`Sync complete: ${added} added, ${skipped} already existed${failed?`, ${failed} failed`:""}.`,failed?"warning":"success");if(showAlert)alert(`Master sync complete.\nAdded: ${added}\nAlready existed: ${skipped}\nFailed: ${failed}`);
 }catch(e){status("Sync failed: "+(e.message||e),"danger");if(showAlert)alert("Sync failed: "+(e.message||e));}}
async function exportCurrent(type){try{const data=filteredRows().map((r,i)=>({sl:i+1,...r})),cols=columns().filter(c=>c.key!=="sl"?true:true);const title=MASTER_DEFS[currentType].label+" Register";if(type==="excel")await FMSExportService.toExcel({rows:data,columns:cols,title,filename:title});if(type==="pdf")await FMSExportService.toPDF({rows:data,columns:cols,title,filename:title});if(type==="jpeg")await FMSExportService.toJPEG({rows:data,columns:cols,title,filename:title});if(type==="print")await FMSExportService.printRows({rows:data,columns:cols,title});}catch(e){alert(e.message||e);}}
async function start(){if(started)return;db=window.db||window.fmsFirebase?.db;if(!db){status("Waiting for Firebase...","warning");return;}started=true;initUI();await switchMaster(currentType);syncExistingData(false);}
document.addEventListener("DOMContentLoaded",()=>{if(window.fmsFirebaseReady&&window.db)start();else{window.addEventListener("fmsFirebaseReady",start,{once:true});setTimeout(()=>{if(window.db)start();},1600);}});
window.FMSMasterDefinitions=MASTER_DEFS;
})(window,document);
