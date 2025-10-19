// backend/Model/tasksHR/SalaryProfile.js
const mongoose = require("mongoose");

const MoneyItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const SalaryProfileSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeProfile",
      required: true,
      unique: true,
      index: true,
    },

    // "hourly" OR "monthly"
    payType: {
      type: String,
      enum: ["hourly", "monthly"],
      required: true,
      index: true,
    },

    // if hourly
    hourlyRate: { type: Number, min: 0 },

    // if monthly
    monthlyBase: { type: Number, min: 0 },

    // additions and deductions applied at compute
    allowances: [MoneyItemSchema],
    deductions: [MoneyItemSchema],

    // optional OT config (simple)
    overtimeRateMultiplier: { type: Number, default: 1.5, min: 1 },

    effectiveFrom: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SalaryProfile ||
  mongoose.model("SalaryProfile", SalaryProfileSchema);
