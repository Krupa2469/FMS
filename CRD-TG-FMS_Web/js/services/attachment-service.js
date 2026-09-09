/* =========================================================
   FMS CENTRAL ATTACHMENT SERVICE
   Version 1.0
   Files are stored in Firebase Storage; metadata is stored in Firestore.
   Parsing files are deliberately NOT passed to this service.
   Lekha Technologies
========================================================= */
(function(window){
    "use strict";

    function getDB(){
        if(typeof window.getFMSFirestore==="function") return window.getFMSFirestore();
        if(typeof db!=="undefined") return db;
        if(typeof firebase!=="undefined" && firebase.firestore) return firebase.firestore();
        return null;
    }

    function getStorage(){
        if(typeof window.getFMSStorage==="function") return window.getFMSStorage();
        if(typeof storage!=="undefined") return storage;
        if(typeof firebase!=="undefined" && firebase.storage) return firebase.storage();
        return null;
    }

    function safeName(name){
        return String(name||"file").replace(/[^\w.\-() ]+/g,"_").replace(/\s+/g,"_");
    }

    async function upload(moduleName, recordId, file){
        if(!recordId) throw new Error("Save the record first, then upload attachments.");
        if(!file) throw new Error("Please select an attachment.");
        const db=getDB(), storage=getStorage();
        if(!db || !storage) throw new Error("Firebase Firestore/Storage is not ready.");

        const module=String(moduleName||"FMS").toLowerCase();
        const path=`attachments/${module}/${recordId}/${Date.now()}_${safeName(file.name)}`;
        const snap=await storage.ref(path).put(file);
        const url=await snap.ref.getDownloadURL();

        const metadata={
            module,
            recordId,
            fileName:file.name,
            fileType:file.type || "application/octet-stream",
            fileSize:file.size || 0,
            storagePath:path,
            downloadURL:url,
            uploadedOn:firebase.firestore.FieldValue.serverTimestamp(),
            active:true
        };
        const doc=await db.collection("fmsAttachments").add(metadata);
        return {id:doc.id,...metadata};
    }

    async function list(moduleName, recordId){
        const db=getDB();
        if(!db || !recordId) return [];
        const module=String(moduleName||"FMS").toLowerCase();
        const snap=await db.collection("fmsAttachments")
            .where("recordId","==",recordId)
            .get();
        return snap.docs
            .map(d=>({id:d.id,...d.data()}))
            .filter(item => item.module === module && item.active !== false);
    }

    async function remove(item){
        const db=getDB(), storage=getStorage();
        if(!item) return;
        if(storage && item.storagePath){
            try{ await storage.ref(item.storagePath).delete(); }catch(e){ console.warn("Storage delete:",e); }
        }
        if(db && item.id){
            await db.collection("fmsAttachments").doc(item.id).update({
                active:false,
                deletedOn:firebase.firestore.FieldValue.serverTimestamp()
            });
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
            if(!id){
                listEl.innerHTML='<div class="text-muted text-center py-2">Save the record first to manage attachments.</div>';
                return;
            }
            try{
                const items=await list(config.module,id);
                if(!items.length){
                    listEl.innerHTML='<div class="text-muted text-center py-2">No attachments.</div>';
                    return;
                }
                items.forEach((item,i)=>{
                    const row=document.createElement("div");
                    row.className="d-flex justify-content-between align-items-center border rounded p-2 mb-2 bg-light";
                    row.innerHTML=`<div><strong>${escapeHtml(item.fileName)}</strong><div class="small text-muted">${escapeHtml(item.fileType)} • ${Math.ceil((item.fileSize||0)/1024)} KB</div></div>
                    <div class="d-flex gap-1">
                      <a class="btn btn-sm btn-outline-primary" href="${escapeHtml(item.downloadURL)}" target="_blank" rel="noopener">View</a>
                      <button type="button" class="btn btn-sm btn-outline-danger" data-delete="${item.id}">Delete</button>
                    </div>`;
                    row.querySelector("[data-delete]").addEventListener("click",async()=>{
                        if(!confirm("Delete this attachment?")) return;
                        await remove(item); await refresh();
                    });
                    listEl.appendChild(row);
                });
            }catch(e){ console.error(e); listEl.innerHTML='<div class="text-danger text-center py-2">Unable to load attachments.</div>'; }
        }

        button.addEventListener("click",async()=>{
            try{
                const file=input.files && input.files[0];
                const id=typeof config.getRecordId==="function" ? config.getRecordId() : null;
                const item=await upload(config.module,id,file);
                input.value="";
                await refresh();
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

    function escapeHtml(v){
        return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
    }

    window.FMSAttachmentService={upload,list,remove,wireUI};
})(window);
