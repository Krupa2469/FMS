/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : master-data.js
    Version     : 1.0.0
    Description : Master Data & Application Constants
==========================================================*/

"use strict";

/*==========================================================
LOCAL STORAGE KEYS
==========================================================*/

const STORAGE_KEYS = {

    CPGRAMS           : "FMS_CPGRAMS",

    PRAJAVANI         : "FMS_PRAJAVANI",

    PUBLIC_GRIEVANCE  : "FMS_PUBLIC_GRIEVANCE",

    DIRECT_COMPLAINT  : "FMS_DIRECT_COMPLAINT",

    ASSEMBLY          : "FMS_ASSEMBLY",

    COURT             : "FMS_COURT",

    VIP               : "FMS_VIP",

    CMO               : "FMS_CMO",

    AUDIT             : "FMS_AUDIT",

    VIGILANCE         : "FMS_VIGILANCE",

    RTI               : "FMS_RTI",

    DISHA             : "FMS_DISHA"

};


/*==========================================================
MODULES
==========================================================*/

const MODULES = {

    CPGRAMS  : "CPGRAMS / Public Grievances",

    RTI      : "RTI Management",

    DISHA    : "DISHA Management"

};





/*==========================================================
DISHA MEETING STATUS
==========================================================*/

const DISHA_MEETING_STATUS = [

    "Held",

    "To Be Held",

    "Postponed",

    "Cancelled"

];


/*==========================================================
BILL STATUS
==========================================================*/

const BILL_STATUS = [

    "Pending",

    "Submitted to CRD",

    "Forwarded to MoRD"

];


/*==========================================================
MONTHS
==========================================================*/

const MONTHS = [

    "January",

    "February",

    "March",

    "April",

    "May",

    "June",

    "July",

    "August",

    "September",

    "October",

    "November",

    "December"

];


/*==========================================================
APPLICATION CONFIGURATION
==========================================================*/

const APP_CONFIG = {

    CPGRAMS_DUE_DAYS : 21,

    PRAJAVANI_DUE_DAYS : 30,

    RTI_DUE_DAYS : 30,

    DISHA_POM_DUE_DAYS : 30

};

/******************************************************************************
 * Load All Master Data
 ******************************************************************************/
/******************************************************************************
 * Load All Master Data
 ******************************************************************************/

function loadMasterData() {

    if (typeof loadDistricts === "function") {
        loadDistricts("district");
    }

    if (typeof loadPriorities === "function") {
        loadPriorities("priority");
    }

    if (typeof loadStatus === "function") {
        loadStatus();
    }

    if (typeof loadATR === "function") {
        loadATR();
    }

    if (typeof loadOfficers === "function") {
        loadOfficers("assignedOfficer");
    }

    if (typeof loadSections === "function") {
        loadSections("section");
    }

}

/*==========================================================
END OF FILE
==========================================================*/