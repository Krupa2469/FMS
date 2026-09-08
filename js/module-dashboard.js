/*==========================================================
 FMS MODULE DASHBOARD - Enhanced
 Preserves existing module dashboard functions while adding:
 - FMS Home / CPGRAMS / RTI / DISHA navigation
 - Financial Year filter
 - CPGRAMS category dashboard selector
 - DISHA quarter filter and requested metrics
==========================================================*/
"use strict";

const moduleConfig = {
  cpgrams:{name:"CPGRAMS",collection:"cpgrams",newPage:"../modules/cpgrams/cpgrams.html",register:"../modules/cpgrams/cpgrams-register.html",daily:"../modules/cpgrams/cpgrams-register.html",report:"reports.html?module=cpgrams",dateFields:["dateReceived","dateArised","receivedDate"]},
  rti:{name:"RTI",collection:"rtiApplications",newPage:"../modules/rti/rti.html",register:"../modules/rti/rti-register.html",daily:"../modules/rti/rti-daily-status.html",report:"reports.html?module=rti",dateFields:["applicationDate","date"]},
  disha:{name:"DISHA",collection:"dishaMeetings",newPage:"../modules/disha/disha.html",register:"../modules/disha/disha-register.html",daily:"../modules/disha/disha-daily-status.html",report:"reports.html?module=disha",dateFields:["dateOfMeeting","meetingDate"]}
};
let mod=(new URLSearchParams(location.search).get("module")||"cpgrams").toLowerCase();
if(!moduleConfig[mod]) mod="cpgrams";
let allRows=[];
let selectedFY="";
let selectedCategory=new URLSearchParams(location.search).get("category")||"CPGRAMS";
let selectedQuarter="ALL";

