"use strict";

/* ============================================================
   GRIEVANCES REGISTER CONTROLLER - v1.3.2
   Reliable Firestore loading with consistent Grievance Type + FY filters.
   The register is intentionally self-contained and does not depend on the
   older repository/search helper functions that were causing blank grids.
============================================================ */
(function(window, document) {
  const COLLECTION = "cpgrams";
  const PAGE_SIZE = 25;
  const TYPES = [
    "CPGRAMS", "Prajavani", "Public Grievances", "Direct Complaints",
    "LAQ", "LCQ", "Court Cases", "VIP References", "CMO References",
    "PMO References", "Audit Paras", "Vigilance Cases"
  ];

  const TYPE_KEYS = new Map([
    ["grievances", "cpgrams"], ["grievance", "cpgrams"], ["cpgrams", "cpgrams"], ["cpgram", "cpgrams"], ["cpgrams portal", "cpgrams"],
    ["prajavani", "prajavani"], ["public grievances", "public grievances"], ["public grievance", "public grievances"],
    ["direct complaints", "direct complaints"], ["direct complaint", "direct complaints"],
    ["laq", "laq"], ["lcq", "lcq"],
    ["court cases", "court cases"], ["court case", "court cases"],
    ["vip references", "vip references"], ["vip reference", "vip references"],
    ["cmo references", "cmo references"], ["cmo reference", "cmo references"],
    ["pmo references", "pmo references"], ["pmo reference", "pmo references"],
    ["audit paras", "audit paras"], ["audit para", "audit paras"],
    ["vigilance cases", "vigilance cases"], ["vigilance case", "vigilance cases"]
  ]);

  let allRecords = [];
  let filteredRecords = [];
  let currentPage = 1;
  let lastBaseCount = 0;

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>\"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));

  function showMessage(type, message) {
    const area = $("messageArea");
    if (area) {
      area.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
      return;
    }
    console[type === "danger" ? "error" : "log"](message);
  }

  function showLoading() {
    $("loadingOverlay")?.classList.remove("d-none");
  }

  function hideLoading() {
    $("loadingOverlay")?.classList.add("d-none");
  }

  function getDb() {
    if (window.db) return window.db;
    if (window.fmsFirebase?.db) return window.fmsFirebase.db;
    try {
      if (window.firebase?.apps?.length && typeof window.firebase.firestore === "function") return window.firebase.firestore();
    } catch (_e) {}
    return null;
  }

  function waitForDb() {
    return new Promise(resolve => {
      const existing = getDb();
      if (existing) return resolve(existing);
      let attempts = 0;
      const done = db => {
        window.removeEventListener("fmsFirebaseReady", onReady);
        clearInterval(timer);
        resolve(db || null);
      };
      const onReady = () => done(getDb());
      window.addEventListener("fmsFirebaseReady", onReady, { once: true });
      const timer = setInterval(() => {
        const db = getDb();
        if (db) return done(db);
        attempts += 1;
        if (attempts >= 40) done(null);
      }, 250);
    });
  }

  function normalizeType(value) {
    let text = String(value || "").trim().toLowerCase();
    text = text.replace(/[_-]+/g, " ").replace(/\s+/g, " ")
      .replace(/\bcomplaint\b/g, "complaints")
      .replace(/\breference\b/g, "references")
      .replace(/\bpara\b/g, "paras");
    return TYPE_KEYS.get(text) || "";
  }

  function displayTypeFromKey(key) {
    if (key === "cpgrams") return "CPGRAMS";
    if (key === "laq") return "LAQ";
    if (key === "lcq") return "LCQ";
    return TYPES.find(type => normalizeType(type) === key) || "CPGRAMS";
  }

  function rowType(record) {
    const qType = String(record?.questionType || "").trim().toUpperCase();
    if (qType === "LAQ") return "laq";
    if (qType === "LCQ") return "lcq";

    // Only fields that represent module/source type may decide the Grievance Type.
    // Category values like Roads, Drinking Water, Housing etc. are NOT grievance types;
    // older CPGRAMS records with only category values must still appear under CPGRAMS.
    const typeFields = ["grievanceType", "referenceType", "type", "sourceType", "grievanceSource", "source"];
    for (const field of typeFields) {
      const normalized = normalizeType(record?.[field]);
      if (normalized) return normalized;
    }
    return "cpgrams";
  }

  function parseDate(value) {
    if (!value) return null;
    if (value && typeof value.toDate === "function") return value.toDate();
    if (value && value.seconds != null) return new Date(Number(value.seconds) * 1000);
    if (value && value._seconds != null) return new Date(Number(value._seconds) * 1000);
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
    const text = String(value).trim();
    let match = text.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})$/);
    if (match) {
      const year = match[3].length === 2 ? Number("20" + match[3]) : Number(match[3]);
      return new Date(year, Number(match[2]) - 1, Number(match[1]));
    }
    match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function fyStartYear(date = new Date()) {
    return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  }

  function fyLabel(startYear) {
    return `${startYear}-${String(startYear + 1).slice(-2)}`;
  }

  function currentFY() {
    return window.FMSRecordPolicy?.currentFY?.() || window.FMSFY?.getCurrentFY?.() || fyLabel(fyStartYear(new Date()));
  }

  function recordDate(record) {
    const fields = [
      "dateReceived", "questionReceivedDate", "orgReceivedDate", "receivedDate",
      "dateArised", "diaryDate", "dairyDate", "applicationDate", "date"
    ];
    for (const field of fields) {
      const date = parseDate(record?.[field]);
      if (date) return date;
    }
    return null;
  }

  function recordFY(record) {
    const date = recordDate(record);
    return date ? fyLabel(fyStartYear(date)) : "";
  }

  function selectedType() {
    const fromSelect = $("searchGrievanceType")?.value;
    const params = new URLSearchParams(location.search);
    const requested = params.get("grievanceType") || params.get("category");
    const type = fromSelect || requested || "CPGRAMS";
    return displayTypeFromKey(normalizeType(type) || "cpgrams");
  }

  function selectedTypeKey() {
    return normalizeType(selectedType()) || "cpgrams";
  }

  function selectedFY() {
    return $("financialYear")?.value || new URLSearchParams(location.search).get("fy") || currentFY();
  }

  function first(record, fields) {
    for (const field of fields) {
      const value = record?.[field];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return "";
  }

  function statusText(record) {
    return String(first(record, ["officeStatus", "currentStatus", "finalStatus", "statusOfFile", "questionFileStatus", "presentStatus", "status"]) || "Pending").trim();
  }

  function statusKey(record) {
    return statusText(record).toLowerCase();
  }

  function isClosed(record) {
    return /closed|disposed|reply obtained|despatched|completed|reply furnished|final reply|replied/.test(statusKey(record));
  }

  function isCirculation(record) {
    return /under circulation|circulation/.test([
      record?.officeStatus, record?.statusOfFile, record?.currentStatus,
      record?.presentStatus, record?.questionFileStatus, record?.status
    ].map(value => String(value || "").toLowerCase()).join(" | "));
  }

  function dueDate(record) {
    return parseDate(record?.dueDate || record?.questionDueDate || record?.atrDueDate);
  }

  function isOverdue(record) {
    if (isClosed(record)) return false;
    const due = dueDate(record);
    if (!due) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }

  function isDueToday(record) {
    if (isClosed(record)) return false;
    const due = dueDate(record);
    if (!due) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  }

  const CPGRAMS_SECTION_1 = [
    ["grievanceNumber", "Grievance Number"], ["dateReceived", "Date Received"], ["dueDate", "Due Date"],
    ["subject", "Subject"], ["category", "Category"], ["grievanceDescription", "Grievance Description"],
    ["grievanceDocument", "Upload Grievance Document"], ["natureOfGrievance", "Nature of Grievance"],
    ["priorityClassification", "Priority Classification"], ["attachmentCount", "Number of Attachments"]
  ];
  const BASIC_SECTION_1 = [
    ["dateReceived", "Date Received"], ["dueDate", "Due Date"], ["subject", "Subject"],
    ["grievanceDescription", "Grievance Description"], ["grievanceDocument", "Upload Grievance Document"]
  ];
  const COMMON_SECTION_2 = [
    ["complainantName", "Complainant Name"], ["mobileNumber", "Mobile Number"], ["gender", "Gender"],
    ["district", "District"], ["mandal", "Mandal"], ["village", "Village"],
    ["address", "Address"], ["preferredContact", "Preferred Contact"]
  ];
  const COMMON_SECTION_3 = [
    ["fileNumber", "File Number"], ["dateArised", "Date Arised"], ["officeCommunicationType", "Type of communication"],
    ["officeLetterAddressedTo", "Letter addressed to"], ["officeReplySection", "Reply obtained from"],
    ["officeStatus", "Status of file"], ["assignedOfficer", "Assigned Officer"], ["section", "Concerned Section"],
    ["fileLocation", "File Location"], ["currentStatus", "Current File Status"], ["finalStatus", "Final Status"],
    ["atrReceived", "ATR Received"], ["atrDate", "ATR Date"], ["atrDueDate", "ATR Due Date"],
    ["disposalDate", "Disposal Date"], ["fileClosed", "File Closed"], ["remarks", "Remarks"]
  ];
  const QUESTION_COLUMNS = [
    ["questionSerialNo", "Question No."], ["questionType", "Question Type"], ["questionReceivedDate", "Received Date"],
    ["questionConcernedSection", "Concerned Section"], ["question", "Question"], ["answer", "Answer"],
    ["answerFurnishedBy", "Answer furnished by"], ["answerFurnishedTo", "Answer furnished to"], ["answerFurnishedDate", "Answer furnished Date"],
    ["questionCommunicationType", "Communication Type"], ["questionFileNumber", "File No."],
    ["questionCommunicationDate", "Communication Date"], ["questionFileStatus", "File Status"], ["attachments", "Upload Document"]
  ];

  function columnsForType() {
    const key = selectedTypeKey();
    if (key === "laq" || key === "lcq") {
      const label = `${displayTypeFromKey(key)} No.`;
      return QUESTION_COLUMNS.map(column => column[0] === "questionSerialNo" ? [column[0], label] : column);
    }
    const section1 = key === "cpgrams" ? CPGRAMS_SECTION_1 : BASIC_SECTION_1;
    return section1.concat(COMMON_SECTION_2, COMMON_SECTION_3, [["attachments", "Upload Document"]]);
  }

  function displayValue(record, key) {
    let value = record?.[key];
    if (key === "grievanceNumber" && !value) value = record?.registrationNumber || record?.grievanceNo || "";
    if (key === "dateReceived" && !value) value = record?.orgReceivedDate || record?.receivedDate || record?.questionReceivedDate || "";
    if (key === "grievanceDocument") value = record?.grievanceDocumentName || record?.fileDocumentName || record?.fileDocument || record?.grievanceDocument || "";
    if (key === "attachments") {
      const attachments = record?.attachments;
      if (Array.isArray(attachments)) return attachments.map(item => item?.name || item?.fileName || item?.filename || "Document").join(", ");
      return record?.fileAttachmentName || record?.attachmentName || record?.attachmentCount || "";
    }
    if (["district", "mandal", "village"].includes(key) && !value) value = record?.[key + "Manual"] || "";
    if (key === "dueDate" && !value) value = record?.atrDueDate || "";
    if ((key === "subject" || key === "grievanceDescription") && !value) value = record?.question || record?.description || "";
    return value ?? "";
  }

  function populateTypeDropdown() {
    const select = $("searchGrievanceType");
    if (!select) return;
    const params = new URLSearchParams(location.search);
    const requested = params.get("grievanceType") || params.get("category") || select.value || "CPGRAMS";
    const mapped = displayTypeFromKey(normalizeType(requested) || "cpgrams");
    select.innerHTML = TYPES.map(type => `<option value="${esc(type)}">${esc(type)}</option>`).join("");
    select.value = TYPES.includes(mapped) ? mapped : "CPGRAMS";
  }

  function populateFinancialYearDropdown() {
    const select = $("financialYear");
    if (!select) return;
    const params = new URLSearchParams(location.search);
    const preferred = params.get("fy") || select.value || currentFY();
    const years = new Set();
    const start = fyStartYear(new Date());
    for (let year = start; year >= 2014; year--) years.add(fyLabel(year));
    allRecords.forEach(record => {
      const fy = recordFY(record);
      if (fy) years.add(fy);
    });
    const sorted = Array.from(years).sort((a, b) => Number(b.slice(0, 4)) - Number(a.slice(0, 4)));
    select.innerHTML = sorted.map(fy => `<option value="${esc(fy)}">${esc(fy)}</option>`).join("");
    select.value = sorted.includes(preferred) ? preferred : (sorted.includes(currentFY()) ? currentFY() : sorted[0] || "");
  }

  function populateDistrictDropdown() {
    const select = $("searchDistrict");
    if (!select) return;
    const keep = select.value;
    const districts = Array.from(new Set(allRecords.map(record => String(record.district || record.districtManual || "").trim()).filter(Boolean))).sort();
    select.innerHTML = `<option value="">All Districts</option>` + districts.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join("");
    if (districts.includes(keep)) select.value = keep;
  }

  function baseRows() {
    const key = selectedTypeKey();
    const fy = selectedFY();
    lastBaseCount = allRecords.filter(record => record && record.active !== false).length;
    return allRecords
      .filter(record => record && record.active !== false)
      .filter(record => rowType(record) === key)
      .filter(record => recordFY(record) === fy);
  }

  function applyDashboardFilter(rows) {
    const filter = new URLSearchParams(location.search).get("filter");
    if (!filter) return rows;
    return rows.filter(record => {
      if (filter === "total") return true;
      if (filter === "pending") return !isClosed(record);
      if (filter === "circulation") return isCirculation(record);
      if (["closed", "completed", "disposed"].includes(filter)) return isClosed(record);
      if (filter === "overdue") return isOverdue(record);
      if (filter === "due-today") return isDueToday(record);
      return true;
    });
  }

  function applySearchFilters(rows) {
    const district = String($("searchDistrict")?.value || "").trim().toLowerCase();
    const status = String($("searchStatus")?.value || "").trim().toLowerCase();
    const category = String($("searchCategory")?.value || "").trim().toLowerCase();
    const priority = String($("searchPriority")?.value || "").trim().toLowerCase();
    const fromDate = parseDate($("fromDate")?.value || "");
    const toDate = parseDate($("toDate")?.value || "");

    return rows.filter(record => {
      if (district && String(record.district || record.districtManual || "").trim().toLowerCase() !== district) return false;
      if (status && !statusKey(record).includes(status)) return false;
      if (category && !String(record.category || record.grievanceCategory || "").trim().toLowerCase().includes(category)) return false;
      if (priority && !String(record.priorityClassification || record.priority || "").trim().toLowerCase().includes(priority)) return false;
      const date = recordDate(record);
      if (fromDate && date && date < fromDate) return false;
      if (toDate && date) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (date > end) return false;
      }
      return true;
    });
  }

  function updateSummary(rows) {
    const values = {
      totalRecords: rows.length,
      pendingRecords: rows.filter(record => !isClosed(record)).length,
      disposedRecords: rows.filter(isClosed).length,
      overdueRecords: rows.filter(isOverdue).length
    };
    Object.entries(values).forEach(([id, value]) => {
      const element = $(id);
      if (element) element.textContent = value;
    });
  }

  function updateTitle() {
    const filter = new URLSearchParams(location.search).get("filter");
    const title = `${selectedType().toUpperCase()} REGISTER${filter && filter !== "total" ? " - " + filter.replace(/-/g, " ").toUpperCase() : ""}`;
    if ($("registerTitle")) $("registerTitle").textContent = title;
    const headerTitle = document.querySelector("header h3");
    if (headerTitle) headerTitle.textContent = title;
    document.title = title;
  }

  function renderTable() {
    const head = $("registerHeaderRow");
    const body = $("registerBody");
    const columns = columnsForType();
    updateTitle();
    if ($("recordCount")) $("recordCount").textContent = `Total Records : ${filteredRecords.length}`;
    if (head) head.innerHTML = columns.map(column => `<th class="text-nowrap">${esc(column[1])}</th>`).join("") + `<th class="text-nowrap">Action</th>`;
    if (!body) return;

    if (!filteredRecords.length) {
      const anyThisType = allRecords.filter(r => r.active !== false && rowType(r) === selectedTypeKey()).length;
      const helper = lastBaseCount
        ? `<div class="small text-muted mt-2">${anyThisType} ${esc(selectedType())} record(s) exist in all years. Change the FY dropdown if needed.</div>`
        : `<div class="small text-muted mt-2">No active grievance records were found in Firestore. Use Utilities → Data Import or enter a new record.</div>`;
      body.innerHTML = `<tr><td colspan="${columns.length + 1}" class="text-center text-muted py-5">No ${esc(selectedType())} records available for Financial Year ${esc(selectedFY())}.${helper}</td></tr>`;
      updatePageInfo();
      return;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const rows = filteredRecords.slice(start, start + PAGE_SIZE);
    body.innerHTML = rows.map(record => `
      <tr>
        ${columns.map(column => `<td>${esc(displayValue(record, column[0]))}</td>`).join("")}
        <td class="text-nowrap">
          <button type="button" class="btn btn-sm btn-info me-1" data-view="${esc(record.id)}">View</button>
          <button type="button" class="btn btn-sm btn-warning me-1" data-edit="${esc(record.id)}">Edit</button>
          <button type="button" class="btn btn-sm btn-danger" data-delete="${esc(record.id)}">Delete</button>
        </td>
      </tr>
    `).join("");
    body.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => openRecord(button.dataset.view, "view")));
    body.querySelectorAll("[data-edit]").forEach(button => button.addEventListener("click", () => openRecord(button.dataset.edit, "edit")));
    body.querySelectorAll("[data-delete]").forEach(button => button.addEventListener("click", () => deleteRecord(button.dataset.delete)));
    updatePageInfo();
  }

  function updatePageInfo() {
    const pageInfo = $("pageInfo");
    if (!pageInfo) return;
    if (!filteredRecords.length) {
      pageInfo.textContent = "Showing 0 to 0 of 0 records";
      return;
    }
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, filteredRecords.length);
    pageInfo.textContent = `Showing ${start} to ${end} of ${filteredRecords.length} records`;
  }

  function applyFilters() {
    const contextRows = baseRows();
    updateSummary(contextRows);
    filteredRecords = applySearchFilters(applyDashboardFilter(contextRows));
    currentPage = 1;
    renderTable();
  }

  async function loadRegister() {
    const body = $("registerBody");
    if (body) body.innerHTML = `<tr><td colspan="20" class="text-center text-muted py-5">Loading Grievances from Firestore...</td></tr>`;
    showLoading();
    try {
      const db = await waitForDb();
      if (!db) throw new Error("Firebase Firestore is not ready. Please wait for Firebase connection and refresh.");
      const snapshot = await db.collection(COLLECTION).get();
      allRecords = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(record => record && record.active !== false && record.deleted !== true);
      allRecords.sort((a, b) => (recordDate(b)?.getTime() || 0) - (recordDate(a)?.getTime() || 0));
      populateTypeDropdown();
      populateFinancialYearDropdown();
      populateDistrictDropdown();
      applyFilters();
      showMessage("success", `Loaded ${allRecords.length} active grievance record(s) from Firestore.`);
      return true;
    } catch (error) {
      console.error("Grievances register load failed:", error);
      if (body) body.innerHTML = `<tr><td colspan="20" class="text-center text-danger py-5">Unable to load Grievances Register: ${esc(error.message || error)}</td></tr>`;
      showMessage("danger", `Unable to load Grievances Register: ${esc(error.message || error)}`);
      return false;
    } finally {
      hideLoading();
    }
  }

  function openRecord(id, mode) {
    const record = allRecords.find(item => item.id === id);
    if (!record) return;
    sessionStorage.setItem("selectedGrievance", JSON.stringify(record));
    location.href = `cpgrams.html?mode=${encodeURIComponent(mode)}&id=${encodeURIComponent(id)}&grievanceType=${encodeURIComponent(selectedType())}`;
  }

  async function deleteRecord(id) {
    if (!id || !confirm("Delete this record?")) return;
    try {
      const db = await waitForDb();
      if (!db) throw new Error("Firestore is not ready.");
      await db.collection(COLLECTION).doc(id).update({
        active: false,
        deletedOn: window.firebase?.firestore?.FieldValue?.serverTimestamp?.() || new Date(),
        updatedOn: window.firebase?.firestore?.FieldValue?.serverTimestamp?.() || new Date()
      });
      await loadRegister();
    } catch (error) {
      alert("Unable to delete record: " + (error.message || error));
    }
  }

  function openNewGrievance() {
    sessionStorage.removeItem("selectedGrievance");
    location.href = `cpgrams.html?mode=new&grievanceType=${encodeURIComponent(selectedType())}`;
  }

  function summaryUrl(filter) {
    const params = new URLSearchParams();
    params.set("filter", filter || "total");
    params.set("fy", selectedFY());
    params.set("grievanceType", selectedType());
    return "cpgrams-register.html?" + params.toString();
  }

  function bindEvents() {
    ["searchGrievanceType", "financialYear", "searchDistrict", "searchStatus", "searchCategory", "searchPriority", "fromDate", "toDate"].forEach(id => {
      const element = $(id);
      if (!element || element.dataset.fmsBound) return;
      element.dataset.fmsBound = "1";
      element.addEventListener("change", applyFilters);
      element.addEventListener("keyup", applyFilters);
    });
    $("btnSearch")?.addEventListener("click", applyFilters);
    $("btnRefresh")?.addEventListener("click", loadRegister);
    $("btnRefreshData")?.addEventListener("click", loadRegister);
    $("btnNew")?.addEventListener("click", openNewGrievance);
    $("btnHome")?.addEventListener("click", () => location.href = "../../index.html");
    $("btnDashboard")?.addEventListener("click", () => location.href = `cpgrams.html?grievanceType=${encodeURIComponent(selectedType())}`);
    $("btnFirst")?.addEventListener("click", () => { currentPage = 1; renderTable(); });
    $("btnPrevious")?.addEventListener("click", () => { currentPage = Math.max(1, currentPage - 1); renderTable(); });
    $("btnNext")?.addEventListener("click", () => {
      currentPage = Math.min(Math.ceil(filteredRecords.length / PAGE_SIZE) || 1, currentPage + 1);
      renderTable();
    });
    $("btnLast")?.addEventListener("click", () => {
      currentPage = Math.ceil(filteredRecords.length / PAGE_SIZE) || 1;
      renderTable();
    });
    $("btnWhatsApp")?.addEventListener("click", async () => {
      const visible = $("registerBody")?.innerText || "";
      await window.FMSWhatsAppService?.compose?.({
        module: "GRIEVANCES",
        title: `${selectedType()} Register Message`,
        defaultMessage: `${selectedType()} Register Update\nFY: ${selectedFY()}\nRecords: ${filteredRecords.length}\n\n${visible.slice(0, 2800)}\n\nPlease type or edit your custom message.`,
        message: m => showMessage("info", m)
      });
    });
  }

  function initialize() {
    populateTypeDropdown();
    populateFinancialYearDropdown();
    bindEvents();
    updateTitle();
    renderTable();
    loadRegister();
  }

  window.openCPGRAMSSummaryFilter = filter => { location.href = summaryUrl(filter); };
  // View opens the Data Entry form with existing values loaded and Update/Delete enabled.
  window.viewRecord = id => openRecord(id, "edit");
  window.editRecord = id => openRecord(id, "edit");
  window.deleteRecordFromGrid = deleteRecord;
  window.searchRecords = applyFilters;
  window.applyFinancialYearFilter = applyFilters;
  window.applyURLFilter = applyFilters;
  window.refreshRegister = loadRegister;
  window.openNewGrievance = openNewGrievance;
  window.goHome = () => location.href = "../../index.html";
  window.openDashboard = () => location.href = `cpgrams.html?grievanceType=${encodeURIComponent(selectedType())}`;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})(window, document);
