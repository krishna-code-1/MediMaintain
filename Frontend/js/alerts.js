
async function setupAlertsPage() {
    const pageContent = document.getElementById("page-content");
    try {
        const response = await getAPI("/alerts");

        const { upcoming, overdue } = response.data;
        const statusClass = {
            "Scheduled": "status-scheduled",
            "In Progress": "status-in-progress",
            "Completed": "status-completed"
        };

        pageContent.innerHTML = `
            <section class="page-heading">
                <div>
                    <h2>Maintenance Alerts</h2>
                    <p>Upcoming and overdue equipment maintenance.</p>
                </div>
            </section>

            <section class="eqm-summary">
                <article class="eqm-summary-card">
                    Upcoming Maintenance
                    <strong>${upcoming.length}</strong>
                </article>

                <article class="eqm-summary-card">
                    Overdue Maintenance
                    <strong>${overdue.length}</strong>
                </article>
            </section>

            <section class="panel">
                <h3>Upcoming Maintenance</h3>
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
                            ${upcoming.map(item => `
                                <tr>
                                    <td>${escapeAlertHTML(item.equipmentName)}</td>
                                    <td>${escapeAlertHTML(item.type)}</td>
                                    <td>${new Date(item.maintenanceDate).toLocaleDateString()}</td>
                                    <td>
                                        <span class="status-badge ${statusClass[item.status] || ""}">
                                            ${escapeAlertHTML(item.status)}
                                        </span>
                                    </td>
                                </tr>
                            `).join("") || `
                                <tr>
                                    <td colspan="4">No upcoming maintenance.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="panel">
                <h3>Overdue Maintenance</h3>
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
                            ${overdue.map(item => `
                                <tr>
                                    <td>${escapeAlertHTML(item.equipmentName)}</td>
                                    <td>${escapeAlertHTML(item.type)}</td>
                                    <td>${new Date(item.maintenanceDate).toLocaleDateString()}</td>
                                    <td>
                                        <span class="status-badge ${statusClass[item.status] || ""}">
                                            ${escapeAlertHTML(item.status)}
                                        </span>
                                    </td>
                                </tr>
                            `).join("") || `
                                <tr>
                                    <td colspan="4">No overdue maintenance.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </section>
        `;

    } catch (error) {
        console.error("Alerts loading error:", error);

        pageContent.innerHTML = `
            <section class="panel">
                <h3>Unable to load alerts</h3>
                <p>${escapeAlertHTML(error.message)}</p>
            </section>
        `;
    }
}

function escapeAlertHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
    })[character]);
}

window.setupAlertsPage = setupAlertsPage;
