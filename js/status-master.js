/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : status-master.js
    Version     : 1.0.0
    Description : Status Master
==========================================================*/

"use strict";

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

    "No",

    "Yes"

];

/*==========================================================
GENERAL YES / NO
==========================================================*/

const YES_NO = [

    "No",

    "Yes"

];

/*==========================================================
LOAD DROPDOWN
==========================================================*/

function loadDropdown(dropdownId, data, defaultText)
{
    const dropdown = document.getElementById(dropdownId);

    if (!dropdown)
    {
        return;
    }

    dropdown.innerHTML = "";

    const option = document.createElement("option");

    option.value = "";

    option.text = defaultText;

    dropdown.appendChild(option);

    data.forEach(function(item)
    {
        const newOption = document.createElement("option");

        newOption.value = item;

        newOption.text = item;

        dropdown.appendChild(newOption);
    });
}

/*==========================================================
LOAD STATUS
==========================================================*/

function loadStatuses()
{
    loadDropdown(
        "status",
        FILE_STATUS,
        "--Select Status--"
    );
}

/*==========================================================
LOAD ATR
==========================================================*/

function loadATR()
{
    loadDropdown(
        "atrReceived",
        ATR_STATUS,
        "--Select--"
    );
}

/*==========================================================
LOAD DISPOSAL
==========================================================*/

function loadDisposed()
{
    loadDropdown(
        "disposed",
        YES_NO,
        "--Select--"
    );
}

/*==========================================================
END OF FILE
==========================================================*/