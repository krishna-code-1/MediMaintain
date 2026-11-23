
(function () {
    "use strict";

    let records = [];
    let equipment = [];

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function statusClass(status) {
        return {
            "Scheduled": "status-scheduled",
            "In Progress": "status-in-progress",
            "Completed": "status-completed"
        }[status] || "";
    }

    // Load maintenance and equipment from MongoDB
    async function loadMaintenanceData() {
        const [maintenanceResponse, equipmentResponse] =
            await Promise.all([
                getAPI("/maintenance"),
                getAPI("/equipment")
            ]);

        records = maintenanceResponse.data;
        equipment = equipmentResponse.data;
    }

    // Render maintenance page
    function renderMaintenancePage() {

        const scheduled = records.filter(
            r => r.status === "Scheduled"
        ).length;

        const progress = records.filter(
            r => r.status === "In Progress"
        ).length;

        const completed = records.filter(
            r => r.status === "Completed"
        ).length;

        return `
            <section class="page-heading">
                <div>
                    <h2>Maintenance Overview</h2>
                    <p>Schedule and track equipment servicing.</p>
                </div>

                <button class="btn btn-primary" id="show-form">
                    + Schedule Maintenance
                </button>
            </section>

            <section class="stats-grid">

                <article class="stat-card">
                    <span class="stat-label">Scheduled</span>
                    <p class="stat-value">${scheduled}</p>
                </article>

                <article class="stat-card">
                    <span class="stat-label">In Progress</span>
                    <p class="stat-value">${progress}</p>
                </article>

                <article class="stat-card">
                    <span class="stat-label">Completed</span>
                    <p class="stat-value">${completed}</p>
                </article>

            </section>

            <section class="panel" id="maintenance-form" hidden>

                <div class="panel-header">
                    <h3>Schedule Maintenance</h3>
                </div>

                <div class="panel-body">

                    <form id="schedule-form">

                        <div class="form-group">
                            <label for="equipment">Equipment</label>

                            <select id="equipment"
                                name="equipmentId" required>

                                <option value="">
                                    Select equipment
                                </option>

                                ${equipment.map(item => `
                                    <option value="${escapeHTML(item._id)}">
                                        ${escapeHTML(item.name)}
                                        (${escapeHTML(item.id)})
                                    </option>
                                `).join("")}

                            </select>
                        </div>

                        <div class="form-group">
                            <label for="type">Maintenance Type</label>

                            <select id="type" name="type" required>
                                <option value="">Select type</option>
                                <option value="Preventive">Preventive</option>
                                <option value="Corrective">Corrective</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="date">Maintenance Date</label>

                            <input type="date"
                                id="date"
                                name="maintenanceDate"
                                required>
                        </div>

                        <button class="btn btn-primary" type="submit">
                            Save Schedule
                        </button>

                        <button class="btn btn-secondary"
                            id="cancel-form" type="button">
                            Cancel
                        </button>

                    </form>

                </div>
            </section>

            <section class="panel">

                <div class="panel-header">
                    <h3>Maintenance Records</h3>
                </div>

                <div class="table-wrapper">

                    <table class="data-table">

                        <thead>
                            <tr>
                                <th>Equipment</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>

                            ${records.length ? records.map(record => `
                                <tr>

                                    <td>
                                        ${escapeHTML(record.equipmentName)}
                                    </td>

                                    <td>
                                        <span class="maintenance-type ${record.type === "Preventive" ? "preventive" : "corrective"}">
                                            ${escapeHTML(record.type)}
                                        </span>
                                    </td>

                                    <td>
                                        ${new Date(record.maintenanceDate)
                                            .toLocaleDateString()}
                                    </td>

                                    <td>

                                        <select
                                            class="status-select ${statusClass(record.status)}"
                                            data-status-id="${escapeHTML(record._id)}"
                                            aria-label="Update maintenance status">

                                            ${[
                                                "Scheduled",
                                                "In Progress",
                                                "Completed"
                                            ].map(status => `
                                                <option value="${status}"
                                                    ${record.status === status
                                                        ? "selected" : ""}>
                                                    ${status}
                                                </option>
                                            `).join("")}

                                        </select>

                                    </td>

                                </tr>
                            `).join("") : `
                                <tr>
                                    <td colspan="4">
                                        No maintenance records yet.
                                    </td>
                                </tr>
                            `}

                        </tbody>

                    </table>

                </div>

            </section>
        `;
    }

    // Initialize maintenance page
    async function setupMaintenancePage() {

        const page = document.getElementById("page-content");

        async function refresh() {
            await loadMaintenanceData();

            page.innerHTML = renderMaintenancePage();
        }

        try {
            await refresh();

        } catch (error) {
            console.error("Maintenance loading error:", error);

            page.innerHTML = `
                <section class="panel">
                    <h3>Unable to load maintenance records</h3>
                    <p>${escapeHTML(error.message)}</p>
                </section>
            `;

            return;
        }

        // Show and cancel maintenance form
        page.addEventListener("click", event => {

            if (event.target.closest("#show-form")) {
                page.querySelector("#maintenance-form").hidden = false;
            }

            if (event.target.closest("#cancel-form")) {
                page.querySelector("#schedule-form").reset();

                page.querySelector("#maintenance-form").hidden = true;
            }

        });

        // Schedule maintenance
        page.addEventListener("submit", async event => {

            if (event.target.id !== "schedule-form") return;

            event.preventDefault();

            const form = event.target;
            const formData = new FormData(form);

            const equipmentId = formData.get("equipmentId");

            const selectedEquipment = equipment.find(
                item => item._id === equipmentId
            );

            if (!selectedEquipment) {
                alert("Please select valid equipment.");
                return;
            }

            const maintenanceData = {
                equipmentId: selectedEquipment._id,
                type: formData.get("type"),
                maintenanceDate: formData.get("maintenanceDate"),
                status: "Scheduled"
            };

            try {

                await postAPI("/maintenance", maintenanceData);

                await refresh();

                alert("Maintenance scheduled successfully.");

            } catch (error) {

                console.error("Scheduling error:", error);

                alert(error.message);

            }

        });

        // Update maintenance status
        page.addEventListener("change", async event => {

            const id = event.target.dataset.statusId;

            if (!id) return;

            const status = event.target.value;

            event.target.classList.remove(
                "status-scheduled",
                "status-in-progress",
                "status-completed"
            );
            event.target.classList.add(statusClass(status));

            try {

                await putAPI(`/maintenance/${id}`, {
                    status: status
                });

                await refresh();

                alert("Maintenance status updated successfully.");

            } catch (error) {

                console.error("Status update error:", error);

                alert(error.message);

                await refresh();

            }

        });

    }

    // Export functions for app.js
    window.renderMaintenancePage = renderMaintenancePage;

    window.setupMaintenancePage = setupMaintenancePage;

})();
