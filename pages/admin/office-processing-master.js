/*
==========================================================
FMS OFFICE PROCESSING MASTER ADMINISTRATION
Version 1.0.0
Lekha Technologies
==========================================================
*/
"use strict";

(function () {

    let selectedId = null;

    const defaults = {
        sections: [
            "Administration","Accounts","Establishment","Engineering","Planning",
            "MGNREGS","PMAY","Finance","Audit","Legal","General","IT Cell"
        ],
        officeCommunicationTypes: [
            "Letter","D.O. Letter","UO Note","Memo"
        ],
        fileStatuses: [
            "Arised","Under Circulation","Despatched","Reply Obtained","Closed"
        ]
    };

    function db() {
        return window.getFMSFirestore?.() ||
            window.fmsFirebase?.db ||
            window.db ||
            (typeof firebase !== "undefined" ? firebase.firestore() : null);
    }

    function collection() {
        return document.getElementById("masterCollection").value;
    }

    function value(id) {
        return document.getElementById(id)?.value.trim() || "";
    }

    function set(id, v) {
        const el = document.getElementById(id);
        if (el) el.value = v || "";
    }

    async function ensureDefaults() {
        const database = db();
        if (!database) return;

        for (const [name, values] of Object.entries(defaults)) {
            const snapshot = await database.collection(name).get();
            const existing = new Set();
            snapshot.forEach(doc => {
                const data = doc.data() || {};
                if (data.name) existing.add(String(data.name).trim());
            });

            const batch = database.batch();
            let count = 0;

            for (const value of values) {
                if (existing.has(value)) continue;
                const ref = database.collection(name).doc();
                batch.set(ref, {
                    name: value,
                    code: value.toUpperCase().replace(/[^A-Z0-9]+/g, "_").slice(0,30),
                    description: "FMS Master",
                    active: true,
                    createdOn: firebase.firestore.FieldValue.serverTimestamp(),
                    modifiedOn: firebase.firestore.FieldValue.serverTimestamp()
                });
                count++;
            }

            if (count) await batch.commit();
        }
    }

    async function loadGrid() {
        const body = document.querySelector("#officeMasterGrid tbody");
        if (!body) return;

        body.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

        const database = db();
        if (!database) {
            body.innerHTML = '<tr><td colspan="5">Firebase is not ready.</td></tr>';
            return;
        }

        try {
            const snapshot = await database.collection(collection()).get();
            const records = [];

            snapshot.forEach(doc => records.push({ id: doc.id, ...doc.data() }));

            const names = records.map(r => r.name).filter(Boolean);
            const all = [...new Set([...defaults[collection()] || [], ...names])]
                .sort((a,b) => a.localeCompare(b));

            body.innerHTML = "";

            all.forEach((name, index) => {
                const existing = records.find(r => r.name === name);
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${escapeHtml(name)}</td>
                    <td>${existing?.code || ""}</td>
                    <td>${existing ? (existing.active === false ? "Inactive" : "Active") : "Default"}</td>
                    <td>${existing ? `<button type="button" class="btn btn-sm btn-outline-primary" data-id="${existing.id}">Edit</button>` : "Default"}</td>
                `;
                const btn = tr.querySelector("button");
                if (btn) btn.addEventListener("click", () => edit(btn.dataset.id));
                body.appendChild(tr);
            });
        } catch (error) {
            console.error(error);
            body.innerHTML = `<tr><td colspan="5">${escapeHtml(error.message)}</td></tr>`;
        }
    }

    async function save() {
        const name = value("masterName");
        if (!name) {
            alert("Please enter a master value.");
            return;
        }

        const database = db();
        if (!database) {
            alert("Firebase is not ready.");
            return;
        }

        const data = {
            name,
            code: value("masterCode") || name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").slice(0,30),
            description: value("masterDescription"),
            active: document.getElementById("masterActive").checked,
            modifiedOn: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (selectedId) {
            await database.collection(collection()).doc(selectedId).update(data);
            alert("Master updated.");
        } else {
            const existing = await database.collection(collection())
                .where("name", "==", name).limit(1).get();

            if (!existing.empty) {
                alert("This master value already exists.");
                return;
            }

            data.createdOn = firebase.firestore.FieldValue.serverTimestamp();
            await database.collection(collection()).add(data);
            alert("Master saved.");
        }

        clear();
        await loadGrid();
    }

    async function edit(id) {
        const database = db();
        const snap = await database.collection(collection()).doc(id).get();
        if (!snap.exists) return;

        selectedId = id;
        const data = snap.data();
        set("masterName", data.name);
        set("masterCode", data.code);
        set("masterDescription", data.description);
        document.getElementById("masterActive").checked = data.active !== false;
    }

    async function remove() {
        if (!selectedId) {
            alert("Select an existing master value first.");
            return;
        }

        if (!confirm("Delete this master value?")) return;

        const database = db();
        await database.collection(collection()).doc(selectedId).delete();
        clear();
        await loadGrid();
    }

    function clear() {
        selectedId = null;
        set("masterName", "");
        set("masterCode", "");
        set("masterDescription", "");
        document.getElementById("masterActive").checked = true;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g,"&amp;").replace(/</g,"&lt;")
            .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
            .replace(/'/g,"&#039;");
    }

    function initialise() {
        document.getElementById("masterCollection")?.addEventListener("change", () => {
            clear();
            loadGrid();
        });
        document.getElementById("btnMasterNew")?.addEventListener("click", clear);
        document.getElementById("btnMasterSave")?.addEventListener("click", save);
        document.getElementById("btnMasterDelete")?.addEventListener("click", remove);
        document.getElementById("btnAdminHome")?.addEventListener("click", () => {
            window.location.href = "master-data.html";
        });
        ensureDefaults().then(loadGrid).catch(error => {
            console.error("Unable to seed office masters:", error);
            loadGrid();
        });
    }

    window.FMSOfficeMasterAdmin = { loadGrid };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialise);
    } else {
        initialise();
    }

    window.addEventListener("fmsFirebaseReady", loadGrid);

})();
