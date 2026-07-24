/*==========================================================
  CPGRAMS MODULE
  File        : cpgrams-repository.js
  Version     : 4.0
  Description : Firestore Repository
==========================================================*/

"use strict";

//==========================================================
// FIRESTORE COLLECTION
//==========================================================

const COLLECTION_NAME = "cpgrams";

//==========================================================
// GET FIRESTORE INSTANCE
//==========================================================

function getCollection() {

    return firebase
        .firestore()
        .collection(COLLECTION_NAME);

}

//==========================================================
// CREATE RECORD
//==========================================================

async function createRecord(grievance) {

    try {

        grievance.createdOn =
            firebase.firestore.FieldValue.serverTimestamp();

        grievance.updatedOn =
            firebase.firestore.FieldValue.serverTimestamp();

        grievance.active = true;

        const document =
            await getCollection().add(grievance);

        return {

            success: true,

            id: document.id,

            message: "Record Saved Successfully."

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

//==========================================================
// GET RECORD BY DOCUMENT ID
//==========================================================

async function getRecord(documentId) {

    try {

        const snapshot =
            await getCollection()
                .doc(documentId)
                .get();

        if (!snapshot.exists) {

            return {

                success: false,

                message: "Record Not Found."

            };

        }

        return {

            success: true,

            data: snapshot.data()

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

//==========================================================
// UPDATE RECORD
//==========================================================

async function updateRecord(documentId, grievance) {

    try {

        grievance.updatedOn =
            firebase.firestore.FieldValue.serverTimestamp();

        await getCollection()
            .doc(documentId)
            .update(grievance);

        return {

            success: true,

            message: "Record Updated Successfully."

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

//==========================================================
// SOFT DELETE RECORD
//==========================================================

async function deleteRecord(documentId) {

    try {

        await getCollection()
            .doc(documentId)
            .update({

                active: false,

                deletedOn:
                    firebase.firestore.FieldValue.serverTimestamp(),

                updatedOn:
                    firebase.firestore.FieldValue.serverTimestamp()

            });

        return {

            success: true,

            message: "Record Deleted Successfully."

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

//==========================================================
// GET RECORD BY GRIEVANCE NUMBER
//==========================================================

async function getRecordByGrievanceNumber(grievanceNumber) {

    try {

        const snapshot =
            await getCollection()

                .where(
                    "grievanceNumber",
                    "==",
                    grievanceNumber
                )

                .where(
                    "active",
                    "==",
                    true
                )

                .limit(1)

                .get();

        if (snapshot.empty) {

            return {

                success: false,

                message: "Record Not Found."

            };

        }

        const document =
            snapshot.docs[0];

        return {

            success: true,

            id: document.id,

            data: document.data()

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

//==========================================================
// DUPLICATE CHECK
//==========================================================

async function grievanceExists(grievanceNumber) {

    try {

        const snapshot =
            await getCollection()

                .where(
                    "grievanceNumber",
                    "==",
                    grievanceNumber
                )

                .where(
                    "active",
                    "==",
                    true
                )

                .limit(1)

                .get();

        return !snapshot.empty;

    }
    catch (error) {

        console.error(error);

        return false;

    }

}

//==========================================================
// GET DOCUMENT BY ID
//==========================================================

async function getDocument(documentId) {

    try {

        const snapshot =
            await getCollection()
                .doc(documentId)
                .get();

        if (!snapshot.exists)
            return null;

        return {

            id: snapshot.id,

            ...snapshot.data()

        };

    }
    catch (error) {

        console.error(error);

        return null;

    }

}

//==========================================================
// GET ALL ACTIVE RECORDS
//==========================================================

async function getActiveRecords(limitCount = 100) {

    try {

        const snapshot =
            await getCollection()

                .where("active", "==", true)

                .orderBy("createdOn", "desc")

                .limit(limitCount)

                .get();

        const records = [];

        snapshot.forEach(doc => {

            records.push({

                id: doc.id,

                ...doc.data()

            });

        });

        return {

            success: true,

            data: records

        };

    }
    catch (error) {

        console.error(error);

        return {

            success: false,

            message: error.message,

            data: []

        };

    }

}

//==========================================================
// SEARCH BY DISTRICT
//==========================================================

async function searchByDistrict(district) {

    try {

        const snapshot =
            await getCollection()

                .where("district", "==", district)

                .where("active", "==", true)

                .orderBy("createdOn", "desc")

                .get();

        const records = [];

        snapshot.forEach(doc => {

            records.push({

                id: doc.id,

                ...doc.data()

            });

        });

        return {

            success: true,

            data: records

        };

    }
    catch (error) {

        console.error(error);

        return {

            success: false,

            message: error.message,

            data: []

        };

    }

}

//==========================================================
// SEARCH BY CATEGORY
//==========================================================

async function searchByCategory(category) {

    try {

        const snapshot =
            await getCollection()

                .where("category", "==", category)

                .where("active", "==", true)

                .orderBy("createdOn", "desc")

                .get();

        const records = [];

        snapshot.forEach(doc => {

            records.push({

                id: doc.id,

                ...doc.data()

            });

        });

        return {

            success: true,

            data: records

        };

    }
    catch (error) {

        console.error(error);

        return {

            success: false,

            message: error.message,

            data: []

        };

    }

}

//==========================================================
// SEARCH BY CURRENT STATUS
//==========================================================

async function searchByStatus(status) {

    try {

        const snapshot =
            await getCollection()

                .where("currentStatus", "==", status)

                .where("active", "==", true)

                .orderBy("createdOn", "desc")

                .get();

        const records = [];

        snapshot.forEach(doc => {

            records.push({

                id: doc.id,

                ...doc.data()

            });

        });

        return {

            success: true,

            data: records

        };

    }
    catch (error) {

        console.error(error);

        return {

            success: false,

            message: error.message,

            data: []

        };

    }

}

//==========================================================
// DASHBOARD SUMMARY
//==========================================================

async function getDashboardSummary() {

    try {

        const snapshot =
            await getCollection()

                .where("active", "==", true)

                .get();

        let total = 0;

        let pending = 0;

        let disposed = 0;

        let overdue = 0;

        const today = new Date();

        snapshot.forEach(doc => {

            total++;

            const data = doc.data();

            if (data.finalStatus === "Disposed" ||
                data.finalStatus === "Closed") {

                disposed++;

            }
            else {

                pending++;

            }

            if (data.dueDate) {

                const due = new Date(data.dueDate);

                if (due < today &&
                    data.finalStatus !== "Disposed" &&
                    data.finalStatus !== "Closed") {

                    overdue++;

                }

            }

        });

        return {

            success: true,

            data: {

                total,

                pending,

                disposed,

                overdue

            }

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


//==========================================================
// GET RECORD COUNT
//==========================================================

async function getRecordCount() {

    try {

        const snapshot =
            await getCollection()
                .where("active", "==", true)
                .get();

        return snapshot.size;

    }
    catch (error) {

        console.error(error);

        return 0;

    }

}

//==========================================================
// GET RECENT RECORDS
//==========================================================

async function getRecentRecords(limitCount = 10) {

    try {

        const snapshot =
            await getCollection()

                .where("active", "==", true)

                .orderBy("createdOn", "desc")

                .limit(limitCount)

                .get();

        const records = [];

        snapshot.forEach(doc => {

            records.push({

                id: doc.id,

                ...doc.data()

            });

        });

        return {

            success: true,

            data: records

        };

    }
    catch (error) {

        console.error(error);

        return {

            success: false,

            data: [],

            message: error.message

        };

    }

}

//==========================================================
// PAGINATED REGISTER
//==========================================================

async function getPagedRecords(lastDocument = null, pageSize = 25) {

    try {

        let query =
            getCollection()

                .where("active", "==", true)

                .orderBy("createdOn", "desc")

                .limit(pageSize);

        if (lastDocument) {

            query =
                query.startAfter(lastDocument);

        }

        const snapshot =
            await query.get();

        const records = [];

        snapshot.forEach(doc => {

            records.push({

                id: doc.id,

                ...doc.data()

            });

        });

        return {

            success: true,

            data: records,

            lastDocument:
                snapshot.docs.length > 0
                    ? snapshot.docs[snapshot.docs.length - 1]
                    : null

        };

    }
    catch (error) {

        console.error(error);

        return {

            success: false,

            data: [],

            lastDocument: null,

            message: error.message

        };

    }

}

//==========================================================
// HARD DELETE
// (Normally not used)
//==========================================================

async function hardDeleteRecord(documentId) {

    try {

        await getCollection()
            .doc(documentId)
            .delete();

        return {

            success: true,

            message: "Record Permanently Deleted."

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

//==========================================================
// HEALTH CHECK
//==========================================================

async function repositoryHealthCheck() {

    try {

        await getCollection()
            .limit(1)
            .get();

        return true;

    }
    catch (error) {

        console.error(error);

        return false;

    }

}

//==========================================================
// EXPORTS
//==========================================================

window.createRecord = createRecord;

window.getRecord = getRecord;

window.updateRecord = updateRecord;

window.deleteRecord = deleteRecord;

window.getDocument = getDocument;

window.getRecordByGrievanceNumber =
    getRecordByGrievanceNumber;

window.grievanceExists =
    grievanceExists;

window.getActiveRecords =
    getActiveRecords;

window.searchByDistrict =
    searchByDistrict;

window.searchByCategory =
    searchByCategory;

window.searchByStatus =
    searchByStatus;

window.getDashboardSummary =
    getDashboardSummary;

window.getRecordCount =
    getRecordCount;

window.getRecentRecords =
    getRecentRecords;

window.getPagedRecords =
    getPagedRecords;

window.hardDeleteRecord =
    hardDeleteRecord;

window.repositoryHealthCheck =
    repositoryHealthCheck;

//==========================================================
// END OF FILE
//==========================================================