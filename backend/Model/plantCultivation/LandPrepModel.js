const mongoose = require("mongoose");

const LandPrepSchema = new mongoose.Schema(
  {
    section: { type: String, required: true, trim: true },
    activityType: {
      type: String,
      enum: [
        "soil-test",
        "clearing",
        "bed-prep",
        "amendment",
        "irrigation-setup",
        "fumigation",
        "other",
      ],
      required: true,
    },
    date: { type: Date, required: true },
    details: { type: String, maxlength: 2000 },
    cost: { type: Number, min: [0, "cost cannot be negative"], default: 0 },
    files: [{ type: String }], // optional URLs (images/docs)
    performedBy: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

LandPrepSchema.index({ section: 1, date: -1, activityType: 1 });
module.exports = mongoose.model("LandPrep", LandPrepSchema);