const CPGRAMS_CATEGORIES=["CPGRAMS","Prajavani","Public Grievances","Direct Complaints","Assembly Questions","Court Cases","VIP References","CMO References","PMO References","Audit Paras","Vigilance Cases"];
function parseDate(v){if(window.FMSFY?.parseDate)return window.FMSFY.parseDate(v);if(!v)return null;if(v&&typeof v.toDate==="function")return v.toDate();if(v&&v.seconds!=null)return new Date(Number(v.seconds)*1000);const d=new Date(v);return Number.isNaN(d.getTime())?null:d;}
function recordDate(row){for(const f of moduleConfig[mod].dateFields){const d=parseDate(row?.[f]);if(d)return d;}return null;}
function normalizeStatus(row){return String(row.officeStatus||row.statusOfFile||row.currentStatus||row.presentStatus||row.statusOfMeeting||row.status||"").trim().toLowerCase();}
function isClosed(status){return /closed|disposed|reply obtained|despatched|completed/.test(status);}
function isHeld(row){return /held/.test(normalizeStatus(row));}
function isPomUploaded(row){return /yes|uploaded|completed/i.test(String(row.pomUploaded||row.pomStatus||""));}
function fyOfDate(d){return window.FMSFY?.formatFY ? window.FMSFY.formatFY(d.getMonth()>=3?d.getFullYear():d.getFullYear()-1) : "";}
function inSelectedFY(row){const d=recordDate(row);return !!d && fyOfDate(d)===selectedFY;}
function quarterOfDate(d){if(!d)return "";const m=d.getMonth()+1;return m>=4&&m<=6?"Q1":m>=7&&m<=9?"Q2":m>=10&&m<=12?"Q3":"Q4";}
function categoryKey(value){return String(value||"").trim().toLowerCase().replace(/\s+/g," ").replace(/\bcomplaint\b/g,"complaints").replace(/\breference\b/g,"references").replace(/\bpara\b/g,"paras");}
function categoryOf(row){return categoryKey(row.category||row.grievanceType||row.referenceType||row.source||row.type||"");}
function categoryMatches(row){if(mod!=="cpgrams")return true;const selected=categoryKey(selectedCategory);const actual=categoryOf(row);if(selected==="cpgrams") return !actual || ["cpgrams","cpgrams portal","cpgram"].includes(actual);return actual===selected;}
function quarterMatches(row){if(mod!=="disha"||selectedQuarter==="ALL")return true;return quarterOfDate(recordDate(row))===selectedQuarter;}
function card(label,value,icon,cls,targetUrl){return `<div class="col-12 col-sm-6 col-lg-4 col-xl-3"><a href="${targetUrl||'#'}" class="text-decoration-none text-reset dashboard-card-link"><div class="card metric-card h-100 dashboard-metric-card"><div class="card-body text-center"><div class="metric-icon text-${cls}"><i class="bi ${icon}"></i></div><div class="text-muted small mt-2">${label}</div><div class="metric-value text-${cls}">${value}</div><div class="small text-primary mt-2">View records <i class="bi bi-arrow-right"></i></div></div></div></a></div>`;}
function showStatus(message,type="info"){const el=document.getElementById("dashboardStatus");if(!el)return;el.className=`alert alert-${type}`;el.textContent=message;el.classList.remove("d-none");}
function setupFilters(){
 document.getElementById("moduleTitle").textContent=`${moduleConfig[mod].name} — DASHBOARD`;
 const fy=document.getElementById("moduleFY");
 const options=window.FMSFY?.getFYOptions ? window.FMSFY.getFYOptions(allRows, moduleConfig[mod].dateFields) : [window.FMSFY?.getCurrentFY?.()||"2026-27"];
 if(window.FMSFY?.populateFYSelect){ window.FMSFY.populateFYSelect(fy, allRows, moduleConfig[mod].dateFields); } else { fy.innerHTML=options.map(x=>`<option value="${x}">${x}</option>`).join(""); }
 selectedFY=fy.value || (window.FMSFY?.getCurrentFY?window.FMSFY.getCurrentFY():fyOfDate(new Date())); fy.value=selectedFY;
 const cwrap=document.getElementById("cpgramsFilterWrap"), qwrap=document.getElementById("dishaQuarterWrap");
 if(mod==="cpgrams"){cwrap.classList.remove("d-none");qwrap.classList.add("d-none");}
 else if(mod==="disha"){cwrap.classList.add("d-none");qwrap.classList.remove("d-none");}
 else{cwrap.classList.add("d-none");qwrap.classList.add("d-none");}
 fy.onchange=()=>{selectedFY=fy.value;renderDashboard();};
 document.getElementById("cpgramsCategory").value=CPGRAMS_CATEGORIES.includes(selectedCategory)?selectedCategory:"CPGRAMS";
 document.getElementById("cpgramsCategory").onchange=e=>{selectedCategory=e.target.value||"CPGRAMS"; const url=new URL(location.href); url.searchParams.set("module","cpgrams"); url.searchParams.set("category",selectedCategory); history.pushState({module:"cpgrams",category:selectedCategory},"",url); renderDashboard();};
 document.getElementById("dishaQuarter").onchange=e=>{selectedQuarter=e.target.value;renderDashboard();};
}
function renderDashboard(){
 let rows=allRows.filter(inSelectedFY).filter(categoryMatches).filter(quarterMatches);
 const cfg=moduleConfig[mod];
 if(mod==="disha"){
   const heldRows=rows.filter(isHeld);
   const districts=new Set(heldRows.map(r=>String(r.district||r.districtName||r.nameOfDistrict||"").trim()).filter(Boolean));
   const pomUploaded=rows.filter(isPomUploaded).length;
   const today=new Date();today.setHours(0,0,0,0);
   const pomOverdue=rows.filter(r=>{const due=parseDate(r.pomDueDate);return due&&!isPomUploaded(r)&&new Date(due.getFullYear(),due.getMonth(),due.getDate())<today;}).length;
   document.getElementById("cards").innerHTML=[
     card("Total Meetings held",heldRows.length,"bi-check-circle","success",cfg.register+"?filter=held"),
     card("No. of districts conducted meeting",districts.size,"bi-geo-alt","primary",cfg.register+"?filter=held"),
     card("PoM Uploaded",pomUploaded,"bi-cloud-check","info",cfg.register+"?filter=pom-uploaded"),
     card("PoM overdue",pomOverdue,"bi-exclamation-triangle","danger",cfg.register+"?filter=pom-overdue")
   ].join("");
   document.getElementById("lastUpdated").textContent=`Last refreshed: ${new Date().toLocaleString("en-IN")} • FY ${selectedFY} • Quarter: ${selectedQuarter==='ALL'?'All Quarters':selectedQuarter} • ${rows.length} DISHA record(s).`;
   showStatus(`Dashboard ready — DISHA: ${rows.length} current-FY record(s).`+ (selectedQuarter!=="ALL"?` ${selectedQuarter} selected.`:""),"success");
   return;
 }
 let pending=0,circulation=0,closed=0,overdue=0,dueToday=0;const today=new Date();today.setHours(0,0,0,0);
 rows.forEach(row=>{const status=normalizeStatus(row),done=isClosed(status);if(done)closed++;else pending++;if(/under circulation|circulation/.test(status))circulation++;const due=parseDate(row.dueDate);if(due&&!done){const d=new Date(due);d.setHours(0,0,0,0);if(d<today)overdue++;if(d.getTime()===today.getTime())dueToday++;}});
 const labels=mod==="cpgrams"?[`Total ${selectedCategory}`,"Pending","Under Circulation","Disposed / Closed","Overdue","Due Today"]:["Total RTI Applications","Pending","Under Circulation","Closed","Overdue","Due Today"];
 const values=[rows.length,pending,circulation,closed,overdue,dueToday];const icons=["bi-collection","bi-hourglass-split","bi-arrow-repeat","bi-check-circle","bi-exclamation-triangle","bi-calendar-event"];const classes=["primary","warning","info","success","danger","secondary"];const filters=["total","pending","circulation","closed","overdue","due-today"];
 document.getElementById("cards").innerHTML=labels.map((l,i)=>card(l,values[i],icons[i],classes[i],`${cfg.register}?filter=${encodeURIComponent(filters[i])}`)).join("");
 document.getElementById("lastUpdated").textContent=`Last refreshed: ${new Date().toLocaleString("en-IN")} • FY ${selectedFY} • ${rows.length} ${cfg.name} record(s).`;
 showStatus(`Dashboard ready — ${cfg.name}${mod==="cpgrams"?` (${selectedCategory})`:""}: ${rows.length} current-FY record(s).`,"success");
}
async function loadDashboard(){
 const cfg=moduleConfig[mod];if(!window.db){showStatus("Firebase is not ready. Please wait a moment and refresh the dashboard.","warning");return;}
 try{showStatus("Loading latest data from Firestore...","info");const snap=await window.db.collection(cfg.collection).get();allRows=snap.docs.map(doc=>({id:doc.id,...doc.data()}));setupFilters();renderDashboard();}catch(error){console.error("Module dashboard error:",error);showStatus(`Unable to load ${cfg.name} dashboard: ${error.message||error}`,"danger");document.getElementById("cards").innerHTML="";}}
