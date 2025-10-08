require('dotenv').config(); 
const mongoose = require("mongoose");

const AlertConfigSchema = new mongoose.Schema(
  {
    parameter: { 
      type: String, 
      enum: ['temperature', 'humidity', 'soilMoisture'],
      required: true 
    },
    minThreshold: { 
      type: Number, 
      required: true 
    },
    maxThreshold: { 
      type: Number, 
      required: true 
    },
    severity: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: 'medium' 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    notificationMethods: [{ 
      type: String, 
      enum: ['email', 'whatsapp', 'sms', 'in_app'] 
    }],
    recipients: [{ 
      type: String
    }],
    alertMessage: String,
    cooldownMinutes: { 
      type: Number, 
      default: 30
    },
    lastTriggered: Date
  },
  { timestamps: true }
);

AlertConfigSchema.index({ parameter: 1, isActive: 1 });

module.exports = mongoose.model("AlertConfig", AlertConfigSchema);