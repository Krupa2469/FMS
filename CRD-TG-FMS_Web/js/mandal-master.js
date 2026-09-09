/*
=========================================================
FMS dependent Mandal master
Version: 2.0
Sources: Firestore, official TGRAC administrative service, local fallback
=========================================================
*/
"use strict";

const MANDAL_MASTER = window.MANDAL_MASTER || {
  "Nagarkurnool":["Achampet","Amrabad","Balmoor","Bijinapally","Kalwakurthy","Kollapur","Lingal","Nagarkurnool","Peddakothapally","Telkapally","Thimmajipet","Uppununthala"]
};
window.MANDAL_MASTER=MANDAL_MASTER;

function mandalDb(){ return window.getFMSFirestore?.() || window.fmsFirebase?.db || window.db || null; }
function mandalServiceUrl(){ return window.FMSAdministrativeMaster?.TGRAC_ADMIN_SERVICE || "https://tgrac.telangana.gov.in/arcgis/rest/services/Master_Administrative_Folder/Master_Administrative_Boundary/MapServer"; }
function normName(v){ return String(v||"").trim().toLowerCase().replace(/[–—]/g,"-").replace(/\s+/g," "); }
function uniqueSort(values){
  const seen=new Map();
  (values||[]).forEach(v=>{const s=String(v||"").trim(); if(s) seen.set(normName(s),s);});
  return [...seen.values()].sort((a,b)=>a.localeCompare(b));
}
function setMandalOptions(values,selected=""){
  const el=document.getElementById("mandal"); if(!el) return;
  const list=uniqueSort(values);
  el.innerHTML='<option value="">-- Select Mandal --</option>'+list.map(v=>`<option value="${v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}">${v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</option>`).join("");
  el.disabled=!selected && !document.getElementById("district")?.value;
  if(selected){
    const o=[...el.options].find(x=>normName(x.value)===normName(selected));
    if(o) el.value=o.value; else { const opt=document.createElement("option"); opt.value=selected; opt.textContent=selected; el.appendChild(opt); el.value=selected; }
  }
}

async function fetchTGRACMandals(district){
  if(!district) return [];
  const url=mandalServiceUrl()+"/4/query?where="+encodeURIComponent("district='"+String(district).replace(/'/g,"''")+"'")+
    "&outFields=district,mandal&returnGeometry=false&returnDistinctValues=true&f=json";
  try{
    const res=await fetch(url,{headers:{Accept:"application/json"}});
    if(!res.ok) throw new Error("TGRAC HTTP "+res.status);
    const json=await res.json();
    return (json.features||[]).map(f=>f.attributes?.mandal).filter(Boolean);
  }catch(e){ console.warn("TGRAC Mandal load failed:",e); return []; }
}

async function loadMandals(district,selected=""){
  const el=document.getElementById("mandal");
  const village=document.getElementById("village");
  if(!el) return [];
  el.disabled=true; el.innerHTML='<option value="">Loading Mandals...</option>';
  if(village){ village.disabled=true; village.innerHTML='<option value="">-- Select Village --</option>'; }
  if(!district){ setMandalOptions([]); return []; }

  let values=[];
  const database=mandalDb();
  if(database){
    try{
      const snap=await database.collection("mandals").where("district","==",district).get();
      snap.forEach(doc=>{const d=doc.data()||{}; if(d.active!==false&&d.name) values.push(d.name);});
    }catch(e){ console.warn("Firestore Mandal load failed:",e); }
  }
  if(!values.length) values=await fetchTGRACMandals(district);
  values=[...values,...(MANDAL_MASTER[district]||[])];
  setMandalOptions(values,selected);
  el.disabled=false;
  return uniqueSort(values);
}
