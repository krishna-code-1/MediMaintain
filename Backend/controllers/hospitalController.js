
const Hospital = require("../models/Hospital");
const User = require("../models/User");
const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);

// Register a new hospital and its first Admin
const registerHospital = async (req, res) => {
  let hospital;

  try {
    const {
      hospitalName,
      email,
      phone,
      address,
      adminName,
      adminEmail,
      password
    } = req.body;

    // Check required fields
    if (
      !hospitalName ||
      !email ||
      !phone ||
      !address ||
      !adminName ||
      !adminEmail ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters"
      });
    }

    // Check whether hospital email already exists
    const existingHospital = await Hospital.findOne({
      email: email.toLowerCase()
    });

    if (existingHospital) {
      return res.status(409).json({
        success: false,
        message: "Hospital is already registered"
      });
    }

    // Check whether Admin email already exists
    const existingUser = await User.findOne({
      email: adminEmail.toLowerCase()
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Admin email is already registered"
      });
    }

    // Hash Admin password using scrypt
    const salt = crypto.randomBytes(16).toString("hex");

    const derivedKey = await scrypt(password, salt, 64);

    const passwordHash =
      salt + ":" + derivedKey.toString("hex");

    // Create hospital
    hospital = await Hospital.create({
      hospitalName,
      email,
      phone,
      address
    });

    // Create first Admin for this hospital
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "Admin",
      hospitalId: hospital._id,
      assignedDepartment: "Other"
    });

    return res.status(201).json({
      success: true,
      message: "Hospital registered successfully",
      hospitalId: hospital._id,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    // Remove hospital if Admin creation failed
    if (hospital) {
      await Hospital.findByIdAndDelete(hospital._id);
    }

    console.error("Hospital Registration Error:", error);

    return res.status(500).json({
      success: false,
      message: "Hospital registration failed"
    });
  }
};

module.exports = {
  registerHospital
};
