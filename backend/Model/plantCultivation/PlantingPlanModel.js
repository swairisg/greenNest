const mongoose = require("mongoose");

const PlantingPlanSchema = new mongoose.Schema(
  {
    planCode: { type: String, required: true, unique: true, trim: true }, // e.g., PLAN-2025-STR-01
    cropType: { type: String, required: true, trim: true },
    seedBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SeedBatch",
      required: true,
    },
    section: { type: String, required: true, trim: true }, // e.g., GH-1 / Bed A
    startDate: { type: Date, required: true },
    expectedHarvestStart: { type: Date },
    expectedHarvestEnd: { type: Date },
    quantityPlanned: {
      type: Number,
      required: true,
      min: [1, "quantityPlanned must be > 0"],
    },
    unit: {
      type: String,
      enum: ["trays", "seedlings", "beds", "plants"],
      default: "seedlings",
    },
    status: {
      type: String,
      enum: ["planned", "active", "completed", "cancelled"],
      default: "planned",
    },
    instructions: { type: String, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

PlantingPlanSchema.index({ cropType: 1, startDate: -1 });
module.exports = mongoose.model("PlantingPlan", PlantingPlanSchema);
