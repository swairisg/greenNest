const mongoose = require("mongoose");

const employeeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,
    },
    fullName: { type: String, required: true },
    department: String,
    designation: String,
    roleMeta: {},
    avatarUrl: String,
    joinedDate: Date,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.EmployeeProfile ||
  mongoose.model("EmployeeProfile", employeeProfileSchema);
