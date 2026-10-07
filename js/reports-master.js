"use strict";
(function(window,document){
const CATALOG={
 cpgrams:["grievanceFinancialYear","grievanceType","prajavaniSerial","grievanceNumber","dateReceived","dueDate","subject","category","grievanceDescription","fileDocumentName","questionSerialNo","questionType","questionReceivedDate","questionConcernedSection","question","answer","answerFurnishedBy","answerFurnishedTo","answerFurnishedDate","questionCommunicationType","questionFileNumber","questionCommunicationDate","questionFileStatus","complainantName","mobileNumber","gender","district","districtManual","mandal","mandalManual","village","villageManual","address","preferredContact","fileNumber","dateArised","officeStatus","officeCommunicationType","memoNumber","memoDate","officeLetterAddressedTo","communicationStatus","memoDocumentName","atrStatus","finalStatus","appealNumber","appealDate","appealReceivedDate","appellantName","appealDocumentName","appealStatus","appealAuthority","appealCommunicationNo","appealDisposalDate","appealRemarks","fileAttachmentName"],
 rti:["applicationNumber","applicationDate","dueDate","informationSought","rtiApplicationFileName","parsedText","applicantName","mobileNumber","applicantAddress","district","mandal","newMandal","village","newVillage","officeFileNo","officeDateArised","officeSubject","officeCommunicationType","officeLetterAddressedTo","newOfficeOfficer","officeReplySection","newOfficeSection","officeStatus","concernedSection","sentToSectionDate","assignedOfficer","replyStatus","firstAppealNumber","firstAppealDate","firstAppealReceivedDate","firstAppealStatus","firstAppealAuthority","firstAppealOrderDate","firstAppealOrderNo","firstAppealGrounds","secondAppealNumber","secondAppealDate","secondAppealReceivedDate","secondAppealStatus","secondAppealAuthority","secondAppealOrderDate","secondAppealOrderNo","secondAppealGrounds","attachmentFileName"],
 disha:["dishaWorkspaceFY","slNo","district","dateOfMeeting","pomUploaded","pomPendingDays","pomUploadDate","meetingExpenditure","statusOfBills","billsSubmittedCRD","billsForwardedMoRD","proposedDateOfMeeting","statusOfMeeting","remarks","officeFileNo","officeDateArised","officeSubject","officeCommunicationType","officeLetterAddressedTo","newOfficeSection","officeStatus"],
 all:["Module","ID","Date","DueDate","Subject","District","Status","Days Pending","Days Delayed"]
};
const LABELS={grievanceType:"Grievance Type",grievanceNumber:"Grievance No.",dateReceived:"Date Received",applicationNumber:"Application No.",applicationDate:"Application Date",dateOfMeeting:"Meeting Date",pomDueDate:"PoM Due Date",pomUploaded:"PoM Uploaded",statusOfMeeting:"Meeting Status",statusOfBills:"Bill Status",meetingExpenditure:"Meeting Expenditure",complainantName:"Complainant Name",applicantName:"Applicant Name",informationSought:"Information Sought",assignedTo:"Assigned To",assignedOfficer:"Assigned Officer",officeCommunicationType:"Communication Type",presentStatus:"Present Status",currentStatus:"Current Status",finalStatus:"Final Status",officeStatus:"Office Status",fileLocation:"File Location",priorityClassification:"Priority Classification",natureOfGrievance:"Grievance Nature",questionSerialNo:"LAQ / LCQ No.",questionType:"Question Type",questionReceivedDate:"Received Date",questionConcernedSection:"Concerned Section",question:"Question",answer:"Answer",answerFurnishedBy:"Answer Furnished By",answerFurnishedTo:"Answer Furnished To",answerFurnishedDate:"Answer Furnished Date",questionCommunicationType:"Communication Type",questionFileNumber:"File No.",questionCommunicationDate:"Communication Date",questionFileStatus:"File Status",grievanceFinancialYear:"Financial Year",prajavaniSerial:"S.No.",subject:"Subject",category:"Category",grievanceDescription:"Grievance Description",fileDocumentName:"Grievance Document",gender:"Gender",district:"District",districtManual:"District (Manual)",mandal:"Mandal",mandalManual:"Mandal (Manual)",village:"Village",villageManual:"Village (Manual)",address:"Address",preferredContact:"Preferred Contact",fileNumber:"File No.",dateArised:"Date Arised",memoNumber:"UO Note/Memo/Letter No.",memoDate:"UO Note/Memo/Letter Date",officeLetterAddressedTo:"Addressed To",communicationStatus:"Communication Status",memoDocumentName:"UO Note/Memo/Letter Document",atrStatus:"ATR Status",appealNumber:"Appeal No.",appealDate:"Appeal Date",appealReceivedDate:"Appeal Received Date",appellantName:"Appellant Name",appealDocumentName:"Appeal Document",appealStatus:"Appeal Status",appealAuthority:"Appeal Authority / Addressed To",appealCommunicationNo:"Communication / Order No.",appealDisposalDate:"Appeal Disposal Date",appealRemarks:"Appeal Subject / Reason / Remarks",fileAttachmentName:"Attachment",applicantAddress:"Applicant Address",rtiApplicationFileName:"RTI Application Document",parsedText:"Extracted Text",newMandal:"New Mandal",newVillage:"New Village",officeFileNo:"File No.",officeDateArised:"Date Arised",officeSubject:"Subject",newOfficeOfficer:"New Officer",officeReplySection:"Reply Obtained From",newOfficeSection:"New Section",concernedSection:"Concerned Section",sentToSectionDate:"Sent to Section Date",replyStatus:"Reply Status",firstAppealNumber:"First Appeal No.",firstAppealDate:"First Appeal Date",firstAppealReceivedDate:"First Appeal Received Date",firstAppealStatus:"First Appeal Status",firstAppealAuthority:"First Appellate Authority",firstAppealOrderDate:"First Appeal Order / Disposal Date",firstAppealOrderNo:"First Appeal Order No.",firstAppealGrounds:"First Appeal Grounds / Remarks",secondAppealNumber:"Second Appeal No.",secondAppealDate:"Second Appeal Date",secondAppealReceivedDate:"Second Appeal Received Date",secondAppealStatus:"Second Appeal Status",secondAppealAuthority:"Second Appellate Authority / Information Commission",secondAppealOrderDate:"Second Appeal Order / Disposal Date",secondAppealOrderNo:"Second Appeal Order No.",secondAppealGrounds:"Second Appeal Grounds / Remarks",attachmentFileName:"Attachment",dishaWorkspaceFY:"Financial Year",slNo:"Sl.No.",pomUploadDate:"PoM Upload Date",pomPendingDays:"PoM Pending Days",billsSubmittedCRD:"Bills Submitted to CRD",billsForwardedMoRD:"Bills Forwarded to MoRD",proposedDateOfMeeting:"Proposed Date of Meeting",remarks:"Remarks"};
const SUMMARY_CATALOG={
 cpgrams:[
  {key:"totalSince2014",label:"Total Received since 2014-15"},{key:"totalPeriod",label:"Total Received (Selected Period)"},{key:"withinDue",label:"Within Due Date"},{key:"dueToday",label:"Due Today"},{key:"overdue",label:"Overdue"},{key:"atrAwaited",label:"ATR / Reply Awaited"},{key:"atrReceived",label:"ATR / Reply Received"},{key:"pendingApproval",label:"Pending Approval"},{key:"disposedClosed",label:"Disposed / Closed"}
 ],
 rti:[
  {key:"total",label:"Total RTI Applications"},{key:"withinDue",label:"Within Due Date"},{key:"dueToday",label:"Due Today"},{key:"overdue",label:"Overdue"},{key:"replyAwaited",label:"Reply Awaited"},{key:"replyReceived",label:"Reply Received"},{key:"replySent",label:"Reply Sent"},{key:"disposedClosed",label:"Disposed / Closed"}
 ],
 disha:[
  {key:"totalMeetings",label:"Total Meetings"},{key:"districtsConducted",label:"Districts Conducted Meetings"},{key:"pomUploaded",label:"PoM Uploaded"},{key:"pomNotUploaded",label:"PoM Not Uploaded"},{key:"pom0to7",label:"PoM Pending 0–7 Days"},{key:"pom8to15",label:"PoM Pending 8–15 Days"},{key:"pomMore15",label:"PoM Pending More Than 15 Days"},{key:"districtsPendingPom",label:"Districts Pending PoM"}
 ],
 all:[
  {key:"totalRecords",label:"Total Records"},{key:"closedCompleted",label:"Closed / Completed"},{key:"pendingOpen",label:"Pending / Open"}
 ]
};
const COLLECTIONS={cpgrams:"cpgrams",rti:"rtiApplications",disha:"dishaMeetings"};
let filterSourceCache={};
let db=null,defs=[],selectedId=null,started=false;const $=id=>document.getElementById(id);const moduleLabel=m=>m==="cpgrams"?"GRIEVANCES":String(m||"").toUpperCase();const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));const label=k=>LABELS[k]||k.replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase());
function setStatus(m,c="muted"){$("status").className=`ms-auto small align-self-center text-${c}`;$("status").textContent=m;}
function sectionOptions(selected=[]){
 const arr=CATALOG[$("module").value]||[];
 return arr.map(k=>`<option value="${k}" ${selected.includes(k)?"selected":""}>${esc(label(k))}</option>`).join("");
}
function readSections(validate=false){
 const cards=[...document.querySelectorAll("#sectionsContainer [data-report-section]")];
 const sections=cards.map(card=>({
  heading:card.querySelector("[data-section-heading]")?.value.trim()||"",
  fields:[...card.querySelector("[data-section-fields]")?.selectedOptions||[]].map(o=>o.value)
 })).filter(s=>s.heading||s.fields.length);
 if(validate){
  sections.forEach((sec,i)=>{
   if(!sec.heading)throw new Error(`Enter a heading for Report Section ${i+1}.`);
   if(!sec.fields.length)throw new Error(`Select at least one field for Report Section ${i+1} (${sec.heading}).`);
  });
 }
 return sections;
}
function moveSection(card,dir){
 const parent=$("sectionsContainer");
 if(dir<0&&card.previousElementSibling)parent.insertBefore(card,card.previousElementSibling);
 if(dir>0&&card.nextElementSibling)parent.insertBefore(card.nextElementSibling,card);
 renumberSections();
}
function renumberSections(){
 [...document.querySelectorAll("#sectionsContainer [data-report-section]")].forEach((card,i)=>{
  const n=card.querySelector("[data-section-number]");if(n)n.textContent=`Section ${i+1}`;
 });
}
function addSection(section={}){
 const card=document.createElement("div");card.className="card section-config-card";card.dataset.reportSection="1";
 card.innerHTML=`<div class="card-body p-3"><div class="d-flex justify-content-between align-items-center mb-2"><div class="section-config-heading" data-section-number>Section</div><div class="btn-group btn-group-sm"><button type="button" class="btn btn-outline-secondary section-order-btn" data-section-up title="Move section up"><i class="bi bi-arrow-up"></i></button><button type="button" class="btn btn-outline-secondary section-order-btn" data-section-down title="Move section down"><i class="bi bi-arrow-down"></i></button><button type="button" class="btn btn-outline-danger" data-section-remove><i class="bi bi-trash"></i> Remove</button></div></div><div class="row g-2"><div class="col-12"><label class="form-label">Section Heading *</label><input type="text" class="form-control" data-section-heading placeholder="Example: Grievance Details" value="${esc(section.heading||"")}"></div><div class="col-12"><label class="form-label">Fields in this Section *</label><select class="form-select section-fields" data-section-fields multiple>${sectionOptions(Array.isArray(section.fields)?section.fields:[])}</select><div class="form-text">Ctrl/Command-click to select multiple fields. The fields are shown in the listed order.</div></div></div></div>`;
 $("sectionsContainer").appendChild(card);
 card.querySelector("[data-section-remove]").onclick=()=>{card.remove();renumberSections();};
 card.querySelector("[data-section-up]").onclick=()=>moveSection(card,-1);
 card.querySelector("[data-section-down]").onclick=()=>moveSection(card,1);
 renumberSections();
}
function renderSections(sections=[]){$("sectionsContainer").innerHTML="";(sections||[]).forEach(addSection);}

