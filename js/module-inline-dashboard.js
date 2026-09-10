"use strict";
/* Common dashboard cards embedded at the top of CPGRAMS, RTI and DISHA data-entry pages. */
(function(){
  const host=document.getElementById("moduleDashboardCards");
  if(!host) return;
  const module=(document.body.dataset.fmsModule||"").toLowerCase();
  const cfg={
    cpgrams:{collection:"cpgrams",register:"cpgrams-register.html",dateFields:["dateReceived","dateArised","receivedDate","questionReceivedDate","date"]},
    rti:{collection:"rtiApplications",register:"rti-register.html",dateFields:["applicationDate","dateReceived","date"]},
    disha:{collection:"dishaMeetings",register:"disha-register.html",dateFields:["dateOfMeeting","meetingDate","proposedDateOfMeeting","date"]}
  }[module];
  if(!cfg) return;

  const esc=s=>String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c]));
  function parseDate(v){
    if(!v) return null;
    if(v&&typeof v.toDate==="function") return v.toDate();
    if(v&&v.seconds!=null) return new Date(Number(v.seconds)*1000);
    if(v&&v._seconds!=null) return new Date(Number(v._seconds)*1000);
    if(v instanceof Date) return v;
    const s=String(v).trim();
    let m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if(m) return new Date(+m[3],+m[2]-1,+m[1]);
    m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(m) return new Date(+m[1],+m[2]-1,+m[3]);
    const d=new Date(v); return Number.isNaN(d.getTime())?null:d;
  }
  function rowDate(r){for(const f of cfg.dateFields){const d=parseDate(r?.[f]);if(d)return d;}return null;}
  function currentFY(){const d=new Date(), y=d.getFullYear(), start=d.getMonth()>=3?y:y-1;return `${start}-${String(start+1).slice(-2)}`;}
  function fyOf(d){if(!d)return "";const y=d.getMonth()>=3?d.getFullYear():d.getFullYear()-1;return `${y}-${String(y+1).slice(-2)}`;}
  function status(r){
    const value=module==="cpgrams" ? (r.currentStatus||r.statusOfFile||r.officeStatus||r.status)
      : module==="rti" ? (r.presentStatus||r.currentStatus||r.statusOfFile||r.officeStatus||r.status)
      : (r.statusOfMeeting||r.currentStatus||r.status);
    return String(value||"").trim().toLowerCase();
  }
  function isCirculation(r){return window.FMSRecordPolicy?window.FMSRecordPolicy.circulation(module,r):/under circulation|circulation/.test([r.officeStatus,r.statusOfFile,r.currentStatus,r.presentStatus,r.questionFileStatus,r.status].map(v=>String(v||"").toLowerCase()).join(" | "));}
  function closed(s,r){return window.FMSRecordPolicy?window.FMSRecordPolicy.closed(module,r):/closed|disposed|reply obtained|despatched|completed|reply furnished|final reply|replied/.test(s);}
  function due(r){return parseDate(r.dueDate||r.pomDueDate);}
  function pomUploaded(r){return /yes|uploaded|completed/i.test(String(r.pomUploaded||r.pomStatus||""));}
  function isOverdue(r, isDone){const d=due(r);if(!d||isDone)return false;const t=new Date();t.setHours(0,0,0,0);d.setHours(0,0,0,0);return d<t;}
  function isDueToday(r,isDone){const d=due(r);if(!d||isDone)return false;const t=new Date();t.setHours(0,0,0,0);d.setHours(0,0,0,0);return d.getTime()===t.getTime();}
  function card(label,value,filter,icon,theme){
    const href=`${cfg.register}?filter=${encodeURIComponent(filter)}&fy=${encodeURIComponent(currentFY())}`;
    return `<div class="col-12 col-sm-6 col-lg-4 col-xl-3"><a class="text-decoration-none text-reset" href="${href}" aria-label="${esc(label)}: ${esc(value)}. View filtered records"><div class="card h-100 shadow-sm border-0 fms-inline-metric-card"><div class="card-body text-center"><div class="fs-2 text-${theme}"><i class="bi ${icon}"></i></div><div class="text-muted small mt-2">${esc(label)}</div><div class="display-6 fw-bold text-${theme}">${esc(value)}</div><div class="small text-primary mt-2">View filtered data <i class="bi bi-arrow-right"></i></div></div></div></a></div>`;
  }
  function getDb(){
    if(window.db) return window.db;
    if(window.fmsFirebase?.db) return window.fmsFirebase.db;
    try{if(typeof firebase!=="undefined"&&firebase.firestore)return firebase.firestore();}catch(_e){}
    return null;
  }
  function render(rows){
    const fy=currentFY();
    rows=window.FMSRecordPolicy
      ? window.FMSRecordPolicy.filterFY(module,rows,fy)
      : rows.filter(r=>r.active!==false&&fyOf(rowDate(r))===fy);
    const statusEl=document.getElementById("moduleDashboardStatus");
    let cards=[];
    if(module==="cpgrams"){
      let pending=0,circulation=0,done=0,overdue=0,dueToday=0;
      rows.forEach(r=>{const s=status(r),isDone=closed(s,r);if(isDone)done++;else pending++;if(isCirculation(r))circulation++;if(isOverdue(r,isDone))overdue++;if(isDueToday(r,isDone))dueToday++;});
      cards=[
        ["Total Grievances",rows.length,"total","bi-collection","primary"],["Pending",pending,"pending","bi-hourglass-split","warning"],["Under Circulation",circulation,"circulation","bi-arrow-repeat","info"],["Disposed / Closed",done,"closed","bi-check-circle","success"],["Overdue",overdue,"overdue","bi-exclamation-triangle","danger"],["Due Today",dueToday,"due-today","bi-calendar-event","secondary"]
      ];
    }else if(module==="rti"){
      let pending=0,overdue=0,done=0,circulation=0,dueToday=0;
      rows.forEach(r=>{const s=status(r),isDone=closed(s,r);if(isDone)done++;else pending++;if(isCirculation(r))circulation++;if(isOverdue(r,isDone))overdue++;if(isDueToday(r,isDone))dueToday++;});
      cards=[
        ["Total RTI Applications",rows.length,"total","bi-collection","primary"],["Pending",pending,"pending","bi-hourglass-split","warning"],["Under Circulation",circulation,"circulation","bi-arrow-repeat","info"],["Completed / Disposed",done,"completed","bi-check-circle","success"],["Overdue",overdue,"overdue","bi-exclamation-triangle","danger"],["Due Today",dueToday,"due-today","bi-calendar-event","secondary"]
      ];
    }else{
      const held=rows.filter(r=>status(r)==="held").length;
      const postponed=rows.filter(r=>status(r)==="postponed").length;
      const toBeHeld=rows.filter(r=>{const s=status(r);const d=parseDate(r.proposedDateOfMeeting||r.dateOfMeeting);return s==="to be held" || (!!d && d>=new Date() && s!=="held"&&s!=="postponed");}).length;
      const uploaded=rows.filter(pomUploaded).length;
      const awaiting=rows.filter(r=>!pomUploaded(r)).length;
      const overdue=rows.filter(r=>isOverdue(r,pomUploaded(r))).length;
      cards=[
        ["Total Meetings",rows.length,"total","bi-calendar3","primary"],["Meetings Held",held,"held","bi-check-circle","success"],["Meetings To Be Held",toBeHeld,"tobeheld","bi-calendar-plus","info"],["Meetings Postponed",postponed,"postponed","bi-calendar-x","warning"],["PoM Uploaded",uploaded,"uploaded","bi-cloud-check","success"],["PoM Awaiting Upload",awaiting,"awaiting","bi-cloud-arrow-up","warning"],["PoM Overdue",overdue,"overdue","bi-exclamation-triangle","danger"]
      ];
    }
    host.innerHTML=cards.map(x=>card(...x)).join("");
    if(statusEl){statusEl.className="alert alert-success py-2 mb-3";statusEl.textContent=`Dashboard ready • Financial Year ${fy} • ${rows.length} record(s)`;}
  }
  async function load(){
    const statusEl=document.getElementById("moduleDashboardStatus");
    const db=getDb();
    if(!db){if(statusEl){statusEl.className="alert alert-warning py-2 mb-3";statusEl.textContent="Dashboard is waiting for Firebase...";}return false;}
    try{
      const snap=await db.collection(cfg.collection).get();
      render(snap.docs.map(d=>({id:d.id,...d.data()})));
      return true;
    }catch(e){console.error(`${module} inline dashboard error`,e);if(statusEl){statusEl.className="alert alert-danger py-2 mb-3";statusEl.textContent="Unable to load dashboard: "+(e.message||e);}return false;}
  }
  async function start(){if(await load())return;window.addEventListener("fmsFirebaseReady",load,{once:true});setTimeout(load,1800);}
  document.addEventListener("DOMContentLoaded",start);
  window.FMSInlineDashboard={refresh:load};
})();
