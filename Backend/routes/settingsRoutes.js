
const express = require("express");

const router = express.Router();

const allowRoles = require("../middleware/roleMiddleware");

const {
    getSettings,
    updateSettings
} = require("../controllers/settingsController");


// View hospital settings - Admin only
router.get(
    "/",
    allowRoles("Admin"),
    getSettings
);


// Update hospital settings - Admin only
router.put(
    "/",
    allowRoles("Admin"),
    updateSettings
);


module.exports = router;
