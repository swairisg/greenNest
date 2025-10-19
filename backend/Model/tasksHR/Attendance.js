const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeProfile",
      required: true,
      index: true,
    },
    department: { type: String, trim: true, index: true },

    workDate: { type: Date, required: true, index: true },

    // embedded snapshot of the shift at assignment time
    shift: {
      name: String,
      startMinutes: Number,
      endMinutes: Number,
      startLabel: String, // "08:00 AM"
      endLabel: String, // "04:00 PM"
    },

    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },

    status: {
      type: String,
      enum: ["open", "clocked_in", "clocked_out"],
      default: "open",
      index: true,
    },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
