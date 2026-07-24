/******************************************************************************
 * FILE MANAGEMENT SYSTEM (FMS)
 * File        : master-service.js
 * Version     : 3.0
 * Developer   : Lekha Technologies
 *
 * Description :
 * Firestore Master Data Service
 *
 * Collections
 * -----------
 * districts
 * mandals
 * villages
 ******************************************************************************/

"use strict";

/******************************************************************************
 * Firestore Reference
 ******************************************************************************/



/******************************************************************************
 * Load Districts
 ******************************************************************************/

async function loadDistricts()
{
    const district = document.getElementById("district");

    if (!district)
        return;

    district.innerHTML =
        '<option value="">-- Select District --</option>';

    try
    {
        const snapshot =
            await db.collection("districts")
                    .orderBy("name")
                    .get();

        snapshot.forEach(doc =>
        {
            const data = doc.data();

            district.innerHTML +=
                `<option value="${data.name}">
                    ${data.name}
                 </option>`;
        });

    }
    catch(error)
    {
        console.error("District Load Error", error);
    }
}

/******************************************************************************
 * Load Mandals
 ******************************************************************************/

async function loadMandals(districtName)
{
    const mandal =
        document.getElementById("mandal");

    if (!mandal)
        return;

    mandal.innerHTML =
        '<option value="">-- Select Mandal --</option>';

    document.getElementById("village").innerHTML =
        '<option value="">-- Select Village --</option>';

    if (!districtName)
        return;

    try
    {
        const snapshot =
            await db.collection("mandals")
                    .where("district","==",districtName)
                    .orderBy("name")
                    .get();

        snapshot.forEach(doc =>
        {
            const data = doc.data();

            mandal.innerHTML +=
                `<option value="${data.name}">
                    ${data.name}
                 </option>`;
        });

    }
    catch(error)
    {
        console.error("Mandal Load Error", error);
    }
}

/******************************************************************************
 * Load Villages
 ******************************************************************************/

async function loadVillages(districtName, mandalName)
{
    const village =
        document.getElementById("village");

    if (!village)
        return;

    village.innerHTML =
        '<option value="">-- Select Village --</option>';

    if (!districtName || !mandalName)
        return;

    try
    {
        const snapshot =
            await db.collection("villages")
                    .where("district","==",districtName)
                    .where("mandal","==",mandalName)
                    .orderBy("name")
                    .get();

        snapshot.forEach(doc =>
        {
            const data = doc.data();

            village.innerHTML +=
                `<option value="${data.name}">
                    ${data.name}
                 </option>`;
        });

    }
    catch(error)
    {
        console.error("Village Load Error", error);
    }
}

/******************************************************************************
 * Load All Master Data
 ******************************************************************************/

function loadMasterData()
{
    loadDistricts();
}