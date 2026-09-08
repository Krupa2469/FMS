<<<<<<< HEAD
/*
================================================================
 FMS - RTI MODULE
 Version : 4.1
 Developer: Lekha Technologies

 Four-section RTI data entry:
 1. Application Details
 2. Applicant Details
 3. Office Processing
 4. Attachments Upload

 RTI Application file:
 - selected only for RTI Application parsing
 - parsed immediately using the central FMS document engine
 - extracted values populate the form
 - the selected RTI Application is uploaded to Firebase Storage
   and its metadata is saved in Firestore when the record is saved

 Attachments:
 - one common attachment upload control
 - no document type is required
 - saved to Firebase Storage + Firestore
================================================================
*/
"use strict";

const RTI_COLLECTION = "rtiApplications";
let currentRTIRecordId = null;
let rtiDocuments = [];
let pendingRTIApplicationFile = null;
let pendingRTIApplicationMeta = null;

function rtiDb() {
    try {
        if (typeof window.getFMSFirestore === "function") {
            const shared = window.getFMSFirestore();
            if (shared) return shared;
        }
    } catch (e) {
        console.warn("Shared Firestore accessor failed:", e);
    }
    if (window.fmsFirebase && window.fmsFirebase.db) return window.fmsFirebase.db;
    if (window.db) return window.db;
    if (typeof db !== "undefined" && db) return db;
    if (typeof firebase !== "undefined" && firebase.firestore) return firebase.firestore();
    return null;
}
function rtiStorage() {
    try {
        if (typeof window.getFMSStorage === "function") {
            const shared = window.getFMSStorage();
            if (shared) return shared;
        }
    } catch (e) {
        console.warn("Shared Storage accessor failed:", e);
    }
    if (window.fmsFirebase && window.fmsFirebase.storage) return window.fmsFirebase.storage;
    if (window.storage) return window.storage;
    if (typeof firebase !== "undefined" && firebase.storage) return firebase.storage();
    return null;
}
function rtiReady() {
    if (rtiDb()) return true;
    showRTIMessage("Firebase is not ready. Please wait a moment and try again.", "warning");
    return false;
}
function rtiServerTimestamp() {
    try {
        if (typeof firebase !== "undefined" && firebase.firestore?.FieldValue) {
            return firebase.firestore.FieldValue.serverTimestamp();
        }
    } catch (e) {}
    return new Date();
}
function esc(v) {
    return String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
function val(id) { const e=document.getElementById(id); return e ? String(e.value||"").trim() : ""; }
function setVal(id,v) { const e=document.getElementById(id); if(e) e.value=v==null?"":v; }
function fmtDate(v) {
    if(!v) return "";
    if(typeof v === "object" && typeof v.toDate === "function") v=v.toDate();
    if(typeof v === "object" && v.seconds != null) v=new Date(Number(v.seconds)*1000);
    if(v instanceof Date) return isNaN(v.getTime()) ? "" : v.toISOString().slice(0,10);
    const s=String(v).trim();
    if(/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) { const [y,m,d]=s.split("-"); return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
    let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if(m) return `${m[3]}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`;
    const d=new Date(s); return isNaN(d.getTime()) ? "" : d.toISOString().slice(0,10);
}
function safeName(name){ return String(name||"document").replace(/[^a-zA-Z0-9._-]/g,"_"); }

function showRTIMessage(message,type="info") {
    const box=document.getElementById("rtiMessage");
    if(!box){ console.log(message); return; }
    box.innerHTML=`<div class="alert alert-${esc(type)}" role="alert">${esc(message)}</div>`;
    setTimeout(()=>{ if(box) box.innerHTML=""; },6000);
}

function calculateRTIDueDate(){
    const source=val("applicationDate"), target=document.getElementById("dueDate");
    if(!target) return;
    if(!source){ target.value=""; return; }
    const d=new Date(source+"T00:00:00");
    if(isNaN(d.getTime())) return;
    d.setDate(d.getDate()+30);
    target.value=d.toISOString().slice(0,10);
}

function addSelectOption(select,value,text=value){
    if(!select || !value) return;
    if([...select.options].some(o=>String(o.value).toLowerCase()===String(value).toLowerCase())) return;
    const o=document.createElement("option"); o.value=value; o.textContent=text; select.appendChild(o);
}

function loadRTIMasters(){
    if(typeof loadDistricts === "function") loadDistricts();

    const district=document.getElementById("district");
    const mandal=document.getElementById("mandal");
    const village=document.getElementById("village");

    district?.addEventListener("change", async ()=>{
        const d=district.value;
        if(window.FMSRTIMasterService){
            await window.FMSRTIMasterService.loadMandals(d);
        } else if(typeof loadMandals === "function"){
            loadMandals(d);
        }
        if(village){
            village.disabled=true;
            village.innerHTML='<option value="">-- Select Village --</option>';
        }
    });

    mandal?.addEventListener("change", async ()=>{
        const d=district?.value||"";
        const m=mandal.value;
        if(window.FMSRTIMasterService){
            await window.FMSRTIMasterService.loadVillages(d,m);
        } else if(typeof loadVillages === "function"){
            loadVillages(d,m);
        }
    });

    document.getElementById("btnSaveMandal")?.addEventListener("click", saveNewRTIMandal);
    document.getElementById("btnSaveVillage")?.addEventListener("click", saveNewRTIVillage);
    document.getElementById("btnSaveOfficeOfficer")?.addEventListener("click", saveNewRTIOfficer);

    loadRTIOfficeSection();
    loadRTIOfficers();
}

async function loadRTIOfficers(selected=""){
    try{
        if(window.FMSRTIMasterService){
            await window.FMSRTIMasterService.loadOfficers("officeLetterAddressedTo",selected);
        } else if(typeof loadOfficers==="function"){
            loadOfficers("officeLetterAddressedTo");
        }
    }catch(e){ console.warn("Officer Master load warning:",e); }
}

async function saveNewRTIMandal(){
    const district=val("district"), input=document.getElementById("newMandal"), name=val("newMandal");
    if(!district){ showRTIMessage("Please select District before saving a new Mandal.","warning"); return; }
    if(!name){ showRTIMessage("Please enter the new Mandal name.","warning"); input?.focus(); return; }
    try{
        const btn=document.getElementById("btnSaveMandal"); if(btn) btn.disabled=true;
        if(window.FMSRTIMasterService) await window.FMSRTIMasterService.saveMandal(district,name);
        if(window.FMSRTIMasterService) await window.FMSRTIMasterService.loadMandals(district,name);
        if(input) input.value="";
        showRTIMessage("Mandal saved to the Mandal Master.","success");
    }catch(e){ console.error(e); showRTIMessage("Unable to save Mandal: "+e.message,"danger"); }
    finally{ const btn=document.getElementById("btnSaveMandal"); if(btn) btn.disabled=false; }
}

async function saveNewRTIVillage(){
    const district=val("district"), mandal=val("mandal"), input=document.getElementById("newVillage"), name=val("newVillage");
    if(!district){ showRTIMessage("Please select District before saving a new Village.","warning"); return; }
    if(!mandal){ showRTIMessage("Please select Mandal before saving a new Village.","warning"); return; }
    if(!name){ showRTIMessage("Please enter the new Village name.","warning"); input?.focus(); return; }
    try{
        const btn=document.getElementById("btnSaveVillage"); if(btn) btn.disabled=true;
        if(window.FMSRTIMasterService) await window.FMSRTIMasterService.saveVillage(district,mandal,name);
        if(window.FMSRTIMasterService) await window.FMSRTIMasterService.loadVillages(district,mandal,name);
        if(input) input.value="";
        showRTIMessage("Village saved to the Village Master.","success");
    }catch(e){ console.error(e); showRTIMessage("Unable to save Village: "+e.message,"danger"); }
    finally{ const btn=document.getElementById("btnSaveVillage"); if(btn) btn.disabled=false; }
}

async function saveNewRTIOfficer(){
    const input=document.getElementById("newOfficeOfficer"), name=val("newOfficeOfficer");
    if(!name){ showRTIMessage("Please enter the new officer name/designation.","warning"); input?.focus(); return; }
    try{
        const btn=document.getElementById("btnSaveOfficeOfficer"); if(btn) btn.disabled=true;
        if(window.FMSRTIMasterService) await window.FMSRTIMasterService.saveOfficer(name);
        await loadRTIOfficers(name);
        if(input) input.value="";
        showRTIMessage("Officer saved to the Officer Master.","success");
    }catch(e){ console.error(e); showRTIMessage("Unable to save Officer: "+e.message,"danger"); }
    finally{ const btn=document.getElementById("btnSaveOfficeOfficer"); if(btn) btn.disabled=false; }
}

function registerRTIEvents(){
    document.getElementById("applicationDate")?.addEventListener("change",calculateRTIDueDate);
    document.getElementById("btnNew")?.addEventListener("click",prepareNewRTI);
    document.getElementById("btnSave")?.addEventListener("click",saveRTIRecord);
    document.getElementById("btnUpdate")?.addEventListener("click",updateRTIRecord);
    document.getElementById("btnDelete")?.addEventListener("click",deleteRTIRecord);
    document.getElementById("btnPrint")?.addEventListener("click",()=>window.print());
    document.getElementById("btnRegister")?.addEventListener("click",()=>location.href="rti-register.html");
    document.getElementById("btnDailyStatus")?.addEventListener("click",()=>location.href="rti-daily-status.html");
    document.getElementById("btnHome")?.addEventListener("click",()=>location.href="../../pages/module-dashboard.html?module=rti");
    document.getElementById("btnWhatsApp")?.addEventListener("click",shareRTIWhatsApp);
    document.getElementById("btnParseRTIApplication")?.addEventListener("click",parseSelectedRTIApplication);
    document.getElementById("rtiApplicationFile")?.addEventListener("change",handleRTIApplicationSelection);
    document.getElementById("btnUploadAttachment")?.addEventListener("click",()=>uploadRTIAttachment("Attachment","attachmentFile"));
}

async function initializeRTIModule(){
    if(!rtiReady()) return;
    registerRTIEvents();
    loadRTIMasters();
    await loadRTIOfficeSection();
    await loadRTIRecordFromURL();
    console.log("RTI Module initialized - Version 4.3");
}

async function loadRTIOfficeSection(selected=""){
    try {
        if(window.FMSOfficeProcessing){
            await window.FMSOfficeProcessing.loadSectionDropdown("officeReplySection",selected);
        } else if(typeof loadSections === "function"){
            await loadSections("officeReplySection");
        }
    } catch(e){ console.warn("Office Section Master load warning",e); }
    await loadRTIOfficers(selected && document.getElementById("officeLetterAddressedTo")?.value || "");
}

function prepareNewRTI(){
    currentRTIRecordId=null; rtiDocuments=[]; pendingRTIApplicationFile=null; pendingRTIApplicationMeta=null;
    document.getElementById("rtiApplicationFile")?.value && (document.getElementById("rtiApplicationFile").value="");
    clearRTIForm(); renderRTIAttachments();
    history.replaceState({},document.title,"rti.html");
    showRTIMessage("Ready for a new RTI application.","info");
}

function getRTIFormData(){
    return {
        applicationNumber:val("applicationNumber"), applicationDate:val("applicationDate"), dueDate:val("dueDate"),
        informationSought:val("informationSought"),
        applicantName:val("applicantName"), mobileNumber:val("mobileNumber"), applicantAddress:val("applicantAddress"),
        district:val("district"), mandal:val("mandal"), village:val("village"),
        officeFileNo:val("officeFileNo"), officeDateArised:val("officeDateArised"), officeSubject:val("officeSubject"),
        officeCommunicationType:val("officeCommunicationType"), officeLetterAddressedTo:val("officeLetterAddressedTo"),
        officeReplyObtainedFrom:val("officeReplySection"), officeStatus:val("officeStatus"),
        parsedText:val("parsedText")
    };
}

function validateRTIForm(data){
    const checks=[
        ["applicationNumber","Please enter RTI Application Number."],
        ["applicationDate","Please enter Application Date."],
        ["applicantName","Please enter Applicant Name."],
        ["informationSought","Please enter Information Sought."]
    ];
    for(const [id,msg] of checks){ if(!data[id]){ showRTIMessage(msg,"warning"); document.getElementById(id)?.focus(); return false; } }
    return true;
}

function buildFirestoreData(data,documents){
    return {
        ...data,
        documents:Array.isArray(documents)?documents:[],
        attachments:Array.isArray(documents)?documents:[],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
}

async function uploadFileToRTI(file,type,recordId){
    if(!file) return null;
    const storage=rtiStorage(); if(!storage) throw new Error("Firebase Storage is not available.");
    const path=`rtiApplications/${recordId}/${Date.now()}_${safeName(file.name)}`;
    const snap=await storage.ref(path).put(file);
    const url=await snap.ref.getDownloadURL();
    return {name:file.name,type,contentType:file.type||"",size:file.size||0,path,url,uploadedAt:new Date().toISOString()};
}

async function persistPendingRTIApplication(recordId,existingDocs=[]){
    if(!pendingRTIApplicationFile) return existingDocs;
    const meta=await uploadFileToRTI(pendingRTIApplicationFile,"RTI Application",recordId);
    const filtered=existingDocs.filter(d=>d.type!=="RTI Application");
    return [...filtered,meta];
}

async function saveRTIRecord(){
    if(!rtiReady()) return false;

    const btn=document.getElementById("btnSave");
    if(btn) btn.disabled=true;

    try {
        calculateRTIDueDate();
        const data=getRTIFormData();

        if(!validateRTIForm(data)) return false;

        const database=rtiDb();
        if(!database) throw new Error("Firestore is not available.");

        const duplicate=await database.collection(RTI_COLLECTION)
            .where("applicationNumber","==",data.applicationNumber).limit(1).get();

        if(!duplicate.empty){
            const existing=duplicate.docs[0];
            showRTIMessage(
                "This RTI Application Number already exists. Use Update instead.",
                "warning"
            );
            currentRTIRecordId=existing.id;
            history.replaceState({},document.title,`rti.html?id=${encodeURIComponent(existing.id)}`);
            return false;
        }

        const now=rtiServerTimestamp();
        const ref=await database.collection(RTI_COLLECTION).add({
            ...data,
            documents:[],
            attachments:[],
            createdAt:now,
            updatedAt:now
        });

        currentRTIRecordId=ref.id;

        // Save the RTI Application document selected for parsing only after
        // the Firestore record has been created.
        let docs=[];
        docs=await persistPendingRTIApplication(currentRTIRecordId,docs);

        await database.collection(RTI_COLLECTION).doc(currentRTIRecordId).update({
            documents:docs,
            attachments:docs,
            updatedAt:rtiServerTimestamp()
        });

        rtiDocuments=docs;
        pendingRTIApplicationFile=null;
        pendingRTIApplicationMeta=null;
        const fileInput=document.getElementById("rtiApplicationFile");
        if(fileInput) fileInput.value="";
        renderRTIAttachments();

        showRTIMessage(
            "RTI application saved successfully to Firestore.",
            "success"
        );

        history.replaceState(
            {},
            document.title,
            `rti.html?id=${encodeURIComponent(currentRTIRecordId)}`
        );

        return true;

    } catch(e) {
        console.error("RTI SAVE ERROR:",e);
        showRTIMessage(
            "Unable to save RTI application: " + (e?.message || e),
            "danger"
        );
        return false;
    } finally {
        if(btn) btn.disabled=false;
    }
}
async function updateRTIRecord(){
    if(!rtiReady()) return false;

    if(!currentRTIRecordId){
        showRTIMessage("Please save or load an RTI record before updating.","warning");
        return false;
    }

    const btn=document.getElementById("btnUpdate");
    if(btn) btn.disabled=true;

    try {
        calculateRTIDueDate();
        const data=getRTIFormData();
        if(!validateRTIForm(data)) return false;

        const database=rtiDb();
        if(!database) throw new Error("Firestore is not available.");

        let docs=[...rtiDocuments];
        docs=await persistPendingRTIApplication(currentRTIRecordId,docs);

        await database.collection(RTI_COLLECTION).doc(currentRTIRecordId).update({
            ...data,
            documents:docs,
            attachments:docs,
            updatedAt:rtiServerTimestamp()
        });

        rtiDocuments=docs;
        pendingRTIApplicationFile=null;
        pendingRTIApplicationMeta=null;
        renderRTIAttachments();

        showRTIMessage("RTI application updated successfully in Firestore.","success");
        return true;

    } catch(e) {
        console.error("RTI UPDATE ERROR:",e);
        showRTIMessage(
            "Unable to update RTI application: " + (e?.message || e),
            "danger"
        );
        return false;
    } finally {
        if(btn) btn.disabled=false;
    }
}
async function deleteRTIRecord(){
    if(!rtiReady()||!currentRTIRecordId) { showRTIMessage("Please load an RTI record before deleting.","warning"); return; }
    if(!confirm("Are you sure you want to delete this RTI application?")) return;
    try { await rtiDb().collection(RTI_COLLECTION).doc(currentRTIRecordId).delete(); currentRTIRecordId=null; rtiDocuments=[]; location.href="rti-register.html"; }
    catch(e){ showRTIMessage("Unable to delete RTI application: "+e.message,"danger"); }
}

async function loadRTIRecordFromURL(){
    const id=new URLSearchParams(location.search).get("id"); if(!id) return;
    if(!rtiReady()) return;
    try {
        const snap=await rtiDb().collection(RTI_COLLECTION).doc(id).get();
        if(!snap.exists){ showRTIMessage("RTI record not found.","warning"); return; }
        currentRTIRecordId=snap.id; await populateRTIForm(snap.data());
        showRTIMessage("RTI record loaded successfully.","info");
    } catch(e){ console.error(e); showRTIMessage("Unable to load RTI record: "+e.message,"danger"); }
}

async function populateRTIForm(data){
    if(!data) return;

    const basic={
        applicationNumber:data.applicationNumber,
        informationSought:data.informationSought,
        applicantName:data.applicantName,
        mobileNumber:data.mobileNumber,
        applicantAddress:data.applicantAddress,
        officeFileNo:data.officeFileNo,
        officeSubject:data.officeSubject,
        officeCommunicationType:data.officeCommunicationType,
        officeLetterAddressedTo:data.officeLetterAddressedTo,
        officeReplySection:data.officeReplySection||data.officeReplyObtainedFrom||data.replyObtainedFrom,
        officeStatus:data.officeStatus
    };
    Object.entries(basic).forEach(([id,v])=>setVal(id,v||""));
    setVal("applicationDate",fmtDate(data.applicationDate));
    setVal("dueDate",fmtDate(data.dueDate));
    setVal("officeDateArised",fmtDate(data.officeDateArised));
    setVal("parsedText",data.parsedText||"");

    const district=data.district||"";
    setVal("district",district);

    if(window.FMSRTIMasterService){
        await window.FMSRTIMasterService.loadMandals(district,data.mandal||"");
        if(district && data.mandal){
            await window.FMSRTIMasterService.loadVillages(district,data.mandal,data.village||"");
        }
        await loadRTIOfficers(data.officeLetterAddressedTo||"");
    }else{
        if(typeof loadMandals==="function" && district) loadMandals(district);
        setTimeout(()=>{
            setVal("mandal",data.mandal||"");
            if(typeof loadVillages==="function"&&district&&data.mandal) loadVillages(district,data.mandal);
            setTimeout(()=>setVal("village",data.village||""),100);
        },100);
    }

    if(data.officeReplySection||data.officeReplyObtainedFrom||data.replyObtainedFrom){
        await loadRTIOfficeSection(data.officeReplySection||data.officeReplyObtainedFrom||data.replyObtainedFrom);
    }
    setVal("mandal",data.mandal||"");
    setVal("village",data.village||"");

    rtiDocuments=Array.isArray(data.documents)?data.documents:(Array.isArray(data.attachments)?data.attachments:[]);
    renderRTIAttachments();
}

function clearRTIForm(){
    ["applicationNumber","applicationDate","dueDate","informationSought","applicantName","mobileNumber","applicantAddress","district","mandal","village","officeFileNo","officeDateArised","officeSubject","officeCommunicationType","officeLetterAddressedTo","officeReplySection","officeStatus","parsedText"].forEach(id=>setVal(id,""));
    const m=document.getElementById("mandal"),v=document.getElementById("village"); if(m){m.disabled=true;m.innerHTML='<option value="">-- Select Mandal --</option>';} if(v){v.disabled=true;v.innerHTML='<option value="">-- Select Village --</option>';}
}

async function handleRTIApplicationSelection(){
    const input=document.getElementById("rtiApplicationFile"); const file=input?.files?.[0];
    if(!file) return;
    pendingRTIApplicationFile=file; pendingRTIApplicationMeta={name:file.name,size:file.size,type:file.type};
    const status=document.getElementById("rtiApplicationStatus"); if(status) status.textContent=`Selected: ${file.name}`;
    showRTIMessage("RTI Application selected. Click 'Parse RTI Application' to extract and populate the form.","info");
}

async function parseSelectedRTIApplication(){
    const file=pendingRTIApplicationFile || document.getElementById("rtiApplicationFile")?.files?.[0];
    if(!file){ showRTIMessage("Please choose the RTI Application document first.","warning"); return; }

    if(!window.FMSDocumentEngine || typeof window.FMSDocumentEngine.parse !== "function"){
        showRTIMessage("Central Document Engine is not available.","danger"); return;
    }

    try{
        showRTIMessage("Parsing RTI Application and populating the form...","info");

        // Use the central engine so extraction + RTI field parsing are performed together.
        const result=await window.FMSDocumentEngine.parse({file,module:"RTI"});
        const text=String(result?.text||"").trim();
        const fields=result?.fields||{};

        if(!text) throw new Error("No readable text was extracted. If this is a scanned PDF, OCR will be attempted automatically.");

        setVal("parsedText",text);

        // Section 1 is always populated from the parsed RTI application.
        const section1Mapping={
            applicationNumber:"applicationNumber",
            applicationDate:"applicationDate",
            dueDate:"dueDate",
            informationSought:"informationSought"
        };
        // Applicant details are also populated from the same RTI application.
        const applicantMapping={
            applicantName:"applicantName",
            mobileNumber:"mobileNumber",
            applicantAddress:"applicantAddress",
            district:"district",
            mandal:"mandal",
            village:"village"
        };
        const officeMapping={
            officeFileNo:"officeFileNo",
            officeDateArised:"officeDateArised",
            officeSubject:"officeSubject",
            officeCommunicationType:"officeCommunicationType",
            officeLetterAddressedTo:"officeLetterAddressedTo",
            officeReplyObtainedFrom:"officeReplySection",
            officeStatus:"officeStatus"
        };

        const fill=window.FMSParserService?.fillFields;
        if(fill){
            // Parsing should fill the blank form, while preserving any value
            // deliberately entered by the user before parsing.
            fill(fields,section1Mapping,{onlyEmpty:true});
            fill(fields,applicantMapping,{onlyEmpty:true});
            fill(fields,officeMapping,{onlyEmpty:true});
        }else{
            fallbackFill(fields,{...section1Mapping,...applicantMapping,...officeMapping});
        }

        // Rebuild dependent masters before applying parsed Mandal/Village.
        const district=fields.district||val("district");
        const mandalValue=fields.mandal||"";
        const villageValue=fields.village||"";

        if(district && window.FMSRTIMasterService){
            const districtEl=document.getElementById("district");
            if(districtEl){
                districtEl.value=district;
                districtEl.dispatchEvent(new Event("change",{bubbles:true}));
            }
            await window.FMSRTIMasterService.loadMandals(district,mandalValue);
            if(mandalValue){
                await window.FMSRTIMasterService.loadVillages(district,mandalValue,villageValue);
            }
        }

        // Parsed officer values are allowed even if they are not yet in the master.
        if(fields.officeLetterAddressedTo){
            await loadRTIOfficers(fields.officeLetterAddressedTo);
            setVal("officeLetterAddressedTo",fields.officeLetterAddressedTo);
        }

        // Reply obtained from remains Section Master.
        if(fields.officeReplyObtainedFrom || fields.replyObtainedFrom){
            const section=fields.officeReplyObtainedFrom||fields.replyObtainedFrom;
            await loadRTIOfficeSection(section);
            setVal("officeReplySection",section);
        }

        calculateRTIDueDate();
        pendingRTIApplicationFile=file;
        pendingRTIApplicationMeta={name:file.name,size:file.size,type:file.type};
        const status=document.getElementById("rtiApplicationStatus");
        if(status) status.textContent=`Parsed: ${file.name} (${result.extractionMethod||"document engine"}) — pending Save`;

        const populated=Object.entries({
            applicationNumber:val("applicationNumber"),
            applicationDate:val("applicationDate"),
            informationSought:val("informationSought"),
            applicantName:val("applicantName"),
            district:val("district")
        }).filter(([,v])=>v).length;

        if(populated===0){
            showRTIMessage("Document was read, but no RTI fields were recognised. Please check the Extracted Text preview or use the manual fields.","warning");
        }else{
            showRTIMessage(`RTI Application parsed successfully. ${populated} key fields populated. Review the form and click Save.`,"success");
        }
    }catch(e){
        console.error("RTI parsing error",e);
        showRTIMessage("Unable to parse RTI Application: "+e.message,"danger");
    }
}
function fallbackFill(fields,mapping){
    Object.keys(mapping).forEach(k=>{ if(fields[k] && !val(mapping[k])) setVal(mapping[k],fields[k]); });
}

async function uploadRTIAttachment(type="Attachment",inputId="attachmentFile"){
    const file=document.getElementById(inputId)?.files?.[0];
    if(!file){ showRTIMessage("Please choose an attachment first.","warning"); return; }
    if(!currentRTIRecordId){ showRTIMessage("Please save the RTI application first. The attachment will then be stored in Firestore.","warning"); return; }
    try {
        const meta=await uploadFileToRTI(file,"Attachment",currentRTIRecordId);
        rtiDocuments.push(meta);
        await rtiDb().collection(RTI_COLLECTION).doc(currentRTIRecordId).update({documents:rtiDocuments,attachments:rtiDocuments,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
        document.getElementById(inputId).value=""; renderRTIAttachments(); showRTIMessage("Attachment saved to Firestore.","success");
    } catch(e){ console.error(e); showRTIMessage(`Unable to save attachment: ${e.message}`,"danger"); }
}

async function removeRTIAttachment(index){
    const doc=rtiDocuments[index]; if(!doc) return;
    if(!confirm(`Remove ${doc.name||"this attachment"}?`)) return;
    try {
        if(doc.path && rtiStorage()) { try{ await rtiStorage().ref(doc.path).delete(); }catch(e){ console.warn(e); } }
        rtiDocuments.splice(index,1);
        if(currentRTIRecordId) await rtiDb().collection(RTI_COLLECTION).doc(currentRTIRecordId).update({documents:rtiDocuments,attachments:rtiDocuments,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
        renderRTIAttachments();
    } catch(e){ showRTIMessage("Unable to remove attachment: "+e.message,"danger"); }
}
window.removeRTIAttachment=removeRTIAttachment;

function renderRTIAttachments(){
    const list=document.getElementById("attachmentList"); if(!list) return;
    if(!rtiDocuments.length){ list.innerHTML='<div class="text-muted text-center py-3">No saved attachments.</div>'; return; }
    list.innerHTML=rtiDocuments.map((d,i)=>`<div class="attachment-row"><div><strong>${esc(d.name)}</strong><div class="small text-muted">Saved attachment</div></div><div class="d-flex gap-2">${d.url?`<a class="btn btn-sm btn-outline-primary" target="_blank" href="${esc(d.url)}">View</a>`:""}<button type="button" class="btn btn-sm btn-outline-danger" onclick="removeRTIAttachment(${i})">Remove</button></div></div>`).join("");
}

async function shareRTIWhatsApp(){
    await window.FMSWhatsAppService?.compose({
        module:"RTI",
        title:"RTI Application Message",
        defaultMessage:`RTI Application Update
Application No: ${val("applicationNumber")}
Applicant: ${val("applicantName")}
Status: ${val("presentStatus")}

Please type or edit your custom message.`,
        message:(m,t)=>showRTIMessage(m,t||"info")
    });
}

if(typeof window.waitForFMSFirebase === "function") window.waitForFMSFirebase(()=>initializeRTIModule());
else document.addEventListener("DOMContentLoaded",()=>initializeRTIModule());

window.parseRTIDocument=parseSelectedRTIApplication;
window.saveRTIRecord=saveRTIRecord;
window.updateRTIRecord=updateRTIRecord;
=======
/******************************************************************
 * FILE MANAGEMENT SYSTEM (FMS)
 *
 * Module    : RTI
 * File      : rti.js
 * Version   : 3.0
 * Developer : Lekha Technologies
 *
 * Storage   : Firebase Firestore
 * Collection: rtiApplications
 *
 * Purpose:
 * RTI Application Data Entry
 ******************************************************************/

"use strict";


console.log(
    "=============================================="
);

console.log(
    "RTI Module JS Loaded - Version 3.0"
);

console.log(
    "=============================================="
);


/* ================================================================
   FIRESTORE COLLECTION
================================================================ */

const RTI_COLLECTION =
    "rtiApplications";


/* ================================================================
   CURRENT RECORD
================================================================ */

let currentRTIRecordId =
    null;


/* ================================================================
   DOCUMENTS
================================================================ */

let rtiDocuments = [];


/* ================================================================
   FIREBASE INITIALIZATION
================================================================ */

function initializeRTIModule() {

    console.log(
        "Initializing RTI Module..."
    );


    if (
        !window.isFMSFirebaseReady ||
        !window.isFMSFirebaseReady()
    ) {

        console.error(
            "FMS Firebase is not ready."
        );

        showRTIMessage(
            "Firebase is not ready. Please wait and try again.",
            "danger"
        );

        return;

    }


    registerRTIEvents();


    loadRTISectionDropdown();


    loadRTIAssignedToDropdown();


    loadRTIRecordFromURL();


    console.log(
        "RTI Module initialized successfully."
    );

}


/* ================================================================
   WAIT FOR COMMON FIREBASE
================================================================ */

if (
    typeof window.waitForFMSFirebase ===
    "function"
) {

    window.waitForFMSFirebase(
        function (firebaseServices) {

            if (!firebaseServices) {

                console.error(
                    "Unable to initialize RTI because Firebase is unavailable."
                );

                return;

            }


            initializeRTIModule();

        }
    );

}
else {

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            if (
                window.isFMSFirebaseReady &&
                window.isFMSFirebaseReady()
            ) {

                initializeRTIModule();

            }

        }
    );

}


/* ================================================================
   REGISTER EVENTS
================================================================ */

function registerRTIEvents() {


    /* ============================================================
       APPLICATION DATE
    ============================================================ */

    const applicationDate =
        document.getElementById(
            "applicationDate"
        );


    if (applicationDate) {

        applicationDate.addEventListener(
            "change",
            calculateRTIDueDate
        );

        applicationDate.addEventListener(
            "input",
            calculateRTIDueDate
        );

    }


    /* ============================================================
       NEW
    ============================================================ */

    bindClick(
        "btnNew",
        prepareNewRTI
    );


    /* ============================================================
       SAVE
    ============================================================ */

    bindClick(
        "btnSave",
        saveRTIRecord
    );


    /* ============================================================
       UPDATE
    ============================================================ */

    bindClick(
        "btnUpdate",
        updateRTIRecord
    );


    /* ============================================================
       DELETE
    ============================================================ */

    bindClick(
        "btnDelete",
        deleteRTIRecord
    );


    /* ============================================================
       PRINT
    ============================================================ */

    bindClick(
        "btnPrint",
        printRTIRecord
    );


    /* ============================================================
       REGISTER
    ============================================================ */

    bindClick(
        "btnRegister",
        function () {

            window.location.href =
                "rti-register.html";

        }
    );


    /* ============================================================
       DAILY STATUS
    ============================================================ */

    bindClick(
        "btnDailyStatus",
        function () {

            window.location.href =
                "rti-daily-status.html";

        }
    );


    /* ============================================================
       WHATSAPP
    ============================================================ */

    bindClick(
        "btnWhatsApp",
        function () {

            window.location.href =
                "rti-daily-status.html";

        }
    );


    /* ============================================================
       HOME
    ============================================================ */

    bindClick(
        "btnHome",
        function () {

            window.location.href =
                "../../index.html";

        }
    );


    /* ============================================================
       DOCUMENT UPLOAD
    ============================================================ */

    bindClick(
        "btnUploadDocument",
        uploadRTIDocument
    );


    /* ============================================================
       DOCUMENT PARSE
    ============================================================ */

    bindClick(
        "btnParseDocument",
        parseRTIDocument
    );

}


/* ================================================================
   SAFE CLICK BINDING
================================================================ */

function bindClick(
    id,
    handler
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.addEventListener(
            "click",
            handler
        );

    }

}


/* ================================================================
   CALCULATE DUE DATE
   APPLICATION DATE + 30 DAYS
================================================================ */

function calculateRTIDueDate() {

    const applicationDate =
        document.getElementById(
            "applicationDate"
        );


    const dueDate =
        document.getElementById(
            "dueDate"
        );


    if (
        !applicationDate ||
        !dueDate
    ) {

        return;

    }


    if (
        !applicationDate.value
    ) {

        dueDate.value =
            "";

        return;

    }


    const date =
        new Date(
            applicationDate.value +
            "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        dueDate.value =
            "";

        return;

    }


    date.setDate(
        date.getDate() + 30
    );


    dueDate.value =
        formatDateForInput(
            date
        );

}


/* ================================================================
   SECTION DROPDOWN
================================================================ */

function loadRTISectionDropdown() {

    const section =
        document.getElementById(
            "concernedSection"
        );


    if (!section) {

        console.warn(
            "RTI Section dropdown not found."
        );

        return;

    }


    /*
     * Use existing Section Master if loaded.
     */

    if (
        typeof loadSections ===
        "function"
    ) {

        loadSections(
            "concernedSection"
        );

        return;

    }


    /*
     * Fallback list.
     *
     * These values correspond to the existing
     * FMS Section Master.
     */

    const sections = [

        "Administration",

        "Accounts",

        "Establishment",

        "Engineering",

        "Planning",

        "MGNREGS",

        "PMAY",

        "Finance",

        "Audit",

        "Legal",

        "General",

        "IT Cell"

    ];


    section.innerHTML =
        "";


    addOption(
        section,
        "",
        "--Select Section--"
    );


    sections.forEach(
        function (item) {

            addOption(
                section,
                item,
                item
            );

        }
    );

}


/* ================================================================
   ASSIGNED TO DROPDOWN
================================================================ */

function loadRTIAssignedToDropdown() {

    const assignedTo =
        document.getElementById(
            "assignedTo"
        );


    if (!assignedTo) {

        return;

    }


    /*
     * Do not destroy an existing
     * populated dropdown.
     */

    if (
        assignedTo.options.length > 1
    ) {

        return;

    }


    /*
     * Existing officer master.
     */

    if (
        typeof OFFICERS !==
        "undefined"
    ) {

        assignedTo.innerHTML =
            "";


        addOption(
            assignedTo,
            "",
            "Select Officer / Section"
        );


        if (
            Array.isArray(
                OFFICERS
            )
        ) {

            OFFICERS.forEach(
                function (officer) {

                    const value =
                        typeof officer ===
                        "string"
                            ? officer
                            : (
                                officer.name ||
                                officer.officerName ||
                                officer.designation ||
                                ""
                            );


                    if (value) {

                        addOption(
                            assignedTo,
                            value,
                            value
                        );

                    }

                }
            );

        }


        return;

    }


    /*
     * Alternative master variable.
     */

    if (
        typeof OFFICER_MASTER !==
        "undefined"
    ) {

        assignedTo.innerHTML =
            "";


        addOption(
            assignedTo,
            "",
            "Select Officer / Section"
        );


        if (
            Array.isArray(
                OFFICER_MASTER
            )
        ) {

            OFFICER_MASTER.forEach(
                function (officer) {

                    const value =
                        typeof officer ===
                        "string"
                            ? officer
                            : (
                                officer.name ||
                                officer.officerName ||
                                officer.designation ||
                                ""
                            );


                    if (value) {

                        addOption(
                            assignedTo,
                            value,
                            value
                        );

                    }

                }
            );

        }

    }

}


/* ================================================================
   ADD OPTION
================================================================ */

function addOption(
    select,
    value,
    text
) {

    const option =
        document.createElement(
            "option"
        );


    option.value =
        value;


    option.textContent =
        text;


    select.appendChild(
        option
    );

}


/* ================================================================
   PREPARE NEW RTI
================================================================ */

function prepareNewRTI() {

    console.log(
        "Preparing new RTI application..."
    );


    currentRTIRecordId =
        null;


    rtiDocuments =
        [];


    clearRTIForm();


    renderRTIDocuments();


    try {

        window.history.replaceState(
            {},
            document.title,
            "rti.html"
        );

    }
    catch (error) {

        console.warn(
            "Unable to clean URL.",
            error
        );

    }


    showRTIMessage(
        "Ready for new RTI application.",
        "info"
    );

}


/* ================================================================
   GET FORM DATA
================================================================ */

function getRTIFormData() {

    return {

        /* ========================================================
           SECTION 1
        ======================================================== */

        applicationNumber:
            getValue(
                "applicationNumber"
            ),


        applicationDate:
            getValue(
                "applicationDate"
            ),


        dueDate:
            getValue(
                "dueDate"
            ),


        informationSought:
            getValue(
                "informationSought"
            ),


        /* ========================================================
           SECTION 2
        ======================================================== */

        applicantName:
            getValue(
                "applicantName"
            ),


        mobileNumber:
            getValue(
                "mobileNumber"
            ),


        applicantAddress:
            getValue(
                "applicantAddress"
            ),


        district:
            getValue(
                "district"
            ),


        mandal:
            getValue(
                "mandal"
            ),


        village:
            getValue(
                "village"
            ),


        /* ========================================================
           SECTION 3
        ======================================================== */

        fileNumber:
            getValue(
                "fileNumber"
            ),


        dateArised:
            getValue(
                "dateArised"
            ),


        assignedTo:
            getValue(
                "assignedTo"
            ),


        concernedSection:
            getValue(
                "concernedSection"
            ),


        presentStatus:
            getValue(
                "presentStatus"
            ),


        replyFurnishedByConcernedSectionDate:
            getValue(
                "replyFurnishedByConcernedSectionDate"
            ),


        finalReplySentToPIODate:
            getValue(
                "finalReplySentToPIODate"
            ),


        /* ========================================================
           DOCUMENTS
        ======================================================== */

        documents:
            rtiDocuments,


        parsedText:
            getValue(
                "parsedText"
            ),


        updatedAt:
            new Date()

    };

}


/* ================================================================
   VALIDATE FORM
================================================================ */

function validateRTIForm(
    data
) {

    if (
        !data.applicationNumber
    ) {

        showRTIMessage(
            "Please enter Application Number.",
            "warning"
        );

        focusField(
            "applicationNumber"
        );

        return false;

    }


    if (
        !data.applicationDate
    ) {

        showRTIMessage(
            "Please enter Application Date.",
            "warning"
        );

        focusField(
            "applicationDate"
        );

        return false;

    }


    if (
        !data.applicantName
    ) {

        showRTIMessage(
            "Please enter Applicant Name.",
            "warning"
        );

        focusField(
            "applicantName"
        );

        return false;

    }


    if (
        !data.informationSought
    ) {

        showRTIMessage(
            "Please enter Information Sought.",
            "warning"
        );

        focusField(
            "informationSought"
        );

        return false;

    }


    if (
        !data.presentStatus
    ) {

        showRTIMessage(
            "Please select Present Status.",
            "warning"
        );

        focusField(
            "presentStatus"
        );

        return false;

    }


    return true;

}


/* ================================================================
   SAVE RTI RECORD
================================================================ */

/* ================================================================
   SAVE RTI RECORD
   - Saves RTI data to Firestore
   - Uploads pending documents to Firebase Storage
   - NEVER sends browser File objects to Firestore
================================================================ */

async function saveRTIRecord() {

    console.log("Saving RTI application...");

    if (!isFirebaseReadyForRTI()) {
        return;
    }

    try {

        /* --------------------------------------------------------
           CALCULATE DUE DATE
        -------------------------------------------------------- */

        calculateRTIDueDate();


        /* --------------------------------------------------------
           GET FORM DATA
        -------------------------------------------------------- */

        const data =
            getRTIFormData();


        /* --------------------------------------------------------
           VALIDATE
        -------------------------------------------------------- */

        if (!validateRTIForm(data)) {
            return;
        }


        /* --------------------------------------------------------
           FIRESTORE
        -------------------------------------------------------- */

        const db =
            window.getFMSFirestore();

        if (!db) {
            throw new Error(
                "Firestore is not available."
            );
        }


        /* --------------------------------------------------------
           CHECK DUPLICATE APPLICATION NUMBER
        -------------------------------------------------------- */

        const duplicateSnapshot =
            await db
                .collection(RTI_COLLECTION)
                .where(
                    "applicationNumber",
                    "==",
                    data.applicationNumber
                )
                .get();


        if (!duplicateSnapshot.empty) {

            showRTIMessage(
                "This RTI Application Number already exists.",
                "warning"
            );

            return;
        }


        /* --------------------------------------------------------
           CREATE FIRESTORE DATA
           
           IMPORTANT:
           Do NOT send rtiDocuments here because it may contain
           browser File objects.
        -------------------------------------------------------- */

        const firestoreData = {

            applicationNumber:
                data.applicationNumber,

            applicationDate:
                data.applicationDate,

            dueDate:
                data.dueDate,

            informationSought:
                data.informationSought,

            applicantName:
                data.applicantName,

            mobileNumber:
                data.mobileNumber,

            applicantAddress:
                data.applicantAddress,

            district:
                data.district,

            mandal:
                data.mandal,

            village:
                data.village,

            fileNumber:
                data.fileNumber,

            dateArised:
                data.dateArised,

            assignedTo:
                data.assignedTo,

            concernedSection:
                data.concernedSection,

            presentStatus:
                data.presentStatus,

            replyFurnishedByConcernedSectionDate:
                data.replyFurnishedByConcernedSectionDate,

            finalReplySentToPIODate:
                data.finalReplySentToPIODate,

            documents: [],

            parsedText:
                data.parsedText || "",

            updatedAt:
                new Date()

        };


        /* --------------------------------------------------------
           CREATE FIRESTORE RECORD FIRST
        -------------------------------------------------------- */

        const docRef =
            await db
                .collection(RTI_COLLECTION)
                .add(firestoreData);


        currentRTIRecordId =
            docRef.id;


        console.log(
            "RTI Firestore record created:",
            currentRTIRecordId
        );


        /* --------------------------------------------------------
           UPLOAD DOCUMENTS
        -------------------------------------------------------- */

        const savedDocuments = [];


        if (
            Array.isArray(rtiDocuments) &&
            rtiDocuments.length > 0
        ) {

            const storage =
                getRTIStorage();


            if (!storage) {

                throw new Error(
                    "Firebase Storage is not available."
                );

            }


            for (
                const doc of rtiDocuments
            ) {

                /* ------------------------------------------------
                   ALREADY UPLOADED DOCUMENT
                ------------------------------------------------ */

                if (
                    doc.url &&
                    !doc.localFile
                ) {

                    savedDocuments.push({

                        name:
                            doc.name || "",

                        type:
                            doc.type || "Document",

                        contentType:
                            doc.contentType || "",

                        size:
                            doc.size || 0,

                        path:
                            doc.path || "",

                        url:
                            doc.url,

                        uploadedAt:
                            doc.uploadedAt ||
                            new Date().toISOString()

                    });

                    continue;
                }


                /* ------------------------------------------------
                   NEW LOCAL FILE
                ------------------------------------------------ */

                if (!doc.localFile) {

                    console.warn(
                        "Skipping document without file:",
                        doc
                    );

                    continue;
                }


                const file =
                    doc.localFile;


                const safeName =
                    sanitizeFileName(
                        file.name
                    );


                const storagePath =
                    "rtiApplications/" +
                    currentRTIRecordId +
                    "/" +
                    Date.now() +
                    "_" +
                    safeName;


                console.log(
                    "Uploading:",
                    file.name
                );


                const storageRef =
                    storage.ref(
                        storagePath
                    );


                const snapshot =
                    await storageRef.put(
                        file
                    );


                const downloadURL =
                    await snapshot.ref.getDownloadURL();


                savedDocuments.push({

                    name:
                        file.name,

                    type:
                        doc.type ||
                        "Document",

                    contentType:
                        file.type || "",

                    size:
                        file.size || 0,

                    path:
                        storagePath,

                    url:
                        downloadURL,

                    uploadedAt:
                        new Date().toISOString()

                });


                console.log(
                    "Document uploaded:",
                    file.name
                );

            }

        }


        /* --------------------------------------------------------
           UPDATE FIRESTORE WITH DOCUMENT URLs
           
           At this stage there are NO File objects.
        -------------------------------------------------------- */

        await db
            .collection(RTI_COLLECTION)
            .doc(currentRTIRecordId)
            .update({

                documents:
                    savedDocuments,

                updatedAt:
                    new Date()

            });


        /* --------------------------------------------------------
           UPDATE LOCAL DOCUMENT ARRAY
        -------------------------------------------------------- */

        rtiDocuments =
            savedDocuments;


        renderRTIDocuments();


        /* --------------------------------------------------------
           SUCCESS
        -------------------------------------------------------- */

        console.log(
            "RTI application saved successfully:",
            currentRTIRecordId
        );


        showRTIMessage(
            "RTI application saved successfully.",
            "success"
        );


        /* --------------------------------------------------------
           OPEN SAVED RECORD
        -------------------------------------------------------- */

        setTimeout(
            function () {

                window.location.href =
                    "rti.html?id=" +
                    encodeURIComponent(
                        currentRTIRecordId
                    );

            },
            700
        );

    }

    catch (error) {

        console.error(
            "RTI Save Error:",
            error
        );


        showRTIMessage(

            "Unable to save RTI application: " +
            error.message,

            "danger"

        );

    }

}

/* ================================================================
   UPDATE RTI RECORD
================================================================ */

async function updateRTIRecord() {

    console.log(
        "Updating RTI application..."
    );


    if (
        !isFirebaseReadyForRTI()
    ) {

        return;

    }


    if (
        !currentRTIRecordId
    ) {

        showRTIMessage(
            "Please load an existing RTI record before updating.",
            "warning"
        );

        return;

    }


    try {

        const data =
            getRTIFormData();


        if (
            !validateRTIForm(
                data
            )
        ) {

            return;

        }


        const db =
            window.getFMSFirestore();


        if (!db) {

            throw new Error(
                "Firestore is not available."
            );

        }


        await db
            .collection(
                RTI_COLLECTION
            )
            .doc(
                currentRTIRecordId
            )
            .update(
                data
            );


        console.log(
            "RTI updated:",
            currentRTIRecordId
        );


        showRTIMessage(
            "RTI application updated successfully.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "Error updating RTI:",
            error
        );


        showRTIMessage(
            "Unable to update RTI application: " +
            error.message,
            "danger"
        );

    }

}


/* ================================================================
   DELETE RTI RECORD
================================================================ */

async function deleteRTIRecord() {

    console.log(
        "Delete RTI requested..."
    );


    if (
        !isFirebaseReadyForRTI()
    ) {

        return;

    }


    if (
        !currentRTIRecordId
    ) {

        showRTIMessage(
            "Please load an RTI record before deleting.",
            "warning"
        );

        return;

    }


    const confirmed =
        confirm(
            "Are you sure you want to delete this RTI application?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const db =
            window.getFMSFirestore();


        await db
            .collection(
                RTI_COLLECTION
            )
            .doc(
                currentRTIRecordId
            )
            .delete();


        currentRTIRecordId =
            null;


        showRTIMessage(
            "RTI application deleted successfully.",
            "success"
        );


        setTimeout(
            function () {

                window.location.href =
                    "rti-register.html";

            },
            700
        );

    }
    catch (error) {

        console.error(
            "Error deleting RTI:",
            error
        );


        showRTIMessage(
            "Unable to delete RTI application: " +
            error.message,
            "danger"
        );

    }

}


/* ================================================================
   LOAD RECORD FROM URL
================================================================ */

async function loadRTIRecordFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const recordId =
        params.get(
            "id"
        );


    if (!recordId) {

        console.log(
            "No RTI record ID in URL."
        );

        return;

    }


    if (
        !isFirebaseReadyForRTI()
    ) {

        return;

    }


    try {

        const db =
            window.getFMSFirestore();


        const docSnap =
            await db
                .collection(
                    RTI_COLLECTION
                )
                .doc(
                    recordId
                )
                .get();


        if (
            !docSnap.exists
        ) {

            showRTIMessage(
                "RTI record not found.",
                "warning"
            );

            return;

        }


        currentRTIRecordId =
            docSnap.id;


        populateRTIForm(
            docSnap.data()
        );


        console.log(
            "RTI record loaded:",
            currentRTIRecordId
        );


        showRTIMessage(
            "RTI record loaded successfully.",
            "info"
        );

    }
    catch (error) {

        console.error(
            "Error loading RTI record:",
            error
        );


        showRTIMessage(
            "Unable to load RTI record: " +
            error.message,
            "danger"
        );

    }

}


/* ================================================================
   POPULATE FORM
================================================================ */

function populateRTIForm(
    data
) {

    /* ============================================================
       SECTION 1
    ============================================================ */

    setValue(
        "applicationNumber",
        data.applicationNumber
    );


    setValue(
        "applicationDate",
        formatInputDate(
            data.applicationDate
        )
    );


    setValue(
        "dueDate",
        formatInputDate(
            data.dueDate
        )
    );


    setValue(
        "informationSought",
        data.informationSought
    );


    /* ============================================================
       SECTION 2
    ============================================================ */

    setValue(
        "applicantName",
        data.applicantName
    );


    setValue(
        "mobileNumber",
        data.mobileNumber
    );


    setValue(
        "applicantAddress",
        data.applicantAddress
    );


    setValue(
        "district",
        data.district
    );


    setValue(
        "mandal",
        data.mandal
    );


    setValue(
        "village",
        data.village
    );


    /* ============================================================
       SECTION 3
    ============================================================ */

    setValue(
        "fileNumber",
        data.fileNumber
    );


    setValue(
        "dateArised",
        formatInputDate(
            data.dateArised
        )
    );


    setValue(
        "assignedTo",
        data.assignedTo
    );


    setValue(
        "concernedSection",
        data.concernedSection
    );


    setValue(
        "presentStatus",
        data.presentStatus
    );


    setValue(
        "replyFurnishedByConcernedSectionDate",
        formatInputDate(
            data.replyFurnishedByConcernedSectionDate
        )
    );


    setValue(
        "finalReplySentToPIODate",
        formatInputDate(
            data.finalReplySentToPIODate
        )
    );


    /* ============================================================
       DOCUMENTS
    ============================================================ */

    rtiDocuments =
        Array.isArray(
            data.documents
        )
            ? data.documents
            : [];


    renderRTIDocuments();


    setValue(
        "parsedText",
        data.parsedText
    );

}


/* ================================================================
   CLEAR FORM
================================================================ */

function clearRTIForm() {

    const fields = [

        "applicationNumber",

        "applicationDate",

        "dueDate",

        "informationSought",

        "applicantName",

        "mobileNumber",

        "applicantAddress",

        "district",

        "mandal",

        "village",

        "fileNumber",

        "dateArised",

        "assignedTo",

        "concernedSection",

        "presentStatus",

        "replyFurnishedByConcernedSectionDate",

        "finalReplySentToPIODate",

        "parsedText"

    ];


    fields.forEach(
        function (id) {

            setValue(
                id,
                ""
            );

        }
    );


    rtiDocuments =
        [];


    renderRTIDocuments();

}


/* ================================================================
   DOCUMENT UPLOAD
================================================================ */

async function uploadRTIDocument() {

    const fileInput =
        document.getElementById(
            "documentFile"
        );


    const documentType =
        getValue(
            "documentType"
        );


    if (
        !fileInput ||
        !fileInput.files ||
        !fileInput.files.length
    ) {

        showRTIMessage(
            "Please select a document.",
            "warning"
        );

        return;

    }


    if (!documentType) {

        showRTIMessage(
            "Please select the Document Type.",
            "warning"
        );

        return;

    }


    if (
        !isFirebaseReadyForRTI()
    ) {

        return;

    }


    const file =
        fileInput.files[0];


    try {

        const storage =
            getRTIStorage();


        if (!storage) {

            throw new Error(
                "Firebase Storage is not available."
            );

        }


        showRTIMessage(
            "Uploading document...",
            "info"
        );


        /*
         * Before the RTI record is saved,
         * documents are kept temporarily in
         * browser memory.
         *
         * After Save, they are stored with
         * the RTI record.
         */

        if (!currentRTIRecordId) {

            const temporaryDocument = {

                name:
                    file.name,

                type:
                    documentType,

                contentType:
                    file.type,

                size:
                    file.size,

                localFile:
                    file,

                uploadedAt:
                    new Date().toISOString()

            };


            rtiDocuments.push(
                temporaryDocument
            );


            renderRTIDocuments();


            fileInput.value =
                "";


            showRTIMessage(
                "Document selected. Save the RTI application to upload it to Firebase Storage.",
                "info"
            );


            return;

        }


        const safeName =
            sanitizeFileName(
                file.name
            );


        const path =
            "rtiApplications/" +
            currentRTIRecordId +
            "/" +
            Date.now() +
            "_" +
            safeName;


        const storageRef =
            storage.ref(
                path
            );


        const snapshot =
            await storageRef.put(
                file
            );


        const downloadURL =
            await snapshot.ref.getDownloadURL();


        const documentRecord = {

            name:
                file.name,

            type:
                documentType,

            contentType:
                file.type,

            size:
                file.size,

            path:
                path,

            url:
                downloadURL,

            uploadedAt:
                new Date().toISOString()

        };


        rtiDocuments.push(
            documentRecord
        );


        await updateRTIDocuments();


        renderRTIDocuments();


        fileInput.value =
            "";


        setValue(
            "documentType",
            ""
        );


        showRTIMessage(
            "Document uploaded successfully.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "RTI document upload error:",
            error
        );


        showRTIMessage(
            "Unable to upload document: " +
            error.message,
            "danger"
        );

    }

}


/* ================================================================
   FIREBASE STORAGE
================================================================ */

function getRTIStorage() {

    if (
        typeof firebase !==
        "undefined" &&
        firebase.storage
    ) {

        return firebase.storage();

    }


    if (
        typeof window.getFMSStorage ===
        "function"
    ) {

        return window.getFMSStorage();

    }


    return null;

}


/* ================================================================
   UPDATE FIRESTORE DOCUMENT LIST
================================================================ */

async function updateRTIDocuments() {

    if (
        !currentRTIRecordId
    ) {

        return;

    }


    const db =
        window.getFMSFirestore();


    if (!db) {

        return;

    }


    /*
     * Do not store temporary File objects
     * in Firestore.
     */

    const firestoreDocuments =
        rtiDocuments
            .filter(
                function (doc) {

                    return !doc.localFile;

                }
            );


    await db
        .collection(
            RTI_COLLECTION
        )
        .doc(
            currentRTIRecordId
        )
        .update({

            documents:
                firestoreDocuments,

            updatedAt:
                new Date()

        });

}


/* ================================================================
   RENDER DOCUMENT LIST
================================================================ */

function renderRTIDocuments() {

    const list =
        document.getElementById(
            "documentList"
        );


    const noDocuments =
        document.getElementById(
            "noDocumentsMessage"
        );


    const parseSelect =
        document.getElementById(
            "parseDocumentSelect"
        );


    if (!list) {

        return;

    }


    list.innerHTML =
        "";


    if (parseSelect) {

        parseSelect.innerHTML =
            '<option value="">Select uploaded document</option>';

    }


    if (
        rtiDocuments.length === 0
    ) {

        if (noDocuments) {

            noDocuments.style.display =
                "block";

            list.appendChild(
                noDocuments
            );

        }

        return;

    }


    if (noDocuments) {

        noDocuments.style.display =
            "none";

    }


    rtiDocuments.forEach(
        function (
            doc,
            index
        ) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "document-item";


            const isTemporary =
                !!doc.localFile;


            item.innerHTML = `

                <div>

                    <div class="document-name">

                        ${escapeHTML(
                            doc.name
                        )}

                    </div>

                    <div class="document-status">

                        ${escapeHTML(
                            doc.type || "Document"
                        )}

                        ${
                            isTemporary
                                ? " - Pending Save"
                                : ""
                        }

                    </div>

                </div>


                <div>

                    ${
                        doc.url
                            ? `
                                <a
                                    href="${escapeHTML(
                                        doc.url
                                    )}"
                                    target="_blank"
                                    class="btn btn-sm btn-outline-primary">

                                    View

                                </a>
                              `
                            : ""
                    }


                    <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        onclick="removeRTIDocument(${index})">

                        Remove

                    </button>

                </div>

            `;


            list.appendChild(
                item
            );


            if (
                parseSelect &&
                doc.url
            ) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    index;


                option.textContent =
                    doc.name;


                parseSelect.appendChild(
                    option
                );

            }

        }
    );

}


