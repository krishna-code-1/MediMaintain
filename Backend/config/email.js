
const sendEmail = async ({ to, subject, html }) => {
    try {
        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.BREVO_SENDER_EMAIL;

        if (!apiKey || !senderEmail) {
            throw new Error("Brevo environment variables are missing");
        }

        const response = await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",
                headers: {
                    "api-key": apiKey,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    sender: {
                        name: "MediMaintain",
                        email: senderEmail
                    },
                    to: [{ email: to }],
                    subject,
                    htmlContent: html
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Brevo email sending failed"
            );
        }

        return result;

    } catch (error) {
        console.error("Brevo Email Error:", error.message);
        throw error;
    }
};

module.exports = sendEmail;
