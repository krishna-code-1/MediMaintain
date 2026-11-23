
const mongoose = require("mongoose");
const crypto = require("crypto");
const { promisify } = require("util");
const readline = require("readline");

require("dotenv").config();

const connectDB = require("../config/db");
const User = require("../models/User");

const scrypt = promisify(crypto.scrypt);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

async function hashPassword(password) {

    const salt = crypto.randomBytes(16).toString("hex");

    const hash = await scrypt(password, salt, 64);

    return salt + ":" + hash.toString("hex");
}

async function createAdmin() {

    try {

        await connectDB();

        console.log("\n--- MediMaintain Admin Setup ---\n");

        const name = await ask("Enter admin name: ");
        const email = await ask("Enter admin email: ");
        const password = await ask("Enter admin password: ");

        if (!name.trim() || !email.trim() || !password) {
            throw new Error("All fields are required");
        }

        if (password.length < 8) {
            throw new Error("Password must contain at least 8 characters");
        }

        const existingAdmin = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (existingAdmin) {
            throw new Error("An account with this email already exists");
        }

        const passwordHash = await hashPassword(password);

        const admin = await User.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            passwordHash,
            role: "Admin",
            assignedDepartment: "Other"
        });

        console.log("\nAdmin account created successfully!");
        console.log("Name:", admin.name);
        console.log("Email:", admin.email);
        console.log("Role:", admin.role);

    } catch (error) {

        console.error("\nAdmin creation failed:", error.message);

    } finally {

        rl.close();

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

    }
}

createAdmin();
