/*****************************************************************
    document-parser.js
    CPGRAMS PDF Parser
    Stage 1
*****************************************************************/


/*---------------------------------------------------------------
    Normalize PDF Text
---------------------------------------------------------------*/

function normalizeText(text) {

    return text
        .replace(/\r/g, "")
        .replace(/\t/g, " ")
        .replace(/\u00A0/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .replace(/\n{2,}/g, "\n")
        .trim();

}


/*---------------------------------------------------------------
    Generic Pattern Matcher
---------------------------------------------------------------*/

function matchFirst(text, patterns) {

    for (const pattern of patterns) {

        const match = text.match(pattern);

        if (match && match[1]) {

            return match[1]
                .replace(/\s+/g, " ")
                .trim();
        }
    }

    return "";
}

/*---------------------------------------------------------------
    Registration Number
---------------------------------------------------------------*/

function extractRegistrationNumber(text) {

    const match =
        text.match(/(PMOPG|DORLD|DARPG|GOI|CPGRAMS)?\/?[A-Z]?\/?\d{4}\/\d+/i);

    return match ? match[0] : "";

}


/*---------------------------------------------------------------
    Date Received
---------------------------------------------------------------*/

function extractDateReceived(text) {

    const match =
        text.match(/\d{2}\/\d{2}\/\d{4}/);

    return match ? match[0] : "";

}


/*---------------------------------------------------------------
    Due Date (21 Days)
---------------------------------------------------------------*/

function calculateDueDate(dateReceived) {

    if (!dateReceived)
        return "";

    const parts = dateReceived.split("/");

    const date = new Date(

        Number(parts[2]),
        Number(parts[1]) - 1,
        Number(parts[0])

    );

    date.setDate(date.getDate() + 21);

    const yyyy = date.getFullYear();

    const mm = String(date.getMonth() + 1)
        .padStart(2, "0");

    const dd = String(date.getDate())
        .padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;

}

/*---------------------------------------------------------------
    Complainant Name
---------------------------------------------------------------*/

function extractComplainantName(text){

    const patterns=[

        /Name\s*[:\-]?\s*(.+?)\s*Date of receipt/is,

        /Name\s*[:\-]?\s*(.+?)\s*Address/is,

        /Complainant\s*[:\-]?\s*(.+?)\s*Address/is,

        /Applicant\s*[:\-]?\s*(.+?)\s*Address/is

    ];

    for(const pattern of patterns){

        const match=text.match(pattern);

        if(match){

            return match[1]
                .replace(/\s+/g," ")
                .trim();
        }

    }

    return "";

}

/*---------------------------------------------------------------
    Mobile Number
---------------------------------------------------------------*/

function extractMobile(text) {

    const match = text.match(/\b[6-9]\d{9}\b/);

    return match ? match[0] : "";

}


/*---------------------------------------------------------------
    Email
---------------------------------------------------------------*/

function extractEmail(text) {

    const match =
        text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);

    return match ? match[0] : "";

}

/*---------------------------------------------------------------
    District
---------------------------------------------------------------*/

function extractDistrict(text) {

    const districts = [
        "Adilabad","Bhadradri Kothagudem","Hanamkonda",
        "Hyderabad","Jagtial","Jangaon","Jayashankar",
        "Jogulamba Gadwal","Kamareddy","Karimnagar",
        "Khammam","Komaram Bheem","Mahabubabad",
        "Mahabubnagar","Mancherial","Medak",
        "Medchal-Malkajgiri","Mulugu","Nagarkurnool",
        "Nalgonda","Narayanpet","Nirmal",
        "Nizamabad","Peddapalli","Rajanna Sircilla",
        "Ranga Reddy","Sangareddy","Siddipet",
        "Suryapet","Vikarabad","Wanaparthy",
        "Warangal","Yadadri Bhuvanagiri"
    ];

    for (const district of districts) {

        if (text.toUpperCase().includes(district.toUpperCase()))
            return district;

    }

    return "";

}


/*---------------------------------------------------------------
    State
---------------------------------------------------------------*/

function extractState(text) {

    if (text.toUpperCase().includes("TELANGANA"))
        return "Telangana";

    return "";

}


/*---------------------------------------------------------------
    Mandal
---------------------------------------------------------------*/

function extractMandal(text) {

    const match =
        text.match(/([A-Za-z ]+?)\s+Mandal/i);

    if (!match)
        return "";

    return match[1].trim();

}


/*---------------------------------------------------------------
    Village
---------------------------------------------------------------*/

function extractVillage(text) {

    const match =
        text.match(/([A-Za-z ]+?)\s+Village/i);

    if (!match)
        return "";

    return match[1].trim();

}


/*---------------------------------------------------------------
    Address
---------------------------------------------------------------*/

function extractAddress(text) {

    const match =
        text.match(/Address(.*?)(Mobile|Email|District)/is);

    if (!match)
        return "";

    return match[1]
        .replace(/\s+/g, " ")
        .trim();

}

/*---------------------------------------------------------------
    Department
---------------------------------------------------------------*/

