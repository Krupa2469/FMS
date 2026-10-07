"use strict";
/* ============================================================
   CPGRAMS / GRIEVANCES REGISTER CONTROLLER - v1.10.26
   - CPGRAMS has separate Grievances and Appeals registers.
   - Grievance / Appeal numbers open their uploaded documents.
   - Registers default to latest Date Received first.
============================================================ */
(function(window,document){
  const COLLECTION="cpgrams", ATTACHMENTS_COLLECTION="attachments", PAGE_SIZE=25;
  const TYPES=["CPGRAMS","Prajavani","Public Grievances","Direct Complaints","LAQ","LCQ","Court Cases","VIP References","CMO References","PMO References","Audit Paras","Vigilance Cases"];
  let allRecords=[],filteredRecords=[],allAttachments=[],currentPage=1;
  const $=id=>document.getElementById(id);
  const P=()=>window.FMSRecordPolicy;
  const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c]));
  const first=(r,keys)=>P()?.first?.(r,keys)||"";

  function getDb(){if(window.db)return window.db;if(window.fmsFirebase?.db)return window.fmsFirebase.db;try{if(window.firebase?.apps?.length&&firebase.firestore)return firebase.firestore();}catch(_e){}return null;}
  function waitForDb(){return new Promise(resolve=>{const d=getDb();if(d)return resolve(d);let n=0;const timer=setInterval(()=>{const db=getDb();if(db||++n>40){clearInterval(timer);resolve(db||null);}},250);window.addEventListener("fmsFirebaseReady",()=>{clearInterval(timer);resolve(getDb());},{once:true});});}
  function showMessage(type,msg){const a=$("messageArea");if(a)a.innerHTML=`<div class="alert alert-${type} alert-dismissible fade show">${esc(msg)}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;else console.log(msg);}
  function showLoading(){ $("loadingOverlay")?.classList.remove("d-none"); }
  function hideLoading(){ $("loadingOverlay")?.classList.add("d-none"); }
  function normType(v){return P()?.normalizeType?.(v)||"";}
  function rowType(r){return P()?.rowType?.(r)||"cpgrams";}
  function displayType(k){return P()?.displayType?.(k)||"CPGRAMS";}
  function selectedType(){const p=new URLSearchParams(location.search);const raw=$("searchGrievanceType")?.value||p.get("grievanceType")||p.get("category")||"CPGRAMS";return displayType(normType(raw)||"cpgrams");}
  function selectedTypeKey(){return normType(selectedType())||"cpgrams";}
  function selectedRegisterView(){return String(new URLSearchParams(location.search).get("register")||"").toLowerCase();}
  function currentFY(){return P()?.currentFY?.()||window.FMSFY?.getCurrentFY?.()||"";}
  function selectedFY(){return new URLSearchParams(location.search).get("fy")||$("financialYear")?.value||currentFY();}
  function recordFY(r){return P()?.recordFY?.("cpgrams",r)||P()?.fyOfDate?.(P()?.recordDate?.("cpgrams",r))||"";}
  function w(r){return P()?.workflow?.("cpgrams",r)||{};}
  function isClosed(r){return P()?.closed?.("cpgrams",r)||false;}
  function isOverdue(r){return P()?.overdue?.("cpgrams",r)||false;}
  function isDueToday(r){return P()?.dueToday?.("cpgrams",r)||false;}
  function withinDue(r){return P()?.withinDue?.("cpgrams",r)||(!isClosed(r)&&!isOverdue(r)&&!isDueToday(r));}
  function isCirculation(r){return P()?.circulation?.("cpgrams",r)||false;}
  function hasAppeal(r){const identifying=["appealNumber","appealDate","appealReceivedDate","appellantName","appealAuthority","appealCommunicationNo","appealDisposalDate","appealRemarks","appealDocumentName"];if(identifying.some(k=>String(r?.[k]||"").trim()))return true;const status=String(r?.appealStatus||"").trim();return !!status&&!/^no\s*appeal$/i.test(status);}
  function appealDisposed(r){return hasAppeal(r) && (/disposed|closed|completed/i.test(String(r?.appealStatus||"")) || !!String(r?.appealDisposalDate||"").trim());}
  function appealPending(r){return hasAppeal(r) && !appealDisposed(r);}
  function fv(r,key){return r?.[key]??"";}
  function fmt(v){return P()?.formatDMY?.(v)||String(v??"");}
  function parseDate(v){const d=P()?.parseDate?.(v);if(d instanceof Date&&!Number.isNaN(d.getTime()))return d;const x=new Date(v||0);return Number.isNaN(x.getTime())?null:x;}
  function dateMs(v){const d=parseDate(v);return d?d.getTime():0;}

  function displayValue(r,key){
    const wf=w(r);
    switch(key){
      case "registrationNo":return first(r,["prajavaniNo","grievanceNumber","registrationNumber","grievanceNo"]);
      case "sentTo":return first(r,["officeLetterAddressedTo","addressedTo"]);
      case "communicationStatusView":return first(r,["communicationStatus"])||"Awaiting Approval";
      case "dateReceived":return fmt(first(r,["dateReceived","orgReceivedDate","receivedDate","questionReceivedDate"]));
      case "dueDate":return fmt(first(r,["dueDate","atrDueDate"]));
      case "daysStatus":return wf.dueLabel||"";
      case "memoStatus":return wf.memoIssued?"Issued":"Not issued";
      case "atrStatusView":return first(r,["atrStatus","atrReplyStatus"])||wf.atrStatus||(wf.atrReceived?"Received":"Awaited");
      case "approvalStatusView":return wf.approvalDone?"Approved / Put up":"Pending";
      case "portalUploadStatus":return wf.portalUploaded?"Uploaded":"Pending";
      case "replyGovtStatus":return wf.replySentToGovernment?"Sent":"Pending";
      case "replyComplainantStatus":return wf.replySentToComplainant?"Sent":"Pending";
      case "workflowStage":return wf.stage||"";
      case "finalStatusView":return wf.finalStatus||first(r,["finalStatus","currentStatus","officeStatus"])||"Pending";
      case "appealStatusView":return first(r,["appealStatus"])||"No Appeal";
      case "questionNo":return first(r,["questionSerialNo","laqNo","lcqNo"]);
      case "questionReceivedDate":return fmt(first(r,["questionReceivedDate","dateReceived"]));
      case "attachments":{const a=r?.attachments;if(Array.isArray(a))return a.map(x=>x?.name||x?.fileName||x?.filename||"Document").join(", ");return first(r,["attachmentCount","fileAttachmentName","attachmentName"]);}
      default:{let v=fv(r,key);if(!v&&key==="district")v=fv(r,"districtManual");if(!v&&key==="mandal")v=fv(r,"mandalManual");if(!v&&key==="village")v=fv(r,"villageManual");if(key.toLowerCase().includes("date"))v=fmt(v);return v;}
    }
  }

  function columnsForType(){
    const k=selectedTypeKey();
    let target="cpgrams-other";
    let fallback=[["registrationNo","Grievance No."],["dateReceived","Date Received"],["complainantName","Complaint Name"],["subject","Subject"],["district","District"],["mandal","Mandal"],["village","Village"],["atrStatusView","ATR Status"],["finalStatusView","Grievance Status"],["appealStatusView","Appeal Status"]];
    if(k==="cpgrams"){target="cpgrams-grievances";fallback=[["registrationNo","Grievance No."],["dateReceived","Date Received"],["complainantName","Complainant Name"],["atrStatusView","ATR Status"],["finalStatusView","Grievance Status"],["appealStatusView","Appeal Status"]];}
    else if(k==="laq"||k==="lcq"){target="cpgrams-questions";fallback=[["questionNo",`${displayType(k)} No.`],["questionType","Question Type"],["questionReceivedDate","Received Date"],["questionConcernedSection","Concerned Section"],["question","Question"],["answer","Answer"],["answerFurnishedBy","Answer furnished by"],["answerFurnishedTo","Answer furnished to"],["answerFurnishedDate","Date"],["questionCommunicationType","Communication Type"],["questionFileNumber","File No."],["questionCommunicationDate","Communication Date"],["questionFileStatus","File Status"],["attachments","Upload Document"]];}
    return window.FMSRegisterMasterConfig?.columnsFor?.(target,fallback)||fallback;
  }

  function populateTypeDropdown(){const s=$("searchGrievanceType");if(!s)return;const chosen=selectedType();s.innerHTML=TYPES.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join("");s.value=TYPES.includes(chosen)?chosen:"CPGRAMS";}
  function populateFY(){const s=$("financialYear");if(!s)return;const pref=new URLSearchParams(location.search).get("fy")||s.value||currentFY();const years=new Set();let start=new Date().getFullYear()-(new Date().getMonth()<3?1:0);for(let y=start;y>=2014;y--)years.add(`${y}-${String(y+1).slice(-2)}`);allRecords.forEach(r=>{const fy=recordFY(r);if(fy)years.add(fy);});const list=[...years].sort((a,b)=>+b.slice(0,4)-+a.slice(0,4));s.innerHTML=`<option value="all">All Years</option>`+list.map(f=>`<option value="${esc(f)}">${esc(f)}</option>`).join("");s.value=(pref==="all")?"all":(list.includes(pref)?pref:(list.includes(currentFY())?currentFY():list[0]||""));}
  function populateDistricts(){const s=$("searchDistrict");if(!s)return;const keep=s.value;const ds=[...new Set(allRecords.map(r=>String(r.district||r.districtManual||"").trim()).filter(Boolean))].sort();s.innerHTML='<option value="">All Districts</option>'+ds.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join("");if(ds.includes(keep))s.value=keep;}
  function baseRows(){const fy=selectedFY();let rows=allRecords.filter(r=>P()?P().active(r):r.active!==false).filter(r=>rowType(r)===selectedTypeKey());if(fy&&fy!=="all")rows=rows.filter(r=>recordFY(r)===fy);return rows;}

  function dashboardFilter(rows){
    const f=new URLSearchParams(location.search).get("filter");if(!f||f==="total")return rows;
    return rows.filter(r=>{const wf=w(r);if(f==="pending")return !isClosed(r);if(f==="within-due")return withinDue(r);if(f==="due-today")return isDueToday(r);if(f==="overdue")return isOverdue(r);if(f==="circulation")return isCirculation(r);if(["closed","completed","disposed"].includes(f))return isClosed(r);if(f==="memo-issued")return wf.memoIssued;if(f==="atr-awaited"||f==="reply-awaited")return wf.memoIssued&&!wf.atrReceived&&!isClosed(r);if(f==="atr-received"||f==="reply-received")return wf.atrReceived;if(f==="approval-pending")return /Pending JC|EGS|Pending Approval|Reply to Government Pending/i.test(wf.stage||"");if(f==="portal-pending")return /Portal Upload Pending/i.test(wf.stage||"");if(f==="govt-pending")return /Reply to Government Pending/i.test(wf.stage||"");if(f==="sent-section")return /Sent to concerned section/i.test(wf.stage||"");if(f==="received")return /Received/i.test(wf.stage||"");if(f==="reply-sent")return wf.replySentToGovernment;if(f==="with-section")return /With concerned section/i.test(wf.stage||"");if(f==="answer-furnished")return /Answer furnished/i.test(wf.stage||"");if(f==="appeals-received")return hasAppeal(r);if(f==="appeals-pending")return appealPending(r);if(f==="appeals-disposed")return appealDisposed(r);return true;});
  }
  function searchFilter(rows){const dist=String($("searchDistrict")?.value||"").trim().toLowerCase(),st=String($("searchStatus")?.value||"").trim().toLowerCase(),cat=String($("searchCategory")?.value||"").trim().toLowerCase(),pri=String($("searchPriority")?.value||"").trim().toLowerCase();return rows.filter(r=>{if(dist&&String(r.district||r.districtManual||"").trim().toLowerCase()!==dist)return false;if(st&&!String(w(r).stage||r.finalStatus||r.currentStatus||r.officeStatus||"").toLowerCase().includes(st))return false;if(cat&&!String(r.category||r.grievanceCategory||"").toLowerCase().includes(cat))return false;if(pri&&!String(r.priorityClassification||r.priority||"").toLowerCase().includes(pri))return false;return true;});}
  function updateSummary(rows){const vals={totalRecords:rows.length,pendingRecords:rows.filter(r=>!isClosed(r)).length,disposedRecords:rows.filter(isClosed).length,overdueRecords:rows.filter(isOverdue).length};Object.entries(vals).forEach(([id,val])=>{const e=$(id);if(e)e.textContent=val;});}
  function updateTitle(){const f=new URLSearchParams(location.search).get("filter"),k=selectedTypeKey();const base=k==="cpgrams"?"CPGRAMS GRIEVANCES REGISTER":`${selectedType().toUpperCase()} REGISTER`;const title=`${base}${f&&f!=="total"&&!String(f).startsWith("appeals-")?" - "+f.replace(/-/g," ").toUpperCase():""}`;if($("registerTitle"))$("registerTitle").textContent=base;const h=document.querySelector("header h3");if(h)h.textContent=k==="cpgrams"?"CPGRAMS REGISTERS":title;document.title=k==="cpgrams"?"CPGRAMS Registers":title;}
  function prajavaniSerial(r){const serialTime=x=>{const raw=x?.createdOn||x?.createdAt||x?.dateReceived||x?.receivedDate;if(raw&&typeof raw.toDate==="function")return raw.toDate().getTime();if(raw&&raw.seconds!=null)return Number(raw.seconds)*1000;const d=P()?.parseDate?.(raw)||new Date(raw||0);return d instanceof Date&&!Number.isNaN(d.getTime())?d.getTime():0;};const ordered=allRecords.filter(x=>(P()?P().active(x):x.active!==false)&&rowType(x)==="prajavani").slice().sort((a,b)=>serialTime(a)-serialTime(b));const i=ordered.findIndex(x=>x.id===r.id);return i>=0?i+1:"";}

  function attachmentRowsForRecord(recordId){return allAttachments.filter(a=>String(a.grievanceId||a.recordId||"")===String(recordId)&&a.active!==false&&a.deleted!==true);}
  function attachmentFor(recordId,kind){
    const list=attachmentRowsForRecord(recordId);
    const roleRx=kind==="appeal"?/appeal document/i:/grievance document/i;
    const field=kind==="appeal"?"appealDocument":"fileDocument";
    return list.find(a=>roleRx.test(String(a.fileRole||"")))||list.find(a=>String(a.sourceField||"")===field)||null;
  }
  function directDocumentUrl(record,kind){
    const keys=kind==="appeal"?["appealDocumentURL","appealDocumentUrl","appealDownloadURL"]:["fileDocumentURL","fileDocumentUrl","grievanceDocumentURL","grievanceDocumentUrl","documentURL","documentUrl"];
    for(const k of keys){const v=String(record?.[k]||"").trim();if(v)return v;}return "";
  }
  function documentUrl(record,kind){
    const a=attachmentFor(record?.id,kind);
    const embedded=Array.isArray(record?.attachments)?record.attachments:[];
    const roleRx=kind==="appeal"?/appeal document/i:/grievance document|application document|question document/i;
    const e=embedded.find(x=>roleRx.test(String(x?.fileRole||x?.role||x?.type||"")))||embedded.find(x=>String(x?.url||x?.downloadURL||"").trim())||null;
    return String(a?.downloadURL||a?.url||e?.downloadURL||e?.url||directDocumentUrl(record,kind)||"").trim();
  }
  function browserOpenUrl(url){
    if(!/^data:/i.test(url))return {url,revoke:false};
    try{
      const comma=url.indexOf(",");if(comma<0)return {url,revoke:false};
      const meta=url.slice(5,comma),payload=url.slice(comma+1),isBase64=/;base64/i.test(meta),mime=(meta.split(";")[0]||"application/octet-stream");
      const binary=isBase64?atob(payload):decodeURIComponent(payload);
      const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i)&255;
      return {url:URL.createObjectURL(new Blob([bytes],{type:mime})),revoke:true};
    }catch(_e){return {url,revoke:false};}
  }
  function openDocument(recordId,kind){
    const r=allRecords.find(x=>String(x.id)===String(recordId));if(!r)return;
    const url=documentUrl(r,kind);
    if(!url){alert(kind==="appeal"?"No appeal document is uploaded for this appeal.":"No grievance document is uploaded for this grievance.");return;}
    const target=browserOpenUrl(url);
    const a=document.createElement("a");a.href=target.url;a.target="_blank";a.rel="noopener noreferrer";document.body.appendChild(a);a.click();a.remove();
    if(target.revoke)setTimeout(()=>URL.revokeObjectURL(target.url),60000);
  }
  function linkCell(record,kind,text){const label=esc(text||"");return `<button type="button" class="btn btn-link p-0 fw-semibold text-decoration-underline text-start" data-open-doc="${kind}" data-record-id="${esc(record.id)}">${label||"Open document"}</button>`;}
  function actionButtons(r,focus){return `<div class="fms-register-actions"><button type="button" class="btn btn-sm btn-info" data-view="${esc(r.id)}" data-focus="${focus}">View</button><button type="button" class="btn btn-sm btn-warning" data-edit="${esc(r.id)}" data-focus="${focus}">Edit</button>${focus==="grievance"?`<button type="button" class="btn btn-sm btn-danger" data-delete="${esc(r.id)}">Delete</button>`:""}</div>`;}
  function bindRenderedActions(scope){
    scope?.querySelectorAll("[data-open-doc]").forEach(b=>b.addEventListener("click",()=>openDocument(b.dataset.recordId,b.dataset.openDoc)));
    scope?.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>openRecord(b.dataset.view,"view",b.dataset.focus)));
    scope?.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openRecord(b.dataset.edit,"edit",b.dataset.focus)));
    scope?.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteRecord(b.dataset.delete)));
  }

  function renderTable(){
    const head=$("registerHeaderRow"),body=$("registerBody"),cols=columnsForType(),k=selectedTypeKey(),view=selectedRegisterView();
    const grievanceCard=$("grievanceRegisterCard"),pagination=$("grievancePaginationRow");
    if(view==="appeals"){grievanceCard?.classList.add("d-none");pagination?.classList.add("d-none");updateTitle();renderAppealsRegister();return;}
    grievanceCard?.classList.remove("d-none");pagination?.classList.remove("d-none");
    const includeSerial=true;
    updateTitle();
    if($("recordCount"))$("recordCount").textContent=`Total Records : ${filteredRecords.length}`;
    if(head)head.innerHTML='<th class="fms-serial-col" data-field="serial">S.No.</th>'+cols.map(c=>`<th>${esc(c[1])}</th>`).join("")+'<th>Action</th>';
    if(!body)return;
    if(!filteredRecords.length){body.innerHTML=`<tr><td colspan="${cols.length+(includeSerial?1:0)+1}" class="text-center text-muted py-5">No ${esc(selectedType())} records available${selectedFY()&&selectedFY()!=="all"?` for Financial Year ${esc(selectedFY())}`:""}.</td></tr>`;updatePageInfo();renderAppealsRegister();return;}
    const start=(currentPage-1)*PAGE_SIZE,rows=filteredRecords.slice(start,start+PAGE_SIZE);
    body.innerHTML=rows.map((r,i)=>{
      const cells=cols.map(c=>{
        const value=displayValue(r,c[0]);
        if(c[0]==="registrationNo")return `<td>${linkCell(r,"grievance",value)}</td>`;
        if((k==="laq"||k==="lcq")&&c[0]==="questionNo")return `<td>${linkCell(r,"grievance",value)}</td>`;
        return `<td>${esc(value)}</td>`;
      }).join("");
      const serial=`<td class="fms-serial-col" data-field="serial">${start+i+1}</td>`;
      return `<tr>${serial}${cells}<td>${actionButtons(r,"grievance")}</td></tr>`;
    }).join("");
    bindRenderedActions(body);updatePageInfo();renderAppealsRegister();
  }
  function updatePageInfo(){const e=$("pageInfo");if(!e)return;if(!filteredRecords.length){e.textContent="Showing 0 to 0 of 0 records";return;}const start=(currentPage-1)*PAGE_SIZE+1,end=Math.min(currentPage*PAGE_SIZE,filteredRecords.length);e.textContent=`Showing ${start} to ${end} of ${filteredRecords.length} records`;}

  function appealRows(){
    if(selectedTypeKey()!=="cpgrams")return [];
    let rows=searchFilter(baseRows()).filter(hasAppeal);
    const f=new URLSearchParams(location.search).get("filter");
    if(f==="appeals-pending")rows=rows.filter(appealPending);
    else if(f==="appeals-disposed")rows=rows.filter(appealDisposed);
    else if(f==="appeals-received")rows=rows.filter(hasAppeal);
    rows.sort((a,b)=>dateMs(first(b,["appealReceivedDate","appealDate","dateReceived"]))-dateMs(first(a,["appealReceivedDate","appealDate","dateReceived"])));
    return rows;
  }
  function appealValue(r,key){
    if(key==="appealNumber")return first(r,["appealNumber"]);
    if(key==="appealReceivedDate")return fmt(first(r,["appealReceivedDate","appealDate"]));
    if(key==="appellantName")return first(r,["appellantName","complainantName"]);
    if(key==="registrationNo")return first(r,["grievanceNumber","registrationNumber","grievanceNo"]);
    if(key==="appealStatusView")return first(r,["appealStatus"])||(appealDisposed(r)?"Disposed":"Pending");
    return displayValue(r,key);
  }
  function renderAppealsRegister(){
    const card=$("appealsRegisterCard"),body=$("appealsRegisterBody"),count=$("appealRecordCount"),view=selectedRegisterView();
    if(!card||!body)return;
    if(selectedTypeKey()!=="cpgrams"||view==="grievances"){card.classList.add("d-none");return;}
    card.classList.remove("d-none");
    const fallback=[["appealNumber","Appeal No."],["appealReceivedDate","Date Received"],["appellantName","Appellant Name"],["registrationNo","Corresponding Grievance No."],["appealStatusView","Appeal Status"]];
    const cols=window.FMSRegisterMasterConfig?.columnsFor?.("cpgrams-appeals",fallback)||fallback;
    const head=$("appealsRegisterHead")||card.querySelector("thead tr");
    if(head)head.innerHTML='<th class="fms-serial-col" data-field="serial">S.No.</th>'+cols.map(c=>`<th>${esc(c[1])}</th>`).join('')+'<th>Action</th>';
    const rows=appealRows();if(count)count.textContent=`Total Records : ${rows.length}`;
    if(!rows.length){body.innerHTML=`<tr><td colspan="${cols.length+2}" class="text-center text-muted py-4">No appeals available.</td></tr>`;return;}
    body.innerHTML=rows.map((r,i)=>{
      const cells=cols.map(c=>{const value=appealValue(r,c[0]);if(c[0]==="appealNumber")return `<td>${linkCell(r,"appeal",value)}</td>`;if(c[0]==="registrationNo")return `<td>${linkCell(r,"grievance",value)}</td>`;return `<td>${esc(value)}</td>`;}).join('');
      return `<tr><td class="fms-serial-col" data-field="serial">${i+1}</td>${cells}<td>${actionButtons(r,"appeal")}</td></tr>`;
    }).join("");
    bindRenderedActions(body);
  }

  function applyFilters(){const base=baseRows();updateSummary(base);filteredRecords=searchFilter(dashboardFilter(base));currentPage=1;renderTable();}
  async function loadRegister(){
    showLoading();
    try{
      const db=await waitForDb();if(!db)throw new Error("Firestore is not ready.");
      await window.FMSRegisterMasterConfig?.ready?.(db);
      const [snap,attSnap]=await Promise.all([db.collection(COLLECTION).get(),db.collection(ATTACHMENTS_COLLECTION).get().catch(error=>{console.warn("CPGRAMS Register: attachments could not be loaded",error);return null;})]);
      allRecords=snap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>P()?P().active(r):r.active!==false);
      allRecords.sort((a,b)=>(P()?.recordDate?.("cpgrams",b)?.getTime()||0)-(P()?.recordDate?.("cpgrams",a)?.getTime()||0));
      allAttachments=attSnap?.docs?.map(d=>({id:d.id,...d.data()})).filter(a=>a.active!==false&&a.deleted!==true)||[];
      populateTypeDropdown();populateFY();populateDistricts();applyFilters();showMessage("success",`Loaded ${allRecords.length} active grievance record(s).`);
    }catch(e){const body=$("registerBody");if(body)body.innerHTML=`<tr><td colspan="20" class="text-center text-danger py-5">Unable to load Grievances Register: ${esc(e.message||e)}</td></tr>`;showMessage("danger",`Unable to load Grievances Register: ${e.message||e}`);}finally{hideLoading();}
  }
  function openRecord(id,mode,focus="grievance"){const r=allRecords.find(x=>x.id===id);if(!r)return;sessionStorage.setItem("selectedGrievance",JSON.stringify(r));location.href=`cpgrams.html?mode=${encodeURIComponent(mode)}&fullscreenForm=1&id=${encodeURIComponent(id)}&grievanceType=${encodeURIComponent(selectedType())}&focus=${encodeURIComponent(focus)}${focus==="appeal"?"#cpgramsAppealCard":""}`;}
  async function deleteRecord(id){const r=allRecords.find(x=>x.id===id);if(r)sessionStorage.setItem("selectedGrievance",JSON.stringify(r));location.href=`cpgrams.html?mode=delete&fullscreenForm=1&id=${encodeURIComponent(id)}&grievanceType=${encodeURIComponent(selectedType())}`;}

  function bind(){["searchGrievanceType","financialYear","searchDistrict","searchStatus","searchCategory","searchPriority","fromDate","toDate"].forEach(id=>{const e=$(id);if(!e)return;e.addEventListener("change",applyFilters);e.addEventListener("keyup",applyFilters);});$("btnSearch")?.addEventListener("click",applyFilters);$("btnRefresh")?.addEventListener("click",loadRegister);$("btnRefreshData")?.addEventListener("click",loadRegister);$("btnNew")?.addEventListener("click",()=>{sessionStorage.removeItem("selectedGrievance");location.href=`cpgrams.html?mode=new&fullscreenForm=1&grievanceType=${encodeURIComponent(selectedType())}`;});$("btnHome")?.addEventListener("click",()=>location.href="../../index.html");$("btnDashboard")?.addEventListener("click",()=>location.href=`cpgrams.html?grievanceType=${encodeURIComponent(selectedType())}`);$("btnFirst")?.addEventListener("click",()=>{currentPage=1;renderTable();});$("btnPrevious")?.addEventListener("click",()=>{currentPage=Math.max(1,currentPage-1);renderTable();});$("btnNext")?.addEventListener("click",()=>{currentPage=Math.min(Math.ceil(filteredRecords.length/PAGE_SIZE)||1,currentPage+1);renderTable();});$("btnLast")?.addEventListener("click",()=>{currentPage=Math.ceil(filteredRecords.length/PAGE_SIZE)||1;renderTable();});$("btnWhatsApp")?.addEventListener("click",async()=>{await window.FMSWhatsAppService?.compose?.({module:"GRIEVANCES",title:`${selectedType()} Register Message`,defaultMessage:`${selectedType()} Register Update\nFY: ${selectedFY()}\nRecords: ${filteredRecords.length}\n\n${($("registerBody")?.innerText||"").slice(0,2800)}`,message:m=>showMessage("info",m)});});}
  function bindExternalRefresh(){const reload=()=>loadRegister();window.addEventListener("fmsRecordChanged",event=>{if(!event?.detail?.module||event.detail.module==="cpgrams")reload();});window.addEventListener("storage",event=>{if(event.key==="fms_cpgrams_record_changed"&&event.newValue)reload();});try{if("BroadcastChannel" in window){const channel=new BroadcastChannel("fms-cpgrams-records");channel.addEventListener("message",reload);window.addEventListener("beforeunload",()=>channel.close(),{once:true});}}catch(_e){}}
  function init(){console.log("CPGRAMS Registers v1.10.26 loaded");populateTypeDropdown();populateFY();bind();bindExternalRefresh();renderTable();loadRegister();}

  window.openCPGRAMSSummaryFilter=f=>{const p=new URLSearchParams();p.set("filter",f||"total");p.set("fullscreen","1");p.set("fy",selectedFY());p.set("grievanceType",selectedType());if(String(f||"").startsWith("appeals-"))p.set("register","appeals");location.href="cpgrams-register.html?"+p;};
  window.viewRecord=id=>openRecord(id,"view");window.editRecord=id=>openRecord(id,"edit");window.deleteRecordFromGrid=deleteRecord;window.searchRecords=applyFilters;window.applyFinancialYearFilter=applyFilters;window.applyURLFilter=applyFilters;window.refreshRegister=loadRegister;window.goHome=()=>location.href="../../index.html";window.openDashboard=()=>location.href=`cpgrams.html?grievanceType=${encodeURIComponent(selectedType())}`;
  window.openCPGRAMSDocument=openDocument;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})(window,document);
