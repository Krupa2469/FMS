/* =========================================================
   FMS CENTRAL ATTACHMENT SERVICE
   Version 1.2
   Uploads to Firebase Storage with Firestore inline fallback.
========================================================= */
(function(window){
    "use strict";

    const INLINE_LIMIT_BYTES = 700 * 1024;

    function getDB(){
        if(typeof window.getFMSFirestore==="function") return window.getFMSFirestore();
        if(window.db) return window.db;
        if(typeof db!=="undefined") return db;
        if(typeof firebase!=="undefined" && firebase.firestore) return firebase.firestore();
        return null;
    }

    function getStorage(){
        try{
            if(typeof window.getFMSStorage==="function") return window.getFMSStorage();
            if(window.storage) return window.storage;
            if(typeof storage!=="undefined" && storage) return storage;
            if(typeof firebase!=="undefined" && typeof firebase.storage==="function") return firebase.storage();
        }catch(e){ console.warn("Storage unavailable:", e); }
        return null;
    }

    function safeName(name){ return String(name||"file").replace(/[^\w.\-() ]+/g,"_").replace(/\s+/g,"_"); }
    function serverTimestamp(){ try{return firebase.firestore.FieldValue.serverTimestamp();}catch(_e){return new Date();} }
    function escapeHtml(v){ return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }

    function readAsDataURL(file){
        return new Promise((resolve,reject)=>{
            const reader=new FileReader();
            reader.onload=()=>resolve(String(reader.result||""));
            reader.onerror=()=>reject(reader.error||new Error("Unable to read attachment file."));
            reader.readAsDataURL(file);
        });
    }

    async function inlineInfo(file){
        if((file.size||0)>INLINE_LIMIT_BYTES){
            throw new Error("Firebase Storage upload failed and this file is too large for Firestore fallback. Deploy the updated storage.rules, then try again.");
        }
        return {downloadURL:await readAsDataURL(file),storagePath:"",storageProvider:"firestore-inline"};
    }

    async function upload(moduleName, recordId, file, extra={}){
        if(!recordId) throw new Error("Save the record first, then upload attachments.");
        if(!file) throw new Error("Please select an attachment.");
        const database=getDB();
        if(!database) throw new Error("Firestore is not ready. Please refresh the page and try again.");

        const module=String(moduleName||"FMS").toLowerCase();
        const path=`attachments/${module}/${recordId}/${Date.now()}_${safeName(file.name)}`;
        let info;
        const storage=getStorage();
        if(storage){
            try{
                const snap=await storage.ref(path).put(file);
                const url=await snap.ref.getDownloadURL();
                info={downloadURL:url,storagePath:path,storageProvider:"firebase-storage"};
            }catch(storageError){
                console.warn("Storage upload failed. Trying Firestore inline fallback.", storageError);
                info=await inlineInfo(file);
                info.storageError=storageError?.message || String(storageError);
            }
        }else{
            info=await inlineInfo(file);
        }

        const metadata={
            module,
            recordId,
            fileName:file.name,
            fileType:file.type || "application/octet-stream",
            fileSize:file.size || 0,
            fileRole:extra.fileRole || extra.type || "Attachment",
            sourceField:extra.sourceField || "attachmentFile",
            ...info,
            uploadedOn:serverTimestamp(),
            active:true
        };
        if(window.FMSCrud && typeof window.FMSCrud.create === "function"){
            const result = await window.FMSCrud.create("fmsAttachments", metadata);
            if(!result.success) throw new Error(result.message || "Attachment metadata could not be saved.");
            return {id:result.id || result.data?.id, ...metadata};
        }
        const doc=await database.collection("fmsAttachments").add(metadata);
        return {id:doc.id,...metadata};
    }

    async function list(moduleName, recordId){
        const database=getDB();
        if(!database || !recordId) return [];
        const module=String(moduleName||"FMS").toLowerCase();
        if(window.FMSCrud && typeof window.FMSCrud.list === "function"){
            const result = await window.FMSCrud.list("fmsAttachments", {activeOnly:true});
            if(!result.success) throw new Error(result.message || "Unable to load attachments.");
            return (result.data || []).filter(item => String(item.recordId || "") === String(recordId) && item.module === module && item.active !== false);
        }
        const snap=await database.collection("fmsAttachments").where("recordId","==",recordId).get();
        return snap.docs.map(d=>({id:d.id,...d.data()})).filter(item => item.module===module && item.active!==false);
    }

    async function remove(item){
        const database=getDB(), storage=getStorage();
        if(!item) return;
        if(storage && item.storagePath){ try{ await storage.ref(item.storagePath).delete(); }catch(e){ console.warn("Storage delete:",e); } }
        if(database && item.id){
            if(window.FMSCrud && typeof window.FMSCrud.softDelete === "function") await window.FMSCrud.softDelete("fmsAttachments", item.id);
            else await database.collection("fmsAttachments").doc(item.id).update({active:false,deletedOn:serverTimestamp()});
        }
    }

    function wireUI(config){
        const input=document.getElementById(config.inputId);
        const button=document.getElementById(config.buttonId);
        const listEl=document.getElementById(config.listId);
        if(!input || !button || !listEl) return;

        async function refresh(){
            const id=typeof config.getRecordId==="function" ? config.getRecordId() : null;
            listEl.innerHTML="";
            if(!id){ listEl.innerHTML='<div class="text-muted text-center py-2">Save the record first to manage attachments.</div>'; return; }
            try{
                const items=await list(config.module,id);
                if(!items.length){ listEl.innerHTML='<div class="text-muted text-center py-2">No attachments.</div>'; return; }
                items.forEach(item=>{
                    const row=document.createElement("div");
                    row.className="d-flex justify-content-between align-items-center border rounded p-2 mb-2 bg-light";
                    row.innerHTML=`<div><strong>${escapeHtml(item.fileName)}</strong><div class="small text-muted">${escapeHtml(item.fileRole||item.fileType)} • ${Math.ceil((item.fileSize||0)/1024)} KB</div></div>
                    <div class="d-flex gap-1">
                      <a class="btn btn-sm btn-outline-primary" href="${escapeHtml(item.downloadURL)}" target="_blank" rel="noopener">View</a>
                      <button type="button" class="btn btn-sm btn-outline-danger" data-delete="${escapeHtml(item.id)}">Delete</button>
                    </div>`;
                    row.querySelector("[data-delete]").addEventListener("click",async()=>{ if(!confirm("Delete this attachment?")) return; await remove(item); await refresh(); });
                    listEl.appendChild(row);
                });
            }catch(e){ console.error(e); listEl.innerHTML='<div class="text-danger text-center py-2">Unable to load attachments.</div>'; }
        }

        button.addEventListener("click",async()=>{
            try{
                const file=input.files && input.files[0];
                const id=typeof config.getRecordId==="function" ? config.getRecordId() : null;
                const item=await upload(config.module,id,file);
                input.value=""; await refresh();
                if(typeof config.message==="function") config.message("Attachment uploaded successfully.","success");
                console.log("FMS attachment uploaded:",item.fileName);
            }catch(e){
                console.error(e);
                if(typeof config.message==="function") config.message(e.message,"danger");
                else alert(e.message);
            }
        });

        refresh();
        return {refresh};
    }

    window.FMSAttachmentService={upload,list,remove,wireUI};
})(window);