function rebuildFields(){
 const module=$("module").value,arr=CATALOG[module]||[];
 const oldSections=readSections(false);
 const oldFields=[...$("fields").selectedOptions].map(o=>o.value);
 const oldSummaries=[...$("summaryCards").selectedOptions].map(o=>o.value);
 const oldFilter=[1,2,3].map(n=>$(n===1?"filterField":`filterField${n}`)?.value||"");
 const oldSort=[1,2,3].map(n=>$(n===1?"sortField":`sortField${n}`)?.value||"");
 $("fields").innerHTML=arr.map(k=>`<option value="${k}" ${oldFields.includes(k)?"selected":""}>${esc(label(k))}</option>`).join("");
 const opts='<option value="">None</option>'+arr.map(k=>`<option value="${k}">${esc(label(k))}</option>`).join("");
 ["filterField","filterField2","filterField3","sortField","sortField2","sortField3"].forEach(id=>{if($(id))$(id).innerHTML=opts;});
 oldFilter.forEach((v,i)=>{const id=i===0?"filterField":`filterField${i+1}`;if(arr.includes(v))$(id).value=v;});
 oldSort.forEach((v,i)=>{const id=i===0?"sortField":`sortField${i+1}`;if(arr.includes(v))$(id).value=v;});
 const summaries=SUMMARY_CATALOG[module]||[];
 $("summaryCards").innerHTML=summaries.map(x=>`<option value="${x.key}" ${oldSummaries.includes(x.key)?"selected":""}>${esc(x.label)}</option>`).join("");
 const validSections=oldSections.map(sec=>({heading:sec.heading,fields:(sec.fields||[]).filter(k=>arr.includes(k))})).filter(sec=>sec.heading||sec.fields.length);
 renderSections(validSections);
}

