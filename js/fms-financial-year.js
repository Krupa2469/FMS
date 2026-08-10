/* FMS Financial Year Utility - Version 5.2 */
(function(window){
"use strict";
function fyStartYear(date){ date=date||new Date(); const y=date.getFullYear(); return date.getMonth()>=3?y:y-1; }
function formatFY(y){ return `${y}-${String(y+1).slice(-2)}`; }
function getCurrentFY(){ return formatFY(fyStartYear(new Date())); }
function parseDate(value){
 if(!value) return null;
 if(value instanceof Date) return isNaN(value.getTime())?null:value;
 if(typeof value.toDate==="function") return value.toDate();
 if(typeof value==="object" && value.seconds!=null) return new Date(Number(value.seconds)*1000);
 if(typeof value==="object" && value._seconds!=null) return new Date(Number(value._seconds)*1000);
 const s=String(value).trim();
 if(!s) return null;
 if(/^\d{4}-\d{2}-\d{2}$/.test(s)){ const p=s.split("-").map(Number); return new Date(p[0],p[1]-1,p[2]); }
 const d=new Date(s); return isNaN(d.getTime())?null:d;
}
function recordFY(record, fields){
 fields=fields||["applicationDate","dateReceived","dateArised","dateOfMeeting","dateMeeting"];
 for(const f of fields){ const d=parseDate(record&&record[f]); if(d) return formatFY(fyStartYear(d)); }
 return "";
}
function filterFY(records, fy, fields){ return (records||[]).filter(r=>recordFY(r,fields)===fy); }
function getFYOptions(records, fields){
 const set=new Set((records||[]).map(r=>recordFY(r,fields)).filter(Boolean));
 set.add(getCurrentFY());
 return Array.from(set).sort((a,b)=>Number(b.slice(0,4))-Number(a.slice(0,4)));
}
window.FMSFY={getCurrentFY,recordFY,filterFY,getFYOptions,parseDate,formatFY};
})(window);
