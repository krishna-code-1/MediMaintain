
const express = require("express");

const router = express.Router();

const allowRoles = require("../middleware/roleMiddleware");

const {
    getAllMaintenance,
    getMaintenanceById,
    addMaintenance,
    updateMaintenance,
    deleteMaintenance,
    getAssignedMaintenance,
    updateAssignedMaintenance
} = require("../controllers/maintenanceController");


// ======================================
// TECHNICIAN ROUTES
// ======================================

// Technician views only assigned jobs
router.get(
    "/assigned",
    allowRoles("Technician"),
    getAssignedMaintenance
);

// Technician updates assigned job
router.put(
    "/assigned/:id",
    allowRoles("Technician"),
    updateAssignedMaintenance
);


// ======================================
// ADMIN ROUTES
// ======================================

// Admin views all maintenance
router.get(
    "/",
    allowRoles("Admin"),
    getAllMaintenance
);

// Admin views individual maintenance
router.get(
    "/:id",
    allowRoles("Admin"),
    getMaintenanceById
);

// Admin schedules maintenance
router.post(
    "/",
    allowRoles("Admin"),
    addMaintenance
);

// Admin updates maintenance
router.put(
    "/:id",
    allowRoles("Admin"),
    updateMaintenance
);

// Admin deletes maintenance
router.delete(
    "/:id",
    allowRoles("Admin"),
    deleteMaintenance
);

module.exports = router;
