/* =========================================================
   FMS MASTER OPTION LOADER
   Merges active master-register values into module dropdowns while
   preserving existing built-in options as a fallback.
========================================================= */
(function(window,document){
  "use strict";
  const MAP={
    district:"districts", grievanceType:"grievanceTypes", category:"categories", source:"sources",
    priority:"priorityLevels", priorityClassification:"priorityLevels",
    natureOfGrievance:"grievanceNature", preferredContact:"contactMethods",
    gender:"genderMaster", officeCommunicationType:"officeCommunicationTypes",
    officeStatus:"fileStatuses", currentStatus:"statusMaster", finalStatus:"statusMaster",
    section:"sections", officeReplySection:"sections", assignedOfficer:"officers",
    officeLetterAddressedTo:"officers", fileLocation:"fileLocations",
    statusOfMeeting:"meetingStatuses", statusOfBills:"billStatuses"
  };
  let running=false;
  function getDb(){return window.db||window.fmsFirebase?.db||null;}
  function addOptions(select,values){
    if(!select||!values.length)return;
    const current=select.value;
    const existing=new Set([...select.options].map(o=>String(o.value||o.textContent).trim().toLowerCase()).filter(Boolean));
    values.forEach(v=>{
      const name=String(v||"").trim(); if(!name||existing.has(name.toLowerCase()))return;
      const o=document.createElement("option");o.value=name;o.textContent=name;select.appendChild(o);existing.add(name.toLowerCase());
    });
    if(current)select.value=current;
  }
  async function loadCollection(db,name){
    try{const snap=await db.collection(name).get();return snap.docs.map(d=>d.data()||{}).filter(d=>d.active!==false&&d.name).map(d=>String(d.name).trim()).sort((a,b)=>a.localeCompare(b));}
    catch(e){console.warn("Master option load failed:",name,e);return [];}
  }
  async function load(){
    if(running)return;const db=getDb();if(!db)return;running=true;
    try{
      const targets=Object.entries(MAP).filter(([id])=>document.getElementById(id));
      const collections=[...new Set(targets.map(([,c])=>c))];
      const cache={}; await Promise.all(collections.map(async c=>cache[c]=await loadCollection(db,c)));
      targets.forEach(([id,c])=>addOptions(document.getElementById(id),cache[c]||[]));
    }finally{running=false;}
  }
  document.addEventListener("DOMContentLoaded",()=>{setTimeout(load,900);setTimeout(load,2200);});
  window.addEventListener("fmsFirebaseReady",()=>setTimeout(load,300));
  window.FMSMasterOptionLoader={load};
})(window,document);
