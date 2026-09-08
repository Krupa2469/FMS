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

async function loadSections(dropdownId)
{
    const dropdown = document.getElementById(dropdownId);

    if (!dropdown) {
        return;
    }

    const defaultSections = [...SECTIONS];

    function render(list) {
        dropdown.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.text = "--Select Section--";
        dropdown.appendChild(defaultOption);

        list.forEach(function(section)
        {
            const option = document.createElement("option");
            option.value = section;
            option.text = section;
            dropdown.appendChild(option);
        });
    }

    try {
        const firestore =
            (typeof window.getFMSFirestore === "function"
                ? window.getFMSFirestore()
                : (window.fmsFirebase?.db || window.db));

        if (!firestore) {
            render(defaultSections);
            return;
        }

        const snapshot =
            await firestore.collection("sections").get();

        const values = [];

        snapshot.forEach(function(doc) {
            const data = doc.data() || {};
            if (data.active !== false && data.name) {
                values.push(String(data.name).trim());
            }
        });

        const merged = [...new Set(
            [...defaultSections, ...values].filter(Boolean)
        )].sort((a,b) => a.localeCompare(b));

        render(merged);
    }
    catch (error) {
        console.warn("Section master load failed; using default sections.", error);
        render(defaultSections);
    }
}

window.addEventListener("fmsFirebaseReady", function() {
    document.querySelectorAll("select").forEach(function(select) {
        if (select.id === "section" || select.id === "concernedSection") {
            loadSections(select.id);
        }
    });
});

/*==========================================================
END OF FILE
==========================================================*/