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
        const path=`attachments/${module}/${recordId}/${Date.now()}_${Math.random().toString(36).slice(2,10)}_${safeName(file.name)}`;
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
            if(window.FMSCrud && typeof window.FMSCrud.softDelete === "function") {
                const result=await window.FMSCrud.softDelete("fmsAttachments",item.id);
                if(!result.success) throw new Error(result.message||"Unable to remove document.");
            } else await database.collection("fmsAttachments").doc(item.id).update({active:false,deletedOn:serverTimestamp()});
        }
    }

    async function update(item,fields={}){
        const database=getDB();
        if(!database||!item?.id) throw new Error('Document could not be found.');
        const fileRole=String(fields.fileRole||'').trim();
        if(!fileRole) throw new Error('Select a document type.');
        const changes={fileRole,updatedOn:serverTimestamp()};
        if(window.FMSCrud && typeof window.FMSCrud.update==='function'){
            const result=await window.FMSCrud.update('fmsAttachments',item.id,changes);
            if(!result.success) throw new Error(result.message||'Unable to edit document details.');
        }else{
            await database.collection('fmsAttachments').doc(item.id).update(changes);
        }
        return {...item,...changes};
    }

    function wireUI(config){
        const input=document.getElementById(config.inputId);
        const button=document.getElementById(config.buttonId);
        const listEl=document.getElementById(config.listId);
        const typeInput=document.getElementById(config.typeSelectId||'dishaAttachmentDocumentType');
        if(!input||!button||!listEl) return;
        input.multiple=true;
        const show=(message,type='success')=>{
            if(typeof config.message==='function') config.message(message,type);
            else if(type==='danger'||type==='warning') alert(message);
        };
        async function refresh(){
            const id=typeof config.getRecordId==='function'?config.getRecordId():null;
            listEl.replaceChildren();
            if(!id){listEl.textContent='Save the record first to manage documents.';return;}
            try{
                const items=await list(config.module,id);
                if(!items.length){listEl.textContent='No saved documents.';return;}
                const wrapper=document.createElement('div');wrapper.className='table-responsive';
                const table=document.createElement('table');table.className='table table-striped table-bordered align-middle mb-0';
                table.innerHTML='<thead><tr><th>S.No.</th><th>File Name</th><th>Document Type</th><th>Size</th><th>Action</th></tr></thead>';
                const tbody=document.createElement('tbody');
                items.forEach((item,index)=>{
                    const row=tbody.insertRow();row.insertCell().textContent=String(index+1);
                    const name=row.insertCell();name.textContent=item.fileName||'Document';name.style.overflowWrap='anywhere';
                    const typeCell=row.insertCell();typeCell.textContent=item.fileRole||'Other';
                    row.insertCell().textContent=`${((item.fileSize||0)/1024).toFixed(1)} KB`;
                    const actionCell=row.insertCell();actionCell.className='text-nowrap';
                    const makeButton=(text,style,callback)=>{
                        const el=document.createElement('button');el.type='button';el.className=`btn btn-sm ${style} me-1`;
                        el.textContent=text;el.addEventListener('click',callback);actionCell.appendChild(el);return el;
                    };
                    function openDocument(){
                        if(!item.downloadURL){show('No uploaded document is available for viewing.','warning');return;}
                        window.open(item.downloadURL,'_blank','noopener,noreferrer');
                    }
                    makeButton('View','btn-info',openDocument);
                    makeButton('Edit','btn-warning',()=>{
                        const original=item.fileRole||'Other';
                        const select=document.createElement('select');select.className='form-select form-select-sm';
                        select.innerHTML=window.FMSDocumentTypes?.options(original)||`<option>${escapeHtml(original)}</option>`;
                        typeCell.replaceChildren(select);actionCell.replaceChildren();
                        makeButton('Save','btn-success',async()=>{
                            try{await update(item,{fileRole:select.value});show('Document type updated.');await refresh();}
                            catch(error){show(error.message||'Unable to update document type.','danger');}
                        });
                        makeButton('Cancel','btn-secondary',refresh);
                    });
                    makeButton('Delete','btn-danger',async()=>{
                        if(!confirm('Delete this document?')) return;
                        try{await remove(item);await refresh();show('Document removed.');}
                        catch(error){show(error.message||'Unable to delete document.','danger');}
                    });
                });
                table.appendChild(tbody);wrapper.appendChild(table);listEl.appendChild(wrapper);
            }catch(e){console.error(e);listEl.textContent='Unable to load documents. Please refresh and try again.';}
        }
        button.addEventListener('click',async()=>{
            const files=Array.from(input.files||[]);
            if(!files.length){show('Choose one or more documents to upload.','warning');return;}
            const id=typeof config.getRecordId==='function'?config.getRecordId():null;
            if(!id){show('Save the record before uploading documents.','warning');return;}
            const fileRole=typeInput?.value||'Other';
            let uploaded=0;const failed=[];
            button.disabled=true;
            try{
                for(const file of files){
                    try{await upload(config.module,id,file,{fileRole,sourceField:config.inputId});uploaded++;}
                    catch(e){failed.push(`${file.name}: ${e.message||e}`);}
                }
                input.value='';
                await refresh();
                show(`${uploaded} document(s) uploaded.${failed.length?` ${failed.length} failed: ${failed.join('; ')}. Please reselect the failed files to retry.`:''}`,failed.length?'warning':'success');
            }finally{button.disabled=false;}
        });
        refresh();return {refresh};
    }

    window.FMSAttachmentService={upload,list,remove,update,wireUI};
})(window);
