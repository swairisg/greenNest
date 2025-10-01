const mongoose = require("mongoose");
const { inventoryConnection } = require("../../config/database.js"); 

const DriverSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Driver name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    phone: { 
      type: String, 
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+?[\d\s\-()]+$/, "Please enter a valid phone number"]
    },
    email: { 
      type: String, 
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
    },
    vehicleInfo: { 
      type: String, 
      required: [true, "Vehicle information is required"],
      trim: true,
      maxlength: [200, "Vehicle info cannot exceed 200 characters"]
    },
    licenseNumber: { 
      type: String, 
      required: [true, "License number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9\-_]+$/, "License number can only contain letters, numbers, hyphens and underscores"]
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"]
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

DriverSchema.index({ licenseNumber: 1 }, { unique: true });
DriverSchema.index({ isActive: 1 });
DriverSchema.index({ email: 1 });

module.exports = inventoryConnection.model("Driver", DriverSchema);
