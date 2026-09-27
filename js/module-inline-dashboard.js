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
  function selectedFY(){const home=document.getElementById("dishaWorkspaceFY")?.value; if(home&&/^\d{4}-\d{2}$/.test(home))return home; const q=new URLSearchParams(location.search).get("fy");return q&&/^\d{4}-\d{2}$/.test(q)?q:currentFY();}
  function asDate(v){if(!v)return null;if(v?.toDate)return v.toDate();const d=new Date(v);return Number.isNaN(d.getTime())?null:d;}
  function recordFY(r){const d=asDate(r?.dateOfMeeting||r?.meetingDate||r?.proposedDateOfMeeting||r?.date);if(d){const y=d.getMonth()>=3?d.getFullYear():d.getFullYear()-1;return `${y}-${String(y+1).slice(-2)}`;}return String(r?.financialYear||r?.fy||"").trim();}
  function getDb(){if(window.db)return window.db;if(window.fmsFirebase?.db)return window.fmsFirebase.db;try{if(typeof firebase!=="undefined"&&firebase.firestore)return firebase.firestore();}catch(_e){}return null;}
  function w(r){return P()?.workflow?.(module,r)||{};}
  function isClosed(r){return P()?.closed?.(module,r)||false;}
  function isOverdue(r){return P()?.overdue?.(module,r)||false;}
  function isDueToday(r){return P()?.dueToday?.(module,r)||false;}
  function withinDue(r){return P()?.withinDue?.(module,r)||(!isClosed(r)&&!isOverdue(r)&&!isDueToday(r));}
  function metricLink(value,filter,scope,theme,fy){const href=`${cfg.register}?filter=${encodeURIComponent(filter)}${scope==="fy"?`&fy=${encodeURIComponent(fy)}`:""}`;return `<a class="text-${theme} text-decoration-none fw-bold" href="${href}">${esc(value)}</a>`;}
  function card(label,value,filter,icon,theme){const valueClass=String(value??"").length>8?"fs-6 lh-sm":"fs-3 lh-1";return `<div class="col-6 col-md-4 col-lg-3 col-xl-2"><div class="card h-100 shadow-sm border-0 fms-inline-metric-card"><div class="card-body text-center py-2 px-2"><div class="fs-4 text-${theme}"><i class="bi ${icon}"></i></div><div class="text-muted small mt-1 lh-sm">${esc(label)}</div><div class="${valueClass} fw-bold text-${theme}">${value}</div></div></div></div>`;}
  function render(rows){
    const fy=selectedFY(); if(module!=="disha") rows=(rows||[]).filter(r=>P()?P().inFY(module,r,fy):true);
    const statusEl=document.getElementById("moduleDashboardStatus");let cards=[];
    let dashboardFyRows=rows||[], dashboardAllRows=rows||[];
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
      const allRows=[...(rows||[])].filter(r=>r && r.active!==false && r.deleted!==true);
      const fyRows=allRows.filter(r=>recordFY(r)===fy);
      dashboardAllRows=allRows; dashboardFyRows=fyRows;
      const hasMeetingDate=r=>!!asDate(r?.dateOfMeeting||r?.meetingDate||r?.proposedDateOfMeeting);
      const heldRows=allRows.filter(hasMeetingDate);
      const heldFY=fyRows.filter(hasMeetingDate);
      const uploaded=fyRows.filter(r=>w(r).pomUploaded).length;
      const notUploaded=fyRows.filter(r=>hasMeetingDate(r)&&!w(r).pomUploaded).length;
      const pendingRows=fyRows.filter(r=>{
        if(w(r).pomUploaded) return false;
        const d=P()?.recordDate?.("disha",r);
        return d && P()?.diffDays?.(d,new Date())>=0;
      });
      const pendingDays=pendingRows.map(r=>P()?.diffDays?.(P()?.recordDate?.("disha",r),new Date())||0);
      const maxPending=pendingDays.length?Math.max(...pendingDays):0;
      const districtCount=33;
      const norm=v=>String(v||"").trim().toLowerCase();
      const conductedAll=new Set(heldRows.map(r=>norm(r.district||r.nameOfDistrict)).filter(Boolean)).size;
      const conductedFY=new Set(heldFY.map(r=>norm(r.district||r.nameOfDistrict)).filter(Boolean)).size;
      const noMeetAll=Math.max(0,districtCount-conductedAll);
      const noMeetFY=Math.max(0,districtCount-conductedFY);
      cards=[
        ["Meetings Held",`Total: ${metricLink(heldRows.length,"held","all","primary",fy)} • ${esc(fy)}: ${metricLink(heldFY.length,"held","fy","primary",fy)}`,"held","bi-calendar-check","primary"],
        ["PoM Uploaded",metricLink(uploaded,"pom-uploaded","fy","success",fy),"pom-uploaded","bi-cloud-check","success"],
        ["PoM Not Uploaded",metricLink(notUploaded,"pom-not-uploaded","fy","danger",fy),"pom-not-uploaded","bi-cloud-slash","danger"],
        ["PoM Pending",`${metricLink(pendingRows.length,"pom-pending","fy","warning",fy)} pending • ${esc(maxPending)} day(s) after meeting`,"pom-pending","bi-clock-history","warning"],
        ["Districts with no meetings",`Total: ${metricLink(noMeetAll,"districts-no-meetings","all","danger",fy)} • ${esc(fy)}: ${metricLink(noMeetFY,"districts-no-meetings","fy","danger",fy)}`,"districts-no-meetings","bi-geo-alt","danger"],
        ["Districts conducted meetings",`Total: ${metricLink(conductedAll,"districts-conducted","all","success",fy)} • ${esc(fy)}: ${metricLink(conductedFY,"districts-conducted","fy","success",fy)}`,"districts-conducted","bi-geo-alt-fill","success"]
      ];
    }
    host.innerHTML=cards.map(x=>card(...x)).join("");
    if(statusEl){statusEl.className="alert alert-success py-2 mb-3";statusEl.textContent=module==="disha"?`DISHA workflow dashboard • Financial Year ${fy}: ${dashboardFyRows.length} record(s) • All years: ${dashboardAllRows.length} record(s)`:`${module.toUpperCase()} workflow dashboard • Financial Year ${fy} • ${rows.length} record(s)`;}
  }
  async function load(){const s=document.getElementById("moduleDashboardStatus"),db=getDb();if(!db){if(s){s.className="alert alert-warning py-2 mb-3";s.textContent="Dashboard is waiting for Firebase...";}return false;}try{const snap=await db.collection(cfg.collection).get();render(snap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>P()?P().active(r):r.active!==false));return true;}catch(e){console.error(`${module} inline dashboard error`,e);if(s){s.className="alert alert-danger py-2 mb-3";s.textContent="Unable to load dashboard: "+(e.message||e);}return false;}}
  async function start(){if(await load())return;window.addEventListener("fmsFirebaseReady",load,{once:true});setTimeout(load,1800);}
  document.addEventListener("DOMContentLoaded",start);window.FMSInlineDashboard={refresh:load};
})();
