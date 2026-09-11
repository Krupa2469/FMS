"use strict";
/* Common module navigation: Home, Grievances, RTI and DISHA on every module screen. v1.3.6 */
(function(window,document){
  function init(){
    if(document.querySelector(".fms-module-nav")) return;
    const path=location.pathname.toLowerCase();
    if(!path.includes("/modules/")) return;
    const current=path.includes("/cpgrams/")?"grievances":path.includes("/rti/")?"rti":path.includes("/disha/")?"disha":"";

    if(!document.getElementById("fmsModuleNavStyle")){
      const style=document.createElement("style");
      style.id="fmsModuleNavStyle";
      style.textContent=`
        .fms-module-nav{background:#fff;border-bottom:1px solid #d9dee5;box-shadow:0 2px 7px rgba(0,0,0,.08);padding:9px 12px;position:sticky;top:0;z-index:1055}
        .fms-module-nav-inner{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
        .fms-module-nav a{display:inline-flex;align-items:center;gap:6px;text-decoration:none;border:1px solid #6c757d;border-radius:6px;padding:8px 14px;font-family:Arial,Helvetica,sans-serif;font-weight:600;line-height:1.2;background:#fff;color:#212529}
        .fms-module-nav a:hover{filter:brightness(.97)}
        .fms-module-nav .nav-home{background:#212529;color:#fff;border-color:#212529}
        .fms-module-nav .nav-grievances{border-color:#0d6efd;color:#0d6efd}
        .fms-module-nav .nav-rti{border-color:#d99b00;color:#9a6c00}
        .fms-module-nav .nav-disha{border-color:#0dcaf0;color:#087990}
        .fms-module-nav .current.nav-grievances{background:#0d6efd;color:#fff}
        .fms-module-nav .current.nav-rti{background:#ffc107;color:#212529}
        .fms-module-nav .current.nav-disha{background:#0dcaf0;color:#fff}
      `;
      document.head.appendChild(style);
    }

    const nav=document.createElement("nav");
    nav.className="fms-module-nav";
    nav.setAttribute("aria-label","FMS module navigation");
    nav.innerHTML=`<div class="fms-module-nav-inner">
      <a class="nav-home" href="../../index.html">⌂ Home</a>
      <a class="nav-grievances ${current==="grievances"?"current":""}" href="../cpgrams/cpgrams.html">▣ GRIEVANCES</a>
      <a class="nav-rti ${current==="rti"?"current":""}" href="../rti/rti.html">▤ RTI</a>
      <a class="nav-disha ${current==="disha"?"current":""}" href="../disha/disha.html">♧ DISHA</a>
    </div>`;
    const anchor=document.querySelector("header")||document.querySelector(".main-header")||document.querySelector(".page-header")||document.body.firstElementChild;
    if(anchor&&anchor.parentNode) anchor.parentNode.insertBefore(nav,anchor.nextSibling); else document.body.prepend(nav);

    // The common bar is the single Home navigation on module screens.
    document.querySelectorAll("#btnHome, button[onclick*='goHome()']").forEach(el=>{
      if(!el.closest('.fms-module-nav')) el.style.display="none";
    });

    activateDataEntryFullscreen(path);
  }

  function activateDataEntryFullscreen(path){
    const params=new URLSearchParams(location.search);
    const mode=String(params.get("mode")||"").toLowerCase();
    const requested=params.get("fullscreenForm")==="1" || params.get("formFullscreen")==="1";
    const isDataEntry=/\/modules\/(cpgrams|rti|disha)\/(cpgrams|rti|disha)(?:\.html)?$/i.test(path);
    if(!isDataEntry) return;
    if(!(requested || ((mode==="view" || mode==="edit") && (params.get("id") || params.get("recordId") || params.get("docId"))))) return;
    document.body.classList.add("fms-data-entry-fullscreen");
    document.querySelectorAll("header, footer, .fms-module-nav, .page-footer, #moduleDashboardPanel, #grievanceContextPanel, #grievanceInlineRegisterPanel").forEach(el=>el.classList.add("d-none"));
    document.querySelectorAll("main,.container,.container-fluid,.form-container").forEach(el=>{
      Object.assign(el.style,{maxWidth:"none",width:"100%"});
    });
    const title=document.querySelector("h4.text-center, .form-container h2, .form-container h3, .page-title");
    if(title && !document.getElementById("fmsDataEntryFullscreenBanner")){
      const banner=document.createElement("div");
      banner.id="fmsDataEntryFullscreenBanner";
      banner.className="alert alert-primary rounded-0 mb-2 d-flex justify-content-between align-items-center flex-wrap gap-2";
      banner.innerHTML=`<span><strong>Data Entry Full Screen:</strong> ${mode?mode.toUpperCase():"EDIT"} mode</span><button type="button" class="btn btn-sm btn-outline-primary" id="btnExitDataEntryFullscreen">Back to Register</button>`;
      const anchor=document.querySelector(".fms-action-toolbar,.navigation-bar") || document.body.firstElementChild;
      anchor?.parentNode?.insertBefore(banner, anchor.nextSibling);
      document.getElementById("btnExitDataEntryFullscreen")?.addEventListener("click",()=>{
        if(path.includes("/cpgrams/")) location.href="cpgrams-register.html?fullscreen=1";
        else if(path.includes("/rti/")) location.href="rti-register.html?fullscreen=1";
        else if(path.includes("/disha/")) location.href="disha-register.html?fullscreen=1";
        else history.back();
      });
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})(window,document);