/* ================================================================
   REMOVE DOCUMENT
================================================================ */

async function removeRTIDocument(
    index
) {

    if (
        index < 0 ||
        index >= rtiDocuments.length
    ) {

        return;

    }


    const confirmed =
        confirm(
            "Remove this document?"
        );


    if (!confirmed) {

        return;

    }


    const doc =
        rtiDocuments[index];


    try {

        /*
         * Delete Firebase Storage file
         * if already uploaded.
         */

        if (
            doc.path
        ) {

            const storage =
                getRTIStorage();


            if (storage) {

                try {

                    await storage
                        .ref(
                            doc.path
                        )
                        .delete();

                }
                catch (error) {

                    console.warn(
                        "Storage delete warning:",
                        error
                    );

                }

            }

        }


        rtiDocuments.splice(
            index,
            1
        );


        await updateRTIDocuments();


        renderRTIDocuments();


        showRTIMessage(
            "Document removed.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "Document removal error:",
            error
        );


        showRTIMessage(
            "Unable to remove document: " +
            error.message,
            "danger"
        );

    }

}


window.removeRTIDocument =
    removeRTIDocument;

/* ================================================================
   CENTRAL DOCUMENT PARSING
   FMS CENTRAL DOCUMENT ENGINE
================================================================ */

async function parseRTIDocument() {

    console.log("==============================================");
    console.log("RTI CENTRAL DOCUMENT PARSER");
    console.log("==============================================");

    const select =
        document.getElementById("parseDocumentSelect");

    if (!select || !select.value) {

        showRTIMessage(
            "Please select an uploaded document to parse.",
            "warning"
        );

        return;
    }

    const index =
        Number(select.value);

    const doc =
        rtiDocuments[index];

    if (!doc) {

        showRTIMessage(
            "Selected document not found.",
            "warning"
        );

        return;
    }

    console.log(
        "Selected RTI document:",
        doc.name
    );

    try {

        /* ============================================================
           CHECK CENTRAL DOCUMENT ENGINE
        ============================================================ */

        if (
            typeof window.FMSDocumentEngine === "undefined"
        ) {

            throw new Error(
                "FMS Central Document Engine is not loaded."
            );
        }


        if (
            typeof window.FMSDocumentEngine.extractTextFromPDF !==
            "function"
        ) {

            throw new Error(
                "FMS Central Document Engine PDF parser is not available."
            );
        }


        if (
            typeof window.FMSDocumentEngine.isReady ===
            "function" &&
            !window.FMSDocumentEngine.isReady()
        ) {

            throw new Error(
                "FMS Central Document Engine is not ready."
            );
        }


        console.log(
            "FMS Central Document Engine verified."
        );


        /* ============================================================
           GET FILE
        ============================================================ */

        let file =
            doc.localFile;


        /*
         * If the document is already stored in Firebase Storage,
         * download it and convert it to a File object.
         */

        if (
            !file &&
            doc.url
        ) {

            console.log(
                "Downloading document from Firebase Storage..."
            );

            const response =
                await fetch(doc.url);


            if (!response.ok) {

                throw new Error(
                    "Unable to download document from Firebase Storage. HTTP " +
                    response.status
                );
            }


            const blob =
                await response.blob();


            file =
                new File(
                    [blob],
                    doc.name,
                    {
                        type:
                            doc.contentType ||
                            blob.type ||
                            "application/pdf"
                    }
                );


            console.log(
                "File downloaded successfully."
            );

            console.log(
                "File type:",
                file.type
            );

            console.log(
                "File size:",
                file.size
            );
        }


        /* ============================================================
           FILE VALIDATION
        ============================================================ */

        if (!file) {

            throw new Error(
                "Document file is not available."
            );
        }


        if (
            file.size === 0
        ) {

            throw new Error(
                "The selected document is empty."
            );
        }


        /* ============================================================
           START PARSING
        ============================================================ */

        showRTIMessage(
            "Parsing document...",
            "info"
        );


        console.log(
            "Calling FMS Central Document Engine..."
        );


        const text =
            await window.FMSDocumentEngine.extractTextFromPDF(
                file
            );


        console.log(
            "Central parser completed."
        );


        console.log(
            "Extracted text length:",
            text ? text.length : 0
        );


        /* ============================================================
           DISPLAY EXTRACTED TEXT
        ============================================================ */

        setValue(
            "parsedText",
            text || ""
        );


        /* ============================================================
           SAVE PARSED TEXT TO FIRESTORE
        ============================================================ */

        if (
            currentRTIRecordId
        ) {

            const db =
                window.getFMSFirestore();


            if (db) {

                await db
                    .collection(
                        RTI_COLLECTION
                    )
                    .doc(
                        currentRTIRecordId
                    )
                    .update({

                        parsedText:
                            text || "",

                        updatedAt:
                            new Date()

                    });


                console.log(
                    "Parsed text saved to Firestore."
                );
            }
        }



        /* ============================================================
           AUTO POPULATE RTI FORM FROM PARSED TEXT
        ============================================================ */

        if (text && text.trim()) {

            console.log(
                "Starting RTI form auto-population..."
            );

            autoPopulateRTIForm(
                text
            );

        }


        /* ============================================================
           RESULT
        ============================================================ */

        if (
            text &&
            text.trim()
        ) {

            showRTIMessage(
                "Document parsed successfully.",
                "success"
            );

        }
        else {

            showRTIMessage(
                "Document was processed, but no text could be extracted. The PDF may be scanned/image-based.",
                "warning"
            );
        }


        console.log(
            "=============================================="
        );

        console.log(
            "RTI DOCUMENT PARSING COMPLETED"
        );

        console.log(
            "=============================================="
        );


    }
    catch (error) {

        console.error(
            "=============================================="
        );

        console.error(
            "RTI CENTRAL DOCUMENT PARSER ERROR"
        );

        console.error(
            error
        );

        console.error(
            "=============================================="
        );


        showRTIMessage(
            "Unable to parse document: " +
            error.message,
            "danger"
        );
    }
}


