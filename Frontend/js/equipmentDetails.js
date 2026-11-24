function escapeEquipmentHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatEquipmentDate(value) {
    return value ? new Date(value).toLocaleDateString() : "-";
}

async function setupEquipmentDetailsPage() {
    const pageContent = document.getElementById("page-content");
    const params = new URLSearchParams(window.location.search);
    const equipmentId = params.get("id");

    try {
        if (!equipmentId) {
            throw new Error("Equipment ID not provided");
        }

        if (!/^[\da-f]{24}$/i.test(equipmentId)) {
            throw new Error("Invalid equipment ID");
        }

        const [equipmentResponse, maintenanceResponse] = await Promise.all([
            getAPI(`/equipment/${encodeURIComponent(equipmentId)}`),
            getAPI(`/maintenance?equipmentId=${encodeURIComponent(equipmentId)}`)
        ]);
        const equipment = equipmentResponse.data;
        const history = maintenanceResponse.data;
        const statusClass = {
            "Working": "status-working",
            "Under Maintenance": "status-under-maintenance",
            "Out of Service": "status-out-of-service"
        };
        const maintenanceStatusClass = {
            "Scheduled": "status-scheduled",
            "In Progress": "status-in-progress",
            "Completed": "status-completed"
        };

        pageContent.innerHTML = `
            <section class="page-heading">
                <div>
                    <h2>Equipment Details</h2>
                    <p>Complete equipment information and maintenance history.</p>
                </div>
                <a class="btn btn-secondary" href="equipment.html">Back to Equipment</a>
            </section>

            <section class="panel equipment-profile">
                <h3>${escapeEquipmentHTML(equipment.name)}</h3>
                <table class="data-table">
                    <tbody>
                        <tr><th>Equipment ID</th><td>${escapeEquipmentHTML(equipment.id)}</td></tr>
                        <tr><th>Category</th><td>${escapeEquipmentHTML(equipment.category)}</td></tr>
                        <tr><th>Department</th><td>${escapeEquipmentHTML(equipment.department)}</td></tr>
                        <tr><th>Manufacturer</th><td>${escapeEquipmentHTML(equipment.manufacturer)}</td></tr>
                        <tr><th>Model Number</th><td>${escapeEquipmentHTML(equipment.modelNumber || "-")}</td></tr>
                        <tr><th>Serial Number</th><td>${escapeEquipmentHTML(equipment.serialNumber)}</td></tr>
                        <tr>
                            <th>Status</th>
                            <td><span class="status-badge ${statusClass[equipment.status] || ""}">${escapeEquipmentHTML(equipment.status)}</span></td>
                        </tr>
                        <tr><th>Purchase Date</th><td>${formatEquipmentDate(equipment.purchaseDate)}</td></tr>
                        <tr><th>Last Maintenance</th><td>${formatEquipmentDate(equipment.lastMaintenanceDate)}</td></tr>
                        <tr><th>Next Maintenance</th><td>${formatEquipmentDate(equipment.nextMaintenanceDate)}</td></tr>
                        <tr><th>Notes</th><td>${escapeEquipmentHTML(equipment.notes || "-")}</td></tr>
                    </tbody>
                </table>
            </section>

            <section class="panel maintenance-history">
                <h3>Maintenance History</h3>
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr><th>Type</th><th>Date</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            ${history.length ? history.map(record => `
                                <tr>
                                    <td>${escapeEquipmentHTML(record.type)}</td>
                                    <td>${formatEquipmentDate(record.maintenanceDate)}</td>
                                    <td>
                                        <span class="status-badge ${maintenanceStatusClass[record.status] || ""}">
                                            ${escapeEquipmentHTML(record.status)}
                                        </span>
                                    </td>
                                </tr>
                            `).join("") : `
                                <tr><td colspan="3">No maintenance records for this equipment.</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    } catch (error) {
        console.error("Equipment details error:", error);
        pageContent.innerHTML = `
            <section class="panel">
                <h3>Unable to load equipment details</h3>
                <p>${escapeEquipmentHTML(error.message)}</p>
                <a class="btn btn-secondary" href="equipment.html">Back to Equipment</a>
            </section>
        `;
    }
}

window.setupEquipmentDetailsPage = setupEquipmentDetailsPage;
