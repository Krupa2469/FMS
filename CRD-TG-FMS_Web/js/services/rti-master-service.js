/*
==========================================================
FMS RTI MASTER SERVICE
Version : 1.0.0
Developer: Lekha Technologies

Purpose:
Central master handling for the RTI data-entry form.

Masters used:
- mandals      : district + name
- villages     : district + mandal + name
- officers     : name
- sections     : handled by Office Processing service
==========================================================
*/
"use strict";

(function(window){
    const DEFAULT_MANDALS = window.MANDAL_MASTER || {};
    const TGRAC = window.FMSAdministrativeMaster?.TGRAC_ADMIN_SERVICE || "https://tgrac.telangana.gov.in/arcgis/rest/services/Master_Administrative_Folder/Master_Administrative_Boundary/MapServer";
    const DEFAULT_VILLAGES = window.VILLAGE_MASTER || {};
    const DEFAULT_OFFICERS = Array.isArray(window.OFFICERS) ? window.OFFICERS : [
        "Commissioner","Special Commissioner","Joint Commissioner",
        "Administrative Officer","Assistant Director",
        "District Rural Development Officer","Assistant Project Director",
        "Project Director","Section Officer","Superintendent",
        "Senior Assistant","Junior Assistant"
    ];

    function db(){
        return window.getFMSFirestore?.() ||
               window.fmsFirebase?.db ||
               window.db ||
               (typeof firebase !== "undefined" && firebase.firestore ? firebase.firestore() : null);
    }

    function clean(v){ return String(v ?? "").trim(); }
    function esc(v){
        return clean(v).replace(/&/g,"&amp;").replace(/</g,"&lt;")
            .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
    }

    function setOptions(selectId, values, placeholder, selected=""){
        const el=document.getElementById(selectId);
        if(!el) return;
        const unique=[...new Set((values||[]).map(clean).filter(Boolean))]
            .sort((a,b)=>a.localeCompare(b));
        el.innerHTML=`<option value="">${esc(placeholder)}</option>`+
            unique.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");
        if(selected){
            let option=[...el.options].find(o=>o.value===selected);
            if(!option){
                el.insertAdjacentHTML("beforeend",`<option value="${esc(selected)}">${esc(selected)}</option>`);
            }
            el.value=selected;
        }
    }

    async function getMandals(district){
        district=clean(district);
        if(!district) return [];
        const database=db();
        let values=[];
        if(database){
            try{ const snap=await database.collection("mandals").where("district","==",district).get(); snap.forEach(doc=>{const d=doc.data()||{}; if(d.active!==false&&d.name) values.push(clean(d.name));}); }
            catch(e){ console.warn("RTI Firestore mandal master unavailable:",e); }
        }
        if(!values.length){
            try{
                const where="district='"+district.replace(/'/g,"''")+"'";
                const res=await fetch(TGRAC+"/4/query?where="+encodeURIComponent(where)+"&outFields=mandal&returnGeometry=false&returnDistinctValues=true&f=json");
                if(res.ok){ const json=await res.json(); values=(json.features||[]).map(f=>clean(f.attributes?.mandal)).filter(Boolean); }
            }catch(e){ console.warn("RTI TGRAC mandal load failed:",e); }
        }
        const fallback=Array.isArray(DEFAULT_MANDALS[district])?DEFAULT_MANDALS[district]:[];
        return [...new Set([...values,...fallback].filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    }

    async function loadMandals(district, selected=""){
        const values=await getMandals(district);
        setOptions("mandal",values,"-- Select Mandal --",selected);
        const el=document.getElementById("mandal");
        if(el) el.disabled=!clean(district);
        const village=document.getElementById("village");
        if(village && !selected){
            village.disabled=true;
            village.innerHTML='<option value="">-- Select Village --</option>';
        }
        return values;
    }

    async function saveMandal(district,name){
        district=clean(district); name=clean(name);
        if(!district) throw new Error("Please select District first.");
        if(!name) throw new Error("Please enter the new Mandal name.");
        const database=db();
        if(!database) throw new Error("Firestore is not ready.");
        const existing=await database.collection("mandals")
            .where("district","==",district).where("name","==",name).limit(1).get();
        if(existing.empty){
            await database.collection("mandals").add({
                name,district,
                code:name.toUpperCase().replace(/[^A-Z0-9]+/g,"_").slice(0,30),
                active:true, source:"RTI Data Entry",
                createdOn:firebase.firestore.FieldValue.serverTimestamp(),
                modifiedOn:firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        return name;
    }

    async function getVillages(district,mandal){
        district=clean(district); mandal=clean(mandal);
        if(!district || !mandal) return [];
        const database=db();
        let values=[];
        if(database){
            try{ const snap=await database.collection("villages").where("district","==",district).where("mandal","==",mandal).get(); snap.forEach(doc=>{const d=doc.data()||{}; if(d.active!==false&&d.name) values.push(clean(d.name));}); }
            catch(e){ console.warn("RTI Firestore village master unavailable:",e); }
        }
        if(!values.length){
            try{
                const where="district='"+district.replace(/'/g,"''")+"' AND mandal='"+mandal.replace(/'/g,"''")+"'";
                const res=await fetch(TGRAC+"/5/query?where="+encodeURIComponent(where)+"&outFields=village&returnGeometry=false&returnDistinctValues=true&f=json");
                if(res.ok){ const json=await res.json(); values=(json.features||[]).map(f=>clean(f.attributes?.village)).filter(Boolean); }
            }catch(e){ console.warn("RTI TGRAC village load failed:",e); }
        }
        const fallback=DEFAULT_VILLAGES?.[district]?.[mandal] || [];
        return [...new Set([...values,...fallback].filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    }

    async function loadVillages(district,mandal,selected=""){
        const values=await getVillages(district,mandal);
        setOptions("village",values,"-- Select Village --",selected);
        const el=document.getElementById("village");
        if(el) el.disabled=!clean(mandal);
        return values;
    }

    async function saveVillage(district,mandal,name){
        district=clean(district); mandal=clean(mandal); name=clean(name);
        if(!district) throw new Error("Please select District first.");
        if(!mandal) throw new Error("Please select Mandal first.");
        if(!name) throw new Error("Please enter the new Village name.");
        const database=db();
        if(!database) throw new Error("Firestore is not ready.");
        const existing=await database.collection("villages")
            .where("district","==",district)
            .where("mandal","==",mandal)
            .where("name","==",name).limit(1).get();
        if(existing.empty){
            await database.collection("villages").add({
                name,district,mandal,
                code:name.toUpperCase().replace(/[^A-Z0-9]+/g,"_").slice(0,30),
                active:true, source:"RTI Data Entry",
                createdOn:firebase.firestore.FieldValue.serverTimestamp(),
                modifiedOn:firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        return name;
    }

    async function getOfficers(){
        const database=db();
        let values=[];
        if(database){
            try{
                const snap=await database.collection("officers").get();
                snap.forEach(doc=>{
                    const d=doc.data()||{};
                    if(d.active!==false && d.name) values.push(clean(d.name));
                });
            }catch(e){ console.warn("Officer master Firestore load failed:",e); }
        }
        return [...new Set([...values,...DEFAULT_OFFICERS].filter(Boolean))]
            .sort((a,b)=>a.localeCompare(b));
    }

    async function loadOfficers(selectId="officeLetterAddressedTo",selected=""){
        const values=await getOfficers();
        setOptions(selectId,values,"-- Select Officer --",selected);
        return values;
    }

    async function saveOfficer(name){
        name=clean(name);
        if(!name) throw new Error("Please enter the new officer name/designation.");
        const database=db();
        if(!database) throw new Error("Firestore is not ready.");
        const existing=await database.collection("officers")
            .where("name","==",name).limit(1).get();
        if(existing.empty){
            await database.collection("officers").add({
                name,
                code:name.toUpperCase().replace(/[^A-Z0-9]+/g,"_").slice(0,30),
                description:"Officer Master",
                active:true, source:"RTI Office Processing",
                createdOn:firebase.firestore.FieldValue.serverTimestamp(),
                modifiedOn:firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        return name;
    }

    window.FMSRTIMasterService={
        getMandals,loadMandals,saveMandal,
        getVillages,loadVillages,saveVillage,
        getOfficers,loadOfficers,saveOfficer
    };
})(window);