/* ================================================================
   EXPOSE FUNCTION
================================================================ */

window.parseRTIDocument =
    parseRTIDocument;

/* ================================================================
   PRINT
================================================================ */

function printRTIRecord() {

    window.print();

}


/* ================================================================
   FIREBASE READY CHECK
================================================================ */

function isFirebaseReadyForRTI() {

    if (
        window.isFMSFirebaseReady &&
        window.isFMSFirebaseReady()
    ) {

        return true;

    }


    showRTIMessage(
        "Firebase is not ready. Please wait a moment and try again.",
        "warning"
    );


    return false;

}


/* ================================================================
   GET VALUE
================================================================ */

function getValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


/* ================================================================
   SET VALUE
================================================================ */

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.value =
        value || "";

}


/* ================================================================
   FOCUS FIELD
================================================================ */

function focusField(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.focus();

    }

}


/* ================================================================
   FORMAT DATE
================================================================ */

function formatDateForInput(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


/* ================================================================
   FORMAT FIRESTORE DATE
================================================================ */

function formatInputDate(
    value
) {

    if (!value) {

        return "";

    }


    /*
     * Firestore Timestamp
     */

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        value =
            value.toDate();

    }


    /*
     * Firestore timestamp-like object
     */

    if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        value =
            new Date(
                Number(
                    value.seconds
                ) * 1000
            );

    }


    /*
     * JavaScript Date
     */

    if (
        value instanceof Date
    ) {

        return formatDateForInput(
            value
        );

    }


    /*
     * Already YYYY-MM-DD
     */

    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(
            value
        )
    ) {

        return value;

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return formatDateForInput(
        date
    );

}


