const mongoose = require("mongoose");

const ClimateDailySchema = new mongoose.Schema(
  {
    section: { type: String, required: true, index: true }, // e.g., "GH-1"
    date: { type: Date, required: true, index: true }, // truncated to local day
    tmin: { type: Number, required: true }, // °C
    tmax: { type: Number, required: true }, // °C
  },
  { timestamps: true }
);

ClimateDailySchema.index({ section: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("ClimateDaily", ClimateDailySchema);
