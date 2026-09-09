/* ============================================================
   FMS DAILY STATUS EXCEL REPORT SERVICE
   Version 1.0
   Purpose: Export WhatsApp Daily Status reports to Excel
   in the approved CPGRAMS / DISHA formats.
   Lekha Technologies
============================================================ */
(function(window, document){
    "use strict";

    const XLSX_CDN = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

    function loadXLSX(){
        if(window.XLSX) return Promise.resolve(window.XLSX);
        if(window.__fmsXLSXPromise) return window.__fmsXLSXPromise;
        window.__fmsXLSXPromise = new Promise((resolve,reject)=>{
            const s=document.createElement("script");
            s.src=XLSX_CDN;
            s.onload=()=>window.XLSX ? resolve(window.XLSX) : reject(new Error("Excel library did not load."));
            s.onerror=()=>reject(new Error("Unable to load Excel export library. Check internet access."));
            document.head.appendChild(s);
        });
        return window.__fmsXLSXPromise;
    }

    function db(){
        try{
            if(typeof window.getFMSFirestore==="function"){
                const d=window.getFMSFirestore();
                if(d) return d;
            }
        }catch(e){}
        return window.db || (window.fmsFirebase && window.fmsFirebase.db) ||
               (typeof firebase!=="undefined" && firebase.firestore ? firebase.firestore() : null);
    }

    async function records(collection){
        const d=db();
        if(!d) throw new Error("Firebase Firestore is not initialized.");
        const snap=await d.collection(collection).get();
        return snap.docs.map(x=>({id:x.id,...x.data()}));
    }

    function date(v){
        if(!v) return null;
        if(typeof v.toDate==="function") return v.toDate();
        if(v instanceof Date) return v;
        if(typeof v==="object" && v.seconds!=null) return new Date(Number(v.seconds)*1000);
        if(typeof v==="object" && v._seconds!=null) return new Date(Number(v._seconds)*1000);
        const s=String(v).trim();
        if(/^\d{4}-\d{2}-\d{2}$/.test(s)){
            const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]);
        }
        if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)){
            const p=s.split("/"); return new Date(+p[2],+p[1]-1,+p[0]);
        }
        const d=new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }

    function fmt(v){
        const d=date(v);
        return d ? String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear() : "";
    }

    function iso(v){
        const d=date(v);
        return d ? d.toISOString().slice(0,10) : "";
    }

    function fyInfo(){
        const now=new Date(), y=now.getFullYear(), m=now.getMonth()+1;
        const start=m>=4?y:y-1;
        return {start,end:start+1,label:`${start}-${String(start+1).slice(-2)}`,
                startDate:new Date(start,3,1), endDate:new Date(start+1,2,31,23,59,59,999)};
    }

    function inFY(v, fy){
        const d=date(v); return !!(d && d>=fy.startDate && d<=fy.endDate);
    }

    function daysFrom(v){
        const d=date(v); if(!d) return "";
        const today=new Date(); today.setHours(0,0,0,0);
        d.setHours(0,0,0,0);
        return Math.max(0,Math.floor((today-d)/86400000));
    }

    function norm(v){ return String(v??"").trim(); }

    function status(r){
        return norm(r.status || r.presentStatus || r.currentStatus || r.finalStatus || r.meetingStatus);
    }

    function disposed(r){
        const s=status(r).toLowerCase();
        return ["disposed","disposed of","completed","complete","closed","reply furnished","replied","final reply sent","final reply furnished","held"].includes(s);
    }

    function overdue(r, dueField){
        if(disposed(r)) return false;
        const d=date(r[dueField]); if(!d) return false;
        return d < new Date();
    }

    function setupSheet(X, rows, widths, merges){
        const ws=X.utils.aoa_to_sheet(rows);
        if(widths) ws["!cols"]=widths.map(w=>({wch:w}));
        if(merges) ws["!merges"]=merges;
        ws["!freeze"]={xSplit:0,ySplit:3};
        return ws;
    }

    function addTitleRows(rows,title,subtitle){
        rows.push([title]);
        rows.push([subtitle||""]);
        rows.push([]);
    }

    function cpgramsWorkbook(X, data, fy){
        const wb=X.utils.book_new();
        const current=data.filter(r=>inFY(r.dateReceived||r.dateArised||r.dateReceivedDate,fy));
        const groups={};
        current.forEach(r=>{
            const source=norm(r.grievanceSource||r.source||r.sourceType||r.category||"CPGRAMS");
            groups[source]=(groups[source]||0)+1;
        });

        const summary=[[
            `CPGRAMS Progress Report (FY ${fy.label})`
        ],[""],["Grievance Source","Total Receipt Grievances","Disposed Grievances","Grievances Pending"]];
        const sources=Object.keys(groups);
        let disposedCount=0;
        current.forEach(r=>{if(disposed(r)) disposedCount++;});
        if(!sources.length) sources.push("CPGRAMS");
        sources.forEach(s=>{
            const total=groups[s]||0;
            const d=current.filter(r=>(norm(r.grievanceSource||r.source||r.sourceType||r.category||"CPGRAMS"))===s && disposed(r)).length;
            summary.push([s,total,d,total-d]);
        });
        summary.push(["Total",current.length,disposedCount,current.length-disposedCount]);
        const ws1=setupSheet(X,summary,[28,24,24,24],[{s:{r:0,c:0},e:{r:0,c:3}}]);
        X.utils.book_append_sheet(wb,ws1,"Sheet1");

        const rows=[];
        addTitleRows(rows,"Status of CPGRAMS Complaints pending as on",new Date().toLocaleDateString("en-IN"));
        rows.push(["Sl.No.","Name of the Complainant","Date Received","No. of Days pending","Grievance Details","Current Status"]);
        const pending=current.filter(r=>!disposed(r));
        pending.forEach((r,i)=>{
            rows.push([
                i+1,
                norm(r.complainantName||r.applicantName||r.name),
                fmt(r.dateReceived),
                daysFrom(r.dateReceived),
                norm(r.grievanceDescription||r.description||r.subject),
                status(r)||"Pending"
            ]);
        });
        if(!pending.length) rows.push(["","","","","No pending CPGRAMS records",""]);
        const ws2=setupSheet(X,rows,[10,32,16,22,75,28],[{s:{r:0,c:0},e:{r:0,c:5}}]);
        X.utils.book_append_sheet(wb,ws2,"CPGRAMS");

        const p=setupSheet(X,[["Prajavani","No records available in CPGRAMS collection for this export."]],[28,70]);
        X.utils.book_append_sheet(wb,p,"Prajavani");
        const g=setupSheet(X,[["Public Grievances","No records available in CPGRAMS collection for this export."]],[32,70]);
        X.utils.book_append_sheet(wb,g,"Public Grievances");
        return wb;
    }

    function rtiWorkbook(X,data,fy){
        const wb=X.utils.book_new();
        const current=data.filter(r=>inFY(r.applicationDate||r.dateReceived||r.dateArised,fy));
        const disposedCount=current.filter(disposed).length;
        const pending=current.filter(r=>!disposed(r)).length;
        const overdueCount=current.filter(r=>overdue(r,"dueDate")).length;

        const summary=[
            [`RTI Progress Report (FY ${fy.label})`],[""],["Particulars","Number"],
            ["Total RTI Applications",current.length],
            ["Disposed / Completed",disposedCount],
            ["Pending",pending],
            ["Overdue",overdueCount]
        ];
        X.utils.book_append_sheet(wb,setupSheet(X,summary,[36,20],[{s:{r:0,c:0},e:{r:0,c:1}}]),"Sheet1");

        const rows=[];
        addTitleRows(rows,"Status of RTI Applications pending as on",new Date().toLocaleDateString("en-IN"));
        rows.push(["Sl.No.","Name of the Applicant","Application Date","No. of Days pending","Information sought","Current Status","Due Date","District","File No."]);
        current.filter(r=>!disposed(r)).forEach((r,i)=>{
            rows.push([
                i+1,
                norm(r.applicantName||r.complainantName||r.name),
                fmt(r.applicationDate||r.dateReceived),
                daysFrom(r.applicationDate||r.dateReceived),
                norm(r.informationSought||r.subject||r.description),
                status(r)||"Pending",
                fmt(r.dueDate),
                norm(r.district),
                norm(r.fileNo||r.fileNumber)
            ]);
        });
        if(current.filter(r=>!disposed(r)).length===0) rows.push(["","","","","No pending RTI records","","","",""]);
        X.utils.book_append_sheet(wb,setupSheet(X,rows,[10,30,18,22,60,28,16,24,22],[{s:{r:0,c:0},e:{r:0,c:8}}]),"RTI");
        return wb;
    }

    function dishaWorkbook(X,data,fy){
        const wb=X.utils.book_new();
        const current=data.filter(r=>inFY(r.dateOfMeeting||r.meetingDate,fy));
        const districts={};
        current.forEach(r=>{
            const d=norm(r.districtName||r.district||"Unknown");
            (districts[d]||(districts[d]=[])).push(r);
        });
        const summary=[[`Status of DISHA Meetings Conducted During the FY ${fy.label}`],[""],["Sl.No.","District Name","DISHA Meetings Conducted","","","PoM Uploaded","","Date of meeting"],["","", "Total Meetings to be Conducted","Total Meetings Conducted","Percentage of target meetings","PoM Uploaded","Percentage of PoM Uploaded",""]];
        let i=0;
        Object.keys(districts).sort().forEach(d=>{
            i++; const rs=districts[d], held=rs.filter(r=>norm(r.meetingStatus||r.status).toLowerCase()==="held").length;
            const pom=rs.filter(r=>String(r.pomUploaded??r.momUploaded??"").toLowerCase()==="yes").length;
            summary.push([i,d,rs.length,held,rs.length?Math.round(held/rs.length*100)+"%":"0%",pom,rs.length?Math.round(pom/rs.length*100)+"%":"0%",fmt(rs[0].dateOfMeeting||rs[0].meetingDate)]);
        });
        X.utils.book_append_sheet(wb,setupSheet(X,summary,[10,30,24,24,28,18,24,18],[{s:{r:0,c:0},e:{r:0,c:7}}]),fy.label);

        [1,2,3,4].forEach(q=>{
            const startMonth=(q-1)*3+4;
            const start=new Date(fy.startYear,startMonth-1,1);
            const end=new Date(fy.startYear+(q===4?1:0),q===4?2:q*3,0,23,59,59,999);
            const rs=current.filter(r=>{const d=date(r.dateOfMeeting||r.meetingDate);return d&&d>=start&&d<=end;});
            const title=q===1?"I Quarter":q===2?"II Quarter":q===3?"III Quarter":"IV Quarter";
            const rows=[];
            addTitleRows(rows,`Status of DISHA Meetings Conducted / Scheduled During the ${title} of FY ${fy.label}`,`Quarter period`);
            rows.push(["Sl.No.","District Name","Meeting Data Uploaded","PoM Uploaded","Date of meeting","No.of days Elapsed/Left","Status of PoM Upload"]);
            rs.forEach((r,j)=>{
                const md=date(r.dateOfMeeting||r.meetingDate), due=date(r.pomDueDate)|| (md?new Date(md.getTime()+30*86400000):null);
                const today=new Date(); const delta=due?Math.floor((due-today)/86400000):"";
                const pom=norm(r.pomUploaded??r.momUploaded??"").toUpperCase();
                rows.push([j+1,norm(r.districtName||r.district),norm(r.meetingDataUploaded||r.dataUploaded||"NO"),pom||"NO",fmt(md),
                    delta===""?"":(delta>=0?`${delta} Days Left`:`${Math.abs(delta)} Days Elapsed after due date`),
                    pom==="YES"?"PoM Uploaded Already":(delta<0?"PoM Overdue":`${delta} Days Left for PoM Upload`)]);
            });
            if(!rs.length) rows.push(["","","","","No records for this quarter","",""]);
            X.utils.book_append_sheet(wb,setupSheet(X,rows,[10,30,22,18,18,30,42],[{s:{r:0,c:0},e:{r:0,c:6}}]),title);
        });
        return wb;
    }

    async function exportExcel(module, suppliedRecords){
        const X=await loadXLSX();
        const fy=fyInfo();
        let data=suppliedRecords;
        if(!Array.isArray(data)){
            const col=module==="CPGRAMS"?"cpgrams":module==="RTI"?"rtiApplications":"dishaMeetings";
            data=await records(col);
        }
        const wb=module==="CPGRAMS"?cpgramsWorkbook(X,data,fy):module==="RTI"?rtiWorkbook(X,data,fy):dishaWorkbook(X,data,fy);
        const filename=module==="DISHA"?`DISHA Meetings_Status_${fy.label.replace("-","_")}.xlsx`:`${module} Daily Status FY ${fy.label}.xlsx`;
        X.writeFile(wb,filename);
        return {filename,fy,data};
    }

    async function exportAndWhatsApp(module, options={}){
        const result=await exportExcel(module,options.records);
        return {excel:result,share:null,message:"Excel report exported. Use the module WhatsApp button when you want to send a custom message."};
    }

    window.FMSExcelReportService={exportExcel,exportAndWhatsApp};
})(window,document);
