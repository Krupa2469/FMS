/* =========================================================
   FMS Firebase CRUD Service
   Version 1.5.4
   Purpose: one reliable create/read/update/delete path for all FMS modules.
   Notes:
   - Uses Firestore REST first for writes to avoid browser WebChannel/QUIC stalls.
   - Uses SDK with timeout + REST fallback for reads.
========================================================= */
(function(window){
  "use strict";

  const DEFAULT_TIMEOUT_MS = 12000;
  const WRITE_TIMEOUT_MS = 20000;
  const PROJECT_ID = "crd-tg-fms-2026";
  const DATABASE_ID = "(default)";

  function hasCollection(database){ return !!database && typeof database.collection === "function"; }

  function appOptions(){
    try { if (window.firebase && firebase.apps && firebase.apps.length) return firebase.app().options || {}; } catch (_e) {}
    return {};
  }

  function apiKey(){ return appOptions().apiKey || "AIzaSyArKYQAjXUuEHk6a06SVpPwqn19Gftf4Pw"; }
  function projectId(){ return appOptions().projectId || PROJECT_ID; }

  function restRoot(){
    return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId())}/databases/${encodeURIComponent(DATABASE_ID)}/documents`;
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
      if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length && typeof firebase.storage === "function") return firebase.storage();
    } catch (_e) {}
    return null;
  }

  function db(){ return immediateDb(); }

  function timeoutPromise(promise, ms, label){
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label || "Firebase operation"} timed out. Please check internet connection and try again.`)), ms || DEFAULT_TIMEOUT_MS);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

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

  function serverTimestamp(){ return new Date(); }

  function cleanForFirestore(value){
    if (value === undefined) return undefined;
    if (value instanceof File || value instanceof Blob) return undefined;
    if (Array.isArray(value)) return value.map(cleanForFirestore).filter(v => v !== undefined);
    if (value && typeof value === "object") {
      if (typeof value.toDate === "function") return value;
      // Drop Firestore sentinel objects from REST payloads; use real Date in this service.
      if (String(value.constructor && value.constructor.name || "").includes("FieldValue")) return undefined;
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

  function isTimestampLike(v){ return !!v && typeof v === "object" && (v.seconds != null || v._seconds != null); }

  function toRestValue(value){
    if (value === undefined) return undefined;
    if (value === null) return { nullValue: null };
    if (value instanceof Date) return { timestampValue: value.toISOString() };
    if (isTimestampLike(value)) return { timestampValue: new Date(Number(value.seconds ?? value._seconds) * 1000).toISOString() };
    if (typeof value === "boolean") return { booleanValue: value };
    if (typeof value === "number") {
      if (!Number.isFinite(value)) return { stringValue: String(value) };
      if (Number.isInteger(value)) return { integerValue: String(value) };
      return { doubleValue: value };
    }
    if (typeof value === "string") return { stringValue: value };
    if (Array.isArray(value)) {
      return { arrayValue: { values: value.map(toRestValue).filter(Boolean) } };
    }
    if (value && typeof value === "object") {
      if (value instanceof File || value instanceof Blob) return undefined;
      const fields = {};
      Object.keys(value).forEach(k => {
        const converted = toRestValue(value[k]);
        if (converted !== undefined) fields[k] = converted;
      });
      return { mapValue: { fields } };
    }
    return { stringValue: String(value) };
  }

  function toRestFields(data){
    const fields = {};
    const source = cleanForFirestore(data || {}) || {};
    Object.keys(source).forEach(key => {
      const converted = toRestValue(source[key]);
      if (converted !== undefined) fields[key] = converted;
    });
    return fields;
  }

  function fromRestValue(v){
    if (!v || typeof v !== "object") return undefined;
    if ("stringValue" in v) return v.stringValue;
    if ("integerValue" in v) return Number(v.integerValue);
    if ("doubleValue" in v) return Number(v.doubleValue);
    if ("booleanValue" in v) return !!v.booleanValue;
    if ("nullValue" in v) return null;
    if ("timestampValue" in v) return v.timestampValue;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromRestValue);
    if ("mapValue" in v) return fromRestFields(v.mapValue.fields || {});
    if ("geoPointValue" in v) return v.geoPointValue;
    return undefined;
  }

  function fromRestFields(fields){
    const out = {};
    Object.keys(fields || {}).forEach(key => { out[key] = fromRestValue(fields[key]); });
    return out;
  }

  function idFromName(name){ return String(name || "").split("/").pop() || ""; }

  function restUrl(path, params){
    const url = new URL(`${restRoot()}${path ? "/" + path.split("/").map(encodeURIComponent).join("/") : ""}`);
    url.searchParams.set("key", apiKey());
    Object.entries(params || {}).forEach(([k,v]) => {
      if (Array.isArray(v)) v.forEach(item => url.searchParams.append(k, item));
      else if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
    return url.toString();
  }

  async function restFetch(url, options, label){
    const response = await timeoutPromise(fetch(url, {
      method: options && options.method || "GET",
      headers: { "Content-Type": "application/json", ...(options && options.headers || {}) },
      body: options && options.body ? JSON.stringify(options.body) : undefined
    }), options && options.timeoutMs || WRITE_TIMEOUT_MS, label || "Firestore REST request");
    let json = null;
    const text = await response.text();
    try { json = text ? JSON.parse(text) : null; } catch (_e) { json = null; }
    if (!response.ok) {
      const msg = json?.error?.message || text || `${response.status} ${response.statusText}`;
      throw new Error(msg);
    }
    return json;
  }

  async function restCreate(collectionName, data){
    const payload = { fields: toRestFields(data) };
    const json = await restFetch(restUrl(collectionName), {method:"POST", body: payload}, `Save ${collectionName}`);
    return {id:idFromName(json.name), ...fromRestFields(json.fields || {})};
  }

  async function restSet(collectionName, documentId, data, merge){
    const fields = toRestFields(data);
    const masks = merge ? Object.keys(fields) : [];
    const params = merge ? { "updateMask.fieldPaths": masks } : {};
    const json = await restFetch(restUrl(`${collectionName}/${documentId}`, params), {method:"PATCH", body:{fields}}, `Update ${collectionName}`);
    return {id:idFromName(json.name), ...fromRestFields(json.fields || {})};
  }

  async function restGet(collectionName, documentId){
    const json = await restFetch(restUrl(`${collectionName}/${documentId}`), {method:"GET", timeoutMs: DEFAULT_TIMEOUT_MS}, `Load ${collectionName}`);
    return {id:idFromName(json.name), ...fromRestFields(json.fields || {})};
  }

  async function restList(collectionName, options){
    const rows = [];
    let pageToken = "";
    do {
      const params = {pageSize: 1000};
      if (pageToken) params.pageToken = pageToken;
      const json = await restFetch(restUrl(collectionName, params), {method:"GET", timeoutMs: DEFAULT_TIMEOUT_MS}, `List ${collectionName}`);
      (json.documents || []).forEach(doc => rows.push({id:idFromName(doc.name), ...fromRestFields(doc.fields || {})}));
      pageToken = json.nextPageToken || "";
    } while (pageToken);
    if (!options || options.activeOnly !== false) return rows.filter(row => row.active !== false);
    return rows;
  }

  async function restDelete(collectionName, documentId){
    await restFetch(restUrl(`${collectionName}/${documentId}`), {method:"DELETE"}, `Delete ${collectionName}`);
    return {id:documentId};
  }

  async function create(collectionName, data, options){
    if (!collectionName) return failure(new Error("Collection name is required."));
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

    // Prefer the Firebase SDK now that the app forces long-polling.
    // This avoids REST/QUIC fetch stalls seen in Edge/Chrome on some networks.
    try {
      const database = await waitForDb();
      const ref = await timeoutPromise(database.collection(collectionName).add(payload), WRITE_TIMEOUT_MS, `Save ${collectionName}`);
      return success({id:ref.id, ...payload}, "Record saved successfully.");
    } catch (sdkError) {
      console.warn("FMSCrud.create SDK failed; trying REST fallback", collectionName, sdkError);
      try {
        const row = await restCreate(collectionName, payload);
        return success(row, "Record saved successfully.");
      } catch (restError) {
        console.error("FMSCrud.create failed", collectionName, restError);
        return failure(restError);
      }
    }
  }

  async function update(collectionName, documentId, data, options){
    if (!collectionName) return failure(new Error("Collection name is required."));
    if (!documentId) return failure(new Error("Document id is required for update."));
    const now = serverTimestamp();
    const payload = cleanForFirestore({...(data || {}), updatedAt:now, updatedOn:now, ...(options && options.extra ? options.extra : {})});
    try {
      const database = await waitForDb();
      await timeoutPromise(database.collection(collectionName).doc(documentId).set(payload, {merge:true}), WRITE_TIMEOUT_MS, `Update ${collectionName}`);
      return success({id:documentId, ...payload}, "Record updated successfully.");
    } catch (sdkError) {
      console.warn("FMSCrud.update SDK failed; trying REST fallback", collectionName, documentId, sdkError);
      try {
        const row = await restSet(collectionName, documentId, payload, true);
        return success(row, "Record updated successfully.");
      } catch (restError) {
        console.error("FMSCrud.update failed", collectionName, documentId, restError);
        return failure(restError);
      }
    }
  }

  async function softDelete(collectionName, documentId, extra){
    if (!collectionName) return failure(new Error("Collection name is required."));
    if (!documentId) return failure(new Error("Document id is required for delete."));
    const now = serverTimestamp();
    const payload = cleanForFirestore({active:false, deletedAt:now, deletedOn:now, updatedAt:now, updatedOn:now, ...(extra || {})});
    try {
      const database = await waitForDb();
      await timeoutPromise(database.collection(collectionName).doc(documentId).set(payload, {merge:true}), WRITE_TIMEOUT_MS, `Delete ${collectionName}`);
      return success({id:documentId}, "Record deleted successfully.");
    } catch (sdkError) {
      console.warn("FMSCrud.softDelete SDK failed; trying REST fallback", collectionName, documentId, sdkError);
      try {
        const row = await restSet(collectionName, documentId, payload, true);
        return success(row, "Record deleted successfully.");
      } catch (restError) {
        console.error("FMSCrud.softDelete failed", collectionName, documentId, restError);
        return failure(restError);
      }
    }
  }

  async function hardDelete(collectionName, documentId){
    try {
      if (!collectionName) throw new Error("Collection name is required.");
      if (!documentId) throw new Error("Document id is required for delete.");
      await restDelete(collectionName, documentId);
      return success({id:documentId}, "Record deleted successfully.");
    } catch (restError) {
      console.warn("FMSCrud.hardDelete REST failed; trying SDK fallback", collectionName, documentId, restError);
      try {
        const database = await waitForDb();
        await timeoutPromise(database.collection(collectionName).doc(documentId).delete(), WRITE_TIMEOUT_MS, `Delete ${collectionName}`);
        return success({id:documentId}, "Record deleted successfully.");
      } catch (error) {
        console.error("FMSCrud.hardDelete failed", collectionName, documentId, error);
        return failure(error);
      }
    }
  }

  async function get(collectionName, documentId){
    try {
      if (!collectionName) throw new Error("Collection name is required.");
      if (!documentId) throw new Error("Document id is required.");
      try {
        const row = await restGet(collectionName, documentId);
        return success(row);
      } catch (restError) {
        const database = await waitForDb();
        const snap = await timeoutPromise(database.collection(collectionName).doc(documentId).get(), DEFAULT_TIMEOUT_MS, `Load ${collectionName}`);
        if (!snap.exists) throw new Error("Record not found.");
        return success({id:snap.id, ...snap.data()});
      }
    } catch (error) {
      console.error("FMSCrud.get failed", collectionName, documentId, error);
      return failure(error);
    }
  }

  async function list(collectionName, options){
    try {
      if (!collectionName) throw new Error("Collection name is required.");
      try {
        const database = await waitForDb();
        const getOptions = options && (options.forceServer || options.source === "server") ? {source:"server"} : undefined;
        const snap = await timeoutPromise(database.collection(collectionName).get(getOptions), DEFAULT_TIMEOUT_MS, `List ${collectionName}`);
        let rows = snap.docs.map(doc => ({id:doc.id, ...doc.data()}));
        if (!options || options.activeOnly !== false) rows = rows.filter(row => row.active !== false);
        return success(rows);
      } catch (sdkError) {
        console.warn("FMSCrud.list SDK failed; trying REST fallback", collectionName, sdkError);
        return success(await restList(collectionName, options));
      }
    } catch (error) {
      console.error("FMSCrud.list failed", collectionName, error);
      return failure(error);
    }
  }

  function normalizeKey(value){ return String(value ?? "").trim().toUpperCase().replace(/\s+/g, ""); }

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

  async function findFirstByNormalized(collectionName, fieldNames, value, excludeId){
    try {
      const wanted = normalizeKey(value);
      if (!wanted) return success(null);
      const listResult = await list(collectionName, {activeOnly:true});
      if (!listResult.success) return listResult;
      const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
      const found = (listResult.data || []).find(row => {
        if (excludeId && row.id === excludeId) return false;
        return fields.some(field => normalizeKey(row[field]) === wanted || normalizeKey(row[field + "Normalized"]) === wanted);
      }) || null;
      return success(found);
    } catch (error) {
      console.error("FMSCrud.findFirstByNormalized failed", collectionName, error);
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

  window.FMSCrud = {db, storage, waitForDb, serverTimestamp, cleanForFirestore, create, update, softDelete, hardDelete, get, list, duplicateExists, findFirstByNormalized, normalizeKey, showResultMessage, uploadFile, timeoutPromise};
})(window);
