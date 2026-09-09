"use strict";
/* Common module navigation: Home, Grievances, RTI and DISHA on every module screen. */
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
        .fms-module-nav{background:#fff;border-bottom:1px solid #d9dee5;box-shadow:0 2px 7px rgba(0,0,0,.08);padding:9px 12px;position:relative;z-index:40}
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
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})(window,document);
