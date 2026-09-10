"use strict";
/* ============================================================
   FMS OPERATIONAL RECORD POLICY - v1.2.6
   One source of truth for active-record, FY, status and due filters.
============================================================ */
(function(window){
  const CONFIG={
    cpgrams:{dateFields:["dateReceived","dateArised","receivedDate","questionReceivedDate","date"],dueFields:["dueDate"]},
    rti:{dateFields:["applicationDate","dateReceived","date"],dueFields:["dueDate"]},
    disha:{dateFields:["dateOfMeeting","meetingDate","proposedDateOfMeeting","date"],dueFields:["pomDueDate"]}
  };
  function active(r){return !!r&&r.active!==false;}
  function parseDate(v){
    if(!v)return null;
    if(v&&typeof v.toDate==="function")v=v.toDate();
    else if(v&&v.seconds!=null)v=new Date(Number(v.seconds)*1000);
    else if(v&&v._seconds!=null)v=new Date(Number(v._seconds)*1000);
    if(v instanceof Date)return Number.isNaN(v.getTime())?null:new Date(v.getTime());
    const s=String(v).trim();
    let m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(m)return new Date(+m[3],+m[2]-1,+m[1]);
    m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m)return new Date(+m[1],+m[2]-1,+m[3]);
    const d=new Date(v);return Number.isNaN(d.getTime())?null:d;
  }
  function fields(module){return CONFIG[module]?.dateFields||[];}
  function recordDate(module,r){for(const f of fields(module)){const d=parseDate(r?.[f]);if(d)return d;}return null;}
  function currentFY(){const d=new Date(),y=d.getFullYear(),start=d.getMonth()>=3?y:y-1;return `${start}-${String(start+1).slice(-2)}`;}
  function fyOfDate(d){if(!d)return "";const y=d.getMonth()>=3?d.getFullYear():d.getFullYear()-1;return `${y}-${String(y+1).slice(-2)}`;}
  function inFY(module,r,fy=currentFY()){return active(r)&&fyOfDate(recordDate(module,r))===fy;}
  function filterFY(module,rows,fy=currentFY()){return (rows||[]).filter(r=>inFY(module,r,fy));}
  function first(r,keys){for(const k of keys||[]){const v=r?.[k];if(v!==undefined&&v!==null&&String(v).trim()!=="")return v;}return "";}
  function status(module,r){
    if(module==="cpgrams")return String(first(r,["officeStatus","currentStatus","finalStatus","statusOfFile","questionFileStatus","status"])||"").trim().toLowerCase();
    if(module==="rti")return String(first(r,["officeStatus","presentStatus","currentStatus","statusOfFile","finalStatus","status"])||"").trim().toLowerCase();
    return String(first(r,["officeStatus","statusOfMeeting","currentStatus","status"])||"").trim().toLowerCase();
  }
  function closed(module,r){
    const s=status(module,r);
    if(module==="disha")return s==="held"||/completed|closed/.test(s);
    return /closed|disposed|reply obtained|despatched|completed|reply furnished|final reply|replied/.test(s);
  }
  function circulation(module,r){return /under circulation|circulation/.test([r?.officeStatus,r?.statusOfFile,r?.currentStatus,r?.presentStatus,r?.questionFileStatus,r?.status].map(v=>String(v||"").toLowerCase()).join(" | "));}
  function dueDate(module,r){for(const k of CONFIG[module]?.dueFields||[]){const d=parseDate(r?.[k]);if(d)return d;}return null;}
  function overdue(module,r){if(!active(r)||closed(module,r))return false;const d=dueDate(module,r);if(!d)return false;const t=new Date();t.setHours(0,0,0,0);d.setHours(0,0,0,0);return d<t;}
  function dueToday(module,r){if(!active(r)||closed(module,r))return false;const d=dueDate(module,r);if(!d)return false;const t=new Date();t.setHours(0,0,0,0);d.setHours(0,0,0,0);return d.getTime()===t.getTime();}
  window.FMSRecordPolicy={CONFIG,active,parseDate,fields,recordDate,currentFY,fyOfDate,inFY,filterFY,status,closed,circulation,dueDate,overdue,dueToday};
})(window);
