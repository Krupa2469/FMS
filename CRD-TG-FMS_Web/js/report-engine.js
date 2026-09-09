/*==========================================================
    FILE MANAGEMENT SYSTEM (FMS)
    File        : report-engine.js
    Version     : 1.0.0
    Description : Generic Report Engine
==========================================================*/

"use strict";

/*==========================================================
TOTAL RECORDS
==========================================================*/

function getTotalRecords(records)
{
    return records.length;
}

/*==========================================================
COUNT BY FIELD VALUE
==========================================================*/

function countByField(records, fieldName, fieldValue)
{
    return records.filter(function(record)
    {
        return record[fieldName] === fieldValue;
    }).length;
}

/*==========================================================
GROUP BY FIELD
==========================================================*/

function groupByField(records, fieldName)
{
    const result = {};

    records.forEach(function(record)
    {
        const key = record[fieldName] || "Unknown";

        if(!result[key])
        {
            result[key] = 0;
        }

        result[key]++;
    });

    return result;
}

/*==========================================================
OVERDUE FILES
==========================================================*/

function getOverdueRecords(records)
{
    const today = new Date();

    return records.filter(function(record)
    {
        if(!record.dueDate)
        {
            return false;
        }

        return new Date(record.dueDate) < today &&
               record.status !== "Disposed";
    });
}

/*==========================================================
RECEIVED TODAY
==========================================================*/

function receivedToday(records)
{
    const today = new Date().toISOString().split("T")[0];

    return records.filter(function(record)
    {
        return record.dateReceived === today;
    }).length;
}

/*==========================================================
DISPOSED TODAY
==========================================================*/

function disposedToday(records)
{
    const today = new Date().toISOString().split("T")[0];

    return records.filter(function(record)
    {
        return record.disposedDate === today;
    }).length;
}

/*==========================================================
END OF FILE
==========================================================*/