"use strict";
/* ============================================================
   FMS GRIEVANCES WORKSPACE - v1.3.5
   Grievance Type -> FY -> Workflow Dashboard -> Register -> Data Entry
============================================================ */
(function(window,document){
  const COLLECTION="cpgrams";
  const TYPE_SELECT="grievanceType";
  const FY_SELECT="grievanceFinancialYear";
  const TYPES=["CPGRAMS","Prajavani","Public Grievances","Direct Complaints","LAQ","LCQ","Court Cases","VIP References","CMO References","PMO References","Audit Paras","Vigilance Cases"];
  let allRows=[];
  const $=id=>document.getElementById(id);
  const P=()=>window.FMSRecordPolicy;
  const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c]));
  const pretty=v=>String(v||"").trim();
  function normType(v){return P()?.normalizeType?.(v)||"";}
  function rowType(r){return P()?.rowType?.(r)||"cpgrams";}
  function currentType(){return pretty($(TYPE_SELECT)?.value);}  
  function currentTypeKey(){return normType(currentType())||"cpgrams";}
  function currentFY(){return $(FY_SELECT)?.value || P()?.currentFY?.() || window.FMSFY?.getCurrentFY?.() || "";}
  function activeRows(){return allRows.filter(r=>P()?P().active(r):r?.active!==false);}
  function rowsForContext(){
    const type=currentType();if(!type)return [];
    const key=currentTypeKey(),fy=currentFY();
    let rows=activeRows().filter(r=>rowType(r)===key);
    if(P()) rows=P().filterFY("cpgrams",rows,fy);
    else if(window.FMSFY) rows=FMSFY.filterFY(rows,fy,["dateReceived","dateArised","receivedDate","questionReceivedDate","date"]);
    return rows;
  }
  function populateFY(){
    const el=$(FY_SELECT);if(!el)return;
    const keep=el.value;const current=P()?.currentFY?.()||window.FMSFY?.getCurrentFY?.();
    let startYear=new Date().getFullYear()-(new Date().getMonth()<3?1:0);
    const opts=[];for(let y=startYear;y>=2014;y--)opts.push(`${y}-${String(y+1).slice(-2)}`);
    el.innerHTML=opts.map(f=>`<option value="${f}">${f}</option>`).join("");
    el.value=(keep&&opts.includes(keep))?keep:(current&&opts.includes(current)?current:opts[0]);
  }
  function w(r){return P()?.workflow?.("cpgrams",r)||{};}
  function isClosed(r){return P()?.closed?.("cpgrams",r)||false;}
  function isOverdue(r){return P()?.overdue?.("cpgrams",r)||false;}
  function isDueToday(r){return P()?.dueToday?.("cpgrams",r)||false;}
  function withinDue(r){return P()?.withinDue?.("cpgrams",r)||(!isClosed(r)&&!isOverdue(r)&&!isDueToday(r));}
  function fullRegisterUrl(filter="total"){
    const p=new URLSearchParams();p.set("filter",filter);p.set("fullscreen","1");p.set("grievanceType",currentType());p.set("fy",currentFY());
    return `cpgrams-register.html?${p}`;
  }
  function card(label,value,filter,icon,theme){
    return `<div class="col-12 col-sm-6 col-lg-4 col-xl-2"><a class="text-decoration-none text-reset" href="${fullRegisterUrl(filter)}"><div class="card h-100 shadow-sm border-0"><div class="card-body text-center"><div class="fs-2 text-${theme}"><i class="bi ${icon}"></i></div><div class="text-muted small mt-2">${esc(label)}</div><div class="display-6 fw-bold text-${theme}">${esc(value)}</div><div class="small text-primary mt-2">View filtered data <i class="bi bi-arrows-fullscreen"></i></div></div></div></a></div>`;
  }
  function renderDashboard(rows){
    const host=$("moduleDashboardCards"), status=$("moduleDashboardStatus");if(!host)return;
    const key=currentTypeKey();let cards=[];
    if(key==="cpgrams"){
      cards=[
        ["Total CPGRAMS",rows.length,"total","bi-collection","primary"],
        ["Within Due Date",rows.filter(withinDue).length,"within-due","bi-calendar-check","success"],
        ["Due Today",rows.filter(isDueToday).length,"due-today","bi-calendar-event","warning"],
        ["Overdue",rows.filter(isOverdue).length,"overdue","bi-exclamation-triangle","danger"],
        ["Memo / Letter Issued",rows.filter(r=>w(r).memoIssued).length,"memo-issued","bi-envelope-paper","info"],
        ["ATR Awaited",rows.filter(r=>w(r).memoIssued&&!w(r).atrReceived&&!isClosed(r)).length,"atr-awaited","bi-hourglass-split","warning"],
        ["ATR Received",rows.filter(r=>w(r).atrReceived).length,"atr-received","bi-inbox","success"],
        ["Pending JC / EGS Approval",rows.filter(r=>/Pending JC|EGS/i.test(w(r).stage||"")).length,"approval-pending","bi-person-check","warning"],
        ["Portal Upload Pending",rows.filter(r=>/Portal Upload Pending/i.test(w(r).stage||"")).length,"portal-pending","bi-cloud-arrow-up","danger"],
        ["Disposed / Closed",rows.filter(isClosed).length,"closed","bi-check-circle","success"]
      ];
    }else if(key==="prajavani"){
      cards=[
        ["Total Prajavani",rows.length,"total","bi-collection","primary"],
        ["Received from JC Admin",rows.filter(r=>/Received from JC/i.test(w(r).stage||"")).length,"received","bi-inbox","primary"],
        ["Sent to Section",rows.filter(r=>/Sent to concerned section/i.test(w(r).stage||"")).length,"sent-section","bi-send","info"],
        ["Reply Awaited",rows.filter(r=>/Reply Awaited|Sent to concerned/i.test(w(r).stage||"")).length,"reply-awaited","bi-hourglass-split","warning"],
        ["Reply Received",rows.filter(r=>/Reply received/i.test(w(r).stage||"")).length,"reply-received","bi-inbox","success"],
        ["Reply Sent to JC Admin",rows.filter(r=>/Reply sent to JC/i.test(w(r).stage||"")).length,"reply-sent","bi-send-check","success"],
        ["Closed",rows.filter(isClosed).length,"closed","bi-check-circle","success"],
        ["Overdue",rows.filter(isOverdue).length,"overdue","bi-exclamation-triangle","danger"]
      ];
    }else if(key==="laq"||key==="lcq"){
      cards=[
        [`Total ${currentType().toUpperCase()}`,rows.length,"total","bi-collection","primary"],
        ["With Section",rows.filter(r=>/With concerned section/i.test(w(r).stage||"")).length,"with-section","bi-building","info"],
        ["Answer Furnished",rows.filter(r=>/Answer furnished/i.test(w(r).stage||"")).length,"answer-furnished","bi-chat-square-text","success"],
        ["Closed",rows.filter(isClosed).length,"closed","bi-check-circle","success"]
      ];
    }else{
      cards=[
        [`Total ${currentType()}`,rows.length,"total","bi-collection","primary"],
        ["Within Due Date",rows.filter(withinDue).length,"within-due","bi-calendar-check","success"],
        ["Due Today",rows.filter(isDueToday).length,"due-today","bi-calendar-event","warning"],
        ["Overdue",rows.filter(isOverdue).length,"overdue","bi-exclamation-triangle","danger"],
        ["Memo / Letter Issued",rows.filter(r=>w(r).memoIssued).length,"memo-issued","bi-envelope-paper","info"],
        ["Reply Awaited",rows.filter(r=>w(r).memoIssued&&!w(r).atrReceived&&!isClosed(r)).length,"reply-awaited","bi-hourglass-split","warning"],
        ["Reply Received",rows.filter(r=>w(r).atrReceived).length,"reply-received","bi-inbox","success"],
        ["Pending Approval",rows.filter(r=>/Pending Approval|Reply to Government Pending/i.test(w(r).stage||"")).length,"approval-pending","bi-person-check","warning"],
        ["Reply to Government Pending",rows.filter(r=>/Reply to Government Pending/i.test(w(r).stage||"")).length,"govt-pending","bi-send-exclamation","danger"],
        ["Closed",rows.filter(isClosed).length,"closed","bi-check-circle","success"]
      ];
    }
    host.innerHTML=cards.map(x=>card(...x)).join("");
    if(status){status.className="alert alert-success py-2 mb-3";status.textContent=`${currentType()} Dashboard • Financial Year ${currentFY()} • ${rows.length} active record(s)`;}
  }
  function fv(r,key){return P()?.first?.(r,[key])||r?.[key]||"";}
  function displayValue(r,key){
    const wf=w(r);
    switch(key){
      case "serial":return "";
      case "registrationNo":return fv(r,"grievanceNumber")||fv(r,"registrationNumber")||fv(r,"grievanceNo")||"";
      case "dateReceived":return P()?.formatDMY?.(fv(r,"dateReceived")||fv(r,"orgReceivedDate")||fv(r,"receivedDate")||fv(r,"questionReceivedDate"))||"";
      case "dueDate":return P()?.formatDMY?.(fv(r,"dueDate"))||"";
      case "daysStatus":return wf.dueLabel||"";
      case "memoStatus":return wf.memoIssued?"Issued":"Not issued";
      case "atrStatusView":return wf.atrReceived?"Received":"Awaited";
      case "approvalStatusView":return wf.approvalDone?"Approved / Put up":"Pending";
      case "portalUploadStatus":return wf.portalUploaded?"Uploaded":"Pending";
      case "workflowStage":return wf.stage||"";
      case "finalStatusView":return wf.finalStatus||fv(r,"finalStatus")||"Pending";
      case "replyGovtStatus":return wf.replySentToGovernment?"Sent":"Pending";
      case "replyComplainantStatus":return wf.replySentToComplainant?"Sent":"Pending";
      case "questionNo":return fv(r,"questionSerialNo")||"";
      case "questionReceivedDate":return P()?.formatDMY?.(fv(r,"questionReceivedDate"))||"";
      case "questionFileStatus":return fv(r,"questionFileStatus")||fv(r,"officeStatus")||"";
      case "attachments":{
        const a=r?.attachments;if(Array.isArray(a))return a.map(x=>x?.name||x?.fileName||x?.filename||"Document").join(", ");return fv(r,"attachmentCount")||"";
      }
      default:{
        let v=fv(r,key);
        if((key||"").toLowerCase().includes("date"))v=P()?.formatDMY?.(v)||v;
        return v;
      }
    }
  }
  function columns(){
    const key=currentTypeKey();
    if(key==="laq"||key==="lcq")return [["questionNo",`${currentType().toUpperCase()} No.`],["questionType","Question Type"],["questionReceivedDate","Received Date"],["questionConcernedSection","Concerned Section"],["question","Question"],["answer","Answer"],["answerFurnishedBy","Answer furnished by"],["answerFurnishedTo","Answer furnished to"],["answerFurnishedDate","Date"],["questionCommunicationType","Communication Type"],["questionFileNumber","File No."],["questionCommunicationDate","Communication Date"],["questionFileStatus","File Status"],["attachments","Upload Document"]];
    if(key==="cpgrams")return [["registrationNo","Registration No."],["dateReceived","Date Received"],["dueDate","Due Date"],["daysStatus","Days Left / Overdue Days"],["complainantName","Complainant Name"],["district","District"],["subject","Subject"],["memoStatus","Memo / Letter Status"],["atrStatusView","ATR Status"],["approvalStatusView","JC / EGS Approval Status"],["portalUploadStatus","Portal Upload Status"],["workflowStage","Present Workflow Stage"],["finalStatusView","Final Status"]];
    if(key==="prajavani")return [["registrationNo","Prajavani No."],["dateReceived","Received Date"],["receivedFrom","Received From"],["section","Concerned Section"],["sentToSectionDate","Sent to Section Date"],["subject","Subject"],["atrStatusView","Reply Status"],["atrDate","Reply Received Date"],["replyGovtStatus","Reply Sent to JC Admin"],["workflowStage","Present Workflow Stage"],["finalStatusView","Final Status"]];
    return [["registrationNo","Reference / Memo No."],["dateReceived","Date Received"],["dueDate","Due Date"],["daysStatus","Days Left / Overdue Days"],["receivedFrom","From Whom Received"],["section","Concerned Section"],["subject","Subject"],["memoStatus","Communication Status"],["atrStatusView","Reply / ATR Status"],["approvalStatusView","Approval Status"],["replyGovtStatus","Reply to Government Status"],["workflowStage","Present Workflow Stage"],["finalStatusView","Final Status"]];
  }
  function renderRegister(rows){
    const head=$("grievanceInlineRegisterHead"), body=$("grievanceInlineRegisterBody"), title=$("grievanceInlineRegisterTitle"), count=$("grievanceInlineRecordCount");if(!head||!body)return;
    const cols=columns();title.textContent=`${currentType()} Register`;count.textContent=`Total Records : ${rows.length}`;
    head.innerHTML=`<tr><th>Sl.No.</th>${cols.map(c=>`<th class="text-nowrap">${esc(c[1])}</th>`).join("")}<th>Action</th></tr>`;
    if(!rows.length){body.innerHTML=`<tr><td colspan="${cols.length+2}" class="text-center text-muted py-4">No ${esc(currentType())} records available for Financial Year ${esc(currentFY())}.</td></tr>`;return;}
    body.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td>${cols.map(c=>`<td>${esc(displayValue(r,c[0]))}</td>`).join("")}<td class="text-nowrap"><button type="button" class="btn btn-sm btn-info me-1" data-view="${esc(r.id)}">View</button><button type="button" class="btn btn-sm btn-warning me-1" data-edit="${esc(r.id)}">Edit</button><button type="button" class="btn btn-sm btn-danger" data-delete="${esc(r.id)}">Delete</button></td></tr>`).join("");
    body.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>openRecord(b.dataset.view,"view")));
    body.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openRecord(b.dataset.edit,"edit")));
    body.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteRecord(b.dataset.delete)));
  }
  function openRecord(id,mode){const r=allRows.find(x=>x.id===id);if(!r)return;sessionStorage.setItem("selectedGrievance",JSON.stringify(r));location.href=`cpgrams.html?mode=${encodeURIComponent(mode)}&fullscreenForm=1&id=${encodeURIComponent(id)}&grievanceType=${encodeURIComponent(currentType())}`;}
  async function deleteRecord(id){if(!confirm("Delete this record?"))return;try{const db=getDb();await db.collection(COLLECTION).doc(id).update({active:false,deletedOn:firebase.firestore.FieldValue.serverTimestamp(),updatedOn:firebase.firestore.FieldValue.serverTimestamp()});await refresh();}catch(e){alert("Unable to delete record: "+(e.message||e));}}
  function getDb(){if(window.db)return window.db;if(window.fmsFirebase?.db)return window.fmsFirebase.db;try{if(typeof firebase!=="undefined"&&firebase.firestore)return firebase.firestore();}catch(_e){}return null;}
  function showContext(hasType){["grievanceFYPanel","moduleDashboardPanel","grievanceInlineRegisterPanel","cpgramsForm"].forEach(id=>$(id)?.classList.toggle("d-none",!hasType));const dataTitle=[...document.querySelectorAll("h4")].find(h=>h.textContent.includes("GRIEVANCES DATA ENTRY"));if(dataTitle)dataTitle.classList.toggle("d-none",!hasType);}
  function syncContext(){const type=currentType();showContext(!!type);if(!type)return;populateFY();const rows=rowsForContext();renderDashboard(rows);renderRegister(rows);const s=$("grievanceContextStatus");if(s){s.className="alert alert-success mb-0 py-3";s.textContent=`${type} • Financial Year ${currentFY()} • workflow dashboard and register use ${rows.length} active record(s).`;}}
  async function refresh(){const db=getDb();if(!db)return false;try{const snap=await db.collection(COLLECTION).get();allRows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>P()?P().active(r):r.active!==false);syncContext();return true;}catch(e){console.error("Grievances workspace load error",e);const s=$("grievanceContextStatus");if(s){s.className="alert alert-danger mb-0";s.textContent="Unable to load Grievances: "+(e.message||e);}return false;}}
  function start(){
    const type=$(TYPE_SELECT),fy=$(FY_SELECT);if(!type)return;
    const requestedType=new URLSearchParams(location.search).get("grievanceType");
    if(requestedType&&!type.value){const k=normType(requestedType);const mapped=TYPES.find(t=>normType(t)===k);if(mapped)type.value=mapped;}
    populateFY();type.addEventListener("change",()=>{if(typeof window.updateGrievanceFormLayout==="function")window.updateGrievanceFormLayout();syncContext();});fy?.addEventListener("change",syncContext);
    $("btnOpenFullGrievanceRegister")?.addEventListener("click",()=>{location.href=fullRegisterUrl("total");});
    showContext(!!currentType());if(getDb())refresh();else{window.addEventListener("fmsFirebaseReady",refresh,{once:true});setTimeout(()=>{if(getDb())refresh();},1500);}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
  window.FMSGrievanceWorkspace={refresh,syncContext,rowsForContext,normType,rowType};
})(window,document);
