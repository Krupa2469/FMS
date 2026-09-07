/*==========================================================
 FILE MANAGEMENT SYSTEM (FMS)

 Module      : Attachment Repository

 File        : attachment-repository.js

 Version     : 2.0

 Developer   : Lekha Technologies

==========================================================*/

"use strict";

/*==========================================================
 ATTACHMENT REPOSITORY
==========================================================*/

class AttachmentRepository {

    constructor() {

        this.db = db;

        this.storage = storage;

        this.collectionName =
            "attachments";

    }

    collection() {

        return this.db.collection(
            this.collectionName
        );

    }

    success(data) {

        return {

            success: true,

            data

        };

    }

    failure(error) {

        return {

            success: false,

            message:
                error.message ||
                error

        };

    }

    /*======================================================
     UPLOAD ATTACHMENT
    ======================================================*/

    async uploadAttachment(
        grievanceId,
        file
    ) {

        try {

            if (!grievanceId)
                throw new Error(
                    "Grievance ID is required."
                );

            if (!file)
                throw new Error(
                    "Please select a file."
                );

            const fileName =
                Date.now() +
                "_" +
                file.name;

            const storagePath =
                "attachments/" +
                grievanceId +
                "/" +
                fileName;

            const storageRef =
                this.storage.ref(
                    storagePath
                );

            const snapshot =
                await storageRef.put(
                    file
                );

            const downloadURL =
                await snapshot.ref
                    .getDownloadURL();

            const attachment = {

                grievanceId:
                    grievanceId,

                fileName:
                    file.name,

                fileType:
                    file.type,

                fileSize:
                    file.size,

                storagePath:
                    storagePath,

                downloadURL:
                    downloadURL,

                uploadedOn:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp(),

                active:
                    true

            };

            const doc =
                await this.collection()
                    .add(
                        attachment
                    );

            return this.success({

                id:
                    doc.id,

                ...attachment

            });

        }
        catch (error) {

            console.error(error);

            return this.failure(
                error
            );

        }

    }

    /*======================================================
      LOAD ATTACHMENTS
    ======================================================*/

    async getAttachments(
        grievanceId
    ) {

        try {

            const snapshot =
                await this.collection()

                    .where(
                        "grievanceId",
                        "==",
                        grievanceId
                    )

                    .where(
                        "active",
                        "==",
                        true
                    )

                    .get();

            const records = [];

            snapshot.forEach(doc => {

                records.push({

                    id:
                        doc.id,

                    ...doc.data()

                });

            });

            return this.success(
                records
            );

        }
        catch (error) {

            console.error(error);

            return this.failure(
                error
            );

        }

    }
        /*======================================================
      VIEW ATTACHMENT
    ======================================================*/

    async getAttachment(id) {

        try {

            const doc =
                await this.collection()
                    .doc(id)
                    .get();

            if (!doc.exists)
                throw new Error(
                    "Attachment not found."
                );

            return this.success({

                id: doc.id,

                ...doc.data()

            });

        }
        catch (error) {

            console.error(error);

            return this.failure(error);

        }

    }

    /*======================================================
      DELETE ATTACHMENT
    ======================================================*/

    async deleteAttachment(id) {

        try {

            const docRef =
                this.collection()
                    .doc(id);

            const doc =
                await docRef.get();

            if (!doc.exists)
                throw new Error(
                    "Attachment not found."
                );

            const data =
                doc.data();

            if (data.storagePath) {

                try {

                    await this.storage
                        .ref(data.storagePath)
                        .delete();

                }
                catch (e) {

                    console.warn(
                        "Storage file not found.",
                        e
                    );

                }

            }

            await docRef.update({

                active: false,

                deletedOn:
                    firebase.firestore.FieldValue.serverTimestamp()

            });

            return this.success(true);

        }
        catch (error) {

            console.error(error);

            return this.failure(error);

        }

    }

}

/*==========================================================
 CREATE REPOSITORY INSTANCE
==========================================================*/

const attachmentRepository =
    new AttachmentRepository();

/*==========================================================
 GLOBAL FUNCTIONS
==========================================================*/

window.uploadAttachmentRepository =
    (grievanceId, file) =>
        attachmentRepository.uploadAttachment(
            grievanceId,
            file
        );

window.getAttachmentsRepository =
    (grievanceId) =>
        attachmentRepository.getAttachments(
            grievanceId
        );

window.getAttachmentRepository =
    (id) =>
        attachmentRepository.getAttachment(
            id
        );

window.deleteAttachmentRepository =
    (id) =>
        attachmentRepository.deleteAttachment(
            id
        );