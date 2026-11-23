
document.addEventListener("DOMContentLoaded", () => {
    loadTechnicianDashboard();

    document.getElementById("logoutButton").addEventListener("click", logout);
});

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

async function loadTechnicianDashboard() {
    const profile = document.getElementById("technicianProfile");
    const tasksContainer = document.getElementById("assignedTasks");

    try {
        // Verify logged-in user
        const response = await window.apiRequest("/auth/me");
        const user = response.user || response.data?.user || response;

        if (user.role !== "Technician") {
            window.location.replace(
                user.role === "Admin" ? "index.html" : "login.html"
            );
            return;
        }

        // Display technician profile
        profile.innerHTML = `
            <h3>Welcome, ${escapeHTML(user.name)}</h3>
            <p>Email: ${escapeHTML(user.email)}</p>
            <p>Role: ${escapeHTML(user.role)}</p>
            <p>Department: ${escapeHTML(user.assignedDepartment)}</p>
        `;

        // Fetch assigned maintenance tasks
        await loadAssignedTasks();

    } catch (error) {
        profile.textContent = error.message;
        tasksContainer.textContent = "Unable to load dashboard.";

        if (error.message.toLowerCase().includes("login")) {
            window.location.replace("login.html");
        }
    }
}

async function loadAssignedTasks() {
    const container = document.getElementById("assignedTasks");

    try {
        const response = await window.apiRequest("/maintenance/assigned");

        const tasks = response.data || response.maintenance || [];

        if (!Array.isArray(tasks) || tasks.length === 0) {
            container.innerHTML = "<p>No maintenance tasks assigned.</p>";
            return;
        }

        container.innerHTML = `
            <h3>My Assigned Maintenance</h3>

            ${tasks.map(task => `
                <div class="panel technician-task-card">
                    <h3>${escapeHTML(task.equipmentName)}</h3>

                    <p>Equipment ID: ${escapeHTML(task.equipmentId)}</p>
                    <p>Type: ${escapeHTML(task.type)}</p>
                    <p>Date: ${escapeHTML(
                        task.maintenanceDate
                            ? new Date(task.maintenanceDate).toLocaleDateString()
                            : "Not specified"
                    )}</p>
                    <p>Current Status: ${escapeHTML(task.status)}</p>

                    <form class="task-update-form" data-id="${escapeHTML(task._id)}">

                        <label>Update Status</label>

                        <select name="status" required>
                            <option value="Scheduled"
                                ${task.status === "Scheduled" ? "selected" : ""}>
                                Scheduled
                            </option>

                            <option value="In Progress"
                                ${task.status === "In Progress" ? "selected" : ""}>
                                In Progress
                            </option>

                            <option value="Completed"
                                ${task.status === "Completed" ? "selected" : ""}>
                                Completed
                            </option>
                        </select>

                        <label>Maintenance Notes</label>

                        <textarea name="notes" rows="3">${escapeHTML(task.notes)}</textarea>

                        <button type="submit">Update Task</button>

                    </form>
                </div>
            `).join("")}
        `;

    } catch (error) {
        container.textContent = error.message;
    }
}

// Update assigned maintenance
document.addEventListener("submit", async (event) => {
    if (!event.target.matches(".task-update-form")) return;

    event.preventDefault();

    const form = event.target;
    const taskId = form.dataset.id;
    const status = form.elements.status.value;
    const notes = form.elements.notes.value.trim();

    const button = form.querySelector("button");
    button.disabled = true;
    button.textContent = "Updating...";

    try {
        await window.apiRequest(`/maintenance/assigned/${taskId}`, {
            method: "PUT",
            body: JSON.stringify({ status, notes })
        });

        alert("Maintenance task updated successfully!");

        await loadAssignedTasks();

    } catch (error) {
        alert(error.message || "Unable to update task.");
        button.disabled = false;
        button.textContent = "Update Task";
    }
});

// Logout technician
async function logout() {
    try {
        await window.apiRequest("/auth/logout", {
            method: "POST"
        });

        window.location.replace("login.html");

    } catch (error) {
        alert(error.message || "Logout failed.");
    }
}
