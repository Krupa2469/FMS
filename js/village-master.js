/******************************************************************************
 * village-master.js
 * Master data for Mandal → Village
 ******************************************************************************/

"use strict";

/*
    Sample data.
    We will later replace this with complete Telangana master data.
*/

const VILLAGE_MASTER = {

    "Nagarkurnool": {

        "Nagarkurnool": [
            "Nagarkurnool",
            "Uyyalawada",
            "Peddapur",
            "Thoodukurthy"
        ],

        "Kalwakurthy": [
            "Kalwakurthy",
            "Marchala",
            "Veldanda",
            "Raghupathipet"
        ],

        "Achampet": [
            "Achampet",
            "Balmoor",
            "Lingotam",
            "Upparapally"
        ]

    }

};

/*==========================================================
Load Villages
==========================================================*/

function loadVillages(district, mandal)
{
    const village =
        document.getElementById("village");

    village.innerHTML =
        '<option value="">-- Select Village --</option>';

    if (!district || !mandal)
        return;

    const villages =
        VILLAGE_MASTER[district]?.[mandal] || [];

    villages.forEach(name => {

        const option =
            document.createElement("option");

        option.value = name;

        option.text = name;

        village.appendChild(option);

    });

}