async function openModuleWhatsAppComposer(){const cfg=moduleConfig[mod];if(!window.FMSWhatsAppService?.compose){showStatus("WhatsApp service is not loaded.","danger");return;}await window.FMSWhatsAppService.compose({module:cfg.name,title:`${cfg.name} Dashboard Message`,defaultMessage:`${cfg.name} Dashboard Update\nFY: ${selectedFY}\nStatus as on: ${new Date().toLocaleDateString("en-IN")}\n\nPlease type or edit the message you want to send.`,message:(m,t)=>showStatus(m,t||"info")});}
function wireButtons(){const cfg=moduleConfig[mod];const go=url=>location.href=url;document.getElementById("btnNew")?.addEventListener("click",()=>go(cfg.newPage));document.getElementById("btnNew2")?.addEventListener("click",()=>go(cfg.newPage));document.getElementById("btnRegister")?.addEventListener("click",()=>go(cfg.register));document.getElementById("btnDaily")?.addEventListener("click",()=>go(cfg.daily));document.getElementById("btnDaily2")?.addEventListener("click",()=>go(cfg.daily));document.getElementById("btnReports")?.addEventListener("click",()=>go(cfg.report));document.getElementById("btnReport2")?.addEventListener("click",()=>go(cfg.report));document.getElementById("btnMasters")?.addEventListener("click",()=>go("admin/master-management.html"));document.getElementById("btnHome")?.addEventListener("click",()=>go("../index.html"));document.getElementById("btnCPGRAMS")?.addEventListener("click",()=>go("module-dashboard.html?module=cpgrams"));document.getElementById("btnRTI")?.addEventListener("click",()=>go("module-dashboard.html?module=rti"));document.getElementById("btnDISHA")?.addEventListener("click",()=>go("module-dashboard.html?module=disha"));document.getElementById("btnRefresh")?.addEventListener("click",loadDashboard);const wa=document.getElementById("btnWhatsApp");if(wa)wa.onclick=openModuleWhatsAppComposer;}
function startDashboard(){wireButtons();loadDashboard();}
document.addEventListener("DOMContentLoaded",()=>{if(window.fmsFirebaseReady&&window.db)startDashboard();else{window.addEventListener("fmsFirebaseReady",startDashboard,{once:true});setTimeout(()=>{if(window.db&&!document.getElementById("lastUpdated")?.textContent?.includes("Last refreshed"))startDashboard();},1500);}});

window.addEventListener("popstate",()=>{
 const params=new URLSearchParams(location.search);
 const newMod=(params.get("module")||"cpgrams").toLowerCase();
 const newCat=params.get("category")||"CPGRAMS";
 if(newMod!==mod){ location.reload(); return; }
 selectedCategory=CPGRAMS_CATEGORIES.includes(newCat)?newCat:"CPGRAMS";
 const select=document.getElementById("cpgramsCategory");
 if(select) select.value=selectedCategory;
 renderDashboard();
});
