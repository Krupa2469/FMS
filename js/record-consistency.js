"use strict";
/* ============================================================
   FMS OPERATIONAL RECORD POLICY - v1.3.5
   One source of truth for active-record, FY, due dates, workflow
   stage, dashboard cards and register/report status logic.
============================================================ */
(function(window){
  const DAY=86400000;
  const CONFIG={
    cpgrams:{dateFields:["dateReceived","orgReceivedDate","receivedDate","questionReceivedDate","dateArised","diaryDate","dairyDate","date"],dueFields:["dueDate","atrDueDate"],dueDays:21},
    rti:{dateFields:["applicationDate","dateReceived","date"],dueFields:["dueDate"],dueDays:30},
    disha:{dateFields:["dateOfMeeting","meetingDate","proposedDateOfMeeting","date"],dueFields:["pomDueDate"],dueDays:0}
  };

  const TYPE_MAP=new Map([
    ["grievances","cpgrams"],["grievance","cpgrams"],["cpgrams","cpgrams"],["cpgram","cpgrams"],["cpgrams portal","cpgrams"],
    ["prajavani","prajavani"],["public grievances","public grievances"],["public grievance","public grievances"],
    ["direct complaints","direct complaints"],["direct complaint","direct complaints"],
    ["laq","laq"],["lcq","lcq"],["court cases","court cases"],["court case","court cases"],
    ["vip references","vip references"],["vip reference","vip references"],["cmo references","cmo references"],["cmo reference","cmo references"],
    ["pmo references","pmo references"],["pmo reference","pmo references"],["audit paras","audit paras"],["audit para","audit paras"],
    ["vigilance cases","vigilance cases"],["vigilance case","vigilance cases"]
  ]);
  const DISPLAY_TYPES={
    cpgrams:"CPGRAMS",prajavani:"Prajavani","public grievances":"Public Grievances","direct complaints":"Direct Complaints",
    laq:"LAQ",lcq:"LCQ","court cases":"Court Cases","vip references":"VIP References","cmo references":"CMO References",
    "pmo references":"PMO References","audit paras":"Audit Paras","vigilance cases":"Vigilance Cases"
  };

  function active(r){return !!r && r.active!==false && r.deleted!==true;}
  function cleanText(v){return String(v??"").trim().replace(/\s+/g," ");}
  function normalizeKey(v){return cleanText(v).toLowerCase().replace(/[_-]+/g," ")
    .replace(/\bcomplaint\b/g,"complaints").replace(/\breference\b/g,"references").replace(/\bpara\b/g,"paras");}
  function normalizeType(v){return TYPE_MAP.get(normalizeKey(v))||"";}
  function displayType(key){return DISPLAY_TYPES[key]||cleanText(key).replace(/\b\w/g,c=>c.toUpperCase());}
  function isQuestionType(t){const k=normalizeType(t);return k==="laq"||k==="lcq";}
  function rowType(r){
    const qt=cleanText(r?.questionType).toUpperCase();
    if(qt==="LAQ")return "laq"; if(qt==="LCQ")return "lcq";
    for(const f of ["grievanceType","referenceType","type","sourceType","grievanceSource","source"]){const k=normalizeType(r?.[f]);if(k)return k;}
    return "cpgrams";
  }
  function first(r,keys){for(const k of keys||[]){const v=r?.[k];if(v!==undefined&&v!==null&&cleanText(v)!=="")return v;}return "";}
  function yes(v){return /^(yes|y|true|1|uploaded|done|completed|closed|disposed|sent|approved|received)$/i.test(cleanText(v));}
  function no(v){return /^(no|n|false|0|not uploaded|pending|awaited|awaiting)$/i.test(cleanText(v));}
  function parseDate(v){
    if(!v)return null;
    if(v&&typeof v.toDate==="function")v=v.toDate();
    else if(v&&v.seconds!=null)v=new Date(Number(v.seconds)*1000);
    else if(v&&v._seconds!=null)v=new Date(Number(v._seconds)*1000);
    if(v instanceof Date)return Number.isNaN(v.getTime())?null:new Date(v.getTime());
    const s=cleanText(v);
    let m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2}|\d{4})$/);
    if(m){const y=m[3].length===2?Number("20"+m[3]):Number(m[3]);return new Date(y,Number(m[2])-1,Number(m[1]));}
    m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
    const d=new Date(s);return Number.isNaN(d.getTime())?null:d;
  }
  function formatDMY(v){const d=parseDate(v);if(!d)return cleanText(v);return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;}
  function formatISO(v){const d=parseDate(v);if(!d)return cleanText(v);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
  function addDays(value,days,format="dmy"){const d=parseDate(value);if(!d)return "";d.setDate(d.getDate()+Number(days||0));return format==="iso"?formatISO(d):formatDMY(d);}
  function todayStart(){const t=new Date();t.setHours(0,0,0,0);return t;}
  function diffDays(from,to=new Date()){const a=parseDate(from),b=parseDate(to);if(!a||!b)return null;a.setHours(0,0,0,0);b.setHours(0,0,0,0);return Math.floor((b-a)/DAY);}
  function fields(module){return CONFIG[module]?.dateFields||[];}
  function recordDate(module,r){for(const f of fields(module)){const d=parseDate(r?.[f]);if(d)return d;}return null;}
  function currentFY(){const d=new Date(),y=d.getFullYear(),start=d.getMonth()>=3?y:y-1;return `${start}-${String(start+1).slice(-2)}`;}
  function fyOfDate(d){if(!d)return "";const y=d.getMonth()>=3?d.getFullYear():d.getFullYear()-1;return `${y}-${String(y+1).slice(-2)}`;}
  function inFY(module,r,fy=currentFY()){return active(r)&&fyOfDate(recordDate(module,r))===fy;}
  function filterFY(module,rows,fy=currentFY()){return (rows||[]).filter(r=>inFY(module,r,fy));}
  function dueDate(module,r){for(const k of CONFIG[module]?.dueFields||[]){const d=parseDate(r?.[k]);if(d)return d;}return null;}
  function dueLabel(module,r){
    const d=dueDate(module,r);if(!d)return "";d.setHours(0,0,0,0);const t=todayStart();const n=Math.round((d-t)/DAY);
    if(closed(module,r))return "Closed";
    if(n>0)return `${n} day(s) left`;
    if(n===0)return "Due today";
    return `${Math.abs(n)} day(s) overdue`;
  }
  function status(module,r){
    if(module==="cpgrams")return cleanText(first(r,["workflowStage","officeStatus","currentStatus","finalStatus","statusOfFile","questionFileStatus","status"])).toLowerCase();
    if(module==="rti")return cleanText(first(r,["workflowStage","officeStatus","presentStatus","currentStatus","statusOfFile","finalStatus","status"])).toLowerCase();
    return cleanText(first(r,["officeStatus","statusOfMeeting","currentStatus","status"])).toLowerCase();
  }
  function cpgramsPortalDone(r){return yes(first(r,["uploadedInCPGRAMSPortal","portalUploaded","cpgramsPortalUploaded","portalUploadStatus"]));}
  function finalReplyToComplainantDone(r){return yes(first(r,["finalReplySentToComplainant","replySentToComplainant","replySent"]));}
  function govtReplyDone(r){return yes(first(r,["replySentToGovernment","replySentToGovernmentMemo","replySentToReferringAuthority","replySentToJCAdmin"]));}
  function rtiReplyDone(r){return yes(first(r,["replySentToApplicant","rtiReplySent","replySent"]));}
  function closed(module,r){
    const s=status(module,r);
    if(module==="disha")return /held|completed|closed/.test(s) || yes(first(r,["pomUploaded","pomStatus"]));
    if(module==="rti")return rtiReplyDone(r)||/closed|disposed|completed|reply sent|reply furnished|final reply|replied/.test(s);
    const t=rowType(r);
    if(t==="cpgrams" && cpgramsPortalDone(r) && finalReplyToComplainantDone(r))return true;
    if(t!=="cpgrams" && !isQuestionType(t) && govtReplyDone(r))return true;
    return /closed|disposed|completed|reply obtained|despatched|reply furnished|final reply|replied/.test(s);
  }
  function circulation(module,r){return /under circulation|circulation/.test([r?.workflowStage,r?.officeStatus,r?.statusOfFile,r?.currentStatus,r?.presentStatus,r?.questionFileStatus,r?.status].map(v=>String(v||"").toLowerCase()).join(" | "));}
  function overdue(module,r){if(!active(r)||closed(module,r))return false;const d=dueDate(module,r);if(!d)return false;d.setHours(0,0,0,0);return d<todayStart();}
  function dueToday(module,r){if(!active(r)||closed(module,r))return false;const d=dueDate(module,r);if(!d)return false;d.setHours(0,0,0,0);return d.getTime()===todayStart().getTime();}
  function withinDue(module,r){return active(r)&&!closed(module,r)&&!overdue(module,r)&&!dueToday(module,r);}

  function cpgramsWorkflow(r){
    const t=rowType(r);
    const memoIssued=!!(first(r,["memoDate","communicationDate","officeMemoDate","officeCommunicationDate"])||first(r,["memoNumber","communicationNo","officeMemoNumber"]));
    const atrReceived=yes(first(r,["atrReceived","atrStatus"])) || !!first(r,["atrDate","atrReceivedDate"]);
    const approvalDone=yes(first(r,["approvalStatus","putUpForJCApproval","putUpForEGSApproval","jcApprovalStatus","egsApprovalStatus"])) || !!first(r,["jcApprovalDate","egsApprovalDate","approvalDate"]);
    const putUp=!!first(r,["putUpDate","dateArised","filePutupDate"]);
    let stage="Grievance Received";
    if(t==="cpgrams"){
      if(closed("cpgrams",r))stage="Disposed / Closed";
      else if(finalReplyToComplainantDone(r) && !cpgramsPortalDone(r))stage="Portal Upload Pending";
      else if(approvalDone)stage="ATR approved / final reply pending";
      else if(atrReceived)stage="Pending JC / EGS Approval";
      else if(memoIssued)stage="ATR Awaited";
      else if(putUp)stage="File put up to JC through AO";
    }else if(t==="prajavani"){
      if(closed("cpgrams",r))stage="Closed by JC, Admin";
      else if(govtReplyDone(r))stage="Reply sent to JC, Admin";
      else if(atrReceived||yes(first(r,["replyStatus"])))stage="Reply received from section";
      else if(memoIssued||!!first(r,["sentToSectionDate"]))stage="Sent to concerned section";
      else stage="Received from JC, Admin";
    }else if(t==="laq"||t==="lcq"){
      const qs=cleanText(first(r,["questionFileStatus","finalStatus","officeStatus"]));
      if(/closed|despatched|reply obtained|disposed/i.test(qs))stage="Answered / Closed";
      else if(first(r,["answer","answerFurnishedDate"]))stage="Answer furnished";
      else if(first(r,["questionConcernedSection"]))stage="With concerned section";
      else stage=`${displayType(t)} Received`;
    }else{
      if(closed("cpgrams",r))stage="Closed";
      else if(govtReplyDone(r))stage="Reply sent to Government / Referring Authority";
      else if(approvalDone)stage="Reply to Government Pending";
      else if(atrReceived||yes(first(r,["replyStatus"])))stage="Reply / ATR Received";
      else if(memoIssued)stage="Reply Awaited";
      else if(putUp)stage="File put up / assigned";
    }
    const finalStatus=closed("cpgrams",r)?"Disposed / Closed":"Pending";
    return {type:t,stage,finalStatus,memoIssued,atrReceived,approvalDone,putUp,portalUploaded:cpgramsPortalDone(r),replySentToComplainant:finalReplyToComplainantDone(r),replySentToGovernment:govtReplyDone(r),dueLabel:dueLabel("cpgrams",r)};
  }

  function rtiWorkflow(r){
    const replyReceived=yes(first(r,["replyStatus"]))||!!first(r,["replyReceivedDate","replyReceivedFrom","replySummary"]);
    const sentToSection=!!first(r,["sentToSectionDate","concernedSection","officeReplySection"]);
    const stage=closed("rti",r)?"Disposed / Closed":rtiReplyDone(r)?"Reply sent to applicant":replyReceived?"Reply received":sentToSection?"Reply awaited":"RTI application received";
    return {stage,replyReceived,sentToSection,replySent:rtiReplyDone(r),finalStatus:closed("rti",r)?"Disposed / Closed":"Pending",dueLabel:dueLabel("rti",r)};
  }

  function dishaPomDisplay(r){
    if(yes(first(r,["pomUploaded","pomStatus"])))return "Yes";
    const d=recordDate("disha",r);if(!d)return "No";
    const days=diffDays(d,new Date());
    return days===null?"No":`${Math.max(days,0)} day(s) elapsed`;
  }
  function dishaWorkflow(r){
    const uploaded=yes(first(r,["pomUploaded","pomStatus"]));
    const statusText=cleanText(first(r,["statusOfMeeting","meetingStatus","status"]));
    let stage=statusText||"Meeting recorded";
    if(uploaded)stage="PoM Uploaded";else if(/held/i.test(statusText)||recordDate("disha",r))stage="PoM Not Uploaded";
    return {stage,pomUploaded:uploaded,pomDisplay:dishaPomDisplay(r)};
  }
  function workflow(module,r){if(module==="rti")return rtiWorkflow(r);if(module==="disha")return dishaWorkflow(r);return cpgramsWorkflow(r);}

  window.FMSRecordPolicy={CONFIG,TYPE_MAP,DISPLAY_TYPES,active,cleanText,normalizeKey,normalizeType,displayType,isQuestionType,rowType,first,yes,no,parseDate,formatDMY,formatISO,addDays,diffDays,fields,recordDate,currentFY,fyOfDate,inFY,filterFY,dueDate,dueLabel,status,closed,circulation,overdue,dueToday,withinDue,workflow,cpgramsWorkflow,rtiWorkflow,dishaWorkflow,dishaPomDisplay};
})(window);
