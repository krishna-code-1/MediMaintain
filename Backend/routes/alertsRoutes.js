
const express = require("express");

const router = express.Router();

const allowRoles = require("../middleware/roleMiddleware");

const {
    getMaintenanceAlerts
} = require("../controllers/alertsController");


// Only Admin can view all maintenance alerts
router.get(
    "/",
    allowRoles("Admin"),
    getMaintenanceAlerts
);


module.exports = router;
