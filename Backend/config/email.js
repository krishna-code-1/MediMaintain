const sendEmail = async ({ to, subject, html }) => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
        from: "MediMaintain <onboarding@resend.dev>",
        to: [to],
        subject,
        html
    });

    if (error) {
        throw new Error(error.message || "Email sending failed");
    }

    return data;
};

module.exports = sendEmail;