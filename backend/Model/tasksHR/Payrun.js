// backend/Model/tasksHR/Payrun.js
const mongoose = require("mongoose");

const PayrunEntrySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeProfile",
      index: true,
    },
    // snapshots for convenience in exports
    employeeName: { type: String, trim: true },
    department: { type: String, trim: true },

    payType: { type: String, enum: ["hourly", "monthly"] },

    // worked time
    workedMinutes: { type: Number, default: 0, min: 0 },
    overtimeMinutes: { type: Number, default: 0, min: 0 },

    // rates / base
    hourlyRate: { type: Number, min: 0 },
    monthlyBase: { type: Number, min: 0 },

    // money
    basePay: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    allowances: [
      {
        name: { type: String, trim: true },
        amount: { type: Number, default: 0 },
      },
    ],
    deductions: [
      {
        name: { type: String, trim: true },
        amount: { type: Number, default: 0 },
      },
    ],
    gross: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
  },
  { _id: false }
);

const PayrunSchema = new mongoose.Schema(
  {
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true, index: true },

    status: {
      type: String,
      enum: ["draft", "computed", "approved", "paid"],
      default: "draft",
      index: true,
    },

    // entries computed for each employee
    entries: [PayrunEntrySchema],

    approvedAt: { type: Date },
    paidAt: { type: Date },

    // audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Payrun || mongoose.model("Payrun", PayrunSchema);
