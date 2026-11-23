
const express = require("express");
const router = express.Router();

const {
    createUser,
    activateUser,
    login,
    getCurrentUser,
    logout
} = require("../controllers/authController");

const allowRoles = require("../middleware/roleMiddleware");

// Admin creates Technician and sends invitation email
router.post("/register", allowRoles("Admin"), createUser);

// Technician activates account using email token
router.post("/activate", activateUser);

// Login and session routes
router.post("/login", login);
router.get("/me", getCurrentUser);
router.post("/logout", logout);

module.exports = router;
