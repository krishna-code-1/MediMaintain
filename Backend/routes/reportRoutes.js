
const express = require("express");

const router = express.Router();

const allowRoles = require("../middleware/roleMiddleware");

const {
    getReports
} = require("../controllers/reportController");


// Only Admin can access reports
router.get(
    "/",
    allowRoles("Admin"),
    getReports
);


module.exports = router;
