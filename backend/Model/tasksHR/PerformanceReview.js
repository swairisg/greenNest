const mongoose = require("mongoose");

const ScoreSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true }, // e.g. "quality", "speed"
    label: { type: String, required: true, trim: true }, // Display name
    weight: { type: Number, default: 1 }, // 0..1 or 0..100 depending on your convention
    selfScore: { type: Number, min: 0, max: 5 }, // optional
    managerScore: { type: Number, min: 0, max: 5 }, // optional
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const PerformanceReviewSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeProfile",
      required: true,
      index: true,
    },
    department: { type: String, trim: true, index: true }, // denormalized for filtering
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true, index: true },

    title: { type: String, trim: true }, // e.g., "H2 2025 Review"
    goals: [ScoreSchema], // weighted goals/competencies

    overallScore: { type: Number, min: 0, max: 5, default: 0 },
    status: {
      type: String,
      enum: ["open", "in_review", "finalized"],
      default: "open",
      index: true,
    },

    summary: { type: String, trim: true }, // final written feedback
    employeeNotes: { type: String, trim: true }, // optional response

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    finalizedAt: { type: Date },
  },
  { timestamps: true }
);

PerformanceReviewSchema.index({ title: "text", summary: "text" });

module.exports =
  mongoose.models.PerformanceReview ||
  mongoose.model("PerformanceReview", PerformanceReviewSchema);
