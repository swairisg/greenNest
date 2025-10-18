const mongoose = require("mongoose");

const ShiftTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },

    // normalized minutes from midnight (0..1439)
    startMinutes: { type: Number, required: true, min: 0, max: 1439 },
    endMinutes: { type: Number, required: true, min: 0, max: 1439 },

    // human-friendly labels we return to the client (e.g. "08:00 AM")
    startLabel: { type: String, required: true },
    endLabel: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ShiftTemplate ||
  mongoose.model("ShiftTemplate", ShiftTemplateSchema);
