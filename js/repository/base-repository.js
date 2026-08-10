/*==========================================================
 FILE MANAGEMENT SYSTEM (FMS)
 File        : base-repository.js
 Version     : 5.0
 Developer   : Lekha Technologies
 Description : Base Firestore Repository
==========================================================*/

"use strict";

/*==========================================================
 CONFIGURATION
==========================================================*/

const DEVELOPMENT_MODE = true;

/*==========================================================
 BASE REPOSITORY
==========================================================*/

class BaseRepository {

    constructor(collectionName) {

        this.collectionName = collectionName;
        this.db = firebase.firestore();

    }

    collection() {

        return this.db.collection(this.collectionName);

    }

    success(data = null, message = "") {

        return {
            success: true,
            data,
            message
        };

    }

    failure(error) {

        console.error(error);

        return {
            success: false,
            data: null,
            message: error.message || error
        };

    }

    serverTimestamp() {

        return firebase.firestore.FieldValue.serverTimestamp();

    }

    /*======================================================
      CREATE
    ======================================================*/

    async create(data) {

        try {

            data.active = true;
            data.version = "5.0";
            data.createdOn = this.serverTimestamp();
            data.updatedOn = this.serverTimestamp();

            const doc =
                await this.collection().add(data);

            return this.success({
                id: doc.id
            });

        }
        catch (error) {

            return this.failure(error);

        }

    }

    /*======================================================
      GET DOCUMENT
    ======================================================*/

    async get(documentId) {

        try {

            const doc =
                await this.collection()
                    .doc(documentId)
                    .get();

            if (!doc.exists) {

                return this.failure("Record not found.");

            }

            return this.success({

                id: doc.id,
                ...doc.data()

            });

        }
        catch (error) {

            return this.failure(error);

        }

    }

    /*======================================================
      UPDATE
    ======================================================*/

    async update(documentId, data) {

        try {

            data.updatedOn =
                this.serverTimestamp();

            await this.collection()

                .doc(documentId)

                .update(data);

            return this.success();

        }
        catch (error) {

            return this.failure(error);

        }

    }

    /*======================================================
      SOFT DELETE
    ======================================================*/

    async delete(documentId) {

        try {

            await this.collection()

                .doc(documentId)

                .update({

                    active: false,

                    deletedOn:
                        this.serverTimestamp(),

                    updatedOn:
                        this.serverTimestamp()

                });

            return this.success();

        }
        catch (error) {

            return this.failure(error);

        }

    }

    /*======================================================
      GET ACTIVE RECORDS
    ======================================================*/

    async getActiveRecords(limit = 500) {

        try {

            let snapshot;

            if (DEVELOPMENT_MODE) {

                snapshot =
                    await this.collection()

                        .where("active", "==", true)

                        .limit(limit)

                        .get();

            }
            else {

                snapshot =
                    await this.collection()

                        .where("active", "==", true)

                        .orderBy("createdOn", "desc")

                        .limit(limit)

                        .get();

            }

            const records = [];

            snapshot.forEach(doc => {

               records.push({

                     ...doc.data(),

                     id: doc.id

               });

            });

            records.sort((a, b) => {

                const d1 =
                    a.createdOn?.toDate?.() ||
                    new Date(0);

                const d2 =
                    b.createdOn?.toDate?.() ||
                    new Date(0);

                return d2 - d1;

            });

            return this.success(records);

        }
        catch (error) {

            return this.failure(error);

        }

    }

    /*======================================================
      QUERY
    ======================================================*/

    async query(field, value) {

        try {

            const snapshot =
                await this.collection()

                    .where(field, "==", value)

                    .where("active", "==", true)

                    .get();

            const records = [];

            snapshot.forEach(doc => {

             records.push({

                ...doc.data(),

                id: doc.id

        });

            });

            return this.success(records);

        }
        catch (error) {

            return this.failure(error);

        }

    }

}

async function deleteAttachmentFromRepository(documentId) {

    try {

        await db
            .collection("attachments")
            .doc(documentId)
            .delete();

        return {
            success: true
        };

    }
    catch (error) {

        console.error(error);

        return {
            success: false,
            message: error.message
        };

    }

}

 async function getAttachments(grievanceId) {

    try {

        const snapshot =
            await db
                .collection("attachments")
                .where(
                    "grievanceId",
                    "==",
                    grievanceId
                )
                .get();

        const list = [];

        snapshot.forEach(doc => {

            list.push({

                id: doc.id,

                ...doc.data()

            });

        });

        return {

            success: true,

            data: list

        };

    }
    catch (error) {

        return {

            success: false,

            message: error.message

        };

    }

}

async function saveAttachment(data) {

    try {

        const doc =
            await db
                .collection("attachments")
                .add(data);

        return {

            success: true,

            id: doc.id

        };

    }
    catch (error) {

        return {

            success: false,

            message: error.message

        };

    }

}
