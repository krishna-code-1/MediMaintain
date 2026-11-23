/* =========================================
   MediMaintain - Main Application
   File: frontend/js/app.js
========================================= */

(function () {
  "use strict";

  const PAGES = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Overview of hospital equipment and maintenance.",
      href: "index.html",
    },
    equipment: {
      title: "Equipment Management",
      subtitle: "View and manage hospital equipment.",
      href: "equipment.html",
    },
    technicians: {
      title: "Technician Management",
      subtitle: "Manage technicians and send account invitations.",
      href: "technicians.html",
    },
    "equipment-details": {
      title: "Equipment Details",
      subtitle: "Equipment information and maintenance history.",
      href: "eqi_details.html",
    },
    maintenance: {
      title: "Maintenance Management",
      subtitle: "Organize maintenance schedules and records.",
      href: "maintenance.html",
    },
    alerts: {
      title: "Maintenance Alerts",
      subtitle: "Monitor upcoming and overdue maintenance.",
      href: "alerts.html",
    },
    reports: {
      title: "Reports & Analytics",
      subtitle: "Review equipment and maintenance summaries.",
      href: "reports.html",
    },
    settings: {
      title: "Settings",
      subtitle: "Manage hospital information.",
      href: "settings.html",
    },
  };

  const NAV_GROUPS = [
    {
      label: "Workspace",
      pages: ["dashboard", "equipment", "maintenance", "technicians", "alerts"],
    },
    {
      label: "Insights",
      pages: ["reports", "settings"],
    },
  ];

  const NAV_ICONS = {
    dashboard: "fa-solid fa-house-medical",
    equipment: "fa-solid fa-stethoscope",
    maintenance: "fa-solid fa-screwdriver-wrench",
    technicians: "fa-solid fa-user-nurse",
    alerts: "fa-solid fa-bell",
    reports: "fa-solid fa-chart-column",
    settings: "fa-solid fa-gears",
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[character];
    });
  }

  function getPage() {
    const page = document.body.dataset.page;
    return Object.hasOwn(PAGES, page) ? page : "dashboard";
  }

  async function getLoggedInUser() {
    if (typeof window.apiRequest !== "function") {
      throw new Error("API service is not loaded. Check api.js script.");
    }

    const response = await window.apiRequest("/auth/me");

    return response.user || response.data?.user || response;
  }

  function renderNavigation(currentPage) {
    return NAV_GROUPS.map(
      (group) => `
      <p class="nav-label">${group.label}</p>

      <nav class="sidebar-nav">
        ${group.pages
          .map((page) => {
            const item = PAGES[page];

            return `
            <a
              class="nav-link ${
                currentPage === page ||
                (currentPage === "equipment-details" && page === "equipment")
                  ? "active"
                  : ""
              }"
              href="${item.href}"
            >
              <i class="${NAV_ICONS[page]}" aria-hidden="true"></i>
              <span>${escapeHTML(item.title)}</span>
            </a>
          `;
          })
          .join("")}
      </nav>
    `,
    ).join("");
  }

  function renderShell(pageName, user) {
    const page = PAGES[pageName];

    document.title = `${page.title} | MediMaintain`;

    return `
      <div class="app-layout">

        <aside class="sidebar" id="app-sidebar">

          <a class="brand" href="index.html">
            <span class="brand-icon">+</span>
            <span>
              <span class="brand-name">MediMaintain</span>
              <span class="brand-subtitle">
                Hospital Equipment Care
              </span>
            </span>
          </a>

          ${renderNavigation(pageName)}

          <div class="sidebar-bottom">
            <div class="demo-notice">
              <strong>Hospital Management System</strong>
              Equipment and maintenance management.
            </div>
          </div>

        </aside>

        <main class="main-area">

          <header class="topbar">

            <div class="topbar-left">

              <button
                class="menu-toggle"
                id="menu-toggle"
                type="button"
                aria-label="Open navigation"
                aria-controls="app-sidebar"
                aria-expanded="false"
              >
                ☰
              </button>

              <div>
                <p class="topbar-label">
                  Hospital Management / ${escapeHTML(page.title)}
                </p>

                <h1 class="topbar-title">
                  ${escapeHTML(page.title)}
                </h1>
              </div>

            </div>

         <div class="topbar-right">
            <div>
              <p class="profile-name">${escapeHTML(user.name)}</p>
              <p class="profile-role">${escapeHTML(user.role)}</p>
            </div>

            <div class="avatar">
              ${escapeHTML(user.name.charAt(0).toUpperCase())}
            </div>

            <button id="logoutButton" class="btn btn-secondary" type="button">
              <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
              Logout
            </button>
          </div>

          </header>

          <div class="page-content" id="page-content">

            <div class="loading-state">
              Loading ${escapeHTML(page.title)}...
            </div>

          </div>

          <footer class="page-footer">
            MediMaintain &copy; ${new Date().getFullYear()}
            · Hospital Equipment Maintenance System
          </footer>

        </main>

        <div
          class="toast-region"
          id="toast-region"
          role="status"
          aria-live="polite"
        ></div>

      </div>
    `;
  }

  function setupMobileNavigation() {
    const sidebar = document.getElementById("app-sidebar");
    const toggle = document.getElementById("menu-toggle");

    if (!sidebar || !toggle) return;

    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");

      const isOpen = sidebar.classList.contains("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    sidebar.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        sidebar.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  async function loadDashboard() {
    const page = document.getElementById("page-content");

    try {
      const response = await window.apiRequest("/dashboard");
      const data = response.data;

      page.innerHTML = `
        <section class="page-heading">
          <div>
            <div class="breadcrumb">Workspace / Dashboard</div>
            <h2>Hospital Overview</h2>
            <p>Current equipment and maintenance information.</p>
          </div>
        </section>

        <section class="stats-grid">
          <article class="stat-card">
            <span class="stat-label">Total Equipment</span>
            <p class="stat-value">${data.totalEquipment ?? 0}</p>
          </article>

          <article class="stat-card">
            <span class="stat-label">Working Equipment</span>
            <p class="stat-value">${data.workingEquipment ?? 0}</p>
          </article>

          <article class="stat-card">
            <span class="stat-label">Under Maintenance</span>
            <p class="stat-value">${data.underMaintenance ?? 0}</p>
          </article>

          <article class="stat-card">
            <span class="stat-label">Upcoming Maintenance</span>
            <p class="stat-value">${data.upcomingMaintenance ?? 0}</p>
          </article>

          <article class="stat-card">
            <span class="stat-label">Overdue Maintenance</span>
            <p class="stat-value">${data.overdueMaintenance ?? 0}</p>
          </article>

          <article class="stat-card">
            <span class="stat-label">Out of Service</span>
            <p class="stat-value">${data.outOfService ?? 0}</p>
          </article>
        </section>

        <section class="dashboard-grid">
          <section class="panel">
            <div class="panel-header">
              <div>
                <h3>Equipment Health</h3>
                <p class="panel-subtitle">Current operational status</p>
              </div>
            </div>

            <div class="health-row">
              <span>Working</span>
              <strong>${data.workingEquipment ?? 0}</strong>
              <div class="health-track">
                <span></span>
              </div>
            </div>

            <div class="health-row">
              <span>Under Maintenance</span>
              <strong>${data.underMaintenance ?? 0}</strong>
              <div class="health-track warning">
                <span></span>
              </div>
            </div>

            <div class="health-row">
              <span>Out of Service</span>
              <strong>${data.outOfService ?? 0}</strong>
              <div class="health-track danger">
                <span></span>
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <h3>Maintenance Overview</h3>
                <p class="panel-subtitle">Upcoming and overdue work</p>
              </div>
              <a class="btn btn-secondary" href="maintenance.html">View schedule</a>
            </div>

            <div class="health-row">
              <span>Upcoming (7 days)</span>
              <strong>${data.upcomingMaintenance ?? 0}</strong>
              <div class="health-track">
                <span></span>
              </div>
            </div>

            <div class="health-row">
              <span>Overdue</span>
              <strong>${data.overdueMaintenance ?? 0}</strong>
              <div class="health-track danger">
                <span></span>
              </div>
            </div>

            <div class="health-row">
              <span>Completed</span>
              <strong>${data.completedMaintenance ?? 0}</strong>
              <div class="health-track">
                <span></span>
              </div>
            </div>
          </section>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h3>Quick Actions</h3>
              <p class="panel-subtitle">Manage hospital equipment and maintenance.</p>
            </div>
          </div>

          <div class="panel-body">
            <div class="quick-actions">
              <a class="btn btn-primary" href="equipment.html">Manage Equipment</a>
              <a class="btn btn-secondary" href="maintenance.html">Schedule Maintenance</a>
              <a class="btn btn-secondary" href="alerts.html">View Alerts</a>
              <a class="btn btn-secondary" href="reports.html">View Reports</a>
            </div>
          </div>
        </section>
      `;
    } catch (error) {
      page.innerHTML = `
        <section class="panel">
          <div class="panel-body">
            <h3>Unable to load dashboard</h3>
            <p>${escapeHTML(error.message)}</p>
            <p>Check whether the backend server is running.</p>
          </div>
        </section>
      `;
    }
  }

  async function initializePage(pageName) {
    async function runInitializer(initializerName) {
      const initializer = window[initializerName];
      if (typeof initializer !== "function") {
        throw new Error(`Page initializer is unavailable: ${initializerName}`);
      }
      await initializer();
    }

    switch (pageName) {
      case "dashboard":
        await loadDashboard();
        break;

      case "equipment":
        await runInitializer("setupEquipmentPage");
        break;

      case "technicians":
        await runInitializer("setupTechniciansPage");
        break;

      case "equipment-details":
        await runInitializer("setupEquipmentDetailsPage");
        break;

      case "maintenance":
        await runInitializer("setupMaintenancePage");
        break;

      case "alerts":
        await runInitializer("setupAlertsPage");
        break;

      case "reports":
        await runInitializer("setupReportsPage");
        break;

      case "settings":
        await runInitializer("setupSettingsPage");
        break;

      default:
        break;
    }
  }

  async function startApp() {
    const root = document.getElementById("app");

    if (!root) return;

    try {
      // Check login session
      const user = await getLoggedInUser();

      // Only Admin can access existing management pages
      if (user.role !== "Admin") {
        if (user.role === "Technician") {
          window.location.replace("technician.html");
        } else {
          window.location.replace("login.html");
        }
        return;
      }

      const pageName = getPage();

      // Render existing application
      root.innerHTML = renderShell(pageName, user);

      setupMobileNavigation();
      document
        .getElementById("logoutButton")
        .addEventListener("click", async () => {
          try {
            await window.apiRequest("/auth/logout", {
              method: "POST",
            });

            window.location.replace("login.html");
          } catch (error) {
            alert(error.message || "Logout failed.");
          }
        });

      await initializePage(pageName);
    } catch (error) {
      console.error("MediMaintain startup error:", error);

      // Redirect unauthenticated users to login
      if (
        error.message.toLowerCase().includes("login") ||
        error.message.toLowerCase().includes("unauthorized")
      ) {
        window.location.replace("login.html");
        return;
      }

      const page = document.getElementById("page-content");

      if (page) {
        page.innerHTML = `
                <section class="panel">
                    <div class="panel-body">
                        <h2>Unable to load the application</h2>
                        <p>${escapeHTML(error.message)}</p>
                    </div>
                </section>
            `;
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp, {
      once: true,
    });
  } else {
    startApp();
  }
})();
