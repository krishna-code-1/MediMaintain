
const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const hospitalData = {
        hospitalName: document.getElementById("hospitalName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim(),
        adminName: document.getElementById("adminName").value.trim(),
        adminEmail: document.getElementById("adminEmail").value.trim(),
        password: document.getElementById("password").value
    };

    registerMessage.textContent = "Registering hospital...";

    try {
        const response = await window.apiRequest("/hospitals/register", {
            method: "POST",
            body: JSON.stringify(hospitalData)
        });

        registerMessage.textContent =
            response.message || "Hospital registered successfully!";

        registerForm.reset();

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

    } catch (error) {
        registerMessage.textContent =
            error.message || "Hospital registration failed.";
    }
});
