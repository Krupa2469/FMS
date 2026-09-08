/*
==========================================================
FILE MANAGEMENT SYSTEM (FMS)

firebase-service.js

Developer : Lekha Technologies
Version    : 1.0

Reusable Firestore Functions
==========================================================
*/

//---------------------------------------------------------
// Save Document
//---------------------------------------------------------
async function saveDocument(collectionName, data) {

    try {

        const docRef = await db.collection(collectionName).add(data);

        console.log("Document Saved :", docRef.id);

        return {
            success: true,
            id: docRef.id
        };

    } catch (error) {

        console.error(error);

        return {
            success: false,
            error: error.message
        };

    }

}

//---------------------------------------------------------
// Update Document
//---------------------------------------------------------
async function updateDocument(collectionName, docId, data) {

    try {

        await db.collection(collectionName)
            .doc(docId)
            .update(data);

        return true;

    } catch (error) {

        console.error(error);

        return false;

    }

}

//---------------------------------------------------------
// Delete Document
//---------------------------------------------------------
async function deleteDocument(collectionName, docId) {

    try {

        await db.collection(collectionName)
            .doc(docId)
            .delete();

        return true;

    } catch (error) {

        console.error(error);

        return false;

    }

}

//---------------------------------------------------------
// Get One Document
//---------------------------------------------------------
async function getDocument(collectionName, docId) {

    try {

        const doc = await db.collection(collectionName)
            .doc(docId)
            .get();

        if (!doc.exists)
            return null;

        return {

            id: doc.id,

            ...doc.data()

        };

    } catch (error) {

        console.error(error);

        return null;

    }

}

//---------------------------------------------------------
// Get All Documents
//---------------------------------------------------------
async function getAllDocuments(collectionName) {

    try {

        const snapshot = await db.collection(collectionName).get();

        let list = [];

        snapshot.forEach(doc => {

            list.push({

                id: doc.id,

                ...doc.data()

            });

        });

        return list;

    } catch (error) {

        console.error(error);

        return [];

    }

}

// Shared Firebase Functions accessor used by the FMS WhatsApp custom-message service.
window.getFMSFunctions = window.getFMSFunctions || function(){
  try { return (window.firebase && window.firebase.functions) ? window.firebase.functions("asia-south1") : null; }
  catch(e){ return null; }
};
