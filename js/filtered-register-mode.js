"use strict";
/* Full-screen register mode used when a dashboard number opens filtered data. */
(function(){
  const params=new URLSearchParams(location.search);
  const filter=params.get("filter");
  if(!filter) return;

  function hide(el){ if(el) el.classList.add("d-none"); }
  function activate(){
    document.body.classList.add("fms-filtered-register-mode");
    const path=location.pathname.toLowerCase();
    let dataBlock=null;

    if(path.includes("cpgrams-register")){
      const table=document.getElementById("registerTable");
      dataBlock=table?.closest(".card") || table?.parentElement;
      document.querySelectorAll(".card").forEach(el=>{
        if(dataBlock && el!==dataBlock && !el.contains(table) && !el.closest(".modal")) hide(el);
      });
      // Hide search/summary/export/advanced panels even when their markup changes.
      ["searchFilters","summaryDashboard","exportOptions","advancedSearch"].forEach(id=>hide(document.getElementById(id)));
    }
    else if(path.includes("rti-register")){
      dataBlock=document.querySelector(".register-container");
      hide(document.querySelector(".search-panel"));
      hide(document.querySelector(".summary-container"));
      document.querySelectorAll(".card,.panel").forEach(el=>{
        if(dataBlock && el!==dataBlock && !dataBlock.contains(el) && !el.closest(".modal")) hide(el);
      });
    }
    else if(path.includes("disha-register")){
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
    banner.innerHTML=`<span><strong>Filtered Register:</strong> ${String(filter).replace(/-/g," ")}</span><button type="button" class="btn btn-sm btn-outline-primary" id="btnClearDashboardFilter">Show Full Register</button>`;
    const anchor=dataBlock || document.body.firstElementChild;
    anchor?.parentNode?.insertBefore(banner,anchor);
    document.getElementById("btnClearDashboardFilter")?.addEventListener("click",()=>{
      params.delete("filter");
      location.href=location.pathname+(params.toString()?"?"+params.toString():"");
    });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",activate);
  else activate();
})();
