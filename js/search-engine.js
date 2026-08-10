/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : search-engine.js
    Version     : 1.0.0
    Description : Generic Search Engine
==========================================================*/

"use strict";

/*==========================================================
SEARCH RECORDS
==========================================================*/

function searchRecords(records, searchText)
{
    if (!Array.isArray(records))
    {
        return [];
    }

    if (!searchText || searchText.trim() === "")
    {
        return records;
    }

    const keyword = searchText.toLowerCase().trim();

    return records.filter(function(record)
    {
        return Object.values(record).some(function(value)
        {
            if (value === null || value === undefined)
            {
                return false;
            }

            return String(value)
                .toLowerCase()
                .includes(keyword);
        });
    });
}

/*==========================================================
SEARCH BY FIELD
==========================================================*/

function searchByField(records, fieldName, value)
{
    if (!value)
    {
        return records;
    }

    return records.filter(function(record)
    {
        return String(record[fieldName] || "")
            .toLowerCase()
            .includes(value.toLowerCase());
    });
}

/*==========================================================
FILTER BY DATE RANGE
==========================================================*/

function filterByDate(records, fieldName, fromDate, toDate)
{
    return records.filter(function(record)
    {
        if (!record[fieldName])
        {
            return false;
        }

        const recordDate = new Date(record[fieldName]);

        if (fromDate && recordDate < new Date(fromDate))
        {
            return false;
        }

        if (toDate && recordDate > new Date(toDate))
        {
            return false;
        }

        return true;
    });
}

/*==========================================================
SORT RECORDS
==========================================================*/

function sortRecords(records, fieldName, ascending = true)
{
    return [...records].sort(function(a, b)
    {
        const valueA = String(a[fieldName] || "");
        const valueB = String(b[fieldName] || "");

        return ascending
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
    });
}

/*==========================================================
END OF FILE
==========================================================*/