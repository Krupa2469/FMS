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

    console.log("STEP 1 - uploadAttachment started");

    try {

        const control =
            document.getElementById("fileAttachment");

        console.log("STEP 2", control);

        if (!control) {

            console.error("fileAttachment control not found");

            return;

        }

        console.log("Files Selected =", control.files.length);

        if (control.files.length === 0) {

            console.log("No file selected");

            return;

        }

        console.log("STEP 3 - File Selected");

        console.log("Current Document ID =", currentDocumentId);

        if (!currentDocumentId) {

            console.log("No currentDocumentId");

            return;

        }

        console.log(
            "typeof uploadAttachmentRepository =",
            typeof uploadAttachmentRepository
        );

        console.log("STEP 4 - Calling Repository");

        const result =
    await uploadAttachmentRepository(
        currentDocumentId,
        control.files[0]
    );

console.log("STEP 5");

console.log(result);

if (!result.success) {

    alert(result.message);

    return;

}

// Refresh attachment table

attachmentList.push(result.data);

renderAttachments();

updateAttachmentCount();

document.getElementById("fileAttachment").value = "";

alert("Attachment uploaded successfully.");

await loadAttachments(currentDocumentId);

// Clear file selector

control.value = "";

alert("Attachment uploaded successfully.");

    }
    catch (error) {

        console.error("UPLOAD ERROR");

        console.error(error);

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