/* ================================================================
   SANITIZE FILE NAME
================================================================ */

function sanitizeFileName(
    fileName
) {

    return String(
        fileName || "document"
    )
    .replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
    );

}


/* ================================================================
   RTI MESSAGE
================================================================ */

function showRTIMessage(
    message,
    type = "info"
) {

    const container =
        document.getElementById(
            "rtiMessage"
        );


    if (!container) {

        alert(
            message
        );

        return;

    }


    container.innerHTML = `

        <div
            class="alert alert-${escapeHTML(type)}"
            role="alert">

            ${escapeHTML(message)}

        </div>

    `;


    setTimeout(
        function () {

            container.innerHTML =
                "";

        },
        4000
    );

}


/* ================================================================
   ESCAPE HTML
================================================================ */

function escapeHTML(
    value
) {

    return String(
        value
    )

    .replace(
        /&/g,
        "&amp;"
    )

    .replace(
        /</g,
        "&lt;"
    )

    .replace(
        />/g,
        "&gt;"
    )

    .replace(
        /"/g,
        "&quot;"
    )

    .replace(
        /'/g,
        "&#039;"
    );

}


/* ================================================================
   END
================================================================ */

console.log(
    "RTI Module JS Ready - Version 3.0"
);

/* ================================================================
   RTI AUTO POPULATION ENGINE
   ---------------------------------------------------------------
   Purpose:
   - Extract RTI information from parsed document text
   - Populate ONLY empty form fields
   - NEVER overwrite manually entered values
   - Do not guess uncertain values
================================================================ */

