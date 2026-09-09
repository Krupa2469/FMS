/*
=========================================================
FMS dependent Village master
Version: 2.0
Sources: Firestore, official TGRAC administrative service, local fallback
=========================================================
*/
"use strict";

const VILLAGE_MASTER = window.VILLAGE_MASTER || {
  "Nagarkurnool":{
    "Nagarkurnool":["Nagarkurnool","Uyyalawada","Peddapur","Thoodukurthy"],
    "Kalwakurthy":["Kalwakurthy","Marchala","Veldanda","Raghupathipet"],
    "Achampet":["Achampet","Balmoor","Lingotam","Upparapally"]
  }
};
window.VILLAGE_MASTER=VILLAGE_MASTER;

function villageDb(){ return window.getFMSFirestore?.() || window.fmsFirebase?.db || window.db || null; }
function villageServiceUrl(){ return window.FMSAdministrativeMaster?.TGRAC_ADMIN_SERVICE || "https://tgrac.telangana.gov.in/arcgis/rest/services/Master_Administrative_Folder/Master_Administrative_Boundary/MapServer"; }
function normVillage(v){ return String(v||"").trim().toLowerCase().replace(/[–—]/g,"-").replace(/\s+/g," "); }
function uniqueVillage(values){ const seen=new Map(); (values||[]).forEach(v=>{const s=String(v||"").trim(); if(s) seen.set(normVillage(s),s);}); return [...seen.values()].sort((a,b)=>a.localeCompare(b)); }
function setVillageOptions(values,selected=""){
  const el=document.getElementById("village"); if(!el) return;
  const list=uniqueVillage(values);
  el.innerHTML='<option value="">-- Select Village --</option>'+list.map(v=>{const e=v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return `<option value="${e}">${e}</option>`;}).join("");
  el.disabled=!document.getElementById("mandal")?.value;
  if(selected){const o=[...el.options].find(x=>normVillage(x.value)===normVillage(selected)); if(o) el.value=o.value; else {const opt=document.createElement("option");opt.value=selected;opt.textContent=selected;el.appendChild(opt);el.value=selected;}}
}
async function fetchTGRACVillages(district,mandal){
  if(!district||!mandal) return [];
  const where="district='"+String(district).replace(/'/g,"''")+"' AND mandal='"+String(mandal).replace(/'/g,"''")+"'";
  const url=villageServiceUrl()+"/5/query?where="+encodeURIComponent(where)+"&outFields=district,mandal,village&returnGeometry=false&returnDistinctValues=true&f=json";
  try{
    const res=await fetch(url,{headers:{Accept:"application/json"}}); if(!res.ok) throw new Error("TGRAC HTTP "+res.status);
    const json=await res.json(); return (json.features||[]).map(f=>f.attributes?.village).filter(Boolean);
  }catch(e){ console.warn("TGRAC Village load failed:",e); return []; }
}
async function loadVillages(district,mandal,selected=""){
  const el=document.getElementById("village"); if(!el) return [];
  el.disabled=true; el.innerHTML='<option value="">Loading Villages...</option>';
  if(!district||!mandal){setVillageOptions([]);return [];}
  let values=[]; const database=villageDb();
  if(database){try{const snap=await database.collection("villages").where("district","==",district).where("mandal","==",mandal).get();snap.forEach(doc=>{const d=doc.data()||{};if(d.active!==false&&d.name) values.push(d.name);});}catch(e){console.warn("Firestore Village load failed:",e);}}
  if(!values.length) values=await fetchTGRACVillages(district,mandal);
  values=[...values,...(VILLAGE_MASTER[district]?.[mandal]||[])];
  setVillageOptions(values,selected); el.disabled=false; return uniqueVillage(values);
}