function filterValueText(v){
 if(v===undefined||v===null)return "";
 if(v&&typeof v.toDate==="function")v=v.toDate();
 if(v&&v.seconds!=null)v=new Date(Number(v.seconds)*1000);
 if(v instanceof Date&&!Number.isNaN(v.getTime()))return v.toLocaleDateString("en-GB");
 if(typeof v==="object")return "";
 return String(v).trim();
}
function firstValue(r,keys){for(const k of keys){const v=r?.[k];if(v!==undefined&&v!==null&&String(v).trim()!=="")return v;}return "";}
function normalizeAll(module,r){
 const name=module==="cpgrams"?"GRIEVANCES":module.toUpperCase();
 const date=module==="cpgrams"?firstValue(r,["dateReceived","questionReceivedDate","date"]):module==="rti"?firstValue(r,["applicationDate","dateReceived","date"]):firstValue(r,["dateOfMeeting","meetingDate","proposedDateOfMeeting","date"]);
 const due=module==="cpgrams"?firstValue(r,["dueDate"]):module==="rti"?firstValue(r,["dueDate"]):firstValue(r,["pomDueDate"]);
 const id=module==="cpgrams"?firstValue(r,["grievanceNumber","questionSerialNo","appealNumber", "id"]):module==="rti"?firstValue(r,["applicationNumber","id"]):firstValue(r,["officeFileNo","slNo","id"]);
 const subject=module==="cpgrams"?firstValue(r,["subject","grievanceDescription","question"]):module==="rti"?firstValue(r,["officeSubject","informationSought"]):firstValue(r,["remarks","statusOfMeeting"]);
 const status=module==="cpgrams"?firstValue(r,["finalStatus","officeStatus","questionFileStatus","appealStatus"]):module==="rti"?firstValue(r,["officeStatus","replyStatus"]):firstValue(r,["statusOfMeeting","officeStatus","pomUploaded"]);
 return {Module:name,ID:id,Date:filterValueText(date),DueDate:filterValueText(due),Subject:subject,District:firstValue(r,["district","nameOfDistrict"]),Status:status,"Days Pending":"","Days Delayed":""};
}
async function loadFilterSource(module){
 if(filterSourceCache[module])return filterSourceCache[module];
 if(module==="all"){
  const all=[];
  for(const m of ["cpgrams","rti","disha"]){const rows=await loadFilterSource(m);rows.forEach(r=>all.push(normalizeAll(m,r)));}
  filterSourceCache.all=all;return all;
 }
 const collection=COLLECTIONS[module];if(!collection)return [];
 try{const snap=await db.collection(collection).get();const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.active!==false);filterSourceCache[module]=rows;return rows;}catch(e){console.warn("Unable to load filter values",e);return [];}
}
async function populateFilterValue(fieldId,valueId,operatorId,selectedValue=""){
 const field=$(fieldId)?.value||"",sel=$(valueId),op=$(operatorId)?.value||"contains";if(!sel)return;
 if(!field){sel.disabled=true;sel.innerHTML='<option value="">Select a filter field first</option>';return;}
 if(op==="isEmpty"||op==="notEmpty"){sel.disabled=true;sel.innerHTML='<option value="">Not required for this operator</option>';return;}
 const rows=await loadFilterSource($("module").value);
 const values=[...new Set(rows.map(r=>filterValueText(r?.[field])).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:"base"}));
 if(selectedValue&&!values.includes(String(selectedValue)))values.unshift(String(selectedValue));
 sel.disabled=false;sel.innerHTML='<option value="">— Select value —</option>'+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");
 if(selectedValue)sel.value=String(selectedValue);
}
async function refreshFilterValues(selected={}){
 await Promise.all([
  populateFilterValue("filterField","filterValue","operator",selected.filterValue||""),
  populateFilterValue("filterField2","filterValue2","operator2",selected.filterValue2||""),
  populateFilterValue("filterField3","filterValue3","operator3",selected.filterValue3||"")
 ]);
}
function filterText(d){
 return [
  [d.filterField,d.operator,d.filterValue],
  [d.filterField2,d.operator2,d.filterValue2],
  [d.filterField3,d.operator3,d.filterValue3]
 ].filter(x=>x[0]).map(x=>`${label(x[0])} ${x[1]||""}${/^(isEmpty|notEmpty)$/.test(x[1]||"")?"":` ${x[2]||""}`}`).join("; ");
}
function clear(){selectedId=null;$("reportDefForm").reset();$("active").checked=true;$("module").value="cpgrams";renderSections([]);rebuildFields();$("definitionId").value="";refreshFilterValues();}
function data(){
 const flatFields=[...$("fields").selectedOptions].map(o=>o.value),sections=readSections(true),summaryCards=[...$("summaryCards").selectedOptions].map(o=>o.value);
 if(!$("reportName").value.trim())throw new Error("Report Name is required.");
 const fields=sections.length?[...new Set(sections.flatMap(s=>s.fields))]:flatFields;
 if(!fields.length)throw new Error("Select at least one report field or configure a report section.");
 return {name:$("reportName").value.trim(),mainHeading:$("mainHeading").value.trim(),module:$("module").value,fields,sections,summaryCards,
  filterField:$("filterField").value,operator:$("operator").value,filterValue:$("filterValue").value,
  filterField2:$("filterField2").value,operator2:$("operator2").value,filterValue2:$("filterValue2").value,
  filterField3:$("filterField3").value,operator3:$("operator3").value,filterValue3:$("filterValue3").value,
  sortField:$("sortField").value,sortDirection:$("sortDirection").value,sortField2:$("sortField2").value,sortDirection2:$("sortDirection2").value,sortField3:$("sortField3").value,sortDirection3:$("sortDirection3").value,datePreset:$("datePreset").value,description:$("description").value.trim(),active:$("active").checked,modifiedOn:firebase.firestore.FieldValue.serverTimestamp()};
}
async function load(){setStatus("Loading report definitions...");if(window.FMSCrud&&typeof window.FMSCrud.list==="function"){const result=await window.FMSCrud.list("reportDefinitions",{activeOnly:true});if(!result.success)throw new Error(result.message||"Unable to load report definitions.");defs=(result.data||[]).sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));}else{db=window.FMSCrud?await window.FMSCrud.waitForDb():db;const snap=await db.collection("reportDefinitions").get();defs=snap.docs.map(d=>({id:d.id,...d.data()})).filter(d=>d.active!==false).sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));}render();setStatus(`${defs.length} report definitions loaded`,"success");}
function filtered(){const q=$("search").value.trim().toLowerCase();return !q?defs:defs.filter(d=>JSON.stringify(d).toLowerCase().includes(q));}
function render(){const arr=filtered();$("recordCount").textContent=`${arr.length} records`;$("definitionsTable").querySelector("tbody").innerHTML=arr.length?arr.map((d,i)=>`<tr><td>${i+1}</td><td>${esc(d.name)}</td><td>${esc(moduleLabel(d.module))}</td><td>${esc((d.sections||[]).length?(d.sections||[]).map(sec=>`${sec.heading}: ${(sec.fields||[]).map(label).join(", ")}`).join(" | "):(d.fields||[]).map(label).join(", "))}</td><td>${esc(filterText(d))}</td><td>${d.active===false?'<span class="badge bg-secondary">Inactive</span>':'<span class="badge bg-success">Active</span>'}</td><td class="text-nowrap"><button class="btn btn-sm btn-primary" data-edit="${d.id}">Edit</button> <button class="btn btn-sm btn-outline-danger" data-del="${d.id}">Delete</button></td></tr>`).join(""):'<tr><td colspan="7" class="text-center text-muted p-4">No custom report definitions.</td></tr>';document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>edit(b.dataset.edit));document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>remove(b.dataset.del));}
async function edit(id){const d=defs.find(x=>x.id===id);if(!d)return;selectedId=id;$("definitionId").value=id;$("reportName").value=d.name||"";$("mainHeading").value=d.mainHeading||"";$("module").value=d.module||"cpgrams";renderSections([]);rebuildFields();[...$("fields").options].forEach(o=>o.selected=(d.fields||[]).includes(o.value));[...$("summaryCards").options].forEach(o=>o.selected=(d.summaryCards||[]).includes(o.value));renderSections(Array.isArray(d.sections)?d.sections:[]);$("filterField").value=d.filterField||"";$("operator").value=d.operator||"contains";$("filterField2").value=d.filterField2||"";$("operator2").value=d.operator2||"contains";$("filterField3").value=d.filterField3||"";$("operator3").value=d.operator3||"contains";$("sortField").value=d.sortField||"";$("sortDirection").value=d.sortDirection||"asc";$("sortField2").value=d.sortField2||"";$("sortDirection2").value=d.sortDirection2||"asc";$("sortField3").value=d.sortField3||"";$("sortDirection3").value=d.sortDirection3||"asc";$("datePreset").value=d.datePreset||"none";$("description").value=d.description||"";$("active").checked=d.active!==false;await refreshFilterValues(d);window.scrollTo({top:0,behavior:"smooth"});}
async function save(){try{db=window.FMSCrud?await window.FMSCrud.waitForDb():db;const d=data();const result=window.FMSCrud?await window.FMSCrud.create("reportDefinitions",d):await db.collection("reportDefinitions").add({...d,active:true,createdOn:firebase.firestore.FieldValue.serverTimestamp()}).then(ref=>({success:true,id:ref.id})).catch(e=>({success:false,message:e.message||String(e)}));if(!result.success)throw new Error(result.message||"Unable to save report definition.");clear();await load();setStatus("Custom report saved.","success");}catch(e){setStatus(e.message||String(e),"danger");alert(e.message||e);}}
async function update(){if(!selectedId)return alert("Select a report definition to update.");try{db=window.FMSCrud?await window.FMSCrud.waitForDb():db;const result=window.FMSCrud?await window.FMSCrud.update("reportDefinitions",selectedId,data()):await db.collection("reportDefinitions").doc(selectedId).update(data()).then(()=>({success:true})).catch(e=>({success:false,message:e.message||String(e)}));if(!result.success)throw new Error(result.message||"Unable to update report definition.");clear();await load();setStatus("Custom report updated.","success");}catch(e){setStatus(e.message||String(e),"danger");alert(e.message||e);}}
async function remove(id=selectedId){if(!id)return alert("Select a report definition to delete.");if(!confirm("Delete this custom report definition?"))return;try{db=window.FMSCrud?await window.FMSCrud.waitForDb():db;const result=window.FMSCrud?await window.FMSCrud.softDelete("reportDefinitions",id):await db.collection("reportDefinitions").doc(id).update({active:false,deletedOn:firebase.firestore.FieldValue.serverTimestamp()}).then(()=>({success:true})).catch(e=>({success:false,message:e.message||String(e)}));if(!result.success)throw new Error(result.message||"Unable to delete report definition.");clear();await load();setStatus("Custom report deleted.","success");}catch(e){setStatus(e.message||String(e),"danger");alert(e.message||e);}}
async function seedDefaults(){if(defs.length)return;const seeds=[
 {name:"GRIEVANCES Status Register",module:"cpgrams",fields:["grievanceType","grievanceNumber","dateReceived","dueDate","complainantName","district","subject","category","currentStatus"],summaryCards:["totalSince2014","totalPeriod","withinDue","dueToday","overdue","atrAwaited","atrReceived","pendingApproval","disposedClosed"],sortField:"dateReceived",sortDirection:"desc",datePreset:"currentFY"},
 {name:"RTI Pendency Register",module:"rti",fields:["applicationNumber","applicationDate","dueDate","applicantName","district","informationSought","presentStatus"],summaryCards:["total","withinDue","dueToday","overdue","replyAwaited","replyReceived","replySent","disposedClosed"],sortField:"applicationDate",sortDirection:"desc",datePreset:"currentFY"},
 {name:"DISHA Meeting Status Register",module:"disha",fields:["slNo","district","dateOfMeeting","pomUploaded","pomPendingDays","remarks"],summaryCards:["totalMeetings","districtsConducted","pomUploaded","pomNotUploaded","districtsPendingPom"],sortField:"dateOfMeeting",sortDirection:"desc",datePreset:"currentFY"}
 ];for(const item of seeds){try{await db.collection("reportDefinitions").add({...item,operator:"contains",filterField:"",filterValue:"",filterField2:"",operator2:"contains",filterValue2:"",filterField3:"",operator3:"contains",filterValue3:"",sortField:item.sortField||"",sortDirection:item.sortDirection||"desc",description:"Built-in editable custom report",active:true,createdOn:firebase.firestore.FieldValue.serverTimestamp()});}catch(e){console.warn("Unable to seed report definition",e);}}await load();}
