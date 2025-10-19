const mongoose = require("mongoose");

const CropSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true, trim: true },
    baseTemp: { type: Number, default: 10 }, // °C (example default)
    stageGDD: {
      emergence: { type: Number, default: 100 },
      vegetative: { type: Number, default: 350 },
      flowering: { type: Number, default: 750 },
      fruiting: { type: Number, default: 1100 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Crop", CropSchema);
