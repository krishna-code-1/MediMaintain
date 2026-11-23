
const activateForm = document.getElementById("activateForm");
const activateMessage = document.getElementById("activateMessage");

// Read activation token from URL
const urlParams = new URLSearchParams(window.location.search);
const activationToken = urlParams.get("token");

if (!activationToken) {
    activateMessage.textContent = "Invalid activation link.";
    activateForm.style.display = "none";
}

activateForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password.length < 8) {
        activateMessage.textContent = "Password must contain at least 8 characters.";
        return;
    }

    if (password !== confirmPassword) {
        activateMessage.textContent = "Passwords do not match.";
        return;
    }

    activateMessage.textContent = "Activating your account...";

    try {
        const response = await window.apiRequest("/auth/activate", {
            method: "POST",
            body: JSON.stringify({
                token: activationToken,
                password: password
            })
        });

        activateMessage.textContent = response.message;

        activateForm.reset();

        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

    } catch (error) {
        activateMessage.textContent =
            error.message || "Account activation failed.";
    }
});
