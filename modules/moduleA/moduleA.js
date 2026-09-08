/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : moduleA.js
    Version     : 1.0.0
    Description : Module A Dashboard Controller
==========================================================*/

"use strict";

/*==========================================================
PAGE LOAD
==========================================================*/

document.addEventListener("DOMContentLoaded", initializeModuleA);


/*==========================================================
INITIALIZE MODULE A
==========================================================*/

function initializeModuleA()
{
    loadDashboard();
}


/*==========================================================
LOAD DASHBOARD
==========================================================*/

function loadDashboard()
{
    let totalFiles = 0;
    let disposedFiles = 0;

    // List of all Module A storage keys
    const storageList = [

        STORAGE_KEYS.CPGRAMS,
        STORAGE_KEYS.PRAJAVANI,
        STORAGE_KEYS.PUBLIC_GRIEVANCE,
        STORAGE_KEYS.DIRECT_COMPLAINT,
        STORAGE_KEYS.ASSEMBLY,
        STORAGE_KEYS.COURT,
        STORAGE_KEYS.VIP,
        STORAGE_KEYS.CMO,
        STORAGE_KEYS.AUDIT,
        STORAGE_KEYS.VIGILANCE

    ];

    storageList.forEach(function(key)
    {
        const records = getData(key);

        totalFiles += records.length;

        disposedFiles += records.filter(function(record)
        {
            return record.status === "Disposed";
        }).length;
    });

    const filesUnderCirculation = totalFiles - disposedFiles;

    document.getElementById("totalFiles").innerText = totalFiles;

    document.getElementById("filesUnderCirculation").innerText = filesUnderCirculation;
    
    document.getElementById("disposedFiles").innerText = disposedFiles;
}


/*==========================================================
CPGRAMS
==========================================================*/

function openCPGRAMS()
{
    window.location.href = "../modules/cpgrams/cpgrams.html";
}


/*==========================================================
PRAJAVANI
==========================================================*/

function openPrajavani()
{
    window.location.href = "../modules/prajavani/prajavani.html";
}


/*==========================================================
PUBLIC GRIEVANCES
==========================================================*/

function openPublicGrievances()
{
    window.location.href = "../modules/public-grievances/public-grievances.html";
}


/*==========================================================
DIRECT COMPLAINTS
==========================================================*/

function openDirectComplaints()
{
    window.location.href = "../modules/direct-complaints/direct-complaints.html";
}


/*==========================================================
ASSEMBLY QUESTIONS
==========================================================*/

function openAssemblyQuestions()
{
    window.location.href = "../modules/assembly-questions/assembly-questions.html";
}


/*==========================================================
COURT CASES
==========================================================*/

function openCourtCases()
{
    window.location.href = "../modules/court-cases/court-cases.html";
}


/*==========================================================
VIP REFERENCES
==========================================================*/

function openVIPReferences()
{
    window.location.href = "../modules/vip-references/vip-references.html";
}


/*==========================================================
CMO REFERENCES
==========================================================*/

function openCMOReferences()
{
    window.location.href = "../modules/cmo-references/cmo-references.html";
}


/*==========================================================
AUDIT PARAS
==========================================================*/

function openAuditParas()
{
    window.location.href = "../modules/audit-paras/audit-paras.html";
}


/*==========================================================
VIGILANCE CASES
==========================================================*/

function openVigilanceCases()
{
    window.location.href = "../modules/vigilance-cases/vigilance-cases.html";
}


function shareModuleADashboardWhatsApp()
{
    if (!window.FMSWhatsAppService?.compose) return;
    const summary =
        "Total Files: " + (document.getElementById("totalFiles")?.textContent || "0") + "\n" +
        "Files Under Circulation: " + (document.getElementById("filesUnderCirculation")?.textContent || "0") + "\n" +
        "Disposed Files: " + (document.getElementById("disposedFiles")?.textContent || "0");
    window.FMSWhatsAppService.compose({
        module: "Module A",
        title: "Module A Message",
        defaultMessage:`Module A Update\nStatus as on: ${new Date().toLocaleDateString("en-IN")}\n\n${summary}\n\nPlease type or edit your custom message.`,
        message: function(msg){ alert(msg); }
    });
}

document.addEventListener("DOMContentLoaded", function(){
    document.getElementById("btnWhatsAppDashboard")?.addEventListener("click", shareModuleADashboardWhatsApp);
});

/*==========================================================
END OF FILE
==========================================================*/