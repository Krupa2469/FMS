"use strict";
/* ============================================================
   FMS GRIEVANCES WORKSPACE - v1.10.6
   Grievance Type -> FY -> Workflow Dashboard -> Register -> Data Entry
============================================================ */
(function(window,document){
  const COLLECTION="cpgrams";
  const TYPE_SELECT="grievanceType";
  const FY_SELECT="grievanceFinancialYear";
  const TYPES=["CPGRAMS","Prajavani","Public Grievances","Direct Complaints","LAQ","LCQ","Court Cases","VIP References","CMO References","PMO References","Audit Paras","Vigilance Cases"];
  let allRows=[];
  let lastChangedId="";
  if(!document.getElementById("fmsDashboardCardValueStyle")){
    const style=document.createElement("style");
    style.id="fmsDashboardCardValueStyle";
    style.textContent=".fms-dashboard-card-value{font-size:1rem;line-height:1.2}.fms-dashboard-metric-line{display:block;white-space:nowrap;margin-top:.12rem}.fms-dashboard-metric-number{font-size:1.05rem;font-weight:700}.fms-compact-dashboard-card .card-body{min-width:0}@media(max-width:575.98px){.fms-dashboard-card-value{font-size:.9rem}.fms-dashboard-metric-number{font-size:.95rem}}";
    document.head.appendChild(style);
  }
  const $=id=>document.getElementById(id);
  const P=()=>window.FMSRecordPolicy;
  const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c]));
  const pretty=v=>String(v||"").trim();
  function normType(v){return P()?.normalizeType?.(v)||"";}
  function rowType(r){return P()?.rowType?.(r)||"cpgrams";}
  function currentType(){return pretty($(TYPE_SELECT)?.value || "CPGRAMS");}  
  function currentTypeKey(){return normType(currentType())||"cpgrams";}
  function currentFY(){return P()?.currentFY?.() || window.FMSFY?.getCurrentFY?.() || "";}
  function activeRows(){return allRows.filter(r=>P()?P().active(r):r?.active!==false);}
  function rowTime(r){
    const recordDate=P()?.recordDate?.("cpgrams",r);
    if(recordDate instanceof Date&&!Number.isNaN(recordDate.getTime()))return recordDate.getTime();
    const raw=r?.dateReceived||r?.orgReceivedDate||r?.receivedDate||r?.grievanceDate||r?.dateOfReceipt||r?.receiptDate||r?.questionReceivedDate||r?.date;
    if(raw&&typeof raw.toDate==="function") return raw.toDate().getTime();
    if(raw&&raw.seconds!=null) return Number(raw.seconds)*1000;
    const d=P()?.parseDate?.(raw) || new Date(raw||0);
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
  }
  function rowsForContext(){
    const type=currentType();if(!type)return [];
    const key=currentTypeKey(),fy=currentFY();
    let rows=activeRows().filter(r=>rowType(r)===key);
    if(P()) rows=P().filterFY("cpgrams",rows,fy);
    else if(window.FMSFY) rows=FMSFY.filterFY(rows,fy,["dateReceived","dateArised","receivedDate","questionReceivedDate","date"]);
    return rows.slice().sort((a,b)=>rowTime(b)-rowTime(a));
  }
  function populateFY(){
    const el=$(FY_SELECT);if(!el)return;
    const current=currentFY();
    el.innerHTML=current?`<option value="${current}">${current}</option>`:"";
    if(current) el.value=current;
  }
  function w(r){return P()?.workflow?.("cpgrams",r)||{};}
  function isClosed(r){return P()?.closed?.("cpgrams",r)||false;}
  function isOverdue(r){return P()?.overdue?.("cpgrams",r)||false;}
  function isDueToday(r){return P()?.dueToday?.("cpgrams",r)||false;}
  function withinDue(r){return P()?.withinDue?.("cpgrams",r)||(!isClosed(r)&&!isOverdue(r)&&!isDueToday(r));}
  function hasCpgramsAppeal(r){return ["appealNumber","appealDate","appealReceivedDate","appealStatus","appealAuthority","appealCommunicationNo","appealDisposalDate","appealRemarks"].some(k=>String(r?.[k]||"").trim());}
  function cpgramsAppealDisposed(r){return hasCpgramsAppeal(r) && (/disposed|closed|completed/i.test(String(r?.appealStatus||"")) || !!String(r?.appealDisposalDate||"").trim());}
  function cpgramsAppealPending(r){return hasCpgramsAppeal(r) && !cpgramsAppealDisposed(r);}
  function fullRegisterUrl(filter="total"){
    const p=new URLSearchParams();p.set("filter",filter);p.set("fullscreen","1");p.set("grievanceType",currentType());p.set("fy",currentFY());
    return `cpgrams-register.html?${p}`;
  }
  function card(label,value,filter,icon,theme){
    const renderedValue = value && typeof value === "object" && Array.isArray(value.metrics)
      ? value.metrics.map(m=>`<span class="fms-dashboard-metric-line">${esc(m.label)}: <span class="fms-dashboard-metric-number">${esc(m.value)}</span></span>`).join("")
      : esc(value);
    return `<div class="col-6 col-md-4 col-lg-3 col-xl-2"><a class="text-decoration-none text-reset" href="${fullRegisterUrl(filter)}"><div class="card h-100 shadow-sm border-0 fms-compact-dashboard-card"><div class="card-body text-center py-2 px-2"><div class="fs-4 text-${theme}"><i class="bi ${icon}"></i></div><div class="text-muted small mt-1 lh-sm">${esc(label)}</div><div class="fms-dashboard-card-value fw-bold text-${theme} lh-sm">${renderedValue}</div></div></div></a></div>`;
  }
  function renderDashboard(rows){
    const host=$("moduleDashboardCards"), status=$("moduleDashboardStatus");if(!host)return;
    const key=currentTypeKey();let cards=[];
    if(key==="laq"||key==="lcq"){
      cards=[
        [`${currentType().toUpperCase()}`,rows.length,"total","bi-collection","primary"],
        ["With Section",rows.filter(r=>/With concerned section/i.test(w(r).stage||"")).length,"with-section","bi-building","info"],
        ["Answer Furnished",rows.filter(r=>/Answer furnished/i.test(w(r).stage||"")).length,"answer-furnished","bi-chat-square-text","success"],
        ["Closed",rows.filter(isClosed).length,"closed","bi-check-circle","success"]
      ];
    }else{
      cards=[
        [`${currentType()}`,rows.length,"total","bi-collection","primary"],
        ["Within Due Date",rows.filter(withinDue).length,"within-due","bi-calendar-check","success"],
        ["Due Today",rows.filter(isDueToday).length,"due-today","bi-calendar-event","warning"],
        ["Overdue",rows.filter(isOverdue).length,"overdue","bi-exclamation-triangle","danger"],
        ["ATR Awaited",rows.filter(r=>(String(r.atrStatus||"").toLowerCase().includes("awaited")||(w(r).memoIssued&&!w(r).atrReceived))&&!isClosed(r)).length,"atr-awaited","bi-hourglass-split","warning"],
        ["Disposed / Closed",rows.filter(isClosed).length,"closed","bi-check-circle","success"]
      ];
      if(key==="cpgrams"){
        cards.push(
          ["Appeals Received",rows.filter(hasCpgramsAppeal).length,"appeals-received","bi-arrow-up-circle","primary"],
          ["Appeals Pending",rows.filter(cpgramsAppealPending).length,"appeals-pending","bi-hourglass-split","warning"],
          ["Appeals Disposed",rows.filter(cpgramsAppealDisposed).length,"appeals-disposed","bi-check2-circle","success"]
        );
      }
    }
    host.innerHTML=cards.map(x=>card(...x)).join("");
    if(status){status.className="d-none";status.textContent="";}
  }
  function fv(r,key){return P()?.first?.(r,[key])||r?.[key]||"";}
  function displayValue(r,key){
    const wf=w(r);
    switch(key){
      case "serial":return "";
      case "registrationNo":return fv(r,"prajavaniNo")||fv(r,"grievanceNumber")||fv(r,"registrationNumber")||fv(r,"grievanceNo")||"";
      case "sentTo":return fv(r,"officeLetterAddressedTo")||fv(r,"addressedTo")||"";
      case "communicationStatusView":return fv(r,"communicationStatus")||"Awaiting Approval";
      case "dateReceived":return P()?.formatDMY?.(fv(r,"dateReceived")||fv(r,"orgReceivedDate")||fv(r,"receivedDate")||fv(r,"questionReceivedDate"))||"";
      case "dueDate":return P()?.formatDMY?.(fv(r,"dueDate"))||"";
      case "daysStatus":return wf.dueLabel||"";
      case "memoStatus":return wf.memoIssued?"Issued":"Not issued";
      case "atrStatusView":return fv(r,"atrStatus")||wf.atrStatus||(wf.atrReceived?"Received":"Awaited");
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
        if(!v&&key==="district")v=fv(r,"districtManual");
        if(!v&&key==="mandal")v=fv(r,"mandalManual");
        if(!v&&key==="village")v=fv(r,"villageManual");
        if((key||"").toLowerCase().includes("date"))v=P()?.formatDMY?.(v)||v;
        return v;
      }
    }
  }
  function columns(){
    const key=currentTypeKey();
    if(key==="laq"||key==="lcq")return [["questionNo",`${currentType().toUpperCase()} No.`],["questionType","Question Type"],["questionReceivedDate","Received Date"],["questionConcernedSection","Concerned Section"],["question","Question"],["answer","Answer"],["answerFurnishedBy","Answer furnished by"],["answerFurnishedTo","Answer furnished to"],["answerFurnishedDate","Date"],["questionCommunicationType","Communication Type"],["questionFileNumber","File No."],["questionCommunicationDate","Communication Date"],["questionFileStatus","File Status"],["attachments","Upload Document"]];
    return [["registrationNo","Grievance No."],["dateReceived","Date Received"],["complainantName","Complaint Name"],["subject","Subject"],["district","District"],["mandal","Mandal"],["village","Village"],["atrStatusView","ATR Status"],["finalStatusView","Grievance Status"]];
  }
  function serialTime(r){const raw=r?.createdOn||r?.createdAt||r?.dateReceived||r?.receivedDate; if(raw&&typeof raw.toDate==="function")return raw.toDate().getTime();if(raw&&raw.seconds!=null)return Number(raw.seconds)*1000;const d=P()?.parseDate?.(raw)||new Date(raw||0);return d instanceof Date&&!Number.isNaN(d.getTime())?d.getTime():0;}
  function prajavaniSerial(r){
    const ordered=activeRows().filter(x=>rowType(x)==="prajavani").slice().sort((a,b)=>serialTime(a)-serialTime(b));
    const i=ordered.findIndex(x=>x.id===r.id); return i>=0?i+1:"";
  }
  function syncPrajavaniSerialField(){
    const el=$("prajavaniSerial"); if(!el||currentTypeKey()!=="prajavani")return;
    const params=new URLSearchParams(location.search), id=params.get("id");
    if(id){const r=allRows.find(x=>x.id===id);el.value=r?prajavaniSerial(r):"";}
    else el.value=activeRows().filter(x=>rowType(x)==="prajavani").length+1;
  }
  function renderRegister(rows){
    const head=$("grievanceInlineRegisterHead"), body=$("grievanceInlineRegisterBody"), title=$("grievanceInlineRegisterTitle"), count=$("grievanceInlineRecordCount");if(!head||!body)return;
    const cols=columns();title.textContent=`${currentType()} Register`;count.textContent=`Total Records : ${rows.length}`;
    const includeSerial=currentTypeKey()==="laq"||currentTypeKey()==="lcq", includeAction=true;
    head.innerHTML=`<tr>${includeSerial?"<th>S.No.</th>":""}${cols.map(c=>`<th class="text-nowrap">${esc(c[1])}</th>`).join("")}${includeAction?"<th>Action</th>":""}</tr>`;
    if(!rows.length){body.innerHTML=`<tr><td colspan="${cols.length+(includeSerial?1:0)+(includeAction?1:0)}" class="text-center text-muted py-4">No ${esc(currentType())} records available for Financial Year ${esc(currentFY())}.</td></tr>`;return;}
    body.innerHTML=rows.map((r,i)=>`<tr class="${r.id===lastChangedId?'table-success':''}">${includeSerial?`<td>${currentTypeKey()==="prajavani"?prajavaniSerial(r):i+1}</td>`:""}${cols.map(c=>`<td>${esc(displayValue(r,c[0]))}</td>`).join("")}${includeAction?`<td class="text-nowrap"><button type="button" class="btn btn-sm btn-info me-1" data-view="${esc(r.id)}">View</button><button type="button" class="btn btn-sm btn-warning me-1" data-edit="${esc(r.id)}">Edit</button><button type="button" class="btn btn-sm btn-danger" data-delete="${esc(r.id)}">Delete</button></td>`:""}</tr>`).join("");
    body.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>openRecord(b.dataset.view,"view")));
    body.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openRecord(b.dataset.edit,"edit")));
    body.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteRecord(b.dataset.delete)));
  }
  function openRecord(id,mode){const r=allRows.find(x=>x.id===id);if(!r)return;sessionStorage.setItem("selectedGrievance",JSON.stringify(r));location.href=`cpgrams.html?mode=${encodeURIComponent(mode)}&fullscreenForm=1&id=${encodeURIComponent(id)}&grievanceType=${encodeURIComponent(currentType())}`;}
  async function deleteRecord(id){
    if(!confirm("Delete this record?"))return;
    try{
      let result=null;
      if(window.FMSCrud?.softDelete){
        result=await window.FMSCrud.softDelete(COLLECTION,id);
        if(!result?.success) throw new Error(result?.message||"Delete failed");
      }else{
        const db=getDb();
        if(!db) throw new Error("Firestore is not ready.");
        await db.collection(COLLECTION).doc(id).set({active:false,deletedOn:new Date(),updatedOn:new Date()},{merge:true});
      }
      removeLocal(id);
      setTimeout(()=>refresh({forceServer:true}),700);
    }catch(e){
      alert("Unable to delete record: "+(e.message||e));
    }
  }
  function getDb(){if(window.db)return window.db;if(window.fmsFirebase?.db)return window.fmsFirebase.db;try{if(typeof firebase!=="undefined"&&firebase.firestore)return firebase.firestore();}catch(_e){}return null;}
  function showContext(hasType){["grievanceFYPanel","moduleDashboardPanel","grievanceInlineRegisterPanel","cpgramsForm"].forEach(id=>$(id)?.classList.toggle("d-none",!hasType));const dataTitle=[...document.querySelectorAll("h4")].find(h=>h.textContent.includes("GRIEVANCES DATA ENTRY"));if(dataTitle)dataTitle.classList.toggle("d-none",!hasType);}
  function syncContext(){const type=currentType();showContext(!!type);const heading=$("grievanceTypeHeading");if(heading)heading.textContent=type||"SELECT GRIEVANCE TYPE";const label=$("selectedGrievanceFormLabel");if(label)label.textContent="";const dataTitle=$("grievanceDataEntryTitle");if(dataTitle&&type)dataTitle.textContent=`${String(type).toUpperCase()} DATA ENTRY FORM`;if(!type)return;populateFY();const rows=rowsForContext();renderDashboard(rows);renderRegister(rows);syncPrajavaniSerialField();const s=$("grievanceContextStatus");if(s){s.className="d-none";s.textContent="";}}
  function upsertLocal(row){
    if(!row || !row.id) return false;
    const normalised={active:true,...row};
    lastChangedId=normalised.id;
    const idx=allRows.findIndex(r=>r.id===normalised.id);
    if(idx>=0) allRows[idx]={...allRows[idx],...normalised};
    else allRows.unshift(normalised);
    syncContext();
    return true;
  }
  function removeLocal(id){
    if(!id) return false;
    lastChangedId="";
    allRows=allRows.filter(r=>r.id!==id);
    syncContext();
    return true;
  }
  async function refresh(options={}){
    try{
      let rows=null;
      if(window.FMSCrud?.list){
        const result=await window.FMSCrud.list(COLLECTION,{activeOnly:true,forceServer:!!options.forceServer});
        if(!result?.success) throw new Error(result?.message||"Unable to load grievances.");
        rows=result.data||[];
      }else{
        const db=getDb();
        if(!db)return false;
        const snap=options.forceServer && db.collection(COLLECTION).get.length ? await db.collection(COLLECTION).get({source:"server"}).catch(()=>db.collection(COLLECTION).get()) : await db.collection(COLLECTION).get();
        rows=snap.docs.map(d=>({id:d.id,...d.data()}));
      }
      const fresh=(rows||[]).filter(r=>P()?P().active(r):r.active!==false);
      if(lastChangedId && !fresh.some(r=>r.id===lastChangedId)){
        const local=allRows.find(r=>r.id===lastChangedId);
        if(local) fresh.unshift(local);
      }
      allRows=fresh;
      syncContext();
      console.log("FMS Grievances Workspace refreshed", {
        total: allRows.length,
        context: rowsForContext().length,
        fy: currentFY(),
        type: currentTypeKey(),
        fyCountBeforeType: activeRows().filter(r=>P()?.recordFY?.("cpgrams",r)===currentFY()).length,
        fyTypeBreakdown: activeRows()
          .filter(r=>P()?.recordFY?.("cpgrams",r)===currentFY())
          .reduce((acc,r)=>{const k=rowType(r);acc[k]=(acc[k]||0)+1;return acc;},{}),
        changedId: lastChangedId || ""
      });
      return true;
    }catch(e){
      console.error("Grievances workspace load error",e);
      const s=$("grievanceContextStatus");
      if(s){s.className="alert alert-danger mb-0";s.textContent="Unable to load Grievances: "+(e.message||e);}
      return false;
    }
  }
  function start(){
    const type=$(TYPE_SELECT),fy=$(FY_SELECT);if(!type)return;
    const queryParams=new URLSearchParams(location.search);
    const requestedType=queryParams.get("grievanceType");
    if(requestedType){const k=normType(requestedType);const mapped=TYPES.find(t=>normType(t)===k);if(mapped)type.value=mapped;}
    // Open CPGRAMS by default when the Grievances module is opened from Home.
    // Users can still change this dropdown to Prajavani, LAQ, LCQ, etc.
    if(!type.value) type.value="CPGRAMS";
    populateFY();type.addEventListener("change",()=>{if(typeof window.updateGrievanceFormLayout==="function")window.updateGrievanceFormLayout();syncContext();});
    $("btnOpenFullGrievanceRegister")?.addEventListener("click",()=>{location.href=fullRegisterUrl("total");});
    showContext(!!currentType());
    if(typeof window.updateGrievanceFormLayout==="function") window.updateGrievanceFormLayout();
    const refreshAfterExternalChange=()=>refresh({forceServer:true,preserveChanged:true});
    window.addEventListener("fmsRecordChanged",event=>{
      if(!event?.detail?.module || event.detail.module==="cpgrams") refreshAfterExternalChange();
    });
    window.addEventListener("storage",event=>{
      if(event.key==="fms_cpgrams_record_changed" && event.newValue) refreshAfterExternalChange();
    });
    try{
      if("BroadcastChannel" in window){
        const channel=new BroadcastChannel("fms-cpgrams-records");
        channel.addEventListener("message",refreshAfterExternalChange);
        window.addEventListener("beforeunload",()=>channel.close(),{once:true});
      }
    }catch(_e){}
    console.log("FMS Grievances Workspace v1.10.6 loaded");
    if(getDb())refresh();else{window.addEventListener("fmsFirebaseReady",refresh,{once:true});setTimeout(()=>{if(getDb())refresh();},1500);}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
  window.FMSGrievanceWorkspace={refresh,syncContext,rowsForContext,upsertLocal,removeLocal,normType,rowType};
})(window,document);
