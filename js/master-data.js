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

    MODULE_A : "Citizen & Administrative Files",

    RTI      : "RTI Management",

    DISHA    : "DISHA Management"

};


/*==========================================================
FILE STATUS
==========================================================*/

const FILE_STATUS = [

    "Under Circulation",

    "Disposed"

];


/*==========================================================
ATR STATUS
==========================================================*/

const ATR_STATUS = [

    "Pending",

    "Received"

];


/*==========================================================
YES / NO
==========================================================*/

const YES_NO = [

    "Yes",

    "No"

];


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


/*==========================================================
END OF FILE
==========================================================*/