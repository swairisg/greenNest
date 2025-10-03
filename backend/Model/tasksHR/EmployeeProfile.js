const mongoose = require("mongoose");

const EmployeeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true }, // optional, helpful for search
    department: { type: String, trim: true, index: true },
    designation: { type: String, trim: true, index: true },
    // add more later: phone, address, status, joinDate, salary, etc.
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.EmployeeProfile ||
  mongoose.model("EmployeeProfile", EmployeeProfileSchema);
