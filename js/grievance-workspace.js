"use strict";
/* ============================================================
   FMS GRIEVANCES WORKSPACE - v1.2.7
   Order: Grievance Type -> FY -> Dashboard -> Register -> Data Entry
   Dashboard and register use the exact same active/type/FY record set.
============================================================ */
(function(window,document){
  const COLLECTION="cpgrams";
  const TYPE_SELECT="grievanceType";
  const FY_SELECT="grievanceFinancialYear";
  const TYPES=["CPGRAMS","Prajavani","Public Grievances","Direct Complaints","LAQ","LCQ","Court Cases","VIP References","CMO References","PMO References","Audit Paras","Vigilance Cases"];
  let allRows=[];

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const pretty=v=>String(v||"").trim();
  const TYPE_MAP=new Map([
    ["grievances","cpgrams"],["grievance","cpgrams"],["cpgrams","cpgrams"],["cpgram","cpgrams"],["cpgrams portal","cpgrams"],
    ["prajavani","prajavani"],["public grievances","public grievances"],["public grievance","public grievances"],
    ["direct complaints","direct complaints"],["direct complaint","direct complaints"],
    ["laq","laq"],["lcq","lcq"],["court cases","court cases"],["court case","court cases"],
    ["vip references","vip references"],["vip reference","vip references"],["cmo references","cmo references"],["cmo reference","cmo references"],
    ["pmo references","pmo references"],["pmo reference","pmo references"],["audit paras","audit paras"],["audit para","audit paras"],
    ["vigilance cases","vigilance cases"],["vigilance case","vigilance cases"]
  ]);
  function normType(v){
    const s=String(v||"").trim().toLowerCase().replace(/[_-]+/g," ").replace(/\s+/g," ")
      .replace(/\bcomplaint\b/g,"complaints").replace(/\breference\b/g,"references").replace(/\bpara\b/g,"paras");
    return TYPE_MAP.get(s)||"";
  }
  function rowType(r){
    if(String(r?.questionType||"").toUpperCase()==="LAQ") return "laq";
    if(String(r?.questionType||"").toUpperCase()==="LCQ") return "lcq";
    const candidates=[r?.grievanceType,r?.referenceType,r?.type,r?.sourceType,r?.grievanceSource,r?.source];
    for(const v of candidates){const n=normType(v);if(n)return n;}
    return "cpgrams"; // old CPGRAMS records without a specific Grievance Type
  }
  function currentType(){return pretty($(TYPE_SELECT)?.value);}
  function currentFY(){return $(FY_SELECT)?.value || window.FMSRecordPolicy?.currentFY?.() || window.FMSFY?.getCurrentFY?.() || "";}
  function activeRows(){return allRows.filter(r=>window.FMSRecordPolicy?window.FMSRecordPolicy.active(r):r?.active!==false);}
  function rowsForContext(){
    const type=currentType();if(!type)return [];
    const nt=normType(type), fy=currentFY();
    let rows=activeRows().filter(r=>rowType(r)===nt);
    if(window.FMSRecordPolicy) rows=window.FMSRecordPolicy.filterFY("cpgrams",rows,fy);
    else if(window.FMSFY) rows=window.FMSFY.filterFY(rows,fy,["dateReceived","dateArised","receivedDate","questionReceivedDate","date"]);
    return rows;
  }
  function populateFY(){
    const el=$(FY_SELECT);if(!el)return;
    const keep=el.value; const current=window.FMSRecordPolicy?.currentFY?.() || window.FMSFY?.getCurrentFY?.();
    let startYear=new Date().getFullYear()-(new Date().getMonth()<3?1:0);
    const opts=[];for(let y=startYear;y>=2014;y--)opts.push(`${y}-${String(y+1).slice(-2)}`);
    el.innerHTML=opts.map(f=>`<option value="${f}">${f}</option>`).join("");
    el.value=(keep&&opts.includes(keep))?keep:(current&&opts.includes(current)?current:opts[0]);
  }
  function isClosed(r){return window.FMSRecordPolicy?window.FMSRecordPolicy.closed("cpgrams",r):/closed|disposed|completed/i.test(String(r.finalStatus||r.currentStatus||r.officeStatus||""));}
  function isCirculation(r){return window.FMSRecordPolicy?window.FMSRecordPolicy.circulation("cpgrams",r):/circulation/i.test(String(r.officeStatus||r.currentStatus||""));}
  function isOverdue(r){return window.FMSRecordPolicy?window.FMSRecordPolicy.overdue("cpgrams",r):false;}
  function isDueToday(r){return window.FMSRecordPolicy?window.FMSRecordPolicy.dueToday("cpgrams",r):false;}
  function fullRegisterUrl(filter="total"){
    const p=new URLSearchParams();p.set("filter",filter);p.set("grievanceType",currentType());p.set("fy",currentFY());
    return `cpgrams-register.html?${p}`;
  }
  function renderDashboard(rows){
    const host=$("moduleDashboardCards"), status=$("moduleDashboardStatus");if(!host)return;
    let pending=0,circ=0,done=0,over=0,today=0;
    rows.forEach(r=>{if(isClosed(r))done++;else pending++;if(isCirculation(r))circ++;if(isOverdue(r))over++;if(isDueToday(r))today++;});
    const cards=[
      ["Total",rows.length,"total","bi-collection","primary"],
      ["Pending",pending,"pending","bi-hourglass-split","warning"],
      ["Under Circulation",circ,"circulation","bi-arrow-repeat","info"],
      ["Disposed / Closed",done,"closed","bi-check-circle","success"],
      ["Overdue",over,"overdue","bi-exclamation-triangle","danger"],
      ["Due Today",today,"due-today","bi-calendar-event","secondary"]
    ];
    host.innerHTML=cards.map(([label,value,filter,icon,theme])=>`<div class="col-12 col-sm-6 col-lg-4 col-xl-2"><a class="text-decoration-none text-reset" href="${fullRegisterUrl(filter)}"><div class="card h-100 shadow-sm border-0"><div class="card-body text-center"><div class="fs-2 text-${theme}"><i class="bi ${icon}"></i></div><div class="text-muted small mt-2">${esc(label)}</div><div class="display-6 fw-bold text-${theme}">${value}</div><div class="small text-primary mt-2">View filtered data <i class="bi bi-arrows-fullscreen"></i></div></div></div></a></div>`).join("");
    if(status){status.className="alert alert-success py-2 mb-3";status.textContent=`${currentType()} Dashboard • Financial Year ${currentFY()} • ${rows.length} record(s)`;}
  }

  const common2=[
    ["complainantName","Complainant Name"],["mobileNumber","Mobile Number"],["gender","Gender"],["district","District"],["mandal","Mandal"],["village","Village"],["address","Address"],["preferredContact","Preferred Contact"]
  ];
  const common3=[
    ["fileNumber","File Number"],["dateArised","Date Arised"],["officeCommunicationType","Type of communication"],["officeLetterAddressedTo","Letter addressed to"],["officeReplySection","Reply obtained from"],["officeStatus","Status of file"],["assignedOfficer","Assigned Officer"],["section","Concerned Section"],["fileLocation","File Location"],["currentStatus","Current File Status"],["finalStatus","Final Status"],["atrReceived","ATR Received"],["atrDate","ATR Date"],["atrDueDate","ATR Due Date"],["disposalDate","Disposal Date"],["fileClosed","File Closed"],["remarks","Remarks"]
  ];
  const docs=[["grievanceDocument","Grievance Document"],["attachments","Upload Document"]];
  const basic1=[["dateReceived","Date Received"],["dueDate","Due Date"],["subject","Subject"],["grievanceDescription","Grievance Description"],["grievanceDocument","Upload Grievance Document"]];
  const cp1=[["grievanceNumber","Grievance Number"],["dateReceived","Date Received"],["dueDate","Due Date"],["subject","Subject"],["category","Category"],["grievanceDescription","Grievance Description"],["grievanceDocument","Upload Grievance Document"],["natureOfGrievance","Nature of Grievance"],["priorityClassification","Priority Classification"],["attachmentCount","Number of Attachments"]];
  const questionCols=[["questionSerialNo","Question No."],["questionType","Question Type"],["questionReceivedDate","Received Date"],["questionConcernedSection","Concerned Section"],["question","Question"],["answer","Answer"],["answerFurnishedBy","Answer furnished by"],["answerFurnishedTo","Answer furnished to"],["answerFurnishedDate","Answer furnished Date"],["questionCommunicationType","Communication Type"],["questionFileNumber","File No."],["questionCommunicationDate","Communication Date"],["questionFileStatus","File Status"],["attachments","Upload Document"]];
  function columns(){
    const nt=normType(currentType());
    if(nt==="laq"||nt==="lcq") return questionCols.map(c=>c[0]==="questionSerialNo"?[c[0],`${currentType().toUpperCase()} No.`]:c);
    return (nt==="cpgrams"?cp1:basic1).concat(common2,common3,[["attachments","Upload Document"]]);
  }
  function displayValue(r,key){
    let v=r?.[key];
    if(key==="grievanceDocument") v=r?.grievanceDocumentName||r?.fileDocumentName||r?.fileDocument||r?.grievanceDocument||"";
    if(key==="attachments"){
      const a=r?.attachments;
      if(Array.isArray(a)) return a.map(x=>x?.name||x?.fileName||x?.filename||"Document").join(", ");
      return r?.fileAttachmentName||r?.attachmentName||r?.attachmentCount||"";
    }
    if((key==="district"||key==="mandal"||key==="village")&&!v) v=r?.[key+"Manual"]||"";
    return v??"";
  }
  function renderRegister(rows){
    const head=$("grievanceInlineRegisterHead"), body=$("grievanceInlineRegisterBody"), title=$("grievanceInlineRegisterTitle"), count=$("grievanceInlineRecordCount");
    if(!head||!body)return;const cols=columns();
    title.textContent=`${currentType()} Register`;
    count.textContent=`Total Records : ${rows.length}`;
    head.innerHTML=`<tr>${cols.map(c=>`<th class="text-nowrap">${esc(c[1])}</th>`).join("")}<th>Action</th></tr>`;
    if(!rows.length){body.innerHTML=`<tr><td colspan="${cols.length+1}" class="text-center text-muted py-4">No ${esc(currentType())} records available for Financial Year ${esc(currentFY())}.</td></tr>`;return;}
    body.innerHTML=rows.map(r=>`<tr>${cols.map(c=>`<td>${esc(displayValue(r,c[0]))}</td>`).join("")}<td class="text-nowrap"><button type="button" class="btn btn-sm btn-info me-1" data-view="${esc(r.id)}">View</button><button type="button" class="btn btn-sm btn-warning me-1" data-edit="${esc(r.id)}">Edit</button><button type="button" class="btn btn-sm btn-danger" data-delete="${esc(r.id)}">Delete</button></td></tr>`).join("");
    body.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>openRecord(b.dataset.view,"view")));
    body.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openRecord(b.dataset.edit,"edit")));
    body.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteRecord(b.dataset.delete)));
  }
  function openRecord(id,mode){
    const r=allRows.find(x=>x.id===id);if(!r)return;sessionStorage.setItem("selectedGrievance",JSON.stringify(r));location.href=`cpgrams.html?mode=${encodeURIComponent(mode)}`;
  }
  async function deleteRecord(id){
    if(!confirm("Delete this record?"))return;
    try{const db=getDb();await db.collection(COLLECTION).doc(id).update({active:false,deletedOn:firebase.firestore.FieldValue.serverTimestamp(),updatedOn:firebase.firestore.FieldValue.serverTimestamp()});await refresh();}
    catch(e){alert("Unable to delete record: "+(e.message||e));}
  }
  function getDb(){if(window.db)return window.db;if(window.fmsFirebase?.db)return window.fmsFirebase.db;try{if(typeof firebase!=="undefined"&&firebase.firestore)return firebase.firestore();}catch(_e){}return null;}
  function showContext(hasType){
    ["grievanceFYPanel","moduleDashboardPanel","grievanceInlineRegisterPanel","cpgramsForm"].forEach(id=>$(id)?.classList.toggle("d-none",!hasType));
    const dataTitle=[...document.querySelectorAll("h4")].find(h=>h.textContent.includes("GRIEVANCES DATA ENTRY FORM"));if(dataTitle)dataTitle.classList.toggle("d-none",!hasType);
  }
  function syncContext(){
    const type=currentType();showContext(!!type);if(!type)return;
    populateFY();const rows=rowsForContext();renderDashboard(rows);renderRegister(rows);
    const s=$("grievanceContextStatus");if(s){s.className="alert alert-success mb-0 py-3";s.textContent=`${type} • Financial Year ${currentFY()} • Dashboard and Register use the same ${rows.length} active record(s).`;}
  }
  async function refresh(){
    const db=getDb();if(!db)return false;
    try{const snap=await db.collection(COLLECTION).get();allRows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.active!==false);syncContext();return true;}
    catch(e){console.error("Grievances workspace load error",e);const s=$("grievanceContextStatus");if(s){s.className="alert alert-danger mb-0";s.textContent="Unable to load Grievances: "+(e.message||e);}return false;}
  }
  function start(){
    const type=$(TYPE_SELECT),fy=$(FY_SELECT);if(!type)return;
    const requestedType=new URLSearchParams(location.search).get("grievanceType");
    if(requestedType && !type.value){
      const mapped=normType(requestedType)==="cpgrams" ? "CPGRAMS" : TYPES.find(t=>normType(t)===normType(requestedType));
      if(mapped) type.value=mapped;
    }
    populateFY();type.addEventListener("change",syncContext);fy?.addEventListener("change",syncContext);
    if(type.value && typeof window.updateGrievanceFormLayout==="function") window.updateGrievanceFormLayout();
    $("btnOpenFullGrievanceRegister")?.addEventListener("click",()=>{location.href=fullRegisterUrl("total");});
    showContext(!!currentType());
    if(getDb())refresh();else{window.addEventListener("fmsFirebaseReady",refresh,{once:true});setTimeout(()=>{if(getDb())refresh();},1500);}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
  window.FMSGrievanceWorkspace={refresh,syncContext,rowsForContext,normType,rowType};
})(window,document);
