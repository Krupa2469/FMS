/*
=========================================================
Government of Telangana - File Management System (FMS)
Master Data - Districts
Developer: Lekha Technologies
Version: 2.0

Districts are loaded from Firestore when available, with a complete
33-district fallback. The TGRAC administrative service is used by the
mandal/village masters for dependent dropdowns.
=========================================================
*/
"use strict";

const DISTRICTS = [
  "Adilabad","Bhadradri Kothagudem","Hanumakonda","Hyderabad","Jagtial",
  "Jangaon","Jayashankar Bhupalpally","Jogulamba Gadwal","Kamareddy","Karimnagar",
  "Khammam","Kumuram Bheem","Mahabubabad","Mahabubnagar","Mancherial","Medak",
  "Medchal-Malkajgiri","Mulugu","Nagarkurnool","Nalgonda","Narayanpet","Nirmal",
  "Nizamabad","Peddapalli","Rajanna Sircilla","Rangareddy","Sangareddy","Siddipet",
  "Suryapet","Vikarabad","Wanaparthy","Warangal","Yadadri Bhuvanagiri"
];

const TGRAC_ADMIN_SERVICE = "https://tgrac.telangana.gov.in/arcgis/rest/services/Master_Administrative_Folder/Master_Administrative_Boundary/MapServer";

function escapeOptionText(value){
  return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");
}

function districtAliases(name){
  const n=String(name||"").trim().toLowerCase();
  return n.replace(/[–—]/g,"-").replace(/\s+/g," ");
}

function uniqueSorted(values){
  const map=new Map();
  (values||[]).forEach(v=>{
    const s=String(v||"").trim();
    if(s) map.set(districtAliases(s),s);
  });
  return [...map.values()].sort((a,b)=>a.localeCompare(b));
}

async function loadDistricts(selected=""){
  const select=document.getElementById("district");
  if(!select) return [];
  select.innerHTML='<option value="">-- Select District --</option>';

  let values=[];
  const database=window.getFMSFirestore?.() || window.fmsFirebase?.db || window.db || null;
  if(database){
    try{
      const snap=await database.collection("districts").get();
      snap.forEach(doc=>{
        const d=doc.data()||{};
        if(d.active!==false && d.name) values.push(d.name);
      });
    }catch(e){ console.warn("District Firestore master unavailable; using fallback:",e); }
  }
  values=uniqueSorted([...values,...DISTRICTS]);
  select.innerHTML='<option value="">-- Select District --</option>'+values.map(v=>`<option value="${escapeOptionText(v)}">${escapeOptionText(v)}</option>`).join("");
  if(selected){
    const found=[...select.options].find(o=>districtAliases(o.value)===districtAliases(selected));
    if(found) select.value=found.value;
    else { select.insertAdjacentHTML("beforeend",`<option value="${escapeOptionText(selected)}">${escapeOptionText(selected)}</option>`); select.value=selected; }
  }
  return values;
}

window.FMSAdministrativeMaster = window.FMSAdministrativeMaster || {};
window.FMSAdministrativeMaster.TGRAC_ADMIN_SERVICE = TGRAC_ADMIN_SERVICE;
window.FMSAdministrativeMaster.DISTRICTS = DISTRICTS;
