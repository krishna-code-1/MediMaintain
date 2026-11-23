
const express = require("express");

const router = express.Router();

const allowRoles = require("../middleware/roleMiddleware");

const {
    getDashboardStats
} = require("../controllers/dashboardController");


// Admin and Technician can access dashboard statistics
router.get(
    "/",
    allowRoles("Admin", "Technician"),
    getDashboardStats
);


module.exports = router;
