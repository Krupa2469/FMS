/*==========================================================
 ATTACHMENT MODULE
 Version : 5.1
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

    try {
        const control = document.getElementById("fileAttachment");
        if (!control) {
            showMessage?.("Attachment file control not found.", "danger");
            return;
        }

        if (!control.files || control.files.length === 0) {
            showMessage?.("Please choose an attachment first.", "warning");
            return;
        }

        if (!currentDocumentId) {
            showMessage?.("Please save the grievance first. After saving, attachments can be uploaded.", "warning");
            return;
        }

        if (typeof uploadAttachmentRepository !== "function") {
            showMessage?.("Attachment repository is not loaded. Please refresh the page and try again.", "danger");
            return;
        }

        showLoading?.();
        const result = await uploadAttachmentRepository(
            currentDocumentId,
            control.files[0],
            { module: "cpgrams", fileRole: "Attachment", sourceField: "fileAttachment" }
        );
        hideLoading?.();

        if (!result.success) {
            showMessage?.(result.message || "Unable to upload attachment.", "danger");
            return;
        }

        control.value = "";
        await loadAttachments(currentDocumentId);
        showMessage?.("Attachment uploaded successfully.", "success");
    }
    catch (error) {
        hideLoading?.();
        console.error("UPLOAD ERROR", error);
        showMessage?.("Unable to upload attachment: " + (error.message || error), "danger");
    }

}

/*==========================================================
 RENDER ATTACHMENTS
==========================================================*/

function renderAttachments() {

    const tbody =
        document.getElementById(
            "attachmentBody"
        );

    if (!tbody)
        return;

    tbody.innerHTML = "";

    if (attachmentList.length === 0) {

        tbody.innerHTML = `

        <tr>

            <td colspan="5"
                class="text-center text-muted">

                No Attachments

            </td>

        </tr>

        `;

        updateAttachmentCount();

        return;

    }

    attachmentList.forEach((file, index) => {

        const sizeKB =
            (file.fileSize / 1024).toFixed(2);

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${index + 1}</td>

            <td>${file.fileName}</td>

            <td>${file.fileType}</td>

            <td>${sizeKB} KB</td>

            <td class="text-center">

                <button
                    class="btn btn-info btn-sm me-1"
                    onclick="viewAttachment('${file.id}')"
                    title="View">

                    <i class="bi bi-eye"></i>

                </button>

                <button
                    class="btn btn-success btn-sm me-1"
                    onclick="downloadAttachment('${file.id}')"
                    title="Download">

                    <i class="bi bi-download"></i>

                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="deleteAttachment('${file.id}')"
                    title="Delete">

                    <i class="bi bi-trash"></i>

                </button>

            </td>

        `;

        tbody.appendChild(row);

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