/******************************************************************************
 * FILE MANAGEMENT SYSTEM (FMS)
 * File        : master-management.js
 * Version     : 3.0
 * Developer   : Lekha Technologies
 *
 * Description :
 * Generic Master Data Controller
 ******************************************************************************/

"use strict";

const db = firebase.firestore();

let selectedId = null;

/******************************************************************************
 * Initialize
 ******************************************************************************/

document.addEventListener("DOMContentLoaded", initializeMasterPage);

function initializeMasterPage() {

    registerEvents();

    loadGrid();

}

/******************************************************************************
 * Register Events
 ******************************************************************************/

function registerEvents() {

    document.getElementById("masterType")
        .addEventListener("change", loadGrid);

    document.getElementById("btnNew")
        .addEventListener("click", newRecord);

    document.getElementById("btnSave")
        .addEventListener("click", saveRecord);

    document.getElementById("btnUpdate")
        .addEventListener("click", updateRecord);

    document.getElementById("btnDelete")
        .addEventListener("click", deleteRecord);

    document.getElementById("btnClear")
        .addEventListener("click", clearForm);

    document.getElementById("txtSearch")
        .addEventListener("keyup", searchGrid);

}

/******************************************************************************
 * Current Collection
 ******************************************************************************/

function currentCollection() {

    return document.getElementById("masterType").value;

}

/******************************************************************************
 * Load Grid
 ******************************************************************************/

async function loadGrid() {

    const tbody =
        document.querySelector("#masterGrid tbody");

    tbody.innerHTML = "";

    const snapshot =
        await db.collection(currentCollection())
                .orderBy("name")
                .get();

    let sl = 1;

    snapshot.forEach(doc => {

        const data = doc.data();

        tbody.innerHTML += `
            <tr onclick="editRecord('${doc.id}')">

                <td>${sl++}</td>

                <td>${data.name || ""}</td>

                <td>${data.code || ""}</td>

                <td>${data.active ? "Active" : "Inactive"}</td>

                <td>

                    <button
                        onclick="event.stopPropagation();editRecord('${doc.id}')">

                        Edit

                    </button>

                </td>

            </tr>`;

    });

}

/******************************************************************************
 * Save
 ******************************************************************************/

async function saveRecord() {

    if (!validate())
        return;

    await db.collection(currentCollection()).add({

        name: getValue("name"),

        code: getValue("code"),

        description: getValue("description"),

        active:
            document.getElementById("active").checked,

        createdOn:
            firebase.firestore.FieldValue.serverTimestamp()

    });

    alert("Record Saved.");

    clearForm();

    loadGrid();

}

/******************************************************************************
 * Edit
 ******************************************************************************/

async function editRecord(id) {

    selectedId = id;

    const doc =
        await db.collection(currentCollection())
                .doc(id)
                .get();

    if (!doc.exists)
        return;

    const data = doc.data();

    setValue("name", data.name);

    setValue("code", data.code);

    setValue("description", data.description);

    document.getElementById("active").checked =
        data.active;

}

/******************************************************************************
 * Update
 ******************************************************************************/

async function updateRecord() {

    if (selectedId == null)
        return;

    await db.collection(currentCollection())
        .doc(selectedId)
        .update({

            name: getValue("name"),

            code: getValue("code"),

            description: getValue("description"),

            active:
                document.getElementById("active").checked,

            modifiedOn:
                firebase.firestore.FieldValue.serverTimestamp()

        });

    alert("Updated Successfully.");

    clearForm();

    loadGrid();

}

/******************************************************************************
 * Delete
 ******************************************************************************/

async function deleteRecord() {

    if (selectedId == null)
        return;

    if (!confirm("Delete this record?"))
        return;

    await db.collection(currentCollection())
        .doc(selectedId)
        .delete();

    alert("Deleted Successfully.");

    clearForm();

    loadGrid();

}

/******************************************************************************
 * New
 ******************************************************************************/

function newRecord() {

    selectedId = null;

    clearForm();

}

/******************************************************************************
 * Clear
 ******************************************************************************/

function clearForm() {

    setValue("name", "");

    setValue("code", "");

    setValue("description", "");

    document.getElementById("active").checked = true;

    selectedId = null;

}

/******************************************************************************
 * Validation
 ******************************************************************************/

function validate() {

    if (getValue("name") === "") {

        alert("Please enter Name.");

        return false;

    }

    return true;

}

/******************************************************************************
 * Search
 ******************************************************************************/

function searchGrid() {

    const search =
        document.getElementById("txtSearch")
                .value
                .toUpperCase();

    const rows =
        document.querySelectorAll("#masterGrid tbody tr");

    rows.forEach(row => {

        row.style.display =
            row.innerText.toUpperCase().includes(search)
            ? ""
            : "none";

    });

}