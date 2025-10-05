const mongoose = require("mongoose");

const GrowthLogSchema = new mongoose.Schema(
  {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlantingPlan",
      required: true,
    },
    date: { type: Date, required: true },
    stage: {
      type: String,
      enum: [
        "germination",
        "seedling",
        "vegetative",
        "flowering",
        "fruiting",
        "harvest-ready",
        "other",
      ],
      required: true,
    },
    heightCm: { type: Number, min: [0, "height cannot be negative"] },
    issues: [
      { type: String, enum: ["pest", "disease", "nutrient", "water", "other"] },
    ],
    notes: { type: String, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

GrowthLogSchema.index({ planId: 1, date: -1 });
module.exports = mongoose.model("GrowthLog", GrowthLogSchema);
