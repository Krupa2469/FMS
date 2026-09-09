/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : officer-master.js
    Version     : 1.0.0
    Description : Officer Master
==========================================================*/

"use strict";

/*==========================================================
OFFICERS
(Temporary Sample Data)
==========================================================*/

const OFFICERS = [

    "Commissioner",

    "Special Commissioner",

    "Joint Commissioner",

    "Administrative Officer",

    "Assistant Director",

    "District Rural Development Officer",

    "Assistant Project Director",

    "Project Director",

    "Section Officer",

    "Superintendent",

    "Senior Assistant",

    "Junior Assistant"

];

window.OFFICERS = OFFICERS;

/*==========================================================
LOAD OFFICERS
==========================================================*/

function loadOfficers(dropdownId)
{
    const dropdown = document.getElementById(dropdownId);

    if (!dropdown)
    {
        return;
    }

    dropdown.innerHTML = "";

    const defaultOption = document.createElement("option");

    defaultOption.value = "";

    defaultOption.text = "--Select Officer--";

    dropdown.appendChild(defaultOption);

    OFFICERS.forEach(function(officer)
    {
        const option = document.createElement("option");

        option.value = officer;

        option.text = officer;

        dropdown.appendChild(option);
    });
}

/*==========================================================
END OF FILE
==========================================================*/