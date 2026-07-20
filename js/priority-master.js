/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : priority-master.js
    Version     : 1.0.0
    Description : Priority Master
==========================================================*/

"use strict";

/*==========================================================
PRIORITY MASTER
==========================================================*/

const PRIORITIES = [
    "Normal",
    "Urgent",
    "Immediate"
];

/*==========================================================
LOAD PRIORITY DROPDOWN
==========================================================*/

function loadPriorities(dropdownId)
{
    const dropdown = document.getElementById(dropdownId);

    if (!dropdown)
    {
        return;
    }

    dropdown.innerHTML = "";

    const defaultOption = document.createElement("option");

    defaultOption.value = "";

    defaultOption.text = "--Select Priority--";

    dropdown.appendChild(defaultOption);

    PRIORITIES.forEach(function(priority)
    {
        const option = document.createElement("option");

        option.value = priority;

        option.text = priority;

        dropdown.appendChild(option);
    });
}

/*==========================================================
END OF FILE
==========================================================*/