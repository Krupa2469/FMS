/*==========================================================
 CPGRAMS SEARCH
 Version : 5.1 synchronized search page
==========================================================*/
"use strict";

let cpgramsSearchRows = [];
let cpgramsSearchFiltered = [];

document.addEventListener("DOMContentLoaded", initializeCPGRAMSSearch);

async function initializeCPGRAMSSearch(){
    bindCPGRAMSSearchEvents();
    await Promise.all([loadSearchDistricts(), loadSearchOfficers()]);
    await refreshCPGRAMSSearch();
}

function bindCPGRAMSSearchEvents(){
    document.getElementById("btnSearch")?.addEventListener("click", applyCPGRAMSSearch);
    document.getElementById("btnClear")?.addEventListener("click", clearCPGRAMSSearch);
    document.getElementById("btnExport")?.addEventListener("click", exportCPGRAMSSearchCSV);
}

async function refreshCPGRAMSSearch(){
    try{
        const snapshot = await db.collection("cpgrams").get();
        cpgramsSearchRows = snapshot.docs
            .map(doc => ({id:doc.id, ...doc.data()}))
            .filter(row => row.active !== false);
        cpgramsSearchFiltered = [...cpgramsSearchRows];
        renderCPGRAMSSearch();
    }catch(error){
        console.error("CPGRAMS search load error", error);
        alert("Unable to load CPGRAMS records. Please check the Firebase connection.");
    }
}

async function loadSearchDistricts(){
    const select=document.getElementById("district");
    if(!select) return;
    try{
        const snap=await db.collection("districts").orderBy("name").get();
        snap.forEach(doc=>{
            const name=String(doc.data()?.name||"").trim();
            if(name) select.add(new Option(name,name));
        });
    }catch(error){ console.warn("District master could not be loaded", error); }
}

async function loadSearchOfficers(){
    const select=document.getElementById("assignedOfficer");
    if(!select) return;
    try{
        const snap=await db.collection("officers").orderBy("name").get();
        snap.forEach(doc=>{
            const d=doc.data()||{};
            const name=String(d.name||d.officerName||"").trim();
            if(name) select.add(new Option(name,name));
        });
    }catch(error){ console.warn("Officer master could not be loaded", error); }
}

function v(id){ return String(document.getElementById(id)?.value||"").trim(); }
function low(value){ return String(value||"").trim().toLowerCase(); }
function recordDate(row){ return String(row.dateReceived||row.receivedDate||row.dateArised||"").slice(0,10); }

function applyCPGRAMSSearch(){
    const grievance=low(v("grievanceNumber"));
    const fileNo=low(v("fileNumber"));
    const complainant=low(v("complainantName"));
    const district=low(v("district"));
    const status=low(v("status"));
    const officer=low(v("assignedOfficer"));
    const from=v("fromDate");
    const to=v("toDate");

    cpgramsSearchFiltered=cpgramsSearchRows.filter(row=>{
        if(grievance && !low(row.grievanceNumber||row.grievanceNo||row.registrationNumber).includes(grievance)) return false;
        if(fileNo && !low(row.fileNumber||row.fileNo).includes(fileNo)) return false;
        if(complainant && !low(row.complainantName||row.applicantName).includes(complainant)) return false;
        if(district && low(row.district)!==district) return false;
        if(status && ![row.currentStatus,row.statusOfFile,row.finalStatus,row.status].some(x=>low(x)===status)) return false;
        if(officer && !low(row.assignedOfficer||row.concernedOfficer||row.letterAddressedTo).includes(officer)) return false;
        const d=recordDate(row);
        if(from && d && d<from) return false;
        if(to && d && d>to) return false;
        return true;
    });
    renderCPGRAMSSearch();
}

function clearCPGRAMSSearch(){
    ["grievanceNumber","fileNumber","complainantName","district","status","assignedOfficer","fromDate","toDate"].forEach(id=>{
        const el=document.getElementById(id); if(el) el.value="";
    });
    cpgramsSearchFiltered=[...cpgramsSearchRows];
    renderCPGRAMSSearch();
}

function esc(value){
    return String(value??"").replace(/[&<>"']/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}

function renderCPGRAMSSearch(){
    const tbody=document.querySelector("#resultsGrid tbody");
    if(!tbody) return;
    if(!cpgramsSearchFiltered.length){
        tbody.innerHTML='<tr><td colspan="7" style="text-align:center">No matching records found.</td></tr>';
        return;
    }
    tbody.innerHTML=cpgramsSearchFiltered.map(row=>{
        const id=encodeURIComponent(row.id||"");
        const grievance=row.grievanceNumber||row.grievanceNo||row.registrationNumber||"";
        const fileNo=row.fileNumber||row.fileNo||"";
        const name=row.complainantName||row.applicantName||"";
        const status=row.currentStatus||row.statusOfFile||row.finalStatus||row.status||"";
        return `<tr>
            <td>${esc(grievance)}</td><td>${esc(fileNo)}</td><td>${esc(name)}</td>
            <td>${esc(row.district)}</td><td>${esc(status)}</td><td>${esc(row.dueDate)}</td>
            <td><button type="button" onclick="location.href='cpgrams.html?id=${id}&mode=view'">View</button></td>
        </tr>`;
    }).join("");
}

function exportCPGRAMSSearchCSV(){
    if(!cpgramsSearchFiltered.length){ alert("No records to export."); return; }
    const headers=["Grievance No.","File No.","Name","District","Status","Due Date"];
    const rows=cpgramsSearchFiltered.map(row=>[
        row.grievanceNumber||row.grievanceNo||row.registrationNumber||"",
        row.fileNumber||row.fileNo||"",
        row.complainantName||row.applicantName||"",
        row.district||"",
        row.currentStatus||row.statusOfFile||row.finalStatus||row.status||"",
        row.dueDate||""
    ]);
    const quote=x=>'"'+String(x??"").replace(/"/g,'""')+'"';
    const csv=[headers,...rows].map(r=>r.map(quote).join(",")).join("\r\n");
    const blob=new Blob(["\ufeff",csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="CPGRAMS_Search.csv"; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
}
