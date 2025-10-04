const mongoose = require("mongoose");
const { Schema } = mongoose;

const pestDetectSchema = new Schema(
  {
    date_identified: {
      type: Date,
      required: [true, "date_identified is required"],
    },
    crop: {
      type: String,
      required: [true, "crop is required"],
      trim: true,
    },
    symptoms: {
      type: String,
      required: [true, "symptoms is required"],
      trim: true,
    },
    severity_level: {
      type: String,
      enum: ["Low", "Moderate", "High"],
      required: [true, "severity_level is required"],
    },
    pesticide: {
      type: String,
      default: "",
      trim: true,
    },
    application_method: {
      type: String,
      default: "",
      trim: true,
    },
    dosage: {
      type: String,
      default: "",
      trim: true,
    },
    treatment_date: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    // (optional) collection: "pest_detections", // uncomment if you want a fixed collection name
  }
);

// Helpful indexes for common queries (optional)
pestDetectSchema.index({ date_identified: -1 });
pestDetectSchema.index({ crop: 1 });
pestDetectSchema.index({ severity_level: 1 });

module.exports = mongoose.model("PestDetectModel", pestDetectSchema);
