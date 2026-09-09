/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : id-generator.js
    Version     : 1.0.0
    Description : Auto Number Generator
==========================================================*/

"use strict";

/*==========================================================
GENERATE FILE NUMBER

Example

CPG-2026-000001

==========================================================*/

function generateFileNumber(prefix)
{
    const year = new Date().getFullYear();

    const key = prefix + "_" + year;

    let currentNumber =
        localStorage.getItem(key);

    if(currentNumber == null)
    {
        currentNumber = 1;
    }
    else
    {
        currentNumber =
            parseInt(currentNumber) + 1;
    }

    localStorage.setItem(key,currentNumber);

    return prefix +
           "-" +
           year +
           "-" +
           currentNumber.toString().padStart(6,"0");
}