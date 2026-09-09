/******************************************************************
 * address-extractor.js
 * Enterprise Parser V2
 * Address Extraction Engine
 ******************************************************************/

console.log("Address Extractor Loaded");

/*---------------------------------------------------------------
    Extract Address
---------------------------------------------------------------*/
function extractAddress(text) {

    if (!text)
        return "";

    const patterns = [

        /Address\s*[:\-]?\s*([\s\S]*?)(Mobile|Email|District|State|PIN|Pincode)/i,

        /Address\s*[:\-]?\s*([\s\S]*?)(Phone|Cell|Village)/i,

        /Resident of\s*([\s\S]*?)(District|State)/i

    ];

    for (const pattern of patterns) {

        const match = text.match(pattern);

        if (match) {

            return cleanAddress(match[1]);

        }

    }

    return "";

}

/*---------------------------------------------------------------
    Clean Address
---------------------------------------------------------------*/
function cleanAddress(address) {

    if (!address)
        return "";

    return address

        .replace(/\n/g, " ")

        .replace(/\r/g, " ")

        .replace(/\s+/g, " ")

        .replace(/PIN.*$/i, "")

        .replace(/Pincode.*$/i, "")

        .trim();

}

/*---------------------------------------------------------------
    Extract PIN
---------------------------------------------------------------*/
function extractPinCode(text) {

    const match = text.match(/\b\d{6}\b/);

    return match ? match[0] : "";

}

/*---------------------------------------------------------------
    Extract District
---------------------------------------------------------------*/
function extractDistrict(text) {

    const districts = [

        "Adilabad",
        "Bhadradri Kothagudem",
        "Hanamkonda",
        "Hyderabad",
        "Jagtial",
        "Jangaon",
        "Jayashankar Bhupalpally",
        "Jogulamba Gadwal",
        "Kamareddy",
        "Karimnagar",
        "Khammam",
        "Komaram Bheem",
        "Mahabubabad",
        "Mahabubnagar",
        "Mancherial",
        "Medak",
        "Medchal Malkajgiri",
        "Mulugu",
        "Nagarkurnool",
        "Nalgonda",
        "Narayanpet",
        "Nirmal",
        "Nizamabad",
        "Peddapalli",
        "Rajanna Sircilla",
        "Ranga Reddy",
        "Sangareddy",
        "Siddipet",
        "Suryapet",
        "Vikarabad",
        "Wanaparthy",
        "Warangal",
        "Yadadri Bhuvanagiri"

    ];

    const upper = text.toUpperCase();

    for (const district of districts) {

        if (upper.includes(district.toUpperCase()))
            return district;

    }

    return "";

}

/*---------------------------------------------------------------
    Extract State
---------------------------------------------------------------*/
function extractState(text) {

    const states = [

        "Telangana",
        "Andhra Pradesh",
        "Karnataka",
        "Tamil Nadu",
        "Kerala",
        "Odisha",
        "Maharashtra"

    ];

    const upper = text.toUpperCase();

    for (const state of states) {

        if (upper.includes(state.toUpperCase()))
            return state;

    }

    return "";

}

/*---------------------------------------------------------------
    Export
---------------------------------------------------------------*/

window.extractAddress = extractAddress;
window.extractDistrict = extractDistrict;
window.extractState = extractState;
window.extractPinCode = extractPinCode;