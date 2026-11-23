
async function setupSettingsPage() {
    const pageContent = document.getElementById("page-content");

    try {
        const response = await getAPI("/settings");
        const settings = response.data;

        pageContent.innerHTML = `
            <section class="page-heading">
                <div>
                    <h2>Hospital Settings</h2>
                    <p>Manage hospital information.</p>
                </div>
            </section>

            <section class="panel">
                <h3>Hospital Information</h3>

                <form id="settingsForm">

                    <div class="form-group">
                        <label for="hospitalName">Hospital Name</label>
                        <input
                            type="text"
                            id="hospitalName"
                            value="${escapeSettingsHTML(settings.hospitalName || "")}"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="contactEmail">Contact Email</label>
                        <input
                            type="email"
                            id="contactEmail"
                            value="${escapeSettingsHTML(settings.contactEmail || "")}"
                        >
                    </div>

                    <div class="form-group">
                        <label for="contactPhone">Contact Phone</label>
                        <input
                            type="text"
                            id="contactPhone"
                            value="${escapeSettingsHTML(settings.contactPhone || "")}"
                        >
                    </div>

                    <button class="btn btn-primary" type="submit">
                        Save Settings
                    </button>

                    <p id="settingsMessage" role="status" aria-live="polite"></p>

                </form>
            </section>
        `;

        const settingsForm = document.getElementById("settingsForm");

        settingsForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const updatedSettings = {
                hospitalName: document.getElementById("hospitalName").value,
                contactEmail: document.getElementById("contactEmail").value,
                contactPhone: document.getElementById("contactPhone").value
            };

            const message = document.getElementById("settingsMessage");
            const submitButton = settingsForm.querySelector('button[type="submit"]');

            try {
                submitButton.disabled = true;
                await putAPI("/settings", updatedSettings);

                message.textContent = "Settings updated successfully!";
                message.className = "message-success";

            } catch (error) {
                message.textContent = error.message;
                message.className = "message-error";
            } finally {
                submitButton.disabled = false;
            }
        });

    } catch (error) {
        console.error("Settings loading error:", error);

        pageContent.innerHTML = `
            <section class="panel">
                <h3>Unable to load settings</h3>
                <p>${escapeSettingsHTML(error.message)}</p>
            </section>
        `;
    }
}

function escapeSettingsHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

window.setupSettingsPage = setupSettingsPage;
