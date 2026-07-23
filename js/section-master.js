/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : section-master.js
    Version     : 1.0.0
    Description : Section Master
==========================================================*/

"use strict";

/*==========================================================
SECTIONS
==========================================================*/

const SECTIONS = [

    "Administration",

    "Accounts",

    "Establishment",

    "Engineering",

    "Planning",

    "MGNREGS",

    "PMAY",

    "Finance",

    "Audit",

    "Legal",

    "General",

    "IT Cell"

];

/*==========================================================
LOAD SECTION DROPDOWN
==========================================================*/

function loadSections(dropdownId)
{
    const dropdown = document.getElementById(dropdownId);

    if (!dropdown)
    {
        return;
    }

    dropdown.innerHTML = "";

    const defaultOption = document.createElement("option");

    defaultOption.value = "";

    defaultOption.text = "--Select Section--";

    dropdown.appendChild(defaultOption);

    SECTIONS.forEach(function(section)
    {
        const option = document.createElement("option");

        option.value = section;

        option.text = section;

        dropdown.appendChild(option);
    });
}

/*==========================================================
END OF FILE
==========================================================*/