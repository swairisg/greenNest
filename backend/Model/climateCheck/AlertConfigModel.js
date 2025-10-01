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
      type: String  // email or phone numbers
    }],
    alertMessage: String,
    cooldownMinutes: { 
      type: Number, 
      default: 30  // Prevent spam alerts
    },
    lastTriggered: Date
  },
  { timestamps: true }
);

//compound index for efficient querying
AlertConfigSchema.index({ parameter: 1, isActive: 1 });

module.exports = mongoose.model("AlertConfig", AlertConfigSchema);