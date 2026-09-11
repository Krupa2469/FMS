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
    const calculated = window.FMSRecordPolicy?.addDays?.(source, 30, "iso");
    if (calculated) target.value = calculated;
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
    if (window.FMSOfficeProcessing) {
        window.FMSOfficeProcessing.loadSectionDropdown?.("concernedSection");
        window.FMSOfficeProcessing.loadOfficerDropdown?.("assignedOfficer");
    }
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
    document.getElementById("btnRegister")?.addEventListener("click",()=>location.href="rti-register.html?fullscreen=1");
    document.getElementById("btnDailyStatus")?.addEventListener("click",()=>location.href="rti-daily-status.html");
    document.getElementById("btnHome")?.addEventListener("click",()=>location.href="../../index.html");
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
    const data = {};
    document.querySelectorAll("#rtiForm input,#rtiForm select,#rtiForm textarea").forEach(el => {
        if (!el.id) return;
        if (el.type === "file") {
            if (el.files && el.files[0]) data[el.id + "Name"] = el.files[0].name;
            return;
        }
        data[el.id] = String(el.value || "").trim();
    });
    // Keep legacy aliases used by existing registers/reports.
    data.officeReplyObtainedFrom = data.officeReplySection || data.officeReplyObtainedFrom || data.concernedSection || "";
    data.subject = data.officeSubject || data.informationSought || "";
    if (!data.dueDate && data.applicationDate) data.dueDate = window.FMSRecordPolicy?.addDays?.(data.applicationDate, 30, "iso") || data.dueDate;
    const workflow = window.FMSRecordPolicy?.workflow?.("rti", data) || {};
    data.workflowStage = workflow.stage || "RTI application received";
    data.presentStatus = workflow.finalStatus || data.finalStatus || data.officeStatus || "Pending";
    data.daysStatus = workflow.dueLabel || "";
    return data;
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
    try { await rtiDb().collection(RTI_COLLECTION).doc(currentRTIRecordId).delete(); currentRTIRecordId=null; rtiDocuments=[]; location.href="rti-register.html?fullscreen=1"; }
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

    Object.keys(data).forEach(key => {
        const element = document.getElementById(key);
        if (!element || element.type === "file") return;
        if ((key || "").toLowerCase().includes("date") || key === "dueDate") setVal(key, fmtDate(data[key]));
        else setVal(key, data[key] || "");
    });

    // Legacy aliases.
    setVal("officeReplySection", data.officeReplySection || data.officeReplyObtainedFrom || data.replyObtainedFrom || data.concernedSection || "");
    setVal("concernedSection", data.concernedSection || data.officeReplySection || data.officeReplyObtainedFrom || "");
    setVal("officeSubject", data.officeSubject || data.subject || "");
    setVal("finalStatus", data.finalStatus || data.presentStatus || "Pending");

    const district=data.district||"";
    setVal("district",district);

    if(window.FMSRTIMasterService){
        await window.FMSRTIMasterService.loadMandals(district,data.mandal||"");
        if(district && data.mandal){
            await window.FMSRTIMasterService.loadVillages(district,data.mandal,data.village||"");
        }
        await loadRTIOfficers(data.officeLetterAddressedTo||data.assignedOfficer||"");
    }else{
        if(typeof loadMandals==="function" && district) loadMandals(district);
        setTimeout(()=>{
            setVal("mandal",data.mandal||"");
            if(typeof loadVillages==="function"&&district&&data.mandal) loadVillages(district,data.mandal);
            setTimeout(()=>setVal("village",data.village||""),100);
        },100);
    }

    if(data.officeReplySection||data.officeReplyObtainedFrom||data.replyObtainedFrom||data.concernedSection){
        await loadRTIOfficeSection(data.officeReplySection||data.officeReplyObtainedFrom||data.replyObtainedFrom||data.concernedSection);
    }
    setVal("mandal",data.mandal||"");
    setVal("village",data.village||"");

    const sectionSelect=document.getElementById("concernedSection");
    if(sectionSelect && (data.concernedSection || data.officeReplySection)){
        const value=data.concernedSection || data.officeReplySection;
        if(![...sectionSelect.options].some(o=>o.value===value)) addSelectOption(sectionSelect,value,value);
        sectionSelect.value=value;
    }
    const officerSelect=document.getElementById("assignedOfficer");
    if(officerSelect && data.assignedOfficer){
        if(![...officerSelect.options].some(o=>o.value===data.assignedOfficer)) addSelectOption(officerSelect,data.assignedOfficer,data.assignedOfficer);
        officerSelect.value=data.assignedOfficer;
    }

    rtiDocuments=Array.isArray(data.documents)?data.documents:(Array.isArray(data.attachments)?data.attachments:[]);
    renderRTIAttachments();
}

function clearRTIForm(){
    document.querySelectorAll("#rtiForm input,#rtiForm select,#rtiForm textarea").forEach(el => {
        if (!el.id || el.type === "file") return;
        if (el.tagName === "SELECT") el.selectedIndex = 0;
        else el.value = "";
    });
    const m=document.getElementById("mandal"),v=document.getElementById("village");
    if(m){m.disabled=true;m.innerHTML='<option value="">-- Select Mandal --</option>';}
    if(v){v.disabled=true;v.innerHTML='<option value="">-- Select Village --</option>';}
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
