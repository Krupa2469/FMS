"use strict";
/* Central reports + custom report definitions - v1.10.29 */
(function(window,document){
const CFG={
  cpgrams:{collection:"cpgrams",dateFields:["dateReceived","orgReceivedDate","receivedDate","grievanceDate","dateOfReceipt","receiptDate","dateArised","questionReceivedDate","date"],dueFields:["dueDate"],name:"GRIEVANCES"},
  rti:{collection:"rtiApplications",dateFields:["applicationDate","dateReceived","date"],dueFields:["dueDate"],name:"RTI"},
  disha:{collection:"dishaMeetings",dateFields:["dateOfMeeting","meetingDate","proposedDateOfMeeting","date"],dueFields:["pomDueDate"],name:"DISHA"}
};
const GOV_HEADER=["GOVERNMENT OF TELANGANA","OFFICE OF THE COMMISSIONER, RURAL DEVELOPMENT","#6-3-607, Anand Nagar Colony, Khairatabad,Hyderabad-500 004"];
const DISHA_STATUS_COLUMNS=[
  {key:"Sl.No.",label:"Sl.No."},{key:"District",label:"District"},{key:"Meeting Date",label:"Meeting Date"},
  {key:"PoM Uploaded",label:"PoM Uploaded"},{key:"PoM Pending Days",label:"PoM Pending Days"},{key:"Remarks",label:"Remarks"}
];
const LABELS={grievanceType:"Grievance Type",grievanceNumber:"Grievance No.",dateReceived:"Date Received",applicationNumber:"Application No.",applicationDate:"Application Date",dateOfMeeting:"Meeting Date",pomDueDate:"PoM Due Date",pomUploaded:"PoM Uploaded",statusOfMeeting:"Meeting Status",statusOfBills:"Bill Status",meetingExpenditure:"Meeting Expenditure",complainantName:"Complainant Name",applicantName:"Applicant Name",informationSought:"Information Sought",assignedTo:"Assigned To",assignedOfficer:"Assigned Officer",officeCommunicationType:"Communication Type",presentStatus:"Present Status",currentStatus:"Current Status",finalStatus:"Final Status",officeStatus:"Office Status",fileLocation:"File Location",priorityClassification:"Priority Classification",natureOfGrievance:"Grievance Nature",questionSerialNo:"LAQ / LCQ No.",questionType:"Question Type",questionReceivedDate:"Received Date",questionConcernedSection:"Concerned Section",question:"Question",answer:"Answer",answerFurnishedBy:"Answer Furnished By",answerFurnishedTo:"Answer Furnished To",answerFurnishedDate:"Answer Furnished Date",questionCommunicationType:"Communication Type",questionFileNumber:"File No.",questionCommunicationDate:"Communication Date",questionFileStatus:"File Status",grievanceFinancialYear:"Financial Year",prajavaniSerial:"S.No.",grievanceDescription:"Grievance Description",fileDocumentName:"Grievance Document",gender:"Gender",district:"District",districtManual:"District (Manual)",mandal:"Mandal",mandalManual:"Mandal (Manual)",village:"Village",villageManual:"Village (Manual)",address:"Address",preferredContact:"Preferred Contact",fileNumber:"File No.",dateArised:"Date Arised",memoNumber:"UO Note/Memo/Letter No.",memoDate:"UO Note/Memo/Letter Date",officeLetterAddressedTo:"Addressed To",communicationStatus:"Communication Status",memoDocumentName:"UO Note/Memo/Letter Document",atrStatus:"ATR Status",appealNumber:"Appeal No.",appealDate:"Appeal Date",appealReceivedDate:"Appeal Received Date",appellantName:"Appellant Name",appealDocumentName:"Appeal Document",appealStatus:"Appeal Status",appealAuthority:"Appeal Authority / Addressed To",appealCommunicationNo:"Communication / Order No.",appealDisposalDate:"Appeal Disposal Date",appealRemarks:"Appeal Subject / Reason / Remarks",fileAttachmentName:"Attachment",applicantAddress:"Applicant Address",rtiApplicationFileName:"RTI Application Document",parsedText:"Extracted Text",newMandal:"New Mandal",newVillage:"New Village",officeFileNo:"File No.",officeDateArised:"Date Arised",officeSubject:"Subject",newOfficeOfficer:"New Officer",officeReplySection:"Reply Obtained From",newOfficeSection:"New Section",concernedSection:"Concerned Section",sentToSectionDate:"Sent to Section Date",replyStatus:"Reply Status",firstAppealNumber:"First Appeal No.",firstAppealDate:"First Appeal Date",firstAppealReceivedDate:"First Appeal Received Date",firstAppealStatus:"First Appeal Status",firstAppealAuthority:"First Appellate Authority",firstAppealOrderDate:"First Appeal Order / Disposal Date",firstAppealOrderNo:"First Appeal Order No.",firstAppealGrounds:"First Appeal Grounds / Remarks",secondAppealNumber:"Second Appeal No.",secondAppealDate:"Second Appeal Date",secondAppealReceivedDate:"Second Appeal Received Date",secondAppealStatus:"Second Appeal Status",secondAppealAuthority:"Second Appellate Authority / Information Commission",secondAppealOrderDate:"Second Appeal Order / Disposal Date",secondAppealOrderNo:"Second Appeal Order No.",secondAppealGrounds:"Second Appeal Grounds / Remarks",attachmentFileName:"Attachment",dishaWorkspaceFY:"Financial Year",slNo:"Sl.No.",pomUploadDate:"PoM Upload Date",pomPendingDays:"PoM Pending Days",billsSubmittedCRD:"Bills Submitted to CRD",billsForwardedMoRD:"Bills Forwarded to MoRD",proposedDateOfMeeting:"Proposed Date of Meeting",remarks:"Remarks"};
let loaded={cpgrams:[],rti:[],disha:[]},definitions=[],reportRows=[],reportColumns=[],reportSections=[],reportSummary=[],activeDefinition=null,started=false,exportPreviewType="pdf",activeModule="all";
const $=id=>document.getElementById(id);const baseLabel=k=>LABELS[k]||String(k).replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase());
function parseFieldRef(ref,fallbackModule){const v=String(ref||"");const i=v.indexOf("::");return i>0?{module:v.slice(0,i),key:v.slice(i+2),qualified:true}:{module:fallbackModule||"cpgrams",key:v,qualified:false};}
const moduleName=m=>m==="cpgrams"?"GRIEVANCES":String(CFG[m]?.name||m||"").toUpperCase();
function label(ref,fallbackModule){const p=parseFieldRef(ref,fallbackModule);if(!p.qualified||p.module==="cpgrams")return baseLabel(p.key);return `${moduleName(p.module)} — ${baseLabel(p.key)}`;}
function parseDate(v){if(!v)return null;if(v&&typeof v.toDate==="function")v=v.toDate();if(v&&v.seconds!=null)v=new Date(Number(v.seconds)*1000);const s=String(v);let m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(m)return new Date(+m[3],+m[2]-1,+m[1]);const d=v instanceof Date?v:new Date(v);return Number.isNaN(d.getTime())?null:d;}
function fmt(v){const d=parseDate(v);return d?d.toLocaleDateString("en-GB"):String(v??"");}
function iso(v){const d=parseDate(v);return d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`:"";}
function first(r,keys){for(const k of keys||[]){if(r[k]!==undefined&&r[k]!==null&&String(r[k]).trim()!=="")return r[k];}return "";}
function statusOf(r,m){if(m==="cpgrams")return first(r,["officeStatus","currentStatus","finalStatus","status"])||"Pending";if(m==="rti")return first(r,["officeStatus","presentStatus","status","finalStatus"])||"Pending";return first(r,["officeStatus","statusOfMeeting","pomUploaded","status"])||"Pending";}
function subjectOf(r,m){if(m==="cpgrams")return first(r,["subject","grievanceDescription","grievanceNumber"]);if(m==="rti")return first(r,["subject","informationSought","applicationNumber"]);return first(r,["remarks","statusOfMeeting","district"]);}
function dateOf(r,m){return first(r,CFG[m].dateFields);}function dueOf(r,m){return first(r,CFG[m].dueFields);}
function dishaPendingDays(r){
  const wf=window.FMSRecordPolicy?.workflow?.("disha",r)||{};
  if(wf.pomUploaded)return "";
  const meeting=parseDate(first(r,["dateOfMeeting","meetingDate","proposedDateOfMeeting"]));
  if(!meeting)return "";
  const today=new Date();today.setHours(0,0,0,0);meeting.setHours(0,0,0,0);
  if(meeting>today)return "";
  const days=Math.max(0,Math.floor((today-meeting)/86400000));
  return `${days} day${days===1?"":"s"}`;
}
function standardRow(m,r,index){
  const P=window.FMSRecordPolicy;
  const wf=P?.workflow?.(m,r)||{};
  if(m==="cpgrams"){
    const typeKey=P?.rowType?.(r)||"cpgrams";
    const type=P?.displayType?.(typeKey)||"CPGRAMS";
    if(typeKey==="laq"||typeKey==="lcq")return {Module:type,"No.":first(r,["questionSerialNo"]),"Received Date":fmt(first(r,["questionReceivedDate","dateReceived"])),"Concerned Section":first(r,["questionConcernedSection","section"]),Question:first(r,["question","subject"]),Answer:first(r,["answer"]),"Answer Furnished By":first(r,["answerFurnishedBy"]),"File Status":first(r,["questionFileStatus","officeStatus"]),"Workflow Stage":wf.stage||""};
    return {Module:type,"Registration / Memo No.":first(r,["grievanceNumber","registrationNumber","grievanceNo"]),"Date Received":fmt(first(r,["dateReceived","orgReceivedDate","receivedDate"])),"Due Date":fmt(first(r,["dueDate"])),"Days Left / Overdue":wf.dueLabel||"","Name / Received From":first(r,["complainantName","receivedFrom"]),District:first(r,["district","nameOfDistrict"]),Subject:first(r,["subject","grievanceDescription"]),"Memo / Letter":wf.memoIssued?"Issued":"Not issued","ATR / Reply":wf.atrReceived?"Received":"Awaited","Approval":wf.approvalDone?"Approved / Put up":"Pending","Portal / Govt Reply":typeKey==="cpgrams"?(wf.portalUploaded?"Uploaded":"Pending"):(wf.replySentToGovernment?"Sent":"Pending"),"Workflow Stage":wf.stage||"","Final Status":wf.finalStatus||"Pending"};
  }
  if(m==="rti"){
    return {Module:"RTI","Application No.":first(r,["applicationNumber"]),"Application Date":fmt(first(r,["applicationDate"])),"Due Date":fmt(first(r,["dueDate"])),"Days Left / Overdue":wf.dueLabel||"","Applicant Name":first(r,["applicantName"]),Subject:first(r,["subject","officeSubject","informationSought"]),"Concerned Section":first(r,["concernedSection","officeReplySection","officeReplyObtainedFrom"]),"Reply Status":wf.replyReceived?"Received":"Awaited","Reply Sent":wf.replySent?"Sent":"Pending","Workflow Stage":wf.stage||"","Final Status":wf.finalStatus||"Pending"};
  }
  return {"Sl.No.":Number(index||0)+1,District:first(r,["district","nameOfDistrict"]),"Meeting Date":fmt(first(r,["dateOfMeeting","meetingDate","proposedDateOfMeeting"])),"PoM Uploaded":wf.pomUploaded?"Yes":"No","PoM Pending Days":dishaPendingDays(r),Remarks:wf.pomUploaded?"PoM Uploaded":"PoM not Uploaded"};
}
function isClosedStatus(status,m){const s=String(status||"").trim().toLowerCase();if(m==="disha")return s==="held"||/completed|closed/.test(s);return /closed|disposed|reply obtained|despatched|completed|final reply|replied/.test(s);}
function isOverdueRecord(r,m){const due=parseDate(dueOf(r,m));if(!due||isClosedStatus(statusOf(r,m),m))return false;const today=new Date();today.setHours(0,0,0,0);due.setHours(0,0,0,0);return due<today;}
function todayLabel(){return new Date().toLocaleDateString("en-GB");}
function currentFY(){const d=new Date(),y=d.getMonth()>=3?d.getFullYear():d.getFullYear()-1;return `${y}-${String(y+1).slice(-2)}`;}
function fyBounds(fy){const y=parseInt(String(fy).slice(0,4),10);if(!Number.isFinite(y))return null;return {from:`${y}-04-01`,to:`${y+1}-03-31`};}
function populateFY(){const sel=$("financialYear");if(!sel)return;const cur=currentFY(),start=parseInt(cur.slice(0,4),10);let html="";for(let y=start;y>=2014;y--){const fy=`${y}-${String(y+1).slice(-2)}`;html+=`<option value="${fy}">${fy}${fy===cur?" (Current FY)":""}</option>`;}html+='<option value="custom">Custom Date Range</option>';sel.innerHTML=html;sel.value=cur;applyFYDates(cur);}
function applyFYDates(fy){const b=fyBounds(fy);if(!b)return;$("fromDate").value=b.from;$("toDate").value=b.to;}
function selectedPeriod(){const fy=$("financialYear")?.value;if(fy&&fy!=="custom")return `Financial Year: ${fy}`;const f=$("fromDate").value,t=$("toDate").value;return `Period: ${f||"Start"} to ${t||"Today"}`;}
function isDishaMeetingStatusDefinition(def){return def?.module==="disha"&&/disha\s+meetings?\s+status/i.test(String(def.name||""));}
function reportName(module){if(activeDefinition){const custom=String(activeDefinition.mainHeading||"").trim();if(custom)return custom;return `${activeDefinition.name||"Custom Report"} as on ${todayLabel()}`;}if(module==="all")return `All Modules Status Report as on ${todayLabel()}`;return `${CFG[module]?.name||String(module).toUpperCase()} Status Report as on ${todayLabel()}`;}
function legacyDefinitionFilters(def){return [{field:def?.filterField,operator:def?.operator,value:def?.filterValue},{field:def?.filterField2,operator:def?.operator2,value:def?.filterValue2},{field:def?.filterField3,operator:def?.operator3,value:def?.filterValue3}].filter(f=>f.field);}
function sectionFilterSpecs(sec,def){
 const own=Array.isArray(sec?.filters)?sec.filters.filter(f=>f?.field).slice(0,3):[];
 if(own.length)return own.map(f=>({field:f.field,operator:f.operator||"contains",value:f.value??""}));
 return legacyDefinitionFilters(def);
}
function definitionSections(def){
 const fallback=def?.module||"cpgrams";
 return (Array.isArray(def?.sections)?def.sections:[])
  .map(sec=>({heading:String(sec?.heading||"").trim(),fields:Array.isArray(sec?.fields)?sec.fields.filter(Boolean):[],filters:sectionFilterSpecs(sec,def)}))
  .filter(sec=>sec.heading&&sec.fields.length)
  .map(sec=>({heading:sec.heading,columns:sec.fields.map(ref=>{const p=parseFieldRef(ref,fallback);return {key:ref,ref,module:p.module,fieldKey:p.key,label:label(ref,fallback)};}),filters:sec.filters,rows:[]}));
}
function definitionFields(def){const fromSections=definitionSections(def).flatMap(sec=>sec.columns.map(c=>c.key));return [...new Set((fromSections.length?fromSections:(def?.fields||[])).filter(Boolean))];}
function reportColumnWidthsCh(columns,rows){
 return (columns||[]).map(c=>{
  const labelText=String(c?.label||c?.key||""),lower=labelText.toLowerCase();
  let max=Math.max(labelText.length+2,6);
  (rows||[]).slice(0,150).forEach(r=>{const text=String(r?.[c.key]??"").replace(/\s+/g," ").trim();max=Math.max(max,Math.min(text.length+2,48));});
  if(/^(s\.?no\.?|sl\.?no\.?|serial)/i.test(labelText))return 7;
  if(/date/i.test(lower))return Math.max(12,Math.min(max,13));
  if(/status|type/i.test(lower))return Math.max(12,Math.min(max,15));
  if(/district|mandal|village/i.test(lower))return Math.max(12,Math.min(max,18));
  if(/name/i.test(lower))return Math.max(14,Math.min(max,22));
  if(/subject|description|remarks|information|question|answer/i.test(lower))return Math.max(20,Math.min(max,32));
  if(/number|no\.?$/i.test(lower))return Math.max(14,Math.min(max,22));
  return Math.max(9,Math.min(max,20));
 });
}
function reportTableWidthCh(columns,rows){return reportColumnWidthsCh(columns,rows).reduce((a,b)=>a+b,0)+2;}
function isNoWrapReportColumn(c){
 const text=String(c?.label||c?.key||"").toLowerCase();
 return /grievance\s*(no\.?|number)|appeal\s*(no\.?|number)|application\s*(no\.?|number)|registration.*no\.?|file\s*no\.?/.test(text);
}
function reportColumnPercentages(columns,rows){
 const widths=reportColumnWidthsCh(columns,rows),total=widths.reduce((a,b)=>a+b,0)||1;
 return widths.map(w=>Math.max(4,(w/total)*100));
}
function reportColgroup(columns,rows){return '<colgroup>'+reportColumnPercentages(columns,rows).map(w=>`<col style="width:${w.toFixed(3)}%">`).join('')+'</colgroup>';}
function reportCellClass(c){return isNoWrapReportColumn(c)?' class="report-nowrap"':'';}
function reportContentWidthPx(){
 const widths=reportSections.length?reportSections.map(sec=>reportTableWidthCh(sec.columns,Array.isArray(sec.rows)?sec.rows:reportRows)):[reportTableWidthCh(reportColumns,reportRows)];
 const widest=Math.max(64,...widths.filter(Number.isFinite));
 return Math.max(680,Math.min(1080,Math.round(widest*8+44)));
}
function applyCompactReportWidth(preview=false){
 const width=reportContentWidthPx();
 if(preview){
  const paper=$("exportPreviewReportTitle")?.closest(".export-preview-paper");
  if(paper){paper.style.width=width+"px";paper.style.minWidth=width+"px";paper.style.maxWidth=width+"px";}
  return;
 }
 const summary=$("summarySection"),card=$("reportTitle")?.closest(".card");
 [summary,card].forEach(el=>{if(!el)return;el.style.width=width+"px";el.style.maxWidth="100%";el.style.marginLeft="auto";el.style.marginRight="auto";});
}
function sectionTableHtml(sections,rows,preview=false){
 const blockClass=preview?"export-preview-section-block":"report-section-block",headingClass=preview?"export-preview-section-heading":"report-section-heading";
 return (sections||[]).map(sec=>{const sectionRows=Array.isArray(sec.rows)?sec.rows:rows;return `<div class="${blockClass}"><div class="${headingClass}">${escapeHtml(sec.heading)} <span class="badge bg-light text-dark ms-2">${sectionRows.length}</span></div><div class="table-responsive"><table class="table table-bordered table-striped table-hover mb-0 report-autofit-table" style="width:100%">${reportColgroup(sec.columns,sectionRows)}<thead><tr>${sec.columns.map(c=>`<th${reportCellClass(c)}>${escapeHtml(c.label||c.key)}</th>`).join("")}</tr></thead><tbody>${sectionRows.length?sectionRows.map(r=>`<tr>${sec.columns.map(c=>`<td${reportCellClass(c)}>${escapeHtml(r[c.key]??"")}</td>`).join("")}</tr>`).join(""):`<tr><td colspan="${Math.max(sec.columns.length,1)}" class="text-center p-4 text-muted">No records found.</td></tr>`}</tbody></table></div></div>`;}).join("");
}
async function loadAll(){if(!window.db)throw new Error("Firestore is not ready.");for(const m of Object.keys(CFG)){const snap=await db.collection(CFG[m].collection).get();loaded[m]=snap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.active!==false);}try{const snap=await db.collection("reportDefinitions").get();definitions=snap.docs.map(d=>({id:d.id,...d.data()})).filter(d=>d.active!==false).sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));}catch(e){console.warn("Report definitions unavailable",e);definitions=[];}populateDefinitions();}
function populateDefinitions(){const sel=$("customReport"),current=sel.value;sel.innerHTML='<option value="">— Standard report —</option>'+definitions.map(d=>`<option value="${d.id}">${escapeHtml(d.name)} (${String(d.module||"").toUpperCase()})</option>`).join("");if(definitions.some(d=>d.id===current))sel.value=current;}
function dateRangePreset(def){if(!def||def.datePreset==="none")return;const now=new Date(),to=new Date(now),from=new Date(now);if(def.datePreset==="currentFY"){const fy=currentFY();$("financialYear").value=fy;applyFYDates(fy);return;}if(def.datePreset==="last7")from.setDate(now.getDate()-6);else if(def.datePreset==="last30")from.setDate(now.getDate()-29);else if(def.datePreset!=="today")return;const f=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;$("financialYear").value="custom";$("fromDate").value=f(from);$("toDate").value=f(to);}
function inRange(r,m){const from=$("fromDate").value,to=$("toDate").value,d=iso(dateOf(r,m));return (!from||!d||d>=from)&&(!to||!d||d<=to);}
function passesOneFilter(r,field,operator,filterValue){
 if(!field)return true;
 let v=r?.[field];if(v&&typeof v.toDate==="function")v=fmt(v);v=String(v??"");const q=String(filterValue??"");
 switch(operator){case"equals":return v.toLowerCase()===q.toLowerCase();case"notEquals":return v.toLowerCase()!==q.toLowerCase();case"gt":return Number(v)>Number(q);case"gte":return Number(v)>=Number(q);case"lt":return Number(v)<Number(q);case"lte":return Number(v)<=Number(q);case"isEmpty":return !v.trim();case"notEmpty":return !!v.trim();default:return v.toLowerCase().includes(q.toLowerCase());}
}
function passesFilters(r,filters=[]){return (filters||[]).every(f=>passesOneFilter(r,f?.field,f?.operator||"contains",f?.value??""));}
function passesSectionFilters(r,module,filters=[],fallbackModule){
 return (filters||[]).every(f=>{const p=parseFieldRef(f?.field,fallbackModule||module);if(p.qualified&&p.module!==module)return true;return passesOneFilter(r,p.key,f?.operator||"contains",f?.value??"");});
}
function sectionModules(sec,fallbackModule){
 const mods=new Set();
 (sec?.columns||[]).forEach(c=>{const p=parseFieldRef(c.ref||c.key,fallbackModule);if(p.qualified)mods.add(p.module);});
 (sec?.filters||[]).forEach(f=>{const p=parseFieldRef(f?.field,fallbackModule);if(p.qualified)mods.add(p.module);});
 if(!mods.size){if(fallbackModule==="all")Object.keys(loaded).forEach(m=>mods.add(m));else mods.add(fallbackModule||"cpgrams");}
 return mods;
}
function passesDef(r,def){
 if(!def)return true;
 return passesOneFilter(r,def.filterField,def.operator,def.filterValue)&&
        passesOneFilter(r,def.filterField2,def.operator2,def.filterValue2)&&
        passesOneFilter(r,def.filterField3,def.operator3,def.filterValue3);
}
function customValue(r,ref,index=0,module=activeModule,fallbackModule=activeModule){
 const p=parseFieldRef(ref,fallbackModule||module);
 if(p.qualified&&p.module!==module)return "";
 const k=p.key;
 if(k==="slNo")return Number(index)+1;
 if(module==="disha"&&k==="pomPendingDays")return dishaPendingDays(r);
 if(module==="disha"&&k==="pomUploaded")return window.FMSRecordPolicy?.workflow?.("disha",r)?.pomUploaded?"Yes":"No";
 const v=r?.[k];if(v&&typeof v.toDate==="function")return fmt(v);if(k.toLowerCase().includes("date")||k.toLowerCase().includes("due")){const d=parseDate(v);if(d)return fmt(v);}return v??"";
}
function summaryDataset(module){
 const modules=module==="all"?Object.keys(loaded):[module];
 const raw=[];
 const transformed=[];
 for(const m of modules){
   const source=(loaded[m]||[]).filter(r=>inRange(r,m));
   source.forEach((r,i)=>{
     raw.push(module==="all"?{...r,__module:m}:r);
     transformed.push(standardRow(m,r,i));
   });
 }
 return {raw,transformed};
}
function buildSummary(module,raw,transformed,selectedKeys){
 const selected=Array.isArray(selectedKeys)?selectedKeys.filter(Boolean):[];
 if(!selected.length)return [];
 const P=window.FMSRecordPolicy,total=(raw||[]).length;let items=[];
 if(module==="cpgrams"){
   const fyLabel=$("financialYear")?.value && $("financialYear")?.value!=="custom" ? $("financialYear").value : selectedPeriod();
   const sinceStart=new Date(2014,3,1);
   const allSince2014=(loaded.cpgrams||[]).filter(r=>{const d=parseDate(dateOf(r,"cpgrams"));return r.active!==false && (!P?.rowType || P.rowType(r)==="cpgrams") && d && d>=sinceStart;});
   const fyReceived=(raw||[]).filter(r=>!P?.rowType || P.rowType(r)==="cpgrams");
   const summaryRows=fyReceived.length ? fyReceived : (raw||[]);
   const hasAppeal=r=>["appealNumber","appealDate","appealReceivedDate","appealStatus","appealAuthority","appealCommunicationNo","appealDisposalDate","appealRemarks"].some(k=>String(r?.[k]||"").trim());
   const appealDisposed=r=>hasAppeal(r) && (/disposed|closed|completed/i.test(String(r?.appealStatus||"")) || !!String(r?.appealDisposalDate||"").trim());
   const appealPending=r=>hasAppeal(r) && !appealDisposed(r);
   items=[
     {key:"totalSince2014",label:"Total Received since 2014-15",value:allSince2014.length},
     {key:"totalPeriod",label:`Total Received ${fyLabel}`,value:fyReceived.length},
     {key:"withinDue",label:"Within Due Date",value:summaryRows.filter(r=>P?.withinDue?.("cpgrams",r)).length},
     {key:"dueToday",label:"Due Today",value:summaryRows.filter(r=>P?.dueToday?.("cpgrams",r)).length},
     {key:"overdue",label:"Overdue",value:summaryRows.filter(r=>P?.overdue?.("cpgrams",r)).length},
     {key:"atrAwaited",label:"ATR / Reply Awaited",value:summaryRows.filter(r=>{const w=P?.workflow?.("cpgrams",r)||{};return w.memoIssued&&!w.atrReceived&&!P?.closed?.("cpgrams",r);}).length},
     {key:"atrReceived",label:"ATR / Reply Received",value:summaryRows.filter(r=>P?.workflow?.("cpgrams",r)?.atrReceived).length},
     {key:"pendingApproval",label:"Pending Approval",value:summaryRows.filter(r=>/Pending JC|EGS|Pending Approval|Reply to Government Pending/i.test(P?.workflow?.("cpgrams",r)?.stage||"")).length},
     {key:"disposedClosed",label:"Disposed / Closed",value:summaryRows.filter(r=>P?.closed?.("cpgrams",r)).length},
     {key:"appealsReceived",label:"Appeals Received",value:summaryRows.filter(hasAppeal).length},
     {key:"appealsPending",label:"Appeals Pending",value:summaryRows.filter(appealPending).length},
     {key:"appealsDisposed",label:"Appeals Disposed",value:summaryRows.filter(appealDisposed).length}
   ];
 }else if(module==="rti"){
   items=[
    {key:"total",label:"Total RTI Applications",value:total},{key:"withinDue",label:"Within Due Date",value:raw.filter(r=>P?.withinDue?.("rti",r)).length},{key:"dueToday",label:"Due Today",value:raw.filter(r=>P?.dueToday?.("rti",r)).length},{key:"overdue",label:"Overdue",value:raw.filter(r=>P?.overdue?.("rti",r)).length},{key:"replyAwaited",label:"Reply Awaited",value:raw.filter(r=>{const w=P?.workflow?.("rti",r)||{};return w.sentToSection&&!w.replyReceived&&!P?.closed?.("rti",r);}).length},{key:"replyReceived",label:"Reply Received",value:raw.filter(r=>P?.workflow?.("rti",r)?.replyReceived).length},{key:"replySent",label:"Reply Sent",value:raw.filter(r=>P?.workflow?.("rti",r)?.replySent).length},{key:"disposedClosed",label:"Disposed / Closed",value:raw.filter(r=>P?.closed?.("rti",r)).length}
   ];
 }else if(module==="disha"){
   const notUploaded=raw.filter(r=>!P?.workflow?.("disha",r)?.pomUploaded);
   const heldRows=raw.filter(r=>/held/i.test(String(r.statusOfMeeting||r.meetingStatus||r.status||"")));
   const districtsConducted=new Set(heldRows.map(r=>String(r.district||r.nameOfDistrict||"").trim().toLowerCase()).filter(Boolean)).size;
   items=[
    {key:"totalMeetings",label:"Total Meetings",value:total},{key:"districtsConducted",label:"Districts Conducted Meetings",value:districtsConducted},{key:"pomUploaded",label:"PoM Uploaded",value:raw.filter(r=>P?.workflow?.("disha",r)?.pomUploaded).length},{key:"pomNotUploaded",label:"PoM Not Uploaded",value:notUploaded.length},{key:"pom0to7",label:"PoM Pending 0–7 Days",value:notUploaded.filter(r=>{const d=P?.diffDays?.(P?.recordDate?.("disha",r),new Date());return d!=null&&d>=0&&d<=7;}).length},{key:"pom8to15",label:"PoM Pending 8–15 Days",value:notUploaded.filter(r=>{const d=P?.diffDays?.(P?.recordDate?.("disha",r),new Date());return d!=null&&d>=8&&d<=15;}).length},{key:"pomMore15",label:"PoM Pending More Than 15 Days",value:notUploaded.filter(r=>{const d=P?.diffDays?.(P?.recordDate?.("disha",r),new Date());return d!=null&&d>15;}).length},{key:"districtsPendingPom",label:"Districts Pending PoM",value:new Set(notUploaded.map(r=>String(r.district||r.nameOfDistrict||"").trim()).filter(Boolean)).size}
   ];
 }else{
   const rows=transformed||[],closed=rows.filter(r=>String(r.Status||r["Final Status"]||"").toLowerCase().match(/closed|disposed|completed/)).length;
   items=[{key:"totalRecords",label:"Total Records",value:rows.length},{key:"closedCompleted",label:"Closed / Completed",value:closed},{key:"pendingOpen",label:"Pending / Open",value:Math.max(rows.length-closed,0)}];
 }
 const map=new Map(items.map(x=>[x.key,x]));
 return selected.map(k=>map.get(k)).filter(Boolean);
}
function buildDefinitionSummary(def){
 const selected=Array.isArray(def?.summaryCards)?def.summaryCards.filter(Boolean):[];
 if(!selected.length)return [];
 const fallback=def?.module||"cpgrams",out=[];
 selected.forEach(ref=>{
   const p=parseFieldRef(ref,fallback),ds=summaryDataset(p.module),card=buildSummary(p.module,ds.raw,ds.transformed,[p.key])[0];
   if(card)out.push({...card,key:ref,label:(p.qualified&&p.module!=="cpgrams")?`${moduleName(p.module)} — ${card.label}`:card.label});
 });
 return out;
}
function dateTimeOf(r,m){const d=window.FMSRecordPolicy?.recordDate?.(m,r)||parseDate(dateOf(r,m));return d instanceof Date&&!Number.isNaN(d.getTime())?d.getTime():0;}
function sortDateDesc(rows,m){return rows.sort((a,b)=>dateTimeOf(b,m)-dateTimeOf(a,m));}
function compareCustom(a,b,field){
  const av=customValue(a,field),bv=customValue(b,field);
  if(/date/i.test(String(field||""))){const ad=parseDate(av),bd=parseDate(bv);if(ad||bd)return (ad?.getTime?.()||0)-(bd?.getTime?.()||0);}
  return String(av??"").localeCompare(String(bv??""),undefined,{numeric:true,sensitivity:"base"});
}
function applyDefinitionSort(rows,def){const specs=[[def.sortField,def.sortDirection],[def.sortField2,def.sortDirection2],[def.sortField3,def.sortDirection3]].filter(x=>x[0]);if(!specs.length)return rows;return rows.sort((a,b)=>{for(const [field,dir] of specs){const c=compareCustom(a,b,field);if(c)return c*(dir==="desc"?-1:1);}return 0;});}
function generate(){
 activeDefinition=definitions.find(d=>d.id===$("customReport").value)||null;
 if(activeDefinition){generateCustom(activeDefinition);return;}
 const m=$("reportModule").value;activeModule=m;reportSections=[];let out=[],raw=[];
 if(m==="all"){
   const combined=[];
   for(const mod of Object.keys(loaded)){for(const r of loaded[mod].filter(x=>inRange(x,mod)))combined.push({...r,__module:mod});}
   combined.sort((a,b)=>dateTimeOf(b,b.__module)-dateTimeOf(a,a.__module));
   raw=combined;out=combined.map((r,i)=>standardRow(r.__module,r,i));
 }else{raw=loaded[m].filter(r=>inRange(r,m));if(m==="cpgrams"&&window.FMSRecordPolicy?.rowType){raw=raw.filter(r=>window.FMSRecordPolicy.rowType(r)==="cpgrams");}sortDateDesc(raw,m);out=raw.map((r,i)=>standardRow(m,r,i));}
 reportRows=out;const keys=[];out.forEach(row=>Object.keys(row).forEach(k=>{if(!keys.includes(k))keys.push(k);}));reportColumns=(keys.length?keys:["Module","ID","Date","Subject","Workflow Stage","Final Status"]).map(k=>({key:k,label:k}));reportSummary=buildSummary(m,raw,out);render(reportName(m));
}
function generateCustom(def){
 const modules=def.module==="all"?Object.keys(loaded):[def.module];let out=[],raw=[];activeModule=def.module||"all";reportSections=definitionSections(def);const fields=definitionFields(def);
 if(reportSections.length){
   // Sectioned reports can draw fields and filters from every operational module.
   const combined=[];
   for(const m of Object.keys(loaded)){for(const r of (loaded[m]||[]).filter(x=>inRange(x,m)))combined.push({raw:r,module:m});}
   combined.sort((a,b)=>dateTimeOf(b.raw,b.module)-dateTimeOf(a.raw,a.module));
   const represented=new Set();
   reportSections.forEach(sec=>{
     const allowed=sectionModules(sec,def.module||"cpgrams");
     let matches=combined.filter(x=>allowed.has(x.module)&&passesSectionFilters(x.raw,x.module,sec.filters,def.module||x.module));
     // Preserve report sorting for records belonging to the report's base module; mixed-module sections otherwise remain latest-date-first.
     if(def.sortField&&allowed.size===1){const only=[...allowed][0];matches.sort((a,b)=>{for(const [field,dir] of [[def.sortField,def.sortDirection],[def.sortField2,def.sortDirection2],[def.sortField3,def.sortDirection3]].filter(x=>x[0])){const c=compareCustom(a.raw,b.raw,field);if(c)return c*(dir==="desc"?-1:1);}return 0;});}
     matches.forEach(x=>represented.add(x));
     sec.rows=matches.map((x,i)=>{const o={};sec.columns.forEach(c=>o[c.key]=customValue(x.raw,c.ref||c.key,i,x.module,def.module||x.module));return o;});
   });
   const selected=combined.filter(x=>represented.has(x));
   raw=selected.map(x=>({...x.raw,__module:x.module}));
   out=selected.map((x,i)=>standardRow(x.module,x.raw,i));
   reportColumns=[];
   reportRows=out;reportSummary=buildDefinitionSummary(def);render(reportName(def.module));return;
 }
 if(isDishaMeetingStatusDefinition(def)){
   let source=(loaded.disha||[]).filter(x=>inRange(x,"disha")).filter(x=>passesDef(x,def));if(def.sortField)applyDefinitionSort(source,def);else sortDateDesc(source,"disha");raw=source.slice();out=source.map((r,i)=>standardRow("disha",r,i));reportColumns=DISHA_STATUS_COLUMNS.map(c=>({...c}));reportRows=out;reportSummary=buildDefinitionSummary(def);render(reportName("disha"));return;
 }
 if(def.module==="all"){
   const combined=[];for(const m of modules){for(const r of loaded[m].filter(x=>inRange(x,m))){const sr=standardRow(m,r);if(passesDef(sr,def))combined.push({raw:{...r,__module:m},row:sr,module:m});}}
   if(def.sortField)combined.sort((a,b)=>{for(const [field,dir] of [[def.sortField,def.sortDirection],[def.sortField2,def.sortDirection2],[def.sortField3,def.sortDirection3]].filter(x=>x[0])){const c=compareCustom(a.row,b.row,field);if(c)return c*(dir==="desc"?-1:1);}return 0;});else combined.sort((a,b)=>dateTimeOf(b.raw,b.raw.__module)-dateTimeOf(a.raw,a.raw.__module));
   raw=combined.map(x=>x.raw);const chosen=fields.length?fields:Object.keys(combined[0]?.row||{});out=combined.map((x,i)=>{const o={};chosen.forEach(k=>o[k]=customValue(x.raw,k,i,x.module,"all")||(x.row?.[k]??""));return o;});reportColumns=chosen.map(k=>({key:k,label:label(k,"all")}));
 }else{
   let source=(loaded[def.module]||[]).filter(x=>inRange(x,def.module)).filter(x=>passesDef(x,def));if(def.sortField)applyDefinitionSort(source,def);else sortDateDesc(source,def.module);raw=source.slice();source.forEach((r,i)=>{const o={};fields.forEach(k=>o[k]=customValue(r,k,i,def.module,def.module));out.push(o);});reportColumns=fields.map(k=>({key:k,label:label(k,def.module)}));
 }
 reportRows=out;reportSummary=buildDefinitionSummary(def);render(reportName(def.module));
}
function render(title){
 $("reportTitle").textContent=title;$("recordCount").textContent=reportRows.length+" records";
 const sectionContainer=$("reportSectionsContainer"),flatWrap=$("reportFlatTableWrap");
 if(reportSections.length){sectionContainer.innerHTML=sectionTableHtml(reportSections,reportRows,false);sectionContainer.style.display="";flatWrap.style.display="none";}
 else{sectionContainer.innerHTML="";sectionContainer.style.display="none";flatWrap.style.display="";const table=$("reportTable"),th=table.querySelector("thead"),tb=table.querySelector("tbody");table.querySelector("colgroup")?.remove();table.insertAdjacentHTML("afterbegin",reportColgroup(reportColumns,reportRows));table.classList.add("report-autofit-table");table.style.width="100%";th.innerHTML='<tr>'+reportColumns.map(c=>`<th${reportCellClass(c)}>${escapeHtml(c.label)}</th>`).join('')+'</tr>';tb.innerHTML=reportRows.length?reportRows.map(r=>'<tr>'+reportColumns.map(c=>`<td${reportCellClass(c)}>${escapeHtml(r[c.key]??"")}</td>`).join('')+'</tr>'):`<tr><td colspan="${Math.max(reportColumns.length,1)}" class="text-center p-5 text-muted">No records found.</td></tr>`;}
 const colors=["primary","success","warning","danger"];
 $("summaryCards").innerHTML=reportSummary.map((x,i)=>`<div class="col-xl-3 col-md-6"><div class="card border-${colors[i%colors.length]} summary-card h-100"><div class="card-body text-center"><div class="text-muted">${escapeHtml(x.label)}</div><h3 class="text-${colors[i%colors.length]}">${escapeHtml(x.value)}</h3></div></div></div>`).join("");
 if($("summarySection"))$("summarySection").style.display=reportSummary.length?"":"none";
 applyCompactReportWidth(false);
 $("summaryPeriod").textContent=selectedPeriod();$("reportStatus").textContent=`Generated ${new Date().toLocaleString("en-IN")}`;
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function exportOpts(){const fy=$("financialYear")?.value;return {rows:reportRows,columns:reportColumns,sections:reportSections,title:$("reportTitle").textContent,filename:$("reportTitle").textContent,headerLines:GOV_HEADER,summary:reportSummary,financialYear:fy&&fy!=="custom"?fy:"",periodLabel:fy==="custom"?selectedPeriod():"",shareText:`${GOV_HEADER.join("\n")}\n\n${$("reportTitle").textContent}\n${selectedPeriod()}\nRecords: ${reportRows.length}`};}
function renderExportPreview(){
 const title=$("reportTitle").textContent||"FMS Report";$("exportPreviewTitle").textContent="Export Report — Preview";$("exportPreviewMeta").textContent=`${title} • ${reportRows.length} record(s)`;$("exportPreviewGov1").textContent=GOV_HEADER[0];$("exportPreviewGov2").textContent=GOV_HEADER[1];$("exportPreviewGov3").textContent=GOV_HEADER[2];$("exportPreviewReportTitle").textContent=title;$("exportPreviewReportMeta").textContent=selectedPeriod()+` • Records: ${reportRows.length}`;
 $("exportPreviewSummary").innerHTML=reportSummary.length?'<div class="export-preview-summary-heading">SUMMARY</div><div class="export-preview-summary-grid">'+reportSummary.map(x=>`<div class="export-preview-summary-card"><div class="export-preview-summary-label">${escapeHtml(x.label)}</div><div class="export-preview-summary-value">${escapeHtml(x.value)}</div></div>`).join("")+"</div>":"";
 const previewSections=$("exportPreviewSections"),previewFlat=$("exportPreviewFlatTableWrap");if(reportSections.length){previewSections.innerHTML=sectionTableHtml(reportSections,reportRows,true);previewSections.style.display="";previewFlat.style.display="none";}else{previewSections.innerHTML="";previewSections.style.display="none";previewFlat.style.display="";const table=$("exportPreviewTable"),th=table.querySelector("thead"),tb=table.querySelector("tbody");table.querySelector("colgroup")?.remove();table.insertAdjacentHTML("afterbegin",reportColgroup(reportColumns,reportRows));table.classList.add("report-autofit-table");table.style.width="100%";th.innerHTML='<tr>'+reportColumns.map(c=>`<th${reportCellClass(c)}>${escapeHtml(c.label||c.key)}</th>`).join('')+'</tr>';tb.innerHTML=reportRows.map(r=>'<tr>'+reportColumns.map(c=>`<td${reportCellClass(c)}>${escapeHtml(r[c.key]??"")}</td>`).join('')+'</tr>').join('');}applyCompactReportWidth(true);$("exportPreviewFormat").value=exportPreviewType==="print"?"pdf":exportPreviewType;$("exportPreviewStatus").textContent="";updateDeviceShareNote();
}
function updateDeviceShareNote(){const note=$("deviceShareNote"),btn=$("btnPreviewShare");if(!note||!btn)return;btn.disabled=false;if(navigator.share){note.textContent="Share will open the device/browser share menu. File sharing is used when permitted; otherwise the report is shared as text or downloaded automatically.";note.classList.add("share-ready");}else{note.textContent="Native device sharing is unavailable in this browser. Share will download the selected report file instead.";note.classList.remove("share-ready");}}
function openExportPreview(type){try{if(!Array.isArray(reportRows)||!reportRows.length)throw new Error("No records are available to export.");exportPreviewType=type||"pdf";renderExportPreview();$("exportPreviewBackdrop").classList.add("open");document.body.style.overflow="hidden";if(type==="print")setTimeout(()=>$("btnPreviewPrint")?.focus(),50);else setTimeout(()=>$("btnPreviewShare")?.focus(),50);}catch(e){alert(e.message||e);}}
function closeExportPreview(){$("exportPreviewBackdrop")?.classList.remove("open");document.body.style.overflow="";}
async function previewDownload(){const status=$("exportPreviewStatus");try{const type=$("exportPreviewFormat").value,opts=exportOpts();status.textContent="Preparing file...";if(type==="excel")await FMSExportService.toExcel(opts);if(type==="pdf")await FMSExportService.toPDF(opts);if(type==="jpeg")await FMSExportService.toJPEG(opts);status.textContent="Downloaded successfully.";}catch(e){status.textContent="";alert(e.message||e);}}
async function previewPrint(){const status=$("exportPreviewStatus");try{status.textContent="Opening print preview...";await FMSExportService.printRows(exportOpts());status.textContent="";}catch(e){status.textContent="";alert(e.message||e);}}
async function previewShare(){const status=$("exportPreviewStatus");try{const type=$("exportPreviewFormat").value;status.textContent="Preparing share...";const result=await FMSExportService.shareFile(type,exportOpts());if(result?.cancelled)status.textContent="Share cancelled.";else if(result?.shared)status.textContent=result.fileShared?"Report file shared.":"Report details shared. The file remains available from Download.";else if(result?.downloaded)status.textContent=result.message||"Sharing was not permitted; report downloaded instead.";else status.textContent="";}catch(e){console.error(e);status.textContent="Unable to use device sharing. Please use Download.";}}
async function shareWhatsApp(){const firstSection=reportSections[0],shareCols=firstSection?.columns?.length?firstSection.columns:reportColumns,shareRows=Array.isArray(firstSection?.rows)?firstSection.rows:reportRows;const preview=shareRows.slice(0,15).map((r,i)=>`${i+1}. ${shareCols.slice(0,4).map(c=>`${c.label}: ${r[c.key]??""}`).join(" | ")}`).join("\n");await window.FMSWhatsAppService?.compose({module:"REPORTS",title:$("reportTitle").textContent,summaryText:`${selectedPeriod()}\nRecords: ${reportRows.length}\n${preview}`});}
async function init(){if(started)return;started=true;$("btnHome").onclick=()=>location.href="../index.html";$("btnMasters").onclick=()=>location.href="admin/master-management.html";$("btnReportsMaster").onclick=()=>location.href="admin/reports-master.html";$("btnRefresh").onclick=async()=>{await loadAll();generate();};$("btnGenerate").onclick=generate;$("btnExcel").onclick=()=>openExportPreview("excel");$("btnPDF").onclick=()=>openExportPreview("pdf");$("btnJPEG").onclick=()=>openExportPreview("jpeg");$("btnPrint").onclick=()=>openExportPreview("print");$("btnWhatsApp").onclick=shareWhatsApp;$("btnCloseExportPreview").onclick=closeExportPreview;$("btnPreviewDownload").onclick=previewDownload;$("btnPreviewPrint").onclick=previewPrint;$("btnPreviewShare").onclick=previewShare;$("exportPreviewFormat").onchange=e=>{exportPreviewType=e.target.value;updateDeviceShareNote();};$("exportPreviewBackdrop").addEventListener("click",e=>{if(e.target===$("exportPreviewBackdrop"))closeExportPreview();});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("exportPreviewBackdrop")?.classList.contains("open"))closeExportPreview();});$("customReport").onchange=()=>{activeDefinition=definitions.find(d=>d.id===$("customReport").value)||null;if(activeDefinition){$("reportModule").value=activeDefinition.module==="all"?"all":activeDefinition.module;dateRangePreset(activeDefinition);}};$("financialYear").onchange=e=>{if(e.target.value!=="custom")applyFYDates(e.target.value);generate();};["fromDate","toDate"].forEach(id=>$(id).addEventListener("change",()=>{$("financialYear").value="custom";}));try{await loadAll();populateFY();const q=new URLSearchParams(location.search).get("module");if(q&&CFG[q])$("reportModule").value=q;generate();}catch(e){$("reportStatus").textContent="Unable to load reports: "+(e.message||e);console.error(e);}}
document.addEventListener("DOMContentLoaded",()=>{if(window.fmsFirebaseReady&&window.db)init();else{window.addEventListener("fmsFirebaseReady",init,{once:true});setTimeout(()=>{if(window.db)init();},1600);}});
})(window,document);
