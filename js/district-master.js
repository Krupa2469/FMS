/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : district-master.js
    Version     : 1.0.0
    Description : Telangana District Master
==========================================================*/

"use strict";

/*==========================================================
TELANGANA DISTRICTS
==========================================================*/

const DISTRICTS = [

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
    "Komaram Bheem Asifabad",
    "Mahabubabad",
    "Mahabubnagar",
    "Mancherial",
    "Medak",
    "Medchal-Malkajgiri",
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

/*==========================================================
LOAD DISTRICT DROPDOWN
==========================================================*/

function loadDistricts(dropdownId)
{
    const dropdown = document.getElementById(dropdownId);

    if (!dropdown)
        return;

    dropdown.innerHTML = "";

    const defaultOption = document.createElement("option");

    defaultOption.value = "";

    defaultOption.text = "--Select District--";

    dropdown.appendChild(defaultOption);

    DISTRICTS.forEach(function(district)
    {
        const option = document.createElement("option");

        option.value = district;

        option.text = district;

        dropdown.appendChild(option);
    });
}

/*==========================================================
END OF FILE
==========================================================*/