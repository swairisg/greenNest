// backend/Model/tasksHR/EmployeeProfile.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const BankSchema = new Schema(
  { accountNo: String, bankName: String, branch: String },
  { _id: false }
);

const EmployeeProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },
    fullName: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    department: { type: String, required: true, trim: true, index: true },
    designation: { type: String, required: true, trim: true, index: true },
    joinDate: { type: Date, required: true },
    currentStatus: {
      type: String,
      enum: ["active", "inactive", "terminated"],
      default: "active",
      index: true,
    },
    salary: { type: Number, min: 0, default: 0 },
    bank: BankSchema,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Search index
EmployeeProfileSchema.index(
  { fullName: "text", department: "text", designation: "text" },
  { name: "employee_text_idx" }
);

module.exports =
  mongoose.models.EmployeeProfile ||
  mongoose.model("EmployeeProfile", EmployeeProfileSchema);