async function exportDefs(type){try{const rows=filtered().map((d,i)=>({sl:i+1,name:d.name,module:String(d.module||"").toUpperCase(),fields:(d.fields||[]).map(label).join(", "),filter:filterText(d),sort:d.sortField?`${label(d.sortField)} ${d.sortDirection||""}`:"",active:d.active===false?"Inactive":"Active"}));const cols=[{key:"sl",label:"Sl.No"},{key:"name",label:"Report Name"},{key:"module",label:"Module"},{key:"fields",label:"Columns"},{key:"filter",label:"Filter"},{key:"sort",label:"Sort"},{key:"active",label:"Status"}],title="FMS Reports Master Register";if(type==="excel")await FMSExportService.toExcel({rows,columns:cols,title});if(type==="pdf")await FMSExportService.toPDF({rows,columns:cols,title});if(type==="jpeg")await FMSExportService.toJPEG({rows,columns:cols,title});if(type==="print")await FMSExportService.printRows({rows,columns:cols,title});}catch(e){alert(e.message||e);}}
async function start(){if(started)return;try{db=window.FMSCrud?await window.FMSCrud.waitForDb():window.db||window.fmsFirebase?.db;}catch(_e){return;}if(!db)return;started=true;
 $("module").onchange=async()=>{filterSourceCache={};rebuildFields();await refreshFilterValues();};
 $("btnAddSection").onclick=()=>addSection({heading:"",fields:[]});
 [["filterField","filterValue","operator"],["filterField2","filterValue2","operator2"],["filterField3","filterValue3","operator3"]].forEach(([f,v,o])=>{$(f).onchange=()=>populateFilterValue(f,v,o);$(o).onchange=()=>populateFilterValue(f,v,o);});
 rebuildFields();await refreshFilterValues();$("reportDefForm").onsubmit=e=>{e.preventDefault();save();};$("btnUpdate").onclick=update;$("btnDelete").onclick=()=>remove();$("btnClear").onclick=clear;$("search").oninput=render;$("btnHome").onclick=()=>location.href="../../index.html";$("btnMasters").onclick=()=>location.href="master-management.html";$("btnReports").onclick=()=>location.href="../reports.html";await load();await seedDefaults();}
document.addEventListener("DOMContentLoaded",()=>{if(window.fmsFirebaseReady&&window.db)start();else{window.addEventListener("fmsFirebaseReady",start,{once:true});setTimeout(()=>{if(window.db)start();},1500);}});
window.FMSReportFieldCatalog=CATALOG;window.FMSReportLabels=LABELS;window.FMSReportSummaryCatalog=SUMMARY_CATALOG;
})(window,document);
