
/* MediMaintain - Equipment Management */

(() => {
    "use strict";

    const $ = (selector) => document.querySelector(selector);

    let equipment = [];
    let editingId = null;

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    const categories = [
        "Diagnostic", "Life Support", "Monitoring",
        "Imaging", "Therapeutic", "Surgical", "Other"
    ];

    const departments = [
        "Emergency", "ICU", "Cardiology", "Radiology",
        "Surgery", "Laboratory", "General Ward", "Other"
    ];

    const statuses = [
        "Working", "Under Maintenance", "Out of Service"
    ];

    // 1. Load equipment from MongoDB
    async function loadEquipment() {
        const response = await getAPI("/equipment");
        equipment = response.data;
    }

    // 2. Create dropdown options
    function options(items, selected = "") {
        return items.map(item => `
            <option value="${item}"
                ${item === selected ? "selected" : ""}>
                ${item}
            </option>
        `).join("");
    }

    function statusClass(status) {
        return {
            "Working": "status-working",
            "Under Maintenance": "status-under-maintenance",
            "Out of Service": "status-out-of-service"
        }[status] || "";
    }

    // 3. Display equipment page
    function renderPage() {
        $("#page-content").innerHTML = `
            <section class="eqm-heading">
                <div>
                    <div class="breadcrumb">
                        Workspace / Equipment Management
                    </div>
                    <h2>Equipment Inventory</h2>
                    <p>Manage hospital medical equipment.</p>
                </div>

                <button class="btn btn-primary" id="add-btn">
                    + Add Equipment
                </button>
            </section>

            <section class="eqm-summary">
                <article class="eqm-summary-card">
                    Total Equipment
                    <strong id="total">0</strong>
                </article>

                <article class="eqm-summary-card">
                    Working
                    <strong id="working">0</strong>
                </article>

                <article class="eqm-summary-card">
                    Under Maintenance
                    <strong id="maintenance">0</strong>
                </article>

                <article class="eqm-summary-card">
                    Out of Service
                    <strong id="out">0</strong>
                </article>
            </section>

            <section class="panel eqm-panel">

                <div class="eqm-toolbar">

                    <input id="search"
                        placeholder="Search name, ID or serial number">

                    <select id="category-filter">
                        <option value="">All Categories</option>
                        ${options(categories)}
                    </select>

                    <select id="department-filter">
                        <option value="">All Departments</option>
                        ${options(departments)}
                    </select>

                    <select id="status-filter">
                        <option value="">All Statuses</option>
                        ${options(statuses)}
                    </select>

                    <button class="btn btn-secondary" id="reset-btn">
                        Reset
                    </button>

                </div>

                <h3>Registered Equipment</h3>
                <p id="record-count"></p>

                <div class="table-wrapper">
                    <table class="data-table eqm-table">
                        <thead>
                            <tr>
                                <th>Equipment</th>
                                <th>Category</th>
                                <th>Department</th>
                                <th>Next Maintenance</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody id="equipment-list"></tbody>
                    </table>
                </div>

            </section>

            <!-- Add/Edit Form -->
            <div class="eqm-modal" id="form-modal" hidden>

                <div class="eqm-modal-card eqm-form-card">

                    <div class="eqm-modal-header">
                        <h2 id="form-title">Add Equipment</h2>
                        <button type="button" data-close>&times;</button>
                    </div>

                    <form id="equipment-form">

                        <section class="eqm-form-section">
                            <h3 class="eqm-section-heading">
                                01. Basic Information
                            </h3>

                            <div class="eqm-form-grid">

                                <div class="eqm-field">
                                    <label>Equipment Name *</label>
                                    <input name="name" required>
                                </div>

                                <div class="eqm-field">
                                    <label>Category *</label>
                                    <select name="category" required>
                                        <option value="">Select Category</option>
                                        ${options(categories)}
                                    </select>
                                </div>

                                <div class="eqm-field">
                                    <label>Department *</label>
                                    <select name="department" required>
                                        <option value="">Select Department</option>
                                        ${options(departments)}
                                    </select>
                                </div>

                                <div class="eqm-field">
                                    <label>Status *</label>
                                    <select name="status" required>
                                        ${options(statuses, "Working")}
                                    </select>
                                </div>

                            </div>
                        </section>

                        <section class="eqm-form-section">
                            <h3 class="eqm-section-heading">
                                02. Technical Details
                            </h3>

                            <div class="eqm-form-grid">

                                <div class="eqm-field">
                                    <label>Manufacturer *</label>
                                    <input name="manufacturer" required>
                                </div>

                                <div class="eqm-field">
                                    <label>Model Number</label>
                                    <input name="modelNumber">
                                </div>

                                <div class="eqm-field">
                                    <label>Serial Number *</label>
                                    <input name="serialNumber" required>
                                </div>

                            </div>
                        </section>

                        <section class="eqm-form-section">
                            <h3 class="eqm-section-heading">
                                03. Maintenance & Assignment
                            </h3>

                            <div class="eqm-form-grid">

                                <div class="eqm-field">
                                    <label>Purchase Date</label>
                                    <input type="date" name="purchaseDate">
                                </div>

                                <div class="eqm-field">
                                    <label>Last Maintenance</label>
                                    <input type="date" name="lastMaintenanceDate">
                                </div>

                                <div class="eqm-field">
                                    <label>Next Maintenance</label>
                                    <input type="date" name="nextMaintenanceDate">
                                </div>

                                <div class="eqm-field">
                                    <label>Assigned Technician</label>
                                    <input name="assignedTechnician">
                                </div>

                                <div class="eqm-field">
                                    <label>Notes</label>
                                    <textarea name="notes" rows="3"></textarea>
                                </div>

                            </div>
                        </section>

                        <p id="form-error" hidden></p>

                        <div class="eqm-form-actions">
                            <button type="button" data-close
                                class="btn btn-secondary">
                                Cancel
                            </button>

                            <button type="submit"
                                class="btn btn-primary">
                                Save Equipment
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        `;

        // Event listeners
        $("#add-btn").onclick = () => openForm();

        $("#equipment-form").onsubmit = saveForm;

        $("#search").oninput = renderTable;

        ["category-filter", "department-filter", "status-filter"]
            .forEach(id => {
                $("#" + id).onchange = renderTable;
            });

        $("#reset-btn").onclick = () => {
            $("#search").value = "";

            ["category-filter", "department-filter", "status-filter"]
                .forEach(id => $("#" + id).value = "");

            renderTable();
        };

        document.querySelectorAll("[data-close]").forEach(button => {
            button.onclick = closeForm;
        });

        $("#form-modal").onclick = event => {
            if (event.target.id === "form-modal") {
                closeForm();
            }
        };

        $("#equipment-list").onclick = handleActions;

        renderTable();
    }

    // 4. Search and filter equipment
    function renderTable() {

        const search = $("#search").value.toLowerCase().trim();

        const filtered = equipment.filter(item => {

            const matchesSearch = [
                item.name,
                item.id,
                item.serialNumber
            ].some(value =>
                String(value || "").toLowerCase().includes(search)
            );

            return matchesSearch &&
                (!$("#category-filter").value ||
                    item.category === $("#category-filter").value) &&
                (!$("#department-filter").value ||
                    item.department === $("#department-filter").value) &&
                (!$("#status-filter").value ||
                    item.status === $("#status-filter").value);
        });

        $("#record-count").textContent =
            `${filtered.length} records`;

        $("#total").textContent = equipment.length;

        $("#working").textContent =
            equipment.filter(e => e.status === "Working").length;

        $("#maintenance").textContent =
            equipment.filter(e =>
                e.status === "Under Maintenance"
            ).length;

        $("#out").textContent =
            equipment.filter(e =>
                e.status === "Out of Service"
            ).length;

        $("#equipment-list").innerHTML = filtered.length
            ? filtered.map(item => `
                <tr>
                    <td>
                        ${escapeHTML(item.name)}<br>
                        <small>${escapeHTML(item.id)}</small>
                    </td>

                    <td>${escapeHTML(item.category)}</td>
                    <td>${escapeHTML(item.department)}</td>

                    <td>
                        ${item.nextMaintenanceDate
                            ? new Date(item.nextMaintenanceDate)
                                .toLocaleDateString()
                            : "—"}
                    </td>

                    <td>
                        <span class="status-badge ${statusClass(item.status)}">
                            ${escapeHTML(item.status)}
                        </span>
                    </td>

                    <td>
                        <button data-action="view"
                            data-id="${item._id}">
                            View
                        </button>

                        <button data-action="edit"
                            data-id="${item._id}">
                            Edit
                        </button>

                        <button data-action="delete"
                            data-id="${item._id}">
                            Delete
                        </button>
                    </td>
                </tr>
            `).join("")
            : `<tr>
                <td colspan="6">No equipment found.</td>
               </tr>`;
    }

    // 5. Handle equipment actions
    function handleActions(event) {

        const button = event.target.closest("[data-action]");

        if (!button) return;

        const item = equipment.find(e =>
            e._id === button.dataset.id
        );

        if (!item) return;

        if (button.dataset.action === "edit") {
            openForm(item);
        }

        if (button.dataset.action === "delete") {
            deleteEquipment(item);
        }

        if (button.dataset.action === "view") {
            window.location.href =
                `eqi_details.html?id=${item._id}`;
        }
    }

    // 6. Open add/edit form
    function openForm(item = null) {

        editingId = item ? item._id : null;

        const form = $("#equipment-form");

        form.reset();

        if (item) {
            Object.entries(item).forEach(([key, value]) => {

                if (form.elements[key]) {
                    form.elements[key].value =
                        value ? String(value).slice(0, 10) : "";
                }

            });
        }

        $("#form-title").textContent =
            item ? "Edit Equipment" : "Add Equipment";

        $("#form-error").hidden = true;

        $("#form-modal").hidden = false;

        document.body.classList.add("eqm-modal-open");
    }

    // 7. Close form
    function closeForm() {

        $("#form-modal").hidden = true;

        document.body.classList.remove("eqm-modal-open");

        editingId = null;
    }

    // 8. Add or update equipment in MongoDB
    async function saveForm(event) {

        event.preventDefault();

        const form = $("#equipment-form");

        const values = Object.fromEntries(
            new FormData(form).entries()
        );

        Object.keys(values).forEach(key => {
            values[key] = values[key].trim();
        });

        const error = $("#form-error");

        const today = new Date().toISOString().slice(0, 10);

        if (values.purchaseDate && values.purchaseDate > today) {
            error.textContent = "Purchase date cannot be in the future.";
            error.hidden = false;
            return;
        }

        if (values.lastMaintenanceDate && values.purchaseDate &&
            values.lastMaintenanceDate < values.purchaseDate) {
            error.textContent = "Last maintenance cannot be before purchase.";
            error.hidden = false;
            return;
        }

        if (values.nextMaintenanceDate && values.lastMaintenanceDate &&
            values.nextMaintenanceDate < values.lastMaintenanceDate) {
            error.textContent = "Next maintenance cannot be before last maintenance.";
            error.hidden = false;
            return;
        }

        if (values.nextMaintenanceDate &&
            values.nextMaintenanceDate < today) {
            error.textContent = "Next maintenance date cannot be in the past.";
            error.hidden = false;
            return;
        }

        const duplicate = equipment.some(item =>
            item.serialNumber.toLowerCase() ===
                values.serialNumber.toLowerCase() &&
            item._id !== editingId
        );

        if (duplicate) {
            error.textContent = "Serial number already exists.";
            error.hidden = false;
            return;
        }

        const wasEditing = Boolean(editingId);

        try {

            if (editingId) {
                await putAPI(`/equipment/${editingId}`, values);
            } else {
                await postAPI("/equipment", values);
            }

            await loadEquipment();

            closeForm();

            renderTable();

            alert(wasEditing
                ? "Equipment updated successfully!"
                : "Equipment added successfully!");

        } catch (error) {

            console.error("Equipment save error:", error);

            $("#form-error").textContent = error.message;

            $("#form-error").hidden = false;
        }
    }

    // 9. Delete equipment from MongoDB
    async function deleteEquipment(item) {

        if (!confirm(`Delete ${item.name} and its maintenance records?`)) return;

        try {

            await deleteAPI(`/equipment/${item._id}`);

            await loadEquipment();

            renderTable();

            alert("Equipment deleted successfully!");

        } catch (error) {

            console.error("Equipment delete error:", error);

            alert(error.message);
        }
    }

    // 10. Initialize page
    async function init() {

        if (document.body.dataset.page !== "equipment") return;

        try {

            await loadEquipment();

            renderPage();

        } catch (error) {

            console.error("Equipment loading error:", error);

            $("#page-content").innerHTML = `
                <section class="panel">
                    <h3>Unable to load equipment</h3>
                    <p>${escapeHTML(error.message)}</p>
                    <button onclick="location.reload()">
                        Retry
                    </button>
                </section>
            `;
        }
    }

    window.setupEquipmentPage = init;

})();
