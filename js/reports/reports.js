"use strict";
/* FMS Central Report Engine — all module reports and daily status */
const FMS_REPORTS = {
  cpgrams:{collection:"cpgrams", dateFields:["dateReceived","dateArised"], dueFields:["dueDate"], title:"CPGRAMS Report"},
  rti:{collection:"rtiApplications", dateFields:["applicationDate","dateReceived"], dueFields:["dueDate"], title:"RTI Report"},
  disha:{collection:"dishaMeetings", dateFields:["dateOfMeeting"], dueFields:["pomDueDate"], title:"DISHA Report"}
};
let reportRows=[], loaded={cpgrams:[],rti:[],disha:[]};

function fmtDate(v){ if(!v)return ""; if(v&&typeof v.toDate==="function") v=v.toDate(); const d=new Date(v); return isNaN(d)?"":d.toLocaleDateString("en-GB"); }
function isoDate(v){ if(!v)return ""; if(v&&typeof v.toDate==="function")v=v.toDate(); const d=new Date(v); return isNaN(d)?"":d.toISOString().slice(0,10); }
function first(r,keys){ for(const k of keys){if(r[k]!==undefined&&r[k]!==null&&String(r[k]).trim()!=="")return r[k];} return ""; }
function statusOf(r,module){
 if(module==="cpgrams") return first(r,["officeStatus","currentStatus","finalStatus","status"]) || "Pending";
 if(module==="rti") return first(r,["officeStatus","presentStatus","status","finalStatus"]) || "Pending";
 return first(r,["officeStatus","statusOfMeeting","pomUploaded","status"]) || "Pending";
}
function dueOf(r,module){return first(r,FMS_REPORTS[module].dueFields);}
function dateOf(r,module){return first(r,FMS_REPORTS[module].dateFields);}
function subjectOf(r,module){
 if(module==="cpgrams")return first(r,["subject","grievanceDescription","grievanceNumber"]);
 if(module==="rti")return first(r,["subject","informationSought","applicationNumber"]);
 return first(r,["remarks","statusOfMeeting","district"]);
}
function makeRow(module,r){
 const due=dueOf(r,module), status=statusOf(r,module), today=new Date(); today.setHours(0,0,0,0);
 let delay="",pendingDays="";
 if(due){const d=new Date(due);d.setHours(0,0,0,0); if(d<today && !/closed|disposed|reply obtained|despatched|held/i.test(String(status))) delay=Math.floor((today-d)/86400000);}
 const baseDate=dateOf(r,module); if(baseDate&&!/closed|disposed|reply obtained|despatched|held/i.test(String(status))){const bd=new Date(baseDate);bd.setHours(0,0,0,0);if(!isNaN(bd)&&bd<=today) pendingDays=Math.floor((today-bd)/86400000);}
 return {Module:module.toUpperCase(),ID:first(r,["grievanceNumber","applicationNumber","fileNo","officeFileNo","id"]),Date:fmtDate(dateOf(r,module)),DueDate:fmtDate(due),Subject:subjectOf(r,module),District:first(r,["district","nameOfDistrict"]),Status:status,"Days Pending":pendingDays,"Days Delayed":delay};
}
async function loadAll(){
 if(!window.db) throw new Error("Firestore is not ready. Please wait and try again.");
 for(const m of Object.keys(FMS_REPORTS)){const snap=await db.collection(FMS_REPORTS[m].collection).get();loaded[m]=snap.docs.map(d=>({id:d.id,...d.data()}));}
}
function inRange(r,module){
 const from=document.getElementById("fromDate").value, to=document.getElementById("toDate").value, d=isoDate(dateOf(r,module));
 return (!from||d>=from)&&(!to||d<=to);
}
function generate(){
 const m=document.getElementById("reportModule").value;
 let rows=[];
 if(m==="all"){for(const mod of Object.keys(loaded))rows.push(...loaded[mod].filter(r=>inRange(r,mod)).map(r=>makeRow(mod,r)));}
 else rows=loaded[m].filter(r=>inRange(r,m)).map(r=>makeRow(m,r));
 reportRows=rows; render(rows,m);
}
function render(rows,m){
 document.getElementById("reportTitle").textContent=m==="all"?"Daily Status Report — All Modules":FMS_REPORTS[m].title;
 document.getElementById("recordCount").textContent=rows.length+" records";
 const thead=document.querySelector("#reportTable thead"), tbody=document.querySelector("#reportTable tbody");
 const cols=["Module","ID","Date","DueDate","Subject","District","Status","Days Pending","Days Delayed"];
 thead.innerHTML="<tr>"+cols.map(c=>`<th>${c}</th>`).join("")+"</tr>";
 tbody.innerHTML=rows.length?rows.map(r=>"<tr>"+cols.map(c=>`<td>${escapeHtml(r[c]??"")}</td>`).join("")+"</tr>").join(""):'<tr><td colspan="9" class="text-center p-5 text-muted">No records found</td></tr>';
 const total=rows.length, delayed=rows.filter(r=>r["Days Delayed"]!=="").length, closed=rows.filter(r=>/closed|disposed|reply obtained/i.test(String(r.Status))).length, pending=total-closed;
 document.getElementById("summaryCards").innerHTML=[["Total",total,"primary"],["Pending",pending,"warning"],["Closed/Disposed",closed,"success"],["Overdue",delayed,"danger"]].map(x=>`<div class="col-md-3"><div class="card border-${x[2]}"><div class="card-body text-center"><div class="text-muted">${x[0]}</div><h3 class="text-${x[2]}">${x[1]}</h3></div></div></div>`).join("");
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function exportExcel(){if(!reportRows.length)return alert("Generate a report first."); const ws=XLSX.utils.json_to_sheet(reportRows),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"FMS Report");XLSX.writeFile(wb,"FMS_Report.xlsx");}
function exportPDF(){if(!reportRows.length)return alert("Generate a report first.");const {jsPDF}=window.jspdf;const doc=new jsPDF({orientation:"landscape"});doc.text(document.getElementById("reportTitle").textContent,14,15);const cols=Object.keys(reportRows[0]);doc.autoTable({head:[cols],body:reportRows.map(r=>cols.map(c=>String(r[c]??""))),startY:22,styles:{fontSize:7}});doc.save("FMS_Report.pdf");}
function printReport(){window.print();}
async function init(){document.getElementById("btnHome").onclick=()=>location.href="../index.html";document.getElementById("btnMasters").onclick=()=>location.href="admin/master-management.html";document.getElementById("btnRefresh").onclick=async()=>{await loadAll();generate();};document.getElementById("btnGenerate").onclick=generate;document.getElementById("btnExcel").onclick=exportExcel;document.getElementById("btnPDF").onclick=exportPDF;document.getElementById("btnPrint").onclick=printReport;try{await loadAll();const q=new URLSearchParams(location.search).get("module");if(q&&["cpgrams","rti","disha"].includes(q))document.getElementById("reportModule").value=q;generate();}catch(e){alert("Unable to load reports: "+e.message);console.error(e);}}
document.addEventListener("DOMContentLoaded",()=>{if(window.fmsFirebaseReady)init();else window.addEventListener("fmsFirebaseReady",init,{once:true});});
