/*==========================================================
 ATTACHMENT MODULE
 Version : 5.2
==========================================================*/

let attachmentList = [];

let currentAttachment = null;

/*==========================================================
 INITIALIZE
==========================================================*/

function registerAttachmentEvents() {

    console.log("registerAttachmentEvents called");

    const btn =
        document.getElementById(
            "btnUploadAttachment"
        );

    console.log(btn);

    if (!btn) {

        console.error("Upload button NOT FOUND");

        return;

    }

    btn.addEventListener("click", async function () {

        console.log("UPLOAD BUTTON CLICKED");

        await uploadAttachment();

    });

}

/*==========================================================
 LOAD ATTACHMENTS
==========================================================*/

async function loadAttachments(grievanceId) {

    if (!grievanceId) {

        attachmentList = [];

        renderAttachments();

        return;

    }

    try {

        showLoading?.();

        const result =
    await getAttachmentsRepository(grievanceId);

        hideLoading?.();

        if (!result.success) {

            attachmentList = [];

            renderAttachments();

            return;

        }

        attachmentList =
            result.data || [];

        renderAttachments();

    }
    catch (error) {

        hideLoading?.();

        console.error(error);

    }

}

/*==========================================================
 UPLOAD
==========================================================*/

async function uploadAttachment() {
    const input=document.getElementById("fileAttachment");
    const files=Array.from(input?.files||[]);
    if (!files.length) { showMessage?.("Please choose documents to upload.","warning"); return; }
    if (!currentDocumentId) { showMessage?.("Save the grievance first, then upload documents.","warning"); return; }
    const fileRole=document.getElementById("attachmentDocumentType")?.value||"Grievance";
    let uploaded=0; const failed=[];
    try {
        showLoading?.();
        for (const file of files) {
            try {
                const result=await uploadAttachmentRepository(currentDocumentId,file,{module:"cpgrams",fileRole,sourceField:"fileAttachment"});
                if (!result?.success) throw new Error(result?.message||"Unable to upload this document.");
                uploaded++;
            } catch (error) { failed.push(`${file.name}: ${error.message||error}`); }
        }
        input.value="";
        await loadAttachments(currentDocumentId);
        showMessage?.(`${uploaded} document(s) uploaded.${failed.length?` ${failed.length} failed: ${failed.join("; ")}. Please reselect failed files to retry.`:""}`, failed.length?"warning":"success");
    } catch(error) {
        console.error(error); showMessage?.("Unable to upload documents: "+(error.message||error),"danger");
    } finally { hideLoading?.(); }
}

/*==========================================================
 RENDER ATTACHMENTS
==========================================================*/

function renderAttachments() {
    const tbody=document.getElementById("attachmentBody"); if(!tbody) return;
    tbody.replaceChildren();
    if (!attachmentList.length) {
        const row=tbody.insertRow();const cell=row.insertCell();cell.colSpan=5;
        cell.className="text-center text-muted";cell.textContent="No Attachments";
        updateAttachmentCount();return;
    }
    attachmentList.forEach((file,index)=>{
        const row=tbody.insertRow();
        row.insertCell().textContent=index+1;
        const name=row.insertCell();name.textContent=file.fileName||"Document";name.style.overflowWrap="anywhere";
        const category=row.insertCell();
        const selectedType=file.fileRole || "Other";
        const label=document.createElement("span");label.textContent=selectedType;category.appendChild(label);
        row.insertCell().textContent=`${((file.fileSize||0)/1024).toFixed(1)} KB`;
        const actions=row.insertCell();actions.className="text-nowrap";
        function action(title,cls,handler){
            const button=document.createElement("button");button.type="button";button.textContent=title;
            button.className=`btn btn-sm ${cls} me-1`;button.addEventListener("click",handler);actions.appendChild(button);return button;
        }
        action("View","btn-info",()=>viewAttachment(file.id));
        action("Edit","btn-warning",()=>{
            const options=window.FMSDocumentTypes?.options(selectedType)||`<option>${selectedType}</option>`;
            category.replaceChildren();const select=document.createElement("select");select.className="form-select form-select-sm";
            select.innerHTML=options;category.appendChild(select);
            actions.replaceChildren();
            action("Save","btn-success",async()=>{
                const result=await updateAttachmentRepository(file.id,{fileRole:select.value});
                if (!result?.success) { alert(result?.message||"Unable to update document type.");return; }
                file.fileRole=select.value;renderAttachments();
            });
            action("Cancel","btn-secondary",()=>renderAttachments());
        });
        action("Download","btn-outline-primary",()=>downloadAttachment(file.id));
        action("Delete","btn-danger",()=>deleteAttachment(file.id));
    });
    updateAttachmentCount();
}

/*==========================================================
 ATTACHMENT COUNT
==========================================================*/

function updateAttachmentCount() {

    const control =
        document.getElementById(
            "txtAttachmentCount"
        );

    if (control) {

        control.value =
            attachmentList.length;

    }

}

/*==========================================================
 GET ATTACHMENT
==========================================================*/

function getAttachment(id) {

    return attachmentList.find(file => file.id === id);

}

/*==========================================================
 REFRESH
==========================================================*/

async function refreshAttachments() {

    if (!currentDocumentId)
        return;

    await loadAttachments(currentDocumentId);

}
/*==========================================================
 VIEW ATTACHMENT
==========================================================*/

async function viewAttachment(id) {

    const file =
        getAttachment(id);

    if (!file)
        return;

    window.open(
        file.downloadURL,
        "_blank"
    );

}

/*==========================================================
 DOWNLOAD ATTACHMENT
==========================================================*/

async function downloadAttachment(id) {

    const file =
        getAttachment(id);

    if (!file)
        return;

    const link =
        document.createElement("a");

    link.href =
        file.downloadURL;

    link.download =
        file.fileName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

}

/*==========================================================
 DELETE ATTACHMENT
==========================================================*/

async function deleteAttachment(id) {

    const file =
        getAttachment(id);

    if (!file)
        return;

    if (!confirm(
        "Delete this attachment?"
    ))
        return;

    try {

        showLoading?.();

        const result =
            await deleteAttachmentRepository(
                id,
                file.storagePath
            );

        hideLoading?.();

        if (!result.success) {

            showMessage(
                "danger",
                result.message
            );

            return;

        }

        attachmentList =
            attachmentList.filter(
                x => x.id !== id
            );

        renderAttachments();

        showMessage(
            "success",
            "Attachment deleted successfully."
        );

    }
    catch (error) {

        hideLoading?.();

        console.error(error);

        showMessage(
            "danger",
            error.message
        );

    }

}

/*==========================================================
 CLEAR
==========================================================*/

function clearAttachments() {

    attachmentList = [];

    renderAttachments();

}


/*==========================================================
 EXPORTS
==========================================================*/

window.viewAttachment =
    viewAttachment;

window.downloadAttachment =
    downloadAttachment;

window.deleteAttachment =
    deleteAttachment;

window.clearAttachments =
    clearAttachments;
