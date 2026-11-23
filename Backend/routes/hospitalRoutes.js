
const express = require("express");

const router = express.Router();

const {
  registerHospital
} = require("../controllers/hospitalController");

// Public hospital registration
router.post("/register", registerHospital);

module.exports = router;
