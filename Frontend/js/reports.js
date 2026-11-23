
async function setupReportsPage() {
    const pageContent = document.getElementById("page-content");

    try {
        const response = await getAPI("/reports");

        const { equipment, maintenance, categoryReport, departmentReport } = response.data;

        pageContent.innerHTML = `
            <section class="page-heading">
                <div>
                    <h2>Equipment Reports</h2>
                    <p>Hospital equipment and maintenance analytics.</p>
                </div>
            </section>

            <section class="eqm-summary">

                <article class="eqm-summary-card">
                    Total Equipment
                    <strong>${equipment.totalEquipment}</strong>
                </article>

                <article class="eqm-summary-card">
                    Working
                    <strong>${equipment.working}</strong>
                </article>

                <article class="eqm-summary-card">
                    Under Maintenance
                    <strong>${equipment.underMaintenance}</strong>
                </article>

                <article class="eqm-summary-card">
                    Out of Service
                    <strong>${equipment.outOfService}</strong>
                </article>

            </section>

            <section class="panel">
                <h3>Maintenance Statistics</h3>

                <section class="eqm-summary">

                    <article class="eqm-summary-card">
                        Total Maintenance
                        <strong>${maintenance.totalMaintenance}</strong>
                    </article>

                    <article class="eqm-summary-card">
                        Completed
                        <strong>${maintenance.completed}</strong>
                    </article>

                    <article class="eqm-summary-card">
                        Scheduled
                        <strong>${maintenance.scheduled}</strong>
                    </article>

                    <article class="eqm-summary-card">
                        In Progress
                        <strong>${maintenance.inProgress}</strong>
                    </article>

                </section>
            </section>

            <section class="panel">
                <h3>Category-wise Equipment</h3>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Total Equipment</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${categoryReport.map(item => `
                            <tr>
                                <td>${escapeReportHTML(item._id || "Other")}</td>
                                <td>${item.count}</td>
                            </tr>
                        `).join("") || `
                            <tr>
                                <td colspan="2">No equipment records found.</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </section>

            <section class="panel">
                <h3>Department-wise Equipment</h3>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th>Total Equipment</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${departmentReport.map(item => `
                            <tr>
                                <td>${escapeReportHTML(item._id || "Other")}</td>
                                <td>${item.count}</td>
                            </tr>
                        `).join("") || `
                            <tr>
                                <td colspan="2">No department records found.</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </section>
        `;

    } catch (error) {
        console.error("Reports loading error:", error);

        pageContent.innerHTML = `
            <section class="panel">
                <h3>Unable to load reports</h3>
                <p>${escapeReportHTML(error.message)}</p>
            </section>
        `;
    }
}

function escapeReportHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
    })[character]);
}

window.setupReportsPage = setupReportsPage;
