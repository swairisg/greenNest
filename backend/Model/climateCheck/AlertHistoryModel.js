require('dotenv').config(); 
const mongoose = require("mongoose");

const AlertHistorySchema = new mongoose.Schema(
  {
    alertConfigId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "AlertConfig",
      required: true 
    },
    parameter: { 
      type: String, 
      enum: ['temperature', 'humidity', 'soilMoisture'],
      required: true 
    },
    recordedValue: { 
      type: Number, 
      required: true 
    },
    thresholdType: { 
      type: String, 
      enum: ['min', 'max'],
      required: true 
    },
    thresholdValue: { 
      type: Number, 
      required: true 
    },
    severity: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    isResolved: { 
      type: Boolean, 
      default: false 
    },
    resolvedAt: Date,
    notificationSent: { 
      type: Boolean, 
      default: false 
    },
    notificationMethods: [String]
  },
  { timestamps: true }
);

AlertHistorySchema.index({ parameter: 1, createdAt: -1 });
AlertHistorySchema.index({ isResolved: 1 });

module.exports = mongoose.model("AlertHistory", AlertHistorySchema);