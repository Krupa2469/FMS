/* FMS Financial Year Utility - Version 5.2 */
(function(window){
"use strict";
function fyStartYear(date){ date=date||new Date(); const y=date.getFullYear(); return date.getMonth()>=3?y:y-1; }
function formatFY(y){ return `${y}-${String(y+1).slice(-2)}`; }
function getCurrentFY(){ return formatFY(fyStartYear(new Date())); }
function strictDate(y,m,d){
 y=Number(y);m=Number(m);d=Number(d);
 if(!Number.isInteger(y)||!Number.isInteger(m)||!Number.isInteger(d)) return null;
 if(y<1900||y>2100||m<1||m>12||d<1||d>31) return null;
 const out=new Date(y,m-1,d);
 if(isNaN(out.getTime())||out.getFullYear()!==y||out.getMonth()!==m-1||out.getDate()!==d) return null;
 return out;
}
function parseDate(value){
 if(!value) return null;
 if(value instanceof Date) return isNaN(value.getTime())?null:value;
 if(typeof value.toDate==="function") return value.toDate();
 if(typeof value==="object" && value.seconds!=null) return new Date(Number(value.seconds)*1000);
 if(typeof value==="object" && value._seconds!=null) return new Date(Number(value._seconds)*1000);
 const s=String(value).trim();
 if(!s) return null;
 let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
 if(m) return strictDate(m[1],m[2],m[3]);
 m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
 if(m) return strictDate(m[3],m[2],m[1]);
 const d=new Date(s); return isNaN(d.getTime())?null:d;
}
function recordFY(record, fields){
 fields=fields||["applicationDate","dateReceived","dateArised","dateOfMeeting","dateMeeting"];
 for(const f of fields){ const d=parseDate(record&&record[f]); if(d) return formatFY(fyStartYear(d)); }
 return "";
}
function filterFY(records, fy, fields){ return (records||[]).filter(r=>recordFY(r,fields)===fy); }
function getFYOptions(records, fields){
 // Financial-year master range: FY 2014-15 through the current FY.
 // Always populate the selector even when there are no records for a year.
 const MIN_FY_START_YEAR = 2014;
 const currentStart = fyStartYear(new Date());
 const set = new Set();
 for(let y=MIN_FY_START_YEAR; y<=currentStart; y++) set.add(formatFY(y));
 // Also retain any older/newer FYs that may already exist in stored records.
 (records||[]).forEach(r=>{ const fy=recordFY(r,fields); if(fy) set.add(fy); });
 return Array.from(set).sort((a,b)=>Number(b.slice(0,4))-Number(a.slice(0,4)));
}
function populateFYSelect(selectOrId, records, fields, preferredFY){
 const el = typeof selectOrId === "string" ? document.getElementById(selectOrId) : selectOrId;
 if(!el) return "";
 const options = getFYOptions(records, fields);
 const current = preferredFY || getCurrentFY();
 el.innerHTML = options.map(fy => `<option value="${fy}">${fy}</option>`).join("");
 el.value = options.includes(current) ? current : options[0] || "";
 return el.value;
}
window.FMSFY={getCurrentFY,recordFY,filterFY,getFYOptions,populateFYSelect,parseDate,formatFY};
})(window);
