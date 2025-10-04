const mongoose = require("mongoose");

const SeedBatchSchema = new mongoose.Schema(
  {
    seedCode: { type: String, required: true, unique: true, trim: true },
    cropType: { type: String, required: true, trim: true },
    supplier: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: {
      type: String,
      enum: ["seeds", "trays", "packets"],
      default: "seeds",
    },
    procuredDate: { type: Date, required: true },
    expiryDate: { type: Date },
    notes: { type: String, maxlength: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

SeedBatchSchema.index({ cropType: 1, procuredDate: -1 });
module.exports = mongoose.model("SeedBatch", SeedBatchSchema);
