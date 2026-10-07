"use strict";
/* FMS v1.10.25 - Common module title + streamlined navigation row + bottom form actions */
(function(window,document){
  const TYPE_LINKS=[
    {key:"cpgrams",label:"CPGRAMS",icon:"▣",href:"../cpgrams/cpgrams.html?grievanceType=CPGRAMS"},
    {key:"prajavani",label:"Prajavani",icon:"◉",href:"../cpgrams/cpgrams.html?grievanceType=Prajavani"},
    {key:"public-grievances",label:"Public Grievances",icon:"▤",href:"../cpgrams/cpgrams.html?grievanceType=Public%20Grievances"},
    {key:"direct-complaints",label:"Direct Complaints",icon:"♙",href:"../cpgrams/cpgrams.html?grievanceType=Direct%20Complaints"},
    {key:"laq",label:"LAQ",icon:"?",href:"../cpgrams/cpgrams.html?grievanceType=LAQ"},
    {key:"lcq",label:"LCQ",icon:"◇",href:"../cpgrams/cpgrams.html?grievanceType=LCQ"},
    {key:"court-cases",label:"Court Cases",icon:"▥",href:"../cpgrams/cpgrams.html?grievanceType=Court%20Cases"},
    {key:"vip-references",label:"VIP References",icon:"☆",href:"../cpgrams/cpgrams.html?grievanceType=VIP%20References"},
    {key:"cmo-references",label:"CMO References",icon:"▣",href:"../cpgrams/cpgrams.html?grievanceType=CMO%20References"},
    {key:"pmo-references",label:"PMO References",icon:"✉",href:"../cpgrams/cpgrams.html?grievanceType=PMO%20References"},
    {key:"audit-paras",label:"Audit Paras",icon:"✓",href:"../cpgrams/cpgrams.html?grievanceType=Audit%20Paras"},
    {key:"vigilance-cases",label:"Vigilance Cases",icon:"!",href:"../cpgrams/cpgrams.html?grievanceType=Vigilance%20Cases"},
    {key:"rti",label:"RTI",icon:"▤",href:"../rti/rti.html"},
    {key:"disha",label:"DISHA",icon:"♧",href:"../disha/disha.html"},
    {key:"utilities",label:"Utilities",icon:"⚒",href:"../../pages/utilities.html"},
    {key:"master-tables",label:"Master Tables",icon:"▦",href:"../../pages/admin/master-management.html"},
    {key:"reports",label:"Reports",icon:"▥",href:"../../pages/reports.html"}
  ];

  const clean=s=>String(s||"").trim();
  const slug=s=>clean(s).toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const params=()=>new URLSearchParams(location.search);
  const path=()=>location.pathname.toLowerCase();

  function contextKey(){
    const p=path(), q=params();
    if(p.includes("/rti/")) return "rti";
    if(p.includes("/disha/")) return "disha";
    if(p.includes("/cpgrams/")){
      const type=clean(q.get("grievanceType")||document.getElementById("grievanceType")?.value||"CPGRAMS");
      if(/^cpgrams$/i.test(type)) return "cpgrams";
      return slug(type);
    }
    return "";
  }

  function moduleTitle(){
    const p=path(), q=params();
    if(p.includes("/rti/")) return "RTI";
    if(p.includes("/disha/")) return "DISHA";
    if(p.includes("/cpgrams/")){
      const type=clean(q.get("grievanceType")||document.getElementById("grievanceType")?.value||"CPGRAMS");
      return (type||"CPGRAMS").toUpperCase();
    }
    return "FILE MANAGEMENT SYSTEM";
  }

  function renderTitle(){
    let title=document.querySelector(".fms-module-title-strip");
    const header=document.querySelector(".fms-global-header");
    if(!header) return null;
    if(!title){
      title=document.createElement("div");
      title.className="fms-module-title-strip";
      title.setAttribute("role","heading");
      title.setAttribute("aria-level","1");
      header.insertAdjacentElement("afterend",title);
    }
    title.textContent=moduleTitle();
    return title;
  }

  function renderNav(title){
    document.querySelectorAll(".fms-module-nav").forEach((n,i)=>{if(i>0)n.remove();});
    let nav=document.querySelector(".fms-module-nav");
    if(!nav){
      nav=document.createElement("nav");
      nav.className="fms-module-nav";
      nav.setAttribute("aria-label","FMS navigation");
    }
    const current=contextKey();
    const links=[{key:"home",label:"Home",icon:"⌂",href:"../../index.html"},...TYPE_LINKS];
    nav.innerHTML=`<div class="fms-module-nav-inner">${links.map(x=>`<a class="fms-nav-item nav-${x.key}${x.key===current?" current":""}" href="${x.href}" title="Open ${x.label}"><span class="fms-nav-icon">${x.icon}</span><span>${x.label}</span></a>`).join("")}</div>`;
    if(title) title.insertAdjacentElement("afterend",nav);
    return nav;
  }

  function hideLegacyHeaders(){
    document.querySelectorAll("body > header:not(.fms-global-header), body > .main-header, body > .page-header:not(.fms-global-header), body > .hero:not(.fms-global-header)").forEach(el=>{
      el.classList.add("fms-legacy-header-hidden");
      el.setAttribute("aria-hidden","true");
    });
  }

  function moveFormActions(){
    const p=path();
    const save=document.getElementById("btnSave"), update=document.getElementById("btnUpdate"), del=document.getElementById("btnDelete");
    if(!save && !update && !del) return;
    let target=null;
    if(p.includes("/cpgrams/")) target=document.getElementById("cpgramsForm");
    else if(p.includes("/rti/")) target=document.getElementById("rtiForm");
    else if(p.includes("/disha/")) target=document.getElementById("dishaDataEntryFocus");
    if(!target) return;

    let actions=document.getElementById("fmsBottomFormActions");
    if(!actions){
      actions=document.createElement("div");
      actions.id="fmsBottomFormActions";
      actions.className="fms-bottom-form-actions";
      actions.innerHTML='<div class="fms-bottom-form-actions-label">Data Entry Actions</div><div class="fms-bottom-form-actions-buttons"></div>';
      target.insertAdjacentElement("afterend",actions);
    }
    const host=actions.querySelector(".fms-bottom-form-actions-buttons");
    [save,update,del].filter(Boolean).forEach(btn=>host.appendChild(btn));

    document.querySelectorAll(".fms-action-toolbar").forEach(toolbar=>{
      if(toolbar.querySelector("#btnSave,#btnUpdate,#btnDelete")) return;
      if(!clean(toolbar.textContent) && !toolbar.querySelector("button,a,input,select")) toolbar.classList.add("fms-empty-toolbar");
    });
    document.querySelectorAll(".fms-action-toolbar-spacer").forEach(s=>s.classList.add("d-none"));
  }

  function hideDuplicateHomeButtons(){
    document.querySelectorAll("#btnHome, button[onclick*='goHome()']").forEach(el=>{
      if(!el.closest('.fms-module-nav')) el.style.display="none";
    });
  }

  function watchCpgramsType(){
    const sel=document.getElementById("grievanceType");
    if(!sel) return;
    sel.addEventListener("change",()=>{
      const q=params();
      q.set("grievanceType",sel.value||"CPGRAMS");
      const title=document.querySelector(".fms-module-title-strip");
      if(title) title.textContent=(sel.value||"CPGRAMS").toUpperCase();
      document.querySelectorAll(".fms-module-nav .current").forEach(a=>a.classList.remove("current"));
      const key=slug(sel.value||"CPGRAMS");
      document.querySelector(`.fms-module-nav .nav-${key}`)?.classList.add("current");
    });
  }

  function activateDataEntryFullscreen(p){
    const q=params();
    const mode=String(q.get("mode")||"").toLowerCase();
    const requested=q.get("fullscreenForm")==="1" || q.get("formFullscreen")==="1";
    const isDataEntry=/\/modules\/(cpgrams|rti|disha)\/(cpgrams|rti|disha)(?:\.html)?$/i.test(p);
    if(!isDataEntry) return;
    if(!(requested || ((mode==="view" || mode==="edit") && (q.get("id") || q.get("recordId") || q.get("docId"))))) return;
    document.body.classList.add("fms-data-entry-fullscreen");
    document.querySelectorAll("header, footer, .fms-module-nav, .fms-module-title-strip, .page-footer, #moduleDashboardPanel, #grievanceContextPanel, #grievanceInlineRegisterPanel").forEach(el=>el.classList.add("d-none"));
    document.querySelectorAll("main,.container,.container-fluid,.form-container").forEach(el=>Object.assign(el.style,{maxWidth:"none",width:"100%"}));
    if(!document.getElementById("fmsDataEntryFullscreenBanner")){
      const banner=document.createElement("div");
      banner.id="fmsDataEntryFullscreenBanner";
      banner.className="alert alert-primary rounded-0 mb-2 d-flex justify-content-between align-items-center flex-wrap gap-2";
      banner.innerHTML=`<span><strong>Data Entry:</strong> ${mode?mode.toUpperCase():"EDIT"} mode</span><button type="button" class="btn btn-sm btn-outline-primary" id="btnExitDataEntryFullscreen">Back to Register</button>`;
      document.body.prepend(banner);
      document.getElementById("btnExitDataEntryFullscreen")?.addEventListener("click",()=>{
        if(p.includes("/cpgrams/")){
          const target=new URLSearchParams();
          const grievanceType=q.get("grievanceType") || document.getElementById("grievanceType")?.value || "CPGRAMS";
          const fy=q.get("fy") || document.getElementById("grievanceFinancialYear")?.value || "";
          target.set("grievanceType",grievanceType); if(fy) target.set("fy",fy);
          location.href="cpgrams-register.html?"+target.toString();
        } else if(p.includes("/rti/")) location.href="rti-register.html?fullscreen=1";
        else if(p.includes("/disha/")) location.href="disha-register.html?fullscreen=1";
        else history.back();
      });
    }
  }

  function init(){
    if(!path().includes("/modules/")) return;
    hideLegacyHeaders();
    const title=renderTitle();
    renderNav(title);
    moveFormActions();
    hideDuplicateHomeButtons();
    watchCpgramsType();
    activateDataEntryFullscreen(path());
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})(window,document);
