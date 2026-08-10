/******************************************************************************
 * mandal-master.js
 * Master data for District → Mandal
 ******************************************************************************/

"use strict";

/* Sample Master Data
   Replace this with complete Telangana data later.
*/

const MANDAL_MASTER = {

    "Nagarkurnool": [
        "Achampet",
        "Amrabad",
        "Balmoor",
        "Bijinapally",
        "Kalwakurthy",
        "Kollapur",
        "Lingal",
        "Nagarkurnool",
        "Peddakothapally",
        "Telkapally",
        "Thimmajipet",
        "Uppununthala"
    ]

};

window.MANDAL_MASTER = MANDAL_MASTER;

/*==========================================================
Load Mandals
==========================================================*/

function loadMandals(district) {

    console.log("District received:", district);

    console.log(MANDAL_MASTER);

    const mandal = document.getElementById("mandal");

    mandal.innerHTML =
        '<option value="">-- Select Mandal --</option>';

    const village = document.getElementById("village");

    if (village) {
        village.innerHTML =
            '<option value="">-- Select Village --</option>';
    }

    if (!district)
        return;

    const list = MANDAL_MASTER[district] || [];

    console.log("Mandals found:", list);

    list.forEach(item => {

        const option = document.createElement("option");

        option.value = item;

        option.text = item;

        mandal.appendChild(option);

    });

}