function extractDepartment(text) {

    const departments = [

        "Rural Development",
        "Panchayat Raj",
        "Revenue",
        "Agriculture",
        "Education",
        "Health",
        "Police",
        "Electricity",
        "Municipal Administration",
        "Irrigation",
        "Transport",
        "Housing",
        "Women and Child Welfare"

    ];

    for (const dept of departments) {

        if (text.toUpperCase().includes(dept.toUpperCase()))
            return dept;

    }

    return "";

}

/*---------------------------------------------------------------
    Category
---------------------------------------------------------------*/

function extractCategory(text) {

    const categories = {

        "MGNREGS": "MGNREGS",
        "SALARIES": "MGNREGS",
        "WAGES": "MGNREGS",

        "ROAD": "Roads",

        "DRINKING WATER": "Drinking Water",

        "PENSION": "Pensions",

        "HOUSING": "Housing",

        "PMAY": "PMAY",

        "DRAINAGE": "Drainage",

        "ELECTRICITY": "Electricity"

    };

    const upper = text.toUpperCase();

    for (const key in categories) {

        if (upper.includes(key))
            return categories[key];

    }

    return "Others";

}

/*---------------------------------------------------------------
    Nature
---------------------------------------------------------------*/

function extractNature(text) {

    const upper = text.toUpperCase();

    if (
        upper.includes("VILLAGE") ||
        upper.includes("ROAD") ||
        upper.includes("COMMUNITY")
    )
        return "Community";

    return "Individual";

}

/*---------------------------------------------------------------
    Priority
---------------------------------------------------------------*/

function extractPriority(text) {

    const upper = text.toUpperCase();

    if (
        upper.includes("URGENT") ||
        upper.includes("EMERGENCY")
    )
        return "Urgent";

    if (
        upper.includes("IMMEDIATELY") ||
        upper.includes("VERY URGENT")
    )
        return "Very Urgent";

    return "Normal";

}

/*---------------------------------------------------------------
    Subject
---------------------------------------------------------------*/

function extractSubject(text) {

    const patterns = [

        /Subject\s*[:\-]?\s*(.+?)(?:\n|Grievance|Department|Address)/is,

        /Issue\s*[:\-]?\s*(.+?)(?:\n|Grievance)/is,

        /Regarding\s*[:\-]?\s*(.+?)(?:\n|Department)/is,

        /Re\s*[:\-]?\s*(.+?)(?:\n|Department)/is

    ];

    for (const pattern of patterns) {

        const match = text.match(pattern);

        if (match) {

            const subject = match[1]
                .replace(/\s+/g, " ")
                .trim();

            if (subject.length > 5)
                return subject;
        }
    }

    return "";
}

/*---------------------------------------------------------------
    Description
---------------------------------------------------------------*/

function extractDescription(text) {

    const start = text.search(
        /The grievance/i
    );

    if (start === -1)
        return "";

    const end = text.search(
        /CASE REPORT SENT|Print|Close/i
    );

    if (end === -1)
        return text.substring(start).trim();

    return text.substring(start, end).trim();
}


/*---------------------------------------------------------------
    Main Parser
---------------------------------------------------------------*/

function parseCPGRAMSPDF(pdfText) {

    const text = normalizeText(pdfText);

    const grievanceNumber =
        extractRegistrationNumber(text);

    const dateReceived =
        extractDateReceived(text);

    const dueDate =
        calculateDueDate(dateReceived);

   const complainantName =
    extractComplainantName(text);

const mobile =
    extractMobile(text);

const email =
    extractEmail(text);

    const district =
    extractDistrict(text);

const mandal =
    extractMandal(text);

const village =
    extractVillage(text);

const state =
    extractState(text);

const address =
    extractAddress(text);

const department = extractDepartment(text);

const category = extractCategory(text);

const nature = extractNature(text);

const priority = extractPriority(text);

const subject = extractSubject(text);

const grievanceDescription = extractDescription(text);

const result = {

    grievanceNumber,

    dateReceived,

    dueDate,

    complainantName,

    mobile,

    email,

    district,

    mandal,

    village,

    state,

    address,

    department,

    category,

    nature,

    priority,

    subject,

    grievanceDescription

};

result.confidence = {

    grievanceNumber: grievanceNumber ? 100 : 0,
    complainantName: complainantName ? 100 : 0,
    mobile: mobile ? 100 : 0,
    email: email ? 100 : 0,
    district: district ? 100 : 0,
    subject: subject ? 100 : 0,
    grievanceDescription: grievanceDescription ? 100 : 0

};

const missing = [];

Object.entries(result).forEach(([key, value]) => {

    if (
        value === "" ||
        value === null ||
        value === undefined
    ) {
        missing.push(key);
    }

});

console.log("Missing Fields:", missing);


// Intelligent Classification

const classification =
    classifyGrievance(result);

Object.assign(result, classification);

// Generate Smart Subject

result.subject =
    buildSmartSubject(result);

// Extract Search Keywords

result.keywords =
    extractKeywords(

        result.subject + " " +
        result.grievanceDescription

      
    );
    console.log("========== Stage 1 ==========");

    console.table(result);

    console.log("=============================");

    return result;

}

window.parseCPGRAMSPDF = parseCPGRAMSPDF;

window.normalizeText = normalizeText;

window.extractRegistrationNumber = extractRegistrationNumber;

    