function autoPopulateRTIForm(text) {

    console.log(
        "=============================================="
    );

    console.log(
        "RTI AUTO POPULATION ENGINE"
    );

    console.log(
        "=============================================="
    );


    if (!text || !text.trim()) {

        console.warn(
            "No parsed text available."
        );

        return;
    }


    /* ============================================================
       NORMALIZE TEXT
    ============================================================ */

    const normalizedText =
        text
            .replace(/\r/g, "")
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n")
            .trim();


    console.log(
        "Normalized text length:",
        normalizedText.length
    );


    /* ============================================================
       HELPER
       ------------------------------------------------------------
       Populate ONLY if field is currently empty.
    ============================================================ */

    function setIfEmpty(
        fieldId,
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {
            return false;
        }


        value =
            String(value)
                .trim();


        if (!value) {
            return false;
        }


        const element =
            document.getElementById(
                fieldId
            );


        if (!element) {

            console.warn(
                "Field not found:",
                fieldId
            );

            return false;
        }


        /*
         * IMPORTANT:
         * Never overwrite an existing value.
         */

        if (
            element.value &&
            element.value.trim()
        ) {

            console.log(
                "Existing value preserved:",
                fieldId
            );

            return false;
        }


        element.value =
            value;


        /*
         * Trigger normal browser events so
         * existing application logic can react.
         */

        element.dispatchEvent(
            new Event(
                "input",
                {
                    bubbles: true
                }
            )
        );


        element.dispatchEvent(
            new Event(
                "change",
                {
                    bubbles: true
                }
            )
        );


        console.log(
            "Auto-populated:",
            fieldId,
            "=",
            value
        );


        return true;
    }


    /* ============================================================
       DATE NORMALIZATION
    ============================================================ */

    function normalizeDate(
        value
    ) {

        if (!value) {
            return "";
        }


        value =
            value.trim();


        let match;


        /*
         * DD.MM.YYYY
         */

        match =
            value.match(
                /^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/
            );


        if (match) {

            const day =
                match[1].padStart(
                    2,
                    "0"
                );

            const month =
                match[2].padStart(
                    2,
                    "0"
                );

            const year =
                match[3];

            return (
                year +
                "-" +
                month +
                "-" +
                day
            );
        }


        /*
         * YYYY-MM-DD
         */

        match =
            value.match(
                /^(\d{4})-(\d{1,2})-(\d{1,2})$/
            );


        if (match) {

            return (
                match[1] +
                "-" +
                match[2].padStart(
                    2,
                    "0"
                ) +
                "-" +
                match[3].padStart(
                    2,
                    "0"
                )
            );
        }


        /*
         * DD Month YYYY
         */

        const months = {

            january: "01",
            february: "02",
            march: "03",
            april: "04",
            may: "05",
            june: "06",
            july: "07",
            august: "08",
            september: "09",
            october: "10",
            november: "11",
            december: "12"

        };


        match =
            value.match(
                /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i
            );


        if (match) {

            const monthName =
                match[2]
                    .toLowerCase();


            if (
                months[monthName]
            ) {

                return (
                    match[3] +
                    "-" +
                    months[monthName] +
                    "-" +
                    match[1].padStart(
                        2,
                        "0"
                    )
                );
            }
        }


        return "";
    }


    /* ============================================================
       APPLICATION NUMBER
    ============================================================ */

    let applicationNumber = "";


    const applicationNumberPatterns = [

        /application\s*(?:no|number)\s*[:\-]?\s*([A-Za-z0-9./_-]+)/i,

        /RTI\s*(?:Application\s*)?(?:No|Number)\s*[:\-]?\s*([A-Za-z0-9./_-]+)/i,

        /No\.\s*[:\-]?\s*([A-Za-z0-9./_-]+)\s*(?:dated|dt\.?)/i

    ];


    for (
        const pattern
        of applicationNumberPatterns
    ) {

        const match =
            normalizedText.match(
                pattern
            );


        if (
            match &&
            match[1]
        ) {

            applicationNumber =
                match[1].trim();

            break;
        }
    }


    setIfEmpty(
        "applicationNumber",
        applicationNumber
    );


    /* ============================================================
       APPLICATION DATE
    ============================================================ */

    let applicationDate = "";


    const applicationDatePatterns = [

        /application\s*date\s*[:\-]?\s*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{4})/i,

        /date\s*of\s*application\s*[:\-]?\s*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{4})/i,

        /application\s*(?:no|number)[^0-9]{0,30}([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{4})/i

    ];


    for (
        const pattern
        of applicationDatePatterns
    ) {

        const match =
            normalizedText.match(
                pattern
            );


        if (
            match &&
            match[1]
        ) {

            applicationDate =
                normalizeDate(
                    match[1]
                );

            if (
                applicationDate
            ) {
                break;
            }
        }
    }


    setIfEmpty(
        "applicationDate",
        applicationDate
    );


    /* ============================================================
       APPLICANT NAME
    ============================================================ */

    let applicantName = "";


    const applicantNamePatterns = [

        /applicant\s*name\s*[:\-]?\s*([^\n]+)/i,

        /name\s*of\s*(?:the\s*)?applicant\s*[:\-]?\s*([^\n]+)/i,

        /applicant\s*[:\-]\s*([^\n]+)/i

    ];


    for (
        const pattern
        of applicantNamePatterns
    ) {

        const match =
            normalizedText.match(
                pattern
            );


        if (
            match &&
            match[1]
        ) {

            applicantName =
                match[1]
                    .trim()
                    .replace(
                        /\s+/g,
                        " "
                    );

            break;
        }
    }


    setIfEmpty(
        "applicantName",
        applicantName
    );


    /* ============================================================
       MOBILE NUMBER
    ============================================================ */

    let mobileNumber = "";


    const mobilePatterns = [

        /mobile\s*(?:no|number)?\s*[:\-]?\s*(\+91[\s-]?[6-9]\d{9}|[6-9]\d{9})/i,

        /phone\s*(?:no|number)?\s*[:\-]?\s*(\+91[\s-]?[6-9]\d{9}|[6-9]\d{9})/i,

        /contact\s*(?:no|number)?\s*[:\-]?\s*(\+91[\s-]?[6-9]\d{9}|[6-9]\d{9})/i

    ];


    for (
        const pattern
        of mobilePatterns
    ) {

        const match =
            normalizedText.match(
                pattern
            );


        if (
            match &&
            match[1]
        ) {

            mobileNumber =
                match[1]
                    .replace(
                        /\s+/g,
                        ""
                    );

            break;
        }
    }


    setIfEmpty(
        "mobileNumber",
        mobileNumber
    );


    /* ============================================================
       INFORMATION SOUGHT
    ============================================================ */

    let informationSought = "";


    const informationPatterns = [

        /information\s*(?:sought|required|requested)\s*[:\-]?\s*([\s\S]+?)(?=\n\s*(?:applicant|name|address|mobile|phone|district|mandal|village|file|subject)\b|$)/i,

        /sought\s*certain\s*information\s*(?:regarding|reg\.?)?\s*([\s\S]+?)(?=\n\s*(?:applicant|name|address|mobile|phone)\b|$)/i,

        /information\s*required\s*[:\-]?\s*([\s\S]+?)(?=\n\s*(?:applicant|name|address|mobile|phone)\b|$)/i

    ];


    for (
        const pattern
        of informationPatterns
    ) {

        const match =
            normalizedText.match(
                pattern
            );


        if (
            match &&
            match[1]
        ) {

            informationSought =
                match[1]
                    .trim();


            break;
        }
    }


    setIfEmpty(
        "informationSought",
        informationSought
    );

/* ============================================================
   IMPROVED APPLICANT ADDRESS EXTRACTION
============================================================ */

let applicantAddress = "";


/*
 * Look only for a clearly labelled Applicant Address.
 */

const addressPatterns = [

    /\bapplicant\s+address\s*[:\-]\s*([^\n\r]+)/i,

    /\baddress\s+of\s+(?:the\s+)?applicant\s*[:\-]\s*([^\n\r]+)/i,

    /\bapplicant's\s+address\s*[:\-]\s*([^\n\r]+)/i

];


for (
    const pattern
    of addressPatterns
) {

    const match =
        normalizedText.match(
            pattern
        );

    if (
        match &&
        match[1]
    ) {

        let candidate =
            cleanExtractedValue(
                match[1]
            );


        /*
         * Do not accept a very long OCR block.
         */

        if (
            candidate.length > 250
        ) {
            continue;
        }


        /*
         * Stop if another field has been
         * accidentally captured.
         */

        candidate =
            candidate.split(
                /\b(?:mobile|phone|district|mandal|village|aadhaar|signature)\b/i
            )[0]
            .trim();


        if (
            candidate.length >= 5
        ) {

            applicantAddress =
                candidate;

            break;
        }
    }
}


if (applicantAddress) {

    setIfEmpty(
        "applicantAddress",
        applicantAddress
    );

} else {

    console.log(
        "Applicant Address not reliably identified."
    );
}
/* ============================================================
   IMPROVED LOCATION EXTRACTION
   ------------------------------------------------------------
   IMPORTANT:
   Only accept values when the document clearly identifies
   the field.
============================================================ */


/* ============================================================
   CLEAN EXTRACTED VALUE
============================================================ */

function cleanExtractedValue(value) {

    if (!value) {
        return "";
    }

    return value
        .replace(/\r/g, " ")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .replace(/[,:;]+$/, "")
        .trim();
}


/* ============================================================
   FIND LABELLED VALUE
   ------------------------------------------------------------
   Example:
   District: Jogulamba Gadwal
   District - Jogulamba Gadwal
============================================================ */

function findLabelledValue(
    labels,
    maxLength = 100
) {

    for (const label of labels) {

        const pattern =
            new RegExp(
                "\\b" +
                label +
                "\\s*(?:No\\.?|Number)?\\s*" +
                "[:\\-]\\s*" +
                "([^\\n\\r]+)",
                "i"
            );

        const match =
            normalizedText.match(pattern);

        if (
            match &&
            match[1]
        ) {

            let value =
                cleanExtractedValue(
                    match[1]
                );

            /*
             * Reject suspiciously long values.
             */

            if (
                value.length > maxLength
            ) {
                continue;
            }

            /*
             * Reject values containing another field label.
             */

            if (
                /\b(?:district|mandal|village|address|mobile|phone|file\s*(?:no|number))\b/i
                    .test(value)
            ) {
                continue;
            }

            return value;
        }
    }

    return "";
}


/* ============================================================
   DISTRICT
============================================================ */

let district =
    findLabelledValue(
        [
            "district"
        ],
        60
    );


/*
 * Do NOT guess the district from arbitrary text.
 */

if (district) {

    setIfEmpty(
        "district",
        district
    );

} else {

    console.log(
        "District not reliably identified."
    );
}


/* ============================================================
   MANDAL
============================================================ */

let mandal =
    findLabelledValue(
        [
            "mandal"
        ],
        60
    );


if (mandal) {

    setIfEmpty(
        "mandal",
        mandal
    );

} else {

    console.log(
        "Mandal not reliably identified."
    );
}


/* ============================================================
   VILLAGE
============================================================ */

let village =
    findLabelledValue(
        [
            "village"
        ],
        80
    );


if (village) {

    setIfEmpty(
        "village",
        village
    );

} else {

    console.log(
        "Village not reliably identified."
    );
}


/* ============================================================
   FILE NUMBER
============================================================ */

let fileNumber = "";


/*
 * Only accept a file number when there is a clear label.
 */

const filePatterns = [

    /\bfile\s*(?:no\.?|number)\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9./_-]{3,})/i,

    /\bfile\s*no\.?\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9./_-]{3,})/i,

    /\bfile\s*number\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9./_-]{3,})/i,

    /\bU\.?O\.?\s*No\.?\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9./_-]{3,})/i

];


for (
    const pattern
    of filePatterns
) {

    const match =
        normalizedText.match(
            pattern
        );

    if (
        match &&
        match[1]
    ) {

        const candidate =
            cleanExtractedValue(
                match[1]
            );

        /*
         * Reject extremely short OCR matches.
         *
         * Example:
         * "te"
         *
         * should NOT become a File Number.
         */

        if (
            candidate.length >= 4
        ) {

            fileNumber =
                candidate;

            break;
        }
    }
}


if (fileNumber) {

    setIfEmpty(
        "fileNumber",
        fileNumber
    );

} else {

    console.log(
        "File Number not reliably identified."
    );
}

    /* ============================================================
       DATE ARISED
    ============================================================ */

    let dateArised = "";


    const dateArisedPatterns = [

        /date\s*arised\s*[:\-]?\s*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{4})/i,

        /date\s*of\s*file\s*[:\-]?\s*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{4})/i

    ];


    for (
        const pattern
        of dateArisedPatterns
    ) {

        const match =
            normalizedText.match(
                pattern
            );


        if (
            match &&
            match[1]
        ) {

            dateArised =
                normalizeDate(
                    match[1]
                );

            if (
                dateArised
            ) {
                break;
            }
        }
    }


    setIfEmpty(
        "dateArised",
        dateArised
    );


    /* ============================================================
       DUE DATE
       ------------------------------------------------------------
       We deliberately DO NOT extract the due date from the PDF.
       Existing RTI rule is:
       Application Date + 30 days.
    ============================================================ */

    const applicationDateElement =
        document.getElementById(
            "applicationDate"
        );


    if (
        applicationDateElement &&
        applicationDateElement.value
    ) {

        calculateRTIDueDate();

        console.log(
            "Due Date calculated from Application Date."
        );
    }


    /* ============================================================
       VALIDATION SUMMARY
    ============================================================ */

    const mandatoryFields = [

        {
            id: "applicationNumber",
            name: "Application Number"
        },

        {
            id: "applicationDate",
            name: "Application Date"
        },

        {
            id: "applicantName",
            name: "Applicant Name"
        },

        {
            id: "informationSought",
            name: "Information Sought"
        },

        {
            id: "presentStatus",
            name: "Present Status"
        }

    ];


    const missingFields = [];


    mandatoryFields.forEach(
        function (field) {

            const element =
                document.getElementById(
                    field.id
                );


            if (
                !element ||
                !element.value ||
                !element.value.trim()
            ) {

                missingFields.push(
                    field.name
                );
            }

        }
    );


    console.log(
        "=============================================="
    );


    console.log(
        "RTI AUTO POPULATION COMPLETED"
    );


    console.log(
        "Missing mandatory fields:",
        missingFields
    );


    console.log(
        "=============================================="
    );


    /* ============================================================
       USER MESSAGE
    ============================================================ */

    if (
        missingFields.length === 0
    ) {

        showRTIMessage(
            "Document parsed and RTI form populated successfully. Please verify the extracted information.",
            "success"
        );

    }
    else {

        showRTIMessage(
            "Document parsed. Existing values were preserved. Please complete: " +
            missingFields.join(
                ", "
            ),
            "warning"
        );

    }

}
>>>>>>> 5da6d8e483480b715fe7bb7b97a96f2bb945b604
