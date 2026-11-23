
/* MediMaintain - Technician Management */

(() => {
    "use strict";

    const $ = (selector) => document.querySelector(selector);

    let technicians = [];

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    const departments = [
        "Emergency",
        "ICU",
        "Cardiology",
        "Radiology",
        "Surgery",
        "Laboratory",
        "General Ward",
        "Other"
    ];

    // 1. Create department dropdown options
    function departmentOptions() {
        return departments.map(department => `
            <option value="${department}">
                ${department}
            </option>
        `).join("");
    }

    // 2. Display Technician Management page
    function renderPage() {

        $("#page-content").innerHTML = `
            <section class="eqm-heading">
                <div>
                    <div class="breadcrumb">
                        Workspace / Technician Management
                    </div>

                    <h2>Technician Management</h2>

                    <p>
                        Add technicians and send account activation invitations.
                    </p>
                </div>
            </section>

            <section class="panel technician-management-panel">

                <h3>Add New Technician</h3>

                <p>
                    Enter technician details to send an account invitation.
                </p>

                <form id="technician-form">

                    <div class="eqm-form-grid">

                        <div class="eqm-field">
                            <label>Technician Name *</label>
                            <input
                                type="text"
                                name="name"
                                required
                                placeholder="Enter full name"
                            >
                        </div>

                        <div class="eqm-field">
                            <label>Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="Enter email address"
                            >
                        </div>

                        <div class="eqm-field">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Enter phone number"
                            >
                        </div>

                        <div class="eqm-field">
                            <label>Assigned Department *</label>
                            <select name="assignedDepartment" required>
                                <option value="">
                                    Select Department
                                </option>

                                ${departmentOptions()}
                            </select>
                        </div>

                    </div>

                    <p id="technician-message" hidden></p>

                    <div class="technician-form-actions">
                        <button
                            type="submit"
                            class="btn btn-primary"
                            id="submit-technician"
                        >
                            Send Invitation
                        </button>
                    </div>

                </form>

            </section>
        `;

        // Form submission
        $("#technician-form").onsubmit = saveTechnician;
    }

    // 3. Save Technician and send invitation email
    async function saveTechnician(event) {

        event.preventDefault();

        const form = $("#technician-form");

        const values = Object.fromEntries(
            new FormData(form).entries()
        );

        Object.keys(values).forEach(key => {
            values[key] = values[key].trim();
        });

        const message = $("#technician-message");
        const submitButton = $("#submit-technician");

        submitButton.disabled = true;
        submitButton.textContent = "Sending Invitation...";

        message.hidden = false;
        message.textContent = "Creating technician account...";

        try {

            const response = await postAPI(
                "/auth/register",
                values
            );

            technicians.push(values);

            message.textContent =
                response.message || "Invitation sent successfully!";

            form.reset();

            alert("Technician invitation sent successfully!");

        } catch (error) {

            console.error("Technician creation error:", error);

            message.textContent =
                error.message || "Unable to create technician.";

        } finally {

            submitButton.disabled = false;
            submitButton.textContent = "Send Invitation";
        }
    }

    // 4. Initialize Technician Management page
    async function init() {

        if (document.body.dataset.page !== "technicians") {
            return;
        }

        renderPage();
    }

    window.setupTechniciansPage = init;

})();
