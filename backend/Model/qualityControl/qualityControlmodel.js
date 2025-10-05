// backend/Model/qualityControl/qualityControlmodel.js
const mongoose = require("mongoose");

const QualitySchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    variety: {
      type: String,
      required: true,
      trim: true,
    },
    size: { type: String, trim: true },
    color: { type: String, trim: true },
    freshness: { type: Number, min: 0, max: 100 },
    weight: { type: Number, min: 0 },
    notes: { type: String, trim: true },
    grade: {
      type: String,
      enum: ["A", "B", "C"],
      required: true,
    },
  },
  { timestamps: true }
);

// Avoid OverwriteModelError during hot reloads/nodemon
module.exports =
  mongoose.models.qualityControlmodel ||
  mongoose.model("qualityControlmodel", QualitySchema);