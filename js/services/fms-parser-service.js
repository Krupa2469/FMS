/* =========================================================
   FMS CENTRAL PARSER SERVICE
   Version 1.0
   One entry point for document parsing in all FMS modules.
   Lekha Technologies
========================================================= */
(function (window) {
    "use strict";

    const Service = {
        version: "1.0.0",

        async parseFile(file, moduleName) {
            if (!window.FMSDocumentEngine) throw new Error("FMS Document Engine is not loaded.");
            const module = String(moduleName || "GENERIC").toUpperCase();
            const result = await window.FMSDocumentEngine.parse({ file, module });
            if (!result.success) throw new Error(result.error || "Document parsing failed.");
            return result;
        },

        fillFields(fields, mapping, options = {}) {
            const onlyEmpty = options.onlyEmpty !== false;
            const changed = [];

            const normalize = value => String(value ?? "")
                .trim().toLowerCase()
                .replace(/\s+/g, " ")
                .replace(/[._-]/g, " ");

            const formatDate = (value, el) => {
                if (!value) return "";
                let v = String(value).trim();
                let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
                if (m) {
                    if (el && el.type === "date") return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;
                    return `${String(m[3]).padStart(2,"0")}/${String(m[2]).padStart(2,"0")}/${m[1]}`;
                }
                m = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
                if (m && el && el.type === "date") return `${m[3]}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`;
                return v;
            };

            const setControl = (el, value) => {
                if (el.tagName === "SELECT") {
                    const wanted = normalize(value);
                    let option = Array.from(el.options).find(o => normalize(o.value) === wanted);
                    if (!option) option = Array.from(el.options).find(o => normalize(o.textContent) === wanted);
                    if (!option && wanted) {
                        option = Array.from(el.options).find(o => {
                            const a=normalize(o.value), b=normalize(o.textContent);
                            return a.includes(wanted) || wanted.includes(a) || b.includes(wanted) || wanted.includes(b);
                        });
                    }
                    if (option) {
                        el.value = option.value;
                        return true;
                    }
                    return false;
                }
                const finalValue = (el.type === "date" || /date/i.test(el.id || "")) ? formatDate(value, el) : value;
                el.value = finalValue;
                return String(el.value ?? "") === String(finalValue ?? "");
            };

            Object.keys(mapping || {}).forEach(key => {
                let value = fields ? fields[key] : "";
                if (value === undefined || value === null || value === "") return;
                const id = mapping[key];
                const el = document.getElementById(id);
                if (!el) return;

                const current = String(el.value || "").trim();
                if (onlyEmpty && current !== "") return;

                if (setControl(el, value)) {
                    changed.push(id);
                    el.dispatchEvent(new Event("input", { bubbles: true }));
                    el.dispatchEvent(new Event("change", { bubbles: true }));
                }
            });

            // Re-apply dependent dropdowns after district changes.
            const districtKey = Object.keys(mapping || {}).find(k => /district/i.test(k));
            const districtId = districtKey ? mapping[districtKey] : null;
            if (districtId && fields && fields[districtKey]) {
                const districtEl = document.getElementById(districtId);
                if (districtEl) {
                    setTimeout(() => {
                        ["mandal","village"].forEach(key => {
                            const id=mapping[key];
                            const value=fields[key];
                            const el=id ? document.getElementById(id) : null;
                            if (el && value && (!onlyEmpty || !String(el.value||"").trim())) {
                                if (setControl(el,value)) {
                                    el.dispatchEvent(new Event("input",{bubbles:true}));
                                    el.dispatchEvent(new Event("change",{bubbles:true}));
                                }
                            }
                        });
                    }, 150);
                }
            }
            return changed;
        },

        notify(message, type = "info") {
            const candidates = ["messageArea", "rtiMessage", "dishaMessage"];
            const target = candidates.map(id => document.getElementById(id)).find(Boolean);
            if (!target) { console.log(message); return; }
            target.innerHTML = `<div class="alert alert-${type}" role="alert">${this.escape(message)}</div>`;
            setTimeout(() => { if (target) target.innerHTML = ""; }, 5000);
        },

        escape(value) {
            return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
        },

        formatConfidence(confidence) {
            const values = Object.values(confidence || {}).filter(v => typeof v === "number");
            if (!values.length) return 0;
            return Math.round(values.reduce((a,b) => a+b, 0) / values.length);
        }
    };

    window.FMSParserService = Service;
})(window);
