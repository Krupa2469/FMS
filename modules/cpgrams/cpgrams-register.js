"use strict";

/* ============================================================
   GRIEVANCES REGISTER CONTROLLER - v1.2.9
   Loads Firestore records consistently by Grievance Type + FY.
   This replaces the old Grievance Number search dependency.
============================================================ */

const GRIEVANCE_COLLECTION = "cpgrams";
const GRIEVANCE_TYPES = [
  "CPGRAMS", "Prajavani", "Public Grievances", "Direct Complaints",
  "LAQ", "LCQ", "Court Cases", "VIP References", "CMO References",
  "PMO References", "Audit Paras", "Vigilance Cases"
];

let grievanceList = [];
let filteredList = [];
let currentPage = 1;
let selectedDocumentId = null;
const pageSize = 25;

const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>\"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));

function getFirestoreDB() {
  if (window.db) return window.db;
  if (window.fmsFirebase && window.fmsFirebase.db) return window.fmsFirebase.db;
  try {
    if (typeof firebase !== "undefined" && firebase.firestore) return firebase.firestore();
  } catch (_error) {}
  return null;
}

function normalizeType(value) {
  const text = String(value || "").trim().toLowerCase().replace(/\s+/g, " ")
    .replace(/\bcomplaint\b/g, "complaints")
    .replace(/\breference\b/g, "references")
    .replace(/\bpara\b/g, "paras");
  if (["grievances", "cpgrams", "cpgrams portal", "cpgram", "direct from complainant"].includes(text)) return "cpgrams";
  return text;
}

