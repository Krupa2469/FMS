/*==========================================================
 FMS MODULE DASHBOARD
 Version: 5.1
 Purpose: Dashboard is the HOME page of each module.
==========================================================*/
"use strict";

const moduleConfig = {
  cpgrams: {
    name: "CPGRAMS",
    collection: "cpgrams",
    newPage: "../modules/cpgrams/cpgrams.html",
    register: "../modules/cpgrams/cpgrams-register.html",
    daily: "../modules/cpgrams/cpgrams-register.html",
    report: "reports.html?module=cpgrams",
    labels: ["Total Grievances","Pending","Under Circulation","Disposed / Closed","Overdue","Due Today"]
  },
  rti: {
    name: "RTI",
    collection: "rtiApplications",
    newPage: "../modules/rti/rti.html",
    register: "../modules/rti/rti-register.html",
    daily: "../modules/rti/rti-daily-status.html",
    report: "reports.html?module=rti",
    labels: ["Total RTI Applications","Pending","Under Circulation","Closed","Overdue","Due Today"]
  },
  disha: {
    name: "DISHA",
    collection: "dishaMeetings",
    newPage: "../modules/disha/disha.html",
    register: "../modules/disha/disha-register.html",
    daily: "../modules/disha/disha-daily-status.html",
    report: "reports.html?module=disha",
    labels: ["Total Meetings","PoM Pending","Under Circulation","Held","PoM Overdue","Upcoming Meetings"]
  }
};

let mod = (new URLSearchParams(location.search).get("module") || "cpgrams").toLowerCase();
if (!moduleConfig[mod]) mod = "cpgrams";

function safeDate(value) {
  if (!value) return null;
  if (value && typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeStatus(row) {
  return String(
    row.officeStatus || row.statusOfFile || row.currentStatus ||
    row.presentStatus || row.statusOfMeeting || row.status || ""
  ).trim().toLowerCase();
}

function isClosed(status) {
  return /closed|disposed|reply obtained|despatched|held|completed/.test(status);
}

function card(label, value, icon, cls, targetUrl) {
  const href = targetUrl || "#";
  return `
    <div class="col-12 col-sm-6 col-lg-4 col-xl-2">
      <a href="${href}" class="text-decoration-none text-reset dashboard-card-link" aria-label="${label}: ${value}">
        <div class="card metric-card h-100 dashboard-metric-card">
          <div class="card-body text-center">
            <div class="metric-icon text-${cls}"><i class="bi ${icon}"></i></div>
            <div class="text-muted small mt-2">${label}</div>
            <div class="metric-value text-${cls}">${value}</div>
            <div class="small text-primary mt-2">View records <i class="bi bi-arrow-right"></i></div>
          </div>
        </div>
      </a>
    </div>`;
}
function showStatus(message, type="info") {
  const el = document.getElementById("dashboardStatus");
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = message;
  el.classList.remove("d-none");
}

async function loadDashboard() {
  const cfg = moduleConfig[mod];
  document.getElementById("moduleTitle").textContent = `${cfg.name} — DASHBOARD`;

  if (!window.db) {
    showStatus("Firebase is not ready. Please wait a moment and refresh the dashboard.", "warning");
    return;
  }

  try {
    showStatus("Loading latest data from Firestore...", "info");

    const snap = await window.db.collection(cfg.collection).get();
    const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate()+1);

    let total = rows.length;
    let pending = 0;
    let circulation = 0;
    let closed = 0;
    let overdue = 0;
    let dueToday = 0;

    rows.forEach(row => {
      const status = normalizeStatus(row);
      const done = isClosed(status);

      if (done) closed++;
      else pending++;

      if (/under circulation|circulation/.test(status)) circulation++;

      const due = safeDate(row.dueDate || row.pomDueDate);
      if (due && !done) {
        const d = new Date(due);
        d.setHours(0,0,0,0);
        if (d < today) overdue++;
        if (d.getTime() === today.getTime()) dueToday++;
      }
    });

    let labels, values, icons, classes;

    if (mod === "disha") {
      const pomPending = rows.filter(r => !/yes|uploaded|completed/i.test(String(r.pomUploaded || r.pomStatus || ""))).length;
      const held = rows.filter(r => /held/i.test(normalizeStatus(r))).length;
      const pomOverdue = rows.filter(r => {
        const due = safeDate(r.pomDueDate);
        return due && due < today && !/yes|uploaded|completed/i.test(String(r.pomUploaded || r.pomStatus || ""));
      }).length;
      const upcoming = rows.filter(r => {
        const d = safeDate(r.proposedDateOfMeeting || r.dateOfMeeting);
        return d && d >= today;
      }).length;
      labels = cfg.labels;
      values = [total, pomPending, circulation, held, pomOverdue, upcoming];
      icons = ["bi-collection","bi-hourglass-split","bi-arrow-repeat","bi-check-circle","bi-exclamation-triangle","bi-calendar-event"];
      classes = ["primary","warning","info","success","danger","secondary"];
    } else {
      labels = cfg.labels;
      values = [total, pending, circulation, closed, overdue, dueToday];
      icons = ["bi-collection","bi-hourglass-split","bi-arrow-repeat","bi-check-circle","bi-exclamation-triangle","bi-calendar-event"];
      classes = ["primary","warning","info","success","danger","secondary"];
    }

    const filterMap = mod === "disha"
      ? ["total","pom-pending","circulation","held","pom-overdue","upcoming"]
      : ["total","pending","circulation","closed","overdue","due-today"];
    document.getElementById("cards").innerHTML = labels.map((l,i) => {
      const url = `${cfg.register}?filter=${encodeURIComponent(filterMap[i])}`;
      return card(l, values[i], icons[i], classes[i], url);
    }).join("");

    const now = new Date();
    document.getElementById("lastUpdated").textContent =
      `Last refreshed: ${now.toLocaleString("en-IN")} • ${total} record(s) read from Firestore.`;

    const statusEl = document.getElementById("dashboardStatus");
    statusEl.className = "alert alert-success";
    statusEl.textContent = `Dashboard ready — ${cfg.name} data loaded successfully.`;
    statusEl.classList.remove("d-none");

  } catch (error) {
    console.error("Module dashboard error:", error);
    showStatus(`Unable to load ${cfg.name} dashboard: ${error.message || error}`, "danger");
    document.getElementById("cards").innerHTML = "";
  }
}

async function shareDailyStatusWhatsApp(){
  const cfg=moduleConfig[mod];
  try{
    if(!window.db) throw new Error("Firebase is not ready.");
    const snap=await window.db.collection(cfg.collection).get();
    const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
    const fyRows=window.FMSFY ? window.FMSFY.filterFY(rows, window.FMSFY.getCurrentFY(),
      mod==="rti"?["applicationDate"]:mod==="disha"?["dateOfMeeting"]:["dateReceived","dateArised"]) : rows;
    const today=new Date(); today.setHours(0,0,0,0);
    const pending=fyRows.filter(r=>!isClosed(normalizeStatus(r))).length;
    const overdue=fyRows.filter(r=>{const d=safeDate(r.dueDate||r.pomDueDate); return d && d<today && !isClosed(normalizeStatus(r));}).length;
    const dueToday=fyRows.filter(r=>{const d=safeDate(r.dueDate||r.pomDueDate); if(!d)return false; d.setHours(0,0,0,0); return d.getTime()===today.getTime();}).length;
    const text=`*${cfg.name} Daily Status Report*\\nFinancial Year: ${window.FMSFY?.getCurrentFY()||""}\\nDate: ${new Date().toLocaleDateString("en-IN")}\\n\\nTotal: ${fyRows.length}\\nPending: ${pending}\\nOverdue: ${overdue}\\nDue Today: ${dueToday}\\n\\nGenerated by FMS`;
    if(window.FMSWhatsAppService && typeof window.FMSWhatsAppService.share==="function"){
      await window.FMSWhatsAppService.share({title:`${cfg.name} Daily Status`,module:cfg.name,extraText:text.replace(/\*/g,""),element:document.querySelector("main")});
    } else {
      window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank");
    }
  }catch(e){ showStatus("Unable to prepare WhatsApp daily status: "+e.message,"danger"); }
}

function wireButtons() {
  const cfg = moduleConfig[mod];
  const go = url => { window.location.href = url; };

  document.getElementById("btnNew").onclick = () => go(cfg.newPage);
  document.getElementById("btnNew2").onclick = () => go(cfg.newPage);
  document.getElementById("btnRegister").onclick = () => go(cfg.register);
  document.getElementById("btnDaily").onclick = () => go(cfg.daily);
  document.getElementById("btnDaily2").onclick = () => go(cfg.daily);
  document.getElementById("btnReports").onclick = () => go(cfg.report);
  document.getElementById("btnReport2").onclick = () => go(cfg.report);
  document.getElementById("btnMasters").onclick = () => go("admin/master-management.html");
  document.getElementById("btnHome").onclick = () => go("../index.html");
  document.getElementById("btnRefresh").onclick = loadDashboard;
  const wa = document.getElementById("btnWhatsApp");
  if (wa) wa.onclick = shareDailyStatusWhatsApp;
}

function startDashboard() {
  wireButtons();
  loadDashboard();
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.fmsFirebaseReady && window.db) {
    startDashboard();
  } else {
    window.addEventListener("fmsFirebaseReady", startDashboard, { once: true });
    setTimeout(() => {
      if (window.db && !document.getElementById("lastUpdated")?.textContent?.includes("Last refreshed")) {
        startDashboard();
      }
    }, 1500);
  }
});
