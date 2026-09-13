async function initializeSettings() {
    const session = RGMS.auth.getSession();

    document.getElementById("btnChangePassword")?.addEventListener("click", async () => {
        const current = document.getElementById("currentPassword").value;
        const next = document.getElementById("newPassword").value;
        const confirmPwd = document.getElementById("confirmPassword").value;
        const out = document.getElementById("passwordMessage");

        if (next.length < 8) { out.textContent = "New password must be at least 8 characters."; return; }
        if (next !== confirmPwd) { out.textContent = "New passwords do not match."; return; }

        try {
            await RGMS.auth.changePassword(current, next);
            out.textContent = "Password changed successfully.";
            document.getElementById("currentPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("confirmPassword").value = "";
        } catch (e) {
            console.error(e);
            out.textContent = e.message || "Unable to change password.";
        }
    });

    document.querySelectorAll(".password-toggle-rg").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = document.getElementById(btn.dataset.target);
            if (!input) return;
            const visible = input.type === "text";
            input.type = visible ? "password" : "text";
            btn.textContent = visible ? "👁" : "🙈";
            btn.setAttribute("aria-label", visible ? "Show password" : "Hide password");
        });
    });

}
window.initializeSettings = initializeSettings;
