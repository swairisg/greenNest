// backend/Model/plantCultivation/CultivationTaskModel.js
const mongoose = require("mongoose");

const CultivationTaskSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      enum: ["seeds", "land", "plans", "growth"],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 2000 },

    section: { type: String, trim: true }, // e.g., GH-1 / Bed A
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // link to a plan/seed/log if you want

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done", "blocked"],
      default: "todo",
    },

    dueDate: { type: Date },
    assignedTo: { type: String, trim: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

CultivationTaskSchema.index({ module: 1, status: 1, dueDate: 1, section: 1 });

module.exports = mongoose.model("CultivationTask", CultivationTaskSchema);
