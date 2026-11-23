
const User = require("../models/User");
const Hospital = require("../models/Hospital");
const crypto = require("crypto");
const { promisify } = require("util");
const transporter = require("../config/email");

const scrypt = promisify(crypto.scrypt);


// 1. Generate secure password hash
async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = await scrypt(password, salt, 64);

    return salt + ":" + hash.toString("hex");
}


// 2. Verify password
async function verifyPassword(password, storedHash) {
    if (!storedHash) return false;

    const [salt, originalHash] = storedHash.split(":");

    if (!salt || !originalHash) return false;

    const hash = await scrypt(password, salt, 64);
    const originalBuffer = Buffer.from(originalHash, "hex");

    if (hash.length !== originalBuffer.length) return false;

    return crypto.timingSafeEqual(hash, originalBuffer);
}


// 3. Create Technician Account and Send Invitation
const createUser = async (req, res) => {
    let user;

    try {
        const {
            name,
            email,
            phone,
            assignedDepartment
        } = req.body;

        const hospitalId = req.session.user.hospitalId;

        if (!name || !email || !assignedDepartment) {
            return res.status(400).json({
                success: false,
                message: "Name, email and department are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Generate a secure activation token
        const activationToken = crypto.randomBytes(32).toString("hex");

        // Store only the hashed token in MongoDB
        const activationTokenHash = crypto
            .createHash("sha256")
            .update(activationToken)
            .digest("hex");

        const activationTokenExpires = new Date(
            Date.now() + 24 * 60 * 60 * 1000
        );

        // Create inactive Technician account
        user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            phone: phone || "",
            role: "Technician",
            assignedDepartment,
            hospitalId,
            passwordHash: null,
            activationTokenHash,
            activationTokenExpires,
            isActive: false
        });

        const frontendUrl = (
            process.env.FRONTEND_URL || "http://127.0.0.1:5500"
        ).replace(/\/+$/, "");

        const activationLink =
            `${frontendUrl}/activate.html?token=${activationToken}`;

        // Send invitation email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: normalizedEmail,
            subject: "MediMaintain Technician Account Invitation",
            html: `
                <h2>Welcome to MediMaintain</h2>

                <p>Hello ${name.trim()},</p>

                <p>
                    Your Technician account has been created by your
                    hospital administrator.
                </p>

                <p>
                    Click the button below to activate your account
                    and create your password.
                </p>

                <a href="${activationLink}"
                   style="background:#2563eb;color:white;padding:12px 20px;
                   text-decoration:none;border-radius:5px;">
                    Activate Account
                </a>

                <p>This link expires in 24 hours.</p>

                <p>If you were not expecting this invitation,
                you can ignore this email.</p>

                <p>Regards,<br>MediMaintain Team</p>
            `
        });

        return res.status(201).json({
            success: true,
            message: "Technician created. Invitation email sent successfully."
        });

    } catch (error) {
        console.error("Create Technician Error:", error.message);

        // Remove the pending account if invitation email fails
        if (user) {
            await User.findByIdAndDelete(user._id).catch(() => {});
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create Technician or send invitation email"
        });
    }
};


// 4. Activate Technician Account
const activateUser = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: "Activation token and password are required"
            });
        }

        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        const activationTokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            activationTokenHash,
            activationTokenExpires: { $gt: new Date() },
            isActive: false
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired activation link"
            });
        }

        user.passwordHash = await hashPassword(password);
        user.activationTokenHash = null;
        user.activationTokenExpires = null;
        user.isActive = true;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Account activated successfully. You can now log in."
        });

    } catch (error) {
        console.error("Account Activation Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Account activation failed"
        });
    }
};


// 5. User Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password, or account not activated"
            });
        }

        const isPasswordValid = await verifyPassword(
            password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const hospital = await Hospital.findById(user.hospitalId);

        if (!hospital || !hospital.isActive) {
            return res.status(403).json({
                success: false,
                message: "Hospital account is inactive"
            });
        }

        // Prevent session fixation
        await new Promise((resolve, reject) => {
            req.session.regenerate(error => {
                if (error) reject(error);
                else resolve();
            });
        });

        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            hospitalId: user.hospitalId,
            assignedDepartment: user.assignedDepartment
        };

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: req.session.user
        });

    } catch (error) {
        console.error("Login Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};


// 6. Get Logged-in User
const getCurrentUser = (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first"
        });
    }

    return res.status(200).json({
        success: true,
        user: req.session.user
    });
};


// 7. User Logout
const logout = (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Logout failed"
            });
        }

        res.clearCookie("medimaintain.sid");

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    });
};


module.exports = {
    createUser,
    activateUser,
    login,
    getCurrentUser,
    logout
};
