const mongoose = require('mongoose');

const automationSettingsSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    unique: true,
  },
  optimalSoilMoisture: {
    min: { type: Number, default: 30 },
    max: { type: Number, default: 70 }
  },
  temperatureThresholds: {
    min: { type: Number, default: 15 },
    max: { type: Number, default: 35 }
  },
  humidityThresholds: {
    min: { type: Number, default: 40 },
    max: { type: Number, default: 80 }
  },
  wateringEnabled: {
    type: Boolean,
    default: true
  },
  manualOverride: {
    active: { type: Boolean, default: false },
    reason: String,
    staffId: String,
    overrideUntil: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AutomationSettings', automationSettingsSchema);