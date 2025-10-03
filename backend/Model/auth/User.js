const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: ["customer"], index: true },
    primaryRole: { type: String, default: "customer" },
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "invited", "pendingApproval"],
      default: "active",
      index: true,
    },
    source: {
      type: String,
      enum: ["publicSignup", "invite", "seed"],
      default: "seed",
    },
    isEmailVerified: { type: Boolean, default: true },
    loginCount: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
