
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    phone: {
        type: String,
        trim: true,
        default: ""
    },

    passwordHash: {
        type: String,
        required: false
    },

    role: {
        type: String,
        enum: ["Admin", "Technician"],
        default: "Technician",
        required: true
    },

    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospital",
        required: true
    },

    assignedDepartment: {
        type: String,
        enum: [
            "Emergency",
            "ICU",
            "Cardiology",
            "Radiology",
            "Surgery",
            "Laboratory",
            "General Ward",
            "Other"
        ],
        default: "Other"
    },

    // Account activation fields
    activationTokenHash: {
        type: String,
        default: null
    },

    activationTokenExpires: {
        type: Date,
        default: null
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

const User = mongoose.model("User", userSchema);

module.exports = User;
