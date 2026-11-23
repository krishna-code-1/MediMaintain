
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginMessage.textContent = "Logging in...";

    try {
        // Step 1: Login and create a session
        await window.apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        // Step 2: Get logged-in user details
        const response = await window.apiRequest("/auth/me");

        const user = response.user || response.data?.user || response;

        // Step 3: Redirect according to role
        if (user.role === "Admin") {
            window.location.href = "index.html";
        } else if (user.role === "Technician") {
            window.location.href = "technician.html";
        } else {
            loginMessage.textContent = "Invalid user role.";
        }SS

    } catch (error) {
        loginMessage.textContent = error.message || "Login failed.";
    }
});