function getRowType(record) {
  const qType = String(record?.questionType || "").trim().toUpperCase();
  if (qType === "LAQ") return "laq";
  if (qType === "LCQ") return "lcq";
  for (const key of ["grievanceType", "referenceType", "type", "sourceType", "grievanceSource", "source", "category"]) {
    const normalized = normalizeType(record?.[key]);
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
  let match = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
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

function getRecordDate(record) {
  for (const key of ["dateReceived", "questionReceivedDate", "dateArised", "receivedDate", "diaryDate", "applicationDate", "date"]) {
    const date = parseDate(record?.[key]);
    if (date) return date;
  }
  return null;
}

function getRecordFY(record) {
  const date = getRecordDate(record);
  return date ? fyLabel(fyStartYear(date)) : "";
}

function selectedType() {
  return $("searchGrievanceType")?.value || new URLSearchParams(location.search).get("grievanceType") || new URLSearchParams(location.search).get("category") || "CPGRAMS";
}

function selectedFY() {
  return $("financialYear")?.value || new URLSearchParams(location.search).get("fy") || currentFY();
}

function getStatus(record) {
  for (const key of ["officeStatus", "currentStatus", "finalStatus", "statusOfFile", "questionFileStatus", "presentStatus", "status"]) {
    const value = record?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "Pending";
}

function statusKey(record) {
  return getStatus(record).toLowerCase();
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

function getDueDate(record) {
  return parseDate(record?.dueDate || record?.questionDueDate || record?.atrDueDate);
}

function isOverdue(record) {
  if (isClosed(record)) return false;
  const due = getDueDate(record);
  if (!due) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function isDueToday(record) {
  if (isClosed(record)) return false;
  const due = getDueDate(record);
  if (!due) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due.getTime() === today.getTime();
}

function setMessage(type, message) {
  const area = $("messageArea");
  if (!area) return;
  area.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
}

function showLoading() {
  const overlay = $("loadingOverlay");
  if (overlay) overlay.classList.remove("d-none");
}

function hideLoading() {
  const overlay = $("loadingOverlay");
  if (overlay) overlay.classList.add("d-none");
}

function populateTypeDropdown() {
  const select = $("searchGrievanceType");
  if (!select) return;
  const requested = new URLSearchParams(location.search).get("grievanceType") || new URLSearchParams(location.search).get("category") || "";
  select.innerHTML = `<option value="">All Grievance Types</option>` + GRIEVANCE_TYPES.map(type => `<option value="${esc(type)}">${esc(type)}</option>`).join("");
  if (requested) {
    const mapped = normalizeType(requested) === "cpgrams" ? "CPGRAMS" : GRIEVANCE_TYPES.find(type => normalizeType(type) === normalizeType(requested));
    if (mapped) select.value = mapped;
  }
  if (!requested && !select.value) select.value = "CPGRAMS";
}

function populateFinancialYearDropdown() {
  const select = $("financialYear");
  if (!select) return;
  const requested = new URLSearchParams(location.search).get("fy");
  const preferred = requested || select.value || currentFY();
  const years = new Set();
  const currentStart = fyStartYear(new Date());
  for (let year = currentStart; year >= 2014; year--) years.add(fyLabel(year));
  grievanceList.forEach(record => {
    const fy = getRecordFY(record);
    if (fy) years.add(fy);
  });
  const options = Array.from(years).sort((a, b) => Number(b.slice(0, 4)) - Number(a.slice(0, 4)));
  select.innerHTML = options.map(fy => `<option value="${esc(fy)}">${esc(fy)}</option>`).join("");
  select.value = options.includes(preferred) ? preferred : (options.includes(currentFY()) ? currentFY() : options[0] || "");
}

function baseRowsForSelectedContext() {
  const type = selectedType();
  const fy = selectedFY();
  const normalizedType = normalizeType(type);
  return grievanceList
    .filter(record => record && record.active !== false)
    .filter(record => !normalizedType || getRowType(record) === normalizedType)
    .filter(record => getRecordFY(record) === fy);
}

function applyDashboardStatusFilter(rows) {
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
    const recordDate = getRecordDate(record);
    if (fromDate && recordDate && recordDate < fromDate) return false;
    if (toDate && recordDate) {
      const end = new Date(toDate.getTime());
      end.setHours(23, 59, 59, 999);
      if (recordDate > end) return false;
    }
    return true;
  });
}

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
const BASIC_SECTION_1 = [
  ["dateReceived", "Date Received"], ["dueDate", "Due Date"], ["subject", "Subject"],
  ["grievanceDescription", "Grievance Description"], ["grievanceDocument", "Upload Grievance Document"]
];
const CPGRAMS_SECTION_1 = [
  ["grievanceNumber", "Grievance Number"], ["dateReceived", "Date Received"], ["dueDate", "Due Date"],
  ["subject", "Subject"], ["category", "Category"], ["grievanceDescription", "Grievance Description"],
  ["grievanceDocument", "Upload Grievance Document"], ["natureOfGrievance", "Nature of Grievance"],
  ["priorityClassification", "Priority Classification"], ["attachmentCount", "Number of Attachments"]
];
const QUESTION_COLUMNS = [
  ["questionSerialNo", "Question No."], ["questionType", "Question Type"], ["questionReceivedDate", "Received Date"],
  ["questionConcernedSection", "Concerned Section"], ["question", "Question"], ["answer", "Answer"],
  ["answerFurnishedBy", "Answer furnished by"], ["answerFurnishedTo", "Answer furnished to"], ["answerFurnishedDate", "Answer furnished Date"],
  ["questionCommunicationType", "Communication Type"], ["questionFileNumber", "File No."],
  ["questionCommunicationDate", "Communication Date"], ["questionFileStatus", "File Status"], ["attachments", "Upload Document"]
];

function getColumns() {
  const normalized = normalizeType(selectedType());
  if (normalized === "laq" || normalized === "lcq") {
    const label = `${selectedType().toUpperCase()} No.`;
    return QUESTION_COLUMNS.map(col => col[0] === "questionSerialNo" ? [col[0], label] : col);
  }
  const section1 = normalized === "cpgrams" ? CPGRAMS_SECTION_1 : BASIC_SECTION_1;
  return section1.concat(COMMON_SECTION_2, COMMON_SECTION_3, [["attachments", "Upload Document"]]);
}

function getDisplayValue(record, key) {
  let value = record?.[key];
  if (key === "grievanceDocument") value = record?.grievanceDocumentName || record?.fileDocumentName || record?.fileDocument || record?.grievanceDocument || "";
  if (key === "attachments") {
    const attachments = record?.attachments;
    if (Array.isArray(attachments)) return attachments.map(item => item?.name || item?.fileName || item?.filename || "Document").join(", ");
    return record?.fileAttachmentName || record?.attachmentName || record?.attachmentCount || "";
  }
  if (["district", "mandal", "village"].includes(key) && !value) value = record?.[key + "Manual"] || "";
  if (key === "dueDate" && !value) value = record?.atrDueDate || "";
  return value ?? "";
}

function updateRegisterTitle() {
  const filter = new URLSearchParams(location.search).get("filter");
  const suffix = filter && filter !== "total" ? ` - ${filter.replace(/-/g, " ").toUpperCase()}` : "";
  const title = `${selectedType().toUpperCase()} REGISTER${suffix}`;
  if ($("registerTitle")) $("registerTitle").textContent = title;
  const headerTitle = document.querySelector("header h3");
  if (headerTitle) headerTitle.textContent = title;
  document.title = title;
}

function updateRecordCount() {
  if ($("recordCount")) $("recordCount").textContent = `Total Records : ${filteredList.length}`;
}

function updatePageInfo() {
  const pageInfo = $("pageInfo");
  if (!pageInfo) return;
  if (!filteredList.length) {
    pageInfo.textContent = "Showing 0 to 0 of 0 records";
    return;
  }
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredList.length);
  pageInfo.textContent = `Showing ${start} to ${end} of ${filteredList.length} records`;
}

function updateSummary(baseRows) {
  const values = {
    totalRecords: baseRows.length,
    pendingRecords: baseRows.filter(record => !isClosed(record)).length,
    disposedRecords: baseRows.filter(isClosed).length,
    overdueRecords: baseRows.filter(isOverdue).length
  };
  Object.entries(values).forEach(([id, value]) => {
    const element = $(id);
    if (element) element.textContent = value;
  });
}

function renderRegisterTable() {
  const header = $("registerHeaderRow");
  const body = $("registerBody");
  const columns = getColumns();
  if (header) {
    header.innerHTML = columns.map(column => `<th class="text-nowrap">${esc(column[1])}</th>`).join("") + `<th class="text-nowrap">Action</th>`;
  }
  if (!body) return;

  if (!filteredList.length) {
    body.innerHTML = `<tr><td colspan="${columns.length + 1}" class="text-center text-muted py-5">No ${esc(selectedType())} records available for Financial Year ${esc(selectedFY())}.</td></tr>`;
    updateRecordCount();
    updatePageInfo();
    updateRegisterTitle();
    return;
  }

  const start = (currentPage - 1) * pageSize;
  const rows = filteredList.slice(start, start + pageSize);
  body.innerHTML = rows.map(record => `
    <tr>
      ${columns.map(column => `<td>${esc(getDisplayValue(record, column[0]))}</td>`).join("")}
      <td class="text-nowrap">
        <button type="button" class="btn btn-sm btn-info me-1" data-view="${esc(record.id)}">View</button>
        <button type="button" class="btn btn-sm btn-warning me-1" data-edit="${esc(record.id)}">Edit</button>
        <button type="button" class="btn btn-sm btn-danger" data-delete="${esc(record.id)}">Delete</button>
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => openRecord(button.dataset.view, "view")));
  body.querySelectorAll("[data-edit]").forEach(button => button.addEventListener("click", () => openRecord(button.dataset.edit, "edit")));
  body.querySelectorAll("[data-delete]").forEach(button => button.addEventListener("click", () => deleteRecordFromGrid(button.dataset.delete)));

  updateRecordCount();
  updatePageInfo();
  updateRegisterTitle();
}

function applyAllFilters() {
  const baseRows = baseRowsForSelectedContext();
  updateSummary(baseRows);
  filteredList = applySearchFilters(applyDashboardStatusFilter(baseRows));
  currentPage = 1;
  renderRegisterTable();
}

async function loadRegister() {
  const body = $("registerBody");
  if (body) body.innerHTML = `<tr><td colspan="20" class="text-center text-muted py-5">Loading Grievances from Firestore...</td></tr>`;
  const db = getFirestoreDB();
  if (!db) {
    if (body) body.innerHTML = `<tr><td colspan="20" class="text-center text-warning py-5">Firestore is not ready. Please refresh after the Firebase connection message appears.</td></tr>`;
    return false;
  }
  try {
    showLoading();
    const snapshot = await db.collection(GRIEVANCE_COLLECTION).get();
    grievanceList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(record => record.active !== false);
    populateFinancialYearDropdown();
    applyAllFilters();
    return true;
  } catch (error) {
    console.error("Grievances register load failed:", error);
    if (body) body.innerHTML = `<tr><td colspan="20" class="text-center text-danger py-5">Unable to load Grievances Register: ${esc(error.message || error)}</td></tr>`;
    setMessage("danger", `Unable to load Grievances Register: ${esc(error.message || error)}`);
    return false;
  } finally {
    hideLoading();
  }
}

function openRecord(id, mode) {
  const record = grievanceList.find(item => item.id === id);
  if (!record) return;
  sessionStorage.setItem("selectedGrievance", JSON.stringify(record));
  location.href = `cpgrams.html?mode=${encodeURIComponent(mode)}&grievanceType=${encodeURIComponent(selectedType())}`;
}

async function deleteRecordFromGrid(id) {
  if (!id || !confirm("Delete this record?")) return;
  const db = getFirestoreDB();
  if (!db) {
    alert("Firestore is not ready.");
    return;
  }
  try {
    await db.collection(GRIEVANCE_COLLECTION).doc(id).update({
      active: false,
      deletedOn: firebase.firestore.FieldValue.serverTimestamp(),
      updatedOn: firebase.firestore.FieldValue.serverTimestamp()
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

function bindEvents() {
  ["searchGrievanceType", "financialYear", "searchDistrict", "searchStatus", "searchCategory", "searchPriority", "fromDate", "toDate"].forEach(id => {
    const element = $(id);
    if (!element || element.dataset.fmsBound) return;
    element.dataset.fmsBound = "1";
    element.addEventListener("change", applyAllFilters);
    element.addEventListener("keyup", applyAllFilters);
  });

  $("btnSearch")?.addEventListener("click", applyAllFilters);
  $("btnRefresh")?.addEventListener("click", loadRegister);
  $("btnRefreshData")?.addEventListener("click", loadRegister);
  $("btnNew")?.addEventListener("click", openNewGrievance);
  $("btnHome")?.addEventListener("click", () => location.href = "../../index.html");
  $("btnDashboard")?.addEventListener("click", () => location.href = `cpgrams.html?grievanceType=${encodeURIComponent(selectedType())}`);
  $("btnFirst")?.addEventListener("click", () => { currentPage = 1; renderRegisterTable(); });
  $("btnPrevious")?.addEventListener("click", () => { currentPage = Math.max(1, currentPage - 1); renderRegisterTable(); });
  $("btnNext")?.addEventListener("click", () => {
    currentPage = Math.min(Math.ceil(filteredList.length / pageSize) || 1, currentPage + 1);
    renderRegisterTable();
  });
  $("btnLast")?.addEventListener("click", () => {
    currentPage = Math.ceil(filteredList.length / pageSize) || 1;
    renderRegisterTable();
  });
}

window.openCPGRAMSSummaryFilter = function(filter) {
  const params = new URLSearchParams();
  params.set("filter", filter || "total");
  params.set("fy", selectedFY());
  params.set("grievanceType", selectedType() || "CPGRAMS");
  location.href = "cpgrams-register.html?" + params.toString();
};

window.viewRecord = id => openRecord(id, "view");
window.editRecord = id => openRecord(id, "edit");
window.deleteRecordFromGrid = deleteRecordFromGrid;
window.searchRecords = applyAllFilters;
window.applyFinancialYearFilter = applyAllFilters;
window.applyURLFilter = applyAllFilters;
window.refreshRegister = loadRegister;
window.openNewGrievance = openNewGrievance;
window.goHome = () => location.href = "../../index.html";
window.openDashboard = () => location.href = `cpgrams.html?grievanceType=${encodeURIComponent(selectedType())}`;

function initialize() {
  populateTypeDropdown();
  populateFinancialYearDropdown();
  bindEvents();
  if (getFirestoreDB()) {
    loadRegister();
  } else {
    window.addEventListener("fmsFirebaseReady", loadRegister, { once: true });
    setTimeout(() => { if (getFirestoreDB()) loadRegister(); }, 1500);
    setTimeout(() => { if (getFirestoreDB()) loadRegister(); }, 3500);
  }
}

document.addEventListener("DOMContentLoaded", initialize);
