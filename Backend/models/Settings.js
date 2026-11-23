const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      trim: true,
      default: "CityCare General Hospital",
    },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
      unique: true,
    },

    contactEmail: {
      type: String,
      trim: true,
      default: "",
    },

    contactPhone: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;
