/*==========================================================
 FILE MANAGEMENT SYSTEM (FMS)
 Module      : Attachment Repository
 File        : attachment-repository.js
 Version     : 2.1
 Developer   : Lekha Technologies
 Description : Storage upload with Firestore inline fallback
==========================================================*/

"use strict";

class AttachmentRepository {

    constructor() {
        this.collectionName = "attachments";
        this.inlineLimitBytes = 700 * 1024;
    }

    getDB() {
        if (window.db) return window.db;
        if (typeof db !== "undefined") return db;
        if (typeof firebase !== "undefined" && firebase.firestore) return firebase.firestore();
        return null;
    }

    getStorage() {
        try {
            if (window.storage) return window.storage;
            if (typeof storage !== "undefined" && storage) return storage;
            if (typeof firebase !== "undefined" && typeof firebase.storage === "function") return firebase.storage();
        } catch (error) {
            console.warn("Firebase Storage not ready:", error);
        }
        return null;
    }

    collection() {
        const database = this.getDB();
        if (!database || typeof database.collection !== "function") {
            throw new Error("Firestore is not ready. Please refresh the page and try again.");
        }
        return database.collection(this.collectionName);
    }

    success(data) { return { success: true, data }; }

    failure(error) {
        return { success: false, message: error?.message || String(error || "Unknown attachment error") };
    }

    safeName(name) {
        return String(name || "file").replace(/[^\w.\-() ]+/g, "_").replace(/\s+/g, "_");
    }

    serverTimestamp() {
        try { return firebase.firestore.FieldValue.serverTimestamp(); }
        catch (_error) { return new Date(); }
    }

    readAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(reader.error || new Error("Unable to read attachment file."));
            reader.readAsDataURL(file);
        });
    }

    async buildInlineAttachment(file) {
        if ((file.size || 0) > this.inlineLimitBytes) {
            throw new Error(
                "Firebase Storage upload failed and the selected file is too large for Firestore fallback. " +
                "Deploy the updated storage.rules from this ZIP, then try again."
            );
        }
        return {
            downloadURL: await this.readAsDataURL(file),
            storagePath: "",
            storageProvider: "firestore-inline"
        };
    }

    async uploadAttachment(grievanceId, file, meta = {}) {
        try {
            if (!grievanceId) throw new Error("Save the record first, then upload attachments.");
            if (!file) throw new Error("Please select a file.");

            const database = this.getDB();
            if (!database) throw new Error("Firestore is not ready. Please refresh the page and try again.");

            const fileName = Date.now() + "_" + this.safeName(file.name);
            const storagePath = "attachments/cpgrams/" + grievanceId + "/" + fileName;
            let uploadInfo = null;
            const storageRef = this.getStorage();

            if (storageRef) {
                try {
                    const ref = storageRef.ref(storagePath);
                    const snapshot = await ref.put(file);
                    const downloadURL = await snapshot.ref.getDownloadURL();
                    uploadInfo = { downloadURL, storagePath, storageProvider: "firebase-storage" };
                } catch (storageError) {
                    console.warn("Storage upload failed. Trying Firestore inline fallback.", storageError);
                    uploadInfo = await this.buildInlineAttachment(file);
                    uploadInfo.storageError = storageError?.message || String(storageError);
                }
            } else {
                uploadInfo = await this.buildInlineAttachment(file);
            }

            const attachment = {
                grievanceId,
                recordId: grievanceId,
                module: meta.module || "cpgrams",
                fileRole: meta.fileRole || meta.type || "Attachment",
                sourceField: meta.sourceField || "fileAttachment",
                fileName: file.name,
                fileType: file.type || "application/octet-stream",
                fileSize: file.size || 0,
                ...uploadInfo,
                uploadedOn: this.serverTimestamp(),
                active: true
            };

            const doc = await this.collection().add(attachment);
            return this.success({ id: doc.id, ...attachment });
        } catch (error) {
            console.error("Attachment upload failed:", error);
            return this.failure(error);
        }
    }

    async getAttachments(grievanceId) {
        try {
            if (!grievanceId) return this.success([]);
            const snapshot = await this.collection().where("grievanceId", "==", grievanceId).get();
            const records = [];
            snapshot.forEach(doc => {
                const data = doc.data() || {};
                if (data.active === false) return;
                records.push({ id: doc.id, ...data });
            });
            return this.success(records);
        } catch (error) {
            console.error("Unable to load attachments:", error);
            return this.failure(error);
        }
    }

    async getAttachment(id) {
        try {
            const doc = await this.collection().doc(id).get();
            if (!doc.exists) throw new Error("Attachment not found.");
            return this.success({ id: doc.id, ...doc.data() });
        } catch (error) {
            console.error(error);
            return this.failure(error);
        }
    }

    async deleteAttachment(id) {
        try {
            const docRef = this.collection().doc(id);
            const doc = await docRef.get();
            if (!doc.exists) throw new Error("Attachment not found.");
            const data = doc.data() || {};
            const storageRef = this.getStorage();
            if (storageRef && data.storagePath) {
                try { await storageRef.ref(data.storagePath).delete(); }
                catch (e) { console.warn("Storage file delete warning:", e); }
            }
            await docRef.update({ active: false, deletedOn: this.serverTimestamp(), updatedOn: this.serverTimestamp() });
            return this.success(true);
        } catch (error) {
            console.error(error);
            return this.failure(error);
        }
    }
}

const attachmentRepository = new AttachmentRepository();
window.uploadAttachmentRepository = (grievanceId, file, meta) => attachmentRepository.uploadAttachment(grievanceId, file, meta);
window.getAttachmentsRepository = grievanceId => attachmentRepository.getAttachments(grievanceId);
window.getAttachmentRepository = id => attachmentRepository.getAttachment(id);
window.deleteAttachmentRepository = id => attachmentRepository.deleteAttachment(id);
