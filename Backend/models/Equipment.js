const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      trim: true,
      required: true,
    },

    category: {
      type: String,
      enum: [
        "Diagnostic",
        "Life Support",
        "Monitoring",
        "Imaging",
        "Therapeutic",
        "Surgical",
        "Other",
      ],
      required: true,
    },

    department: {
      type: String,
      enum: [
        "Emergency",
        "ICU",
        "Cardiology",
        "Radiology",
        "Surgery",
        "Laboratory",
        "General Ward",
        "Other",
      ],
      required: true,
    },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    status: {
      type: String,
      enum: ["Working", "Under Maintenance", "Out of Service"],
      default: "Working",
    },

    manufacturer: {
      type: String,
      trim: true,
      required: true,
    },

    modelNumber: {
      type: String,
      trim: true,
      default: "",
    },

    serialNumber: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },

    purchaseDate: {
      type: Date,
      default: null,
    },

    lastMaintenanceDate: {
      type: Date,
      default: null,
    },

    nextMaintenanceDate: {
      type: Date,
      default: null,
    },

    assignedTechnician: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Equipment = mongoose.model("Equipment", equipmentSchema);

module.exports = Equipment;
