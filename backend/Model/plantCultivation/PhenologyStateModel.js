const mongoose = require("mongoose");

const PhenologyStateSchema = new mongoose.Schema(
  {
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlantingPlan",
      unique: true,
      required: true,
    },
    crop: { type: String, required: true }, // normalized crop name from the plan
    section: { type: String, required: true },
    gddSum: { type: Number, default: 0 },
    predictedStage: {
      type: String,
      enum: ["none", "emergence", "vegetative", "flowering", "fruiting"],
      default: "none",
    },
    lastComputedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PhenologyState", PhenologyStateSchema);
