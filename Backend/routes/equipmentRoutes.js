
const express = require("express");

const router = express.Router();

const allowRoles = require("../middleware/roleMiddleware");

const {
    getAllEquipment,
    getEquipmentById,
    addEquipment,
    updateEquipment,
    deleteEquipment
} = require("../controllers/equipmentController");


// View all equipment
// Admin and Technician
router.get(
    "/",
    allowRoles("Admin", "Technician"),
    getAllEquipment
);


// View individual equipment
// Admin and Technician
router.get(
    "/:id",
    allowRoles("Admin", "Technician"),
    getEquipmentById
);


// Add equipment
// Admin only
router.post(
    "/",
    allowRoles("Admin"),
    addEquipment
);


// Update equipment
// Admin only
router.put(
    "/:id",
    allowRoles("Admin"),
    updateEquipment
);


// Delete equipment
// Admin only
router.delete(
    "/:id",
    allowRoles("Admin"),
    deleteEquipment
);


module.exports = router;
