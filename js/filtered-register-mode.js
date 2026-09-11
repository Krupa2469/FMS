"use strict";
/* Full-screen register mode used when a dashboard number opens filtered data. */
(function(){
  const params=new URLSearchParams(location.search);
  const filter=params.get("filter");
  const full=params.get("fullscreen")==="1" || params.get("fullRegister")==="1";
  if(!filter && !full) return;

  function hide(el){ if(el) el.classList.add("d-none"); }
  function activate(){
    document.body.classList.add(filter?"fms-filtered-register-mode":"fms-full-register-mode");
    const path=location.pathname.toLowerCase();
    let dataBlock=null;

    if(path.includes("cpgrams-register")){
      // Dashboard-card drill-down: show only the filtered Grievances register.
      document.querySelectorAll("header, nav, footer, .fms-module-nav, .fms-action-toolbar").forEach(hide);
      const table=document.getElementById("registerTable");
      dataBlock=table?.closest(".card") || table?.parentElement;
      document.querySelectorAll(".card").forEach(el=>{
        if(dataBlock && el!==dataBlock && !el.contains(table) && !el.closest(".modal")) hide(el);
      });
      // Hide search/summary/export/advanced panels even when their markup changes.
      ["searchFilters","summaryDashboard","exportOptions","advancedSearch"].forEach(id=>hide(document.getElementById(id)));
      document.querySelectorAll(".container-fluid > .row.mt-3, .container-fluid > .row.mt-4, .container-fluid > .card.shadow-sm.mt-4").forEach(el=>{ if(!el.contains(table)) hide(el); });
    }
    else if(path.includes("rti-register")){
      document.querySelectorAll("header, nav, footer, .main-header, .navigation-bar, .fms-module-nav, .fms-action-toolbar").forEach(hide);
      dataBlock=document.querySelector(".register-container");
      hide(document.querySelector(".search-panel"));
      hide(document.querySelector(".summary-container"));
      document.querySelectorAll(".card,.panel").forEach(el=>{
        if(dataBlock && el!==dataBlock && !dataBlock.contains(el) && !el.closest(".modal")) hide(el);
      });
    }
    else if(path.includes("disha-register")){
      document.querySelectorAll("header, nav, footer, .page-header, .navigation-bar, .fms-action-toolbar, .fms-module-nav").forEach(hide);
      const tbody=document.getElementById("registerBody");
      dataBlock=tbody?.closest(".card") || tbody?.closest(".table-responsive")?.parentElement;
      document.querySelectorAll(".card").forEach(el=>{
        if(dataBlock && el!==dataBlock && !el.contains(tbody) && !el.closest("#loadingOverlay")) hide(el);
      });
      document.querySelectorAll(".summary-link").forEach(el=>hide(el.closest(".row")));
    }

    if(dataBlock){
      dataBlock.classList.add("fms-filtered-data-block");
      Object.assign(dataBlock.style,{maxWidth:"none",width:"100%",margin:"0"});
    }
    document.querySelectorAll("main,.container,.container-fluid").forEach(el=>{
      if(dataBlock && el.contains(dataBlock)){
        Object.assign(el.style,{maxWidth:"none",width:"100%",paddingLeft:"8px",paddingRight:"8px"});
      }
    });
    document.querySelectorAll(".table-responsive").forEach(el=>{
      if(dataBlock && dataBlock.contains(el)) el.style.width="100%";
    });

    const banner=document.createElement("div");
    banner.className="alert alert-primary rounded-0 mb-2 d-flex justify-content-between align-items-center flex-wrap gap-2";
    banner.id="filteredRegisterBanner";
    const category=params.get("category") || params.get("grievanceType"), fy=params.get("fy");
    const details=[filter?String(filter).replace(/-/g," "):"Full Register", category?`Grievance Type: ${category}`:"", fy?`FY: ${fy}`:""].filter(Boolean).join(" • ");
    const label=filter?"Filtered Register":"Full Register";
    banner.classList.add("fms-register-fullscreen-banner");
    banner.innerHTML=`<span><strong>${label}:</strong> ${details}</span><button type="button" class="btn btn-sm btn-outline-primary" id="btnClearDashboardFilter">Exit Full Screen</button>`;
    const anchor=dataBlock || document.body.firstElementChild;
    anchor?.parentNode?.insertBefore(banner,anchor);
    document.getElementById("btnClearDashboardFilter")?.addEventListener("click",()=>{
      params.delete("filter");
      params.delete("fullscreen");
      params.delete("fullRegister");
      location.href=location.pathname+(params.toString()?"?"+params.toString():"");
    });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",activate);
  else activate();
})();
