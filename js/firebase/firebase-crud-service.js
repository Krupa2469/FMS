/* =========================================================
   FMS Firebase CRUD Service
   Version 1.5.1
   Purpose: one reliable create/read/update/delete path for all FMS modules
========================================================= */
(function(window){
  "use strict";

  const DEFAULT_TIMEOUT_MS = 15000;

  function hasCollection(database){
    return !!database && typeof database.collection === "function";
  }

  function immediateDb(){
    try { if (hasCollection(window.db)) return window.db; } catch (_e) {}
    try { if (hasCollection(window.fmsFirebase && window.fmsFirebase.db)) return window.fmsFirebase.db; } catch (_e) {}
    try { if (typeof db !== "undefined" && hasCollection(db)) return db; } catch (_e) {}
    try {
      if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length && typeof firebase.firestore === "function") {
        const database = firebase.firestore();
        if (hasCollection(database)) return database;
      }
    } catch (_e) {}
    return null;
  }

  function storage(){
    try { if (window.storage && typeof window.storage.ref === "function") return window.storage; } catch (_e) {}
    try { if (window.fmsFirebase && window.fmsFirebase.storage && typeof window.fmsFirebase.storage.ref === "function") return window.fmsFirebase.storage; } catch (_e) {}
    try { if (typeof storage !== "undefined" && storage && typeof storage.ref === "function") return storage; } catch (_e) {}
    try {
      if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length && typeof firebase.storage === "function") {
        return firebase.storage();
      }
    } catch (_e) {}
    return null;
  }

  function db(){ return immediateDb(); }

  function waitForDb(timeoutMs){
    const ready = immediateDb();
    if (ready) return Promise.resolve(ready);

    return new Promise((resolve, reject) => {
      let done = false;
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        window.removeEventListener("fmsFirebaseReady", onReady);
        const finalDb = immediateDb();
        if (finalDb) resolve(finalDb);
        else reject(new Error("Firestore is not ready. Please hard refresh the page and try again."));
      }, timeoutMs || DEFAULT_TIMEOUT_MS);

      function onReady(){
        if (done) return;
        const database = immediateDb();
        if (!database) return;
        done = true;
        clearTimeout(timer);
        window.removeEventListener("fmsFirebaseReady", onReady);
        resolve(database);
      }

      window.addEventListener("fmsFirebaseReady", onReady);
      setTimeout(onReady, 250);
      setTimeout(onReady, 1000);
      setTimeout(onReady, 2500);
    });
  }

  function serverTimestamp(){
    try { return firebase.firestore.FieldValue.serverTimestamp(); }
    catch (_e) { return new Date(); }
  }

  function cleanForFirestore(value){
    if (value === undefined) return undefined;
    if (value instanceof File || value instanceof Blob) return undefined;
    if (Array.isArray(value)) {
      return value.map(cleanForFirestore).filter(v => v !== undefined);
    }
    if (value && typeof value === "object") {
      if (typeof value.toDate === "function") return value;
      const out = {};
      Object.keys(value).forEach(key => {
        const cleaned = cleanForFirestore(value[key]);
        if (cleaned !== undefined) out[key] = cleaned;
      });
      return out;
    }
    return value;
  }

  function success(data, message){ return {success:true, data:data ?? null, id:data && data.id, message:message || ""}; }
  function failure(error){ return {success:false, data:null, message:error && error.message ? error.message : String(error || "Unknown Firebase error")}; }

  async function create(collectionName, data, options){
    try {
      if (!collectionName) throw new Error("Collection name is required.");
      const database = await waitForDb();
      const now = serverTimestamp();
      const payload = cleanForFirestore({
        ...(data || {}),
        active: (data && data.active === false) ? false : true,
        createdAt: (data && (data.createdAt || data.createdOn)) || now,
        createdOn: (data && (data.createdOn || data.createdAt)) || now,
        updatedAt: now,
        updatedOn: now,
        ...(options && options.extra ? options.extra : {})
      });
      const ref = await database.collection(collectionName).add(payload);
      return success({id:ref.id, ...payload}, "Record saved successfully.");
    } catch (error) {
      console.error("FMSCrud.create failed", collectionName, error);
      return failure(error);
    }
  }

  async function update(collectionName, documentId, data, options){
    try {
      if (!collectionName) throw new Error("Collection name is required.");
      if (!documentId) throw new Error("Document id is required for update.");
      const database = await waitForDb();
      const now = serverTimestamp();
      const payload = cleanForFirestore({
        ...(data || {}),
        updatedAt: now,
        updatedOn: now,
        ...(options && options.extra ? options.extra : {})
      });
      await database.collection(collectionName).doc(documentId).set(payload, {merge:true});
      return success({id:documentId, ...payload}, "Record updated successfully.");
    } catch (error) {
      console.error("FMSCrud.update failed", collectionName, documentId, error);
      return failure(error);
    }
  }

  async function softDelete(collectionName, documentId, extra){
    try {
      if (!collectionName) throw new Error("Collection name is required.");
      if (!documentId) throw new Error("Document id is required for delete.");
      const database = await waitForDb();
      const now = serverTimestamp();
      await database.collection(collectionName).doc(documentId).set(cleanForFirestore({
        active:false,
        deletedAt:now,
        deletedOn:now,
        updatedAt:now,
        updatedOn:now,
        ...(extra || {})
      }), {merge:true});
      return success({id:documentId}, "Record deleted successfully.");
    } catch (error) {
      console.error("FMSCrud.softDelete failed", collectionName, documentId, error);
      return failure(error);
    }
  }

  async function hardDelete(collectionName, documentId){
    try {
      if (!collectionName) throw new Error("Collection name is required.");
      if (!documentId) throw new Error("Document id is required for delete.");
      const database = await waitForDb();
      await database.collection(collectionName).doc(documentId).delete();
      return success({id:documentId}, "Record deleted successfully.");
    } catch (error) {
      console.error("FMSCrud.hardDelete failed", collectionName, documentId, error);
      return failure(error);
    }
  }

  async function get(collectionName, documentId){
    try {
      if (!collectionName) throw new Error("Collection name is required.");
      if (!documentId) throw new Error("Document id is required.");
      const database = await waitForDb();
      const snap = await database.collection(collectionName).doc(documentId).get();
      if (!snap.exists) throw new Error("Record not found.");
      return success({id:snap.id, ...snap.data()});
    } catch (error) {
      console.error("FMSCrud.get failed", collectionName, documentId, error);
      return failure(error);
    }
  }

  async function list(collectionName, options){
    try {
      if (!collectionName) throw new Error("Collection name is required.");
      const database = await waitForDb();
      const snap = await database.collection(collectionName).get();
      let rows = snap.docs.map(doc => ({id:doc.id, ...doc.data()}));
      if (!options || options.activeOnly !== false) rows = rows.filter(row => row.active !== false);
      return success(rows);
    } catch (error) {
      console.error("FMSCrud.list failed", collectionName, error);
      return failure(error);
    }
  }

  function normalizeKey(value){ return String(value ?? "").trim().toUpperCase().replace(/\s+/g,""); }

  async function duplicateExists(collectionName, fieldNames, value, excludeId){
    try {
      const wanted = normalizeKey(value);
      if (!wanted) return success(false);
      const listResult = await list(collectionName, {activeOnly:true});
      if (!listResult.success) return listResult;
      const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
      const exists = (listResult.data || []).some(row => {
        if (excludeId && row.id === excludeId) return false;
        return fields.some(field => normalizeKey(row[field]) === wanted || normalizeKey(row[field + "Normalized"]) === wanted);
      });
      return success(exists);
    } catch (error) {
      console.error("FMSCrud.duplicateExists failed", collectionName, error);
      return failure(error);
    }
  }

  function showResultMessage(result, fallback, type){
    const message = (result && (result.message || result.error)) || fallback || "Operation completed.";
    const finalType = type || (result && result.success ? "success" : "danger");
    if (typeof window.showMessage === "function") window.showMessage(message, finalType);
    else alert(message);
  }

  async function uploadFile(moduleName, recordId, file, meta){
    if (window.FMSAttachmentService && typeof window.FMSAttachmentService.upload === "function") {
      return await window.FMSAttachmentService.upload(moduleName, recordId, file, meta || {});
    }
    throw new Error("Attachment service is not loaded.");
  }

  window.FMSCrud = {db, storage, waitForDb, serverTimestamp, cleanForFirestore, create, update, softDelete, hardDelete, get, list, duplicateExists, normalizeKey, showResultMessage, uploadFile};
})(window);
