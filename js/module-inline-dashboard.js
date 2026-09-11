"use strict";
/* Common workflow dashboard cards embedded at the top of RTI and DISHA pages. CPGRAMS uses grievance-workspace.js. */
(function(){
  const host=document.getElementById("moduleDashboardCards");
  if(!host) return;
  const module=(document.body.dataset.fmsModule||"").toLowerCase();
  const cfg={
    rti:{collection:"rtiApplications",register:"rti-register.html"},
    disha:{collection:"dishaMeetings",register:"disha-register.html"}
  }[module];
  if(!cfg) return;
  const P=()=>window.FMSRecordPolicy;
  const esc=s=>String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c]));
  function currentFY(){return P()?.currentFY?.() || window.FMSFY?.getCurrentFY?.() || (()=>{const d=new Date(),y=d.getMonth()>=3?d.getFullYear():d.getFullYear()-1;return `${y}-${String(y+1).slice(-2)}`;})();}
  function getDb(){if(window.db)return window.db;if(window.fmsFirebase?.db)return window.fmsFirebase.db;try{if(typeof firebase!=="undefined"&&firebase.firestore)return firebase.firestore();}catch(_e){}return null;}
  function w(r){return P()?.workflow?.(module,r)||{};}
  function isClosed(r){return P()?.closed?.(module,r)||false;}
  function isOverdue(r){return P()?.overdue?.(module,r)||false;}
  function isDueToday(r){return P()?.dueToday?.(module,r)||false;}
  function withinDue(r){return P()?.withinDue?.(module,r)||(!isClosed(r)&&!isOverdue(r)&&!isDueToday(r));}
  function card(label,value,filter,icon,theme){const href=`${cfg.register}?filter=${encodeURIComponent(filter)}&fy=${encodeURIComponent(currentFY())}`;return `<div class="col-6 col-md-4 col-lg-3 col-xl-2"><a class="text-decoration-none text-reset" href="${href}"><div class="card h-100 shadow-sm border-0 fms-inline-metric-card"><div class="card-body text-center py-2 px-2"><div class="fs-4 text-${theme}"><i class="bi ${icon}"></i></div><div class="text-muted small mt-1 lh-sm">${esc(label)}</div><div class="fs-3 fw-bold text-${theme} lh-1">${esc(value)}</div><div class="small text-primary mt-1 lh-sm">View filtered data <i class="bi bi-arrow-right"></i></div></div></div></a></div>`;}
  function render(rows){
    const fy=currentFY();rows=(rows||[]).filter(r=>P()?P().inFY(module,r,fy):true);
    const statusEl=document.getElementById("moduleDashboardStatus");let cards=[];
    if(module==="rti"){
      cards=[
        ["Total RTI Applications",rows.length,"total","bi-collection","primary"],
        ["Within Due Date",rows.filter(withinDue).length,"within-due","bi-calendar-check","success"],
        ["Due Today",rows.filter(isDueToday).length,"due-today","bi-calendar-event","warning"],
        ["Overdue",rows.filter(isOverdue).length,"overdue","bi-exclamation-triangle","danger"],
        ["Sent to Section",rows.filter(r=>w(r).sentToSection).length,"sent-section","bi-send","info"],
        ["Reply Awaited",rows.filter(r=>w(r).sentToSection&&!w(r).replyReceived&&!isClosed(r)).length,"reply-awaited","bi-hourglass-split","warning"],
        ["Reply Received",rows.filter(r=>w(r).replyReceived).length,"reply-received","bi-inbox","success"],
        ["Reply Sent to Applicant",rows.filter(r=>w(r).replySent).length,"reply-sent","bi-send-check","success"],
        ["Disposed / Closed",rows.filter(isClosed).length,"closed","bi-check-circle","success"]
      ];
    } else {
      const held=rows.filter(r=>/held/i.test(String(r.statusOfMeeting||r.meetingStatus||r.status||""))).length;
      const postponed=rows.filter(r=>/postponed/i.test(String(r.statusOfMeeting||r.meetingStatus||r.status||""))).length;
      const uploaded=rows.filter(r=>w(r).pomUploaded).length;
      const notUploaded=rows.filter(r=>!w(r).pomUploaded).length;
      const pending07=rows.filter(r=>!w(r).pomUploaded && ((P()?.diffDays?.(P()?.recordDate?.("disha",r),new Date())||0)>=0) && ((P()?.diffDays?.(P()?.recordDate?.("disha",r),new Date())||0)<=7)).length;
      const pending815=rows.filter(r=>{const d=P()?.diffDays?.(P()?.recordDate?.("disha",r),new Date());return !w(r).pomUploaded&&d!=null&&d>=8&&d<=15;}).length;
      const pending15=rows.filter(r=>{const d=P()?.diffDays?.(P()?.recordDate?.("disha",r),new Date());return !w(r).pomUploaded&&d!=null&&d>15;}).length;
      const districts=new Set(rows.filter(r=>!w(r).pomUploaded).map(r=>String(r.district||r.nameOfDistrict||"").trim()).filter(Boolean));
      cards=[
        ["Total Meetings",rows.length,"total","bi-calendar3","primary"],
        ["Meetings Held",held,"held","bi-check-circle","success"],
        ["PoM Uploaded",uploaded,"pom-uploaded","bi-cloud-check","success"],
        ["PoM Not Uploaded",notUploaded,"pom-not-uploaded","bi-cloud-arrow-up","warning"],
        ["PoM Pending 0–7 Days",pending07,"pom-0-7","bi-clock","info"],
        ["PoM Pending 8–15 Days",pending815,"pom-8-15","bi-clock-history","warning"],
        ["PoM Pending >15 Days",pending15,"pom-15-plus","bi-exclamation-triangle","danger"],
        ["Districts Pending PoM",districts.size,"districts-pending","bi-geo-alt","secondary"],
        ["Postponed Meetings",postponed,"postponed","bi-calendar-x","warning"]
      ];
    }
    host.innerHTML=cards.map(x=>card(...x)).join("");
    if(statusEl){statusEl.className="alert alert-success py-2 mb-3";statusEl.textContent=`${module.toUpperCase()} workflow dashboard • Financial Year ${fy} • ${rows.length} record(s)`;}
  }
  async function load(){const s=document.getElementById("moduleDashboardStatus"),db=getDb();if(!db){if(s){s.className="alert alert-warning py-2 mb-3";s.textContent="Dashboard is waiting for Firebase...";}return false;}try{const snap=await db.collection(cfg.collection).get();render(snap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>P()?P().active(r):r.active!==false));return true;}catch(e){console.error(`${module} inline dashboard error`,e);if(s){s.className="alert alert-danger py-2 mb-3";s.textContent="Unable to load dashboard: "+(e.message||e);}return false;}}
  async function start(){if(await load())return;window.addEventListener("fmsFirebaseReady",load,{once:true});setTimeout(load,1800);}
  document.addEventListener("DOMContentLoaded",start);window.FMSInlineDashboard={refresh:load};
})();
