// models/AutomationSettings.js - Cleaned and Fixed Version
const mongoose = require('mongoose');

// Schema for automation thresholds and settings
const automationSettingsSchema = new mongoose.Schema({
  // Automation thresholds
  thresholds: {
    soilMoisture: {
      min: { type: Number, required: true, default: 30 }, // Start watering when below 30%
      max: { type: Number, required: true, default: 70 }, // Stop watering when above 70%
    },
    temperature: {
      min: { type: Number, default: 18 }, // Minimum temperature (°C)
      max: { type: Number, default: 28 }, // Maximum temperature (°C)
    },
    humidity: {
      min: { type: Number, default: 40 }, // Minimum humidity (%)
      max: { type: Number, default: 80 }, // Maximum humidity (%)
    }
  },
  
  // Operation settings
  operations: {
    watering: {
      enabled: { type: Boolean, default: true },
      duration: { type: Number, default: 10 }, // Duration in minutes
      interval: { type: Number, default: 60 }, // Minimum interval between watering (minutes)
      lastRun: { type: Date, default: null },
      manualOverride: { type: Boolean, default: false },
      status: { type: String, enum: ['ON', 'OFF', 'AUTO'], default: 'AUTO' }
    },
    fertilization: {
      enabled: { type: Boolean, default: true },
      schedule: { type: String, default: 'weekly' }, // daily, weekly, monthly
      lastRun: { type: Date, default: null },
      manualOverride: { type: Boolean, default: false },
      status: { type: String, enum: ['ON', 'OFF', 'AUTO'], default: 'AUTO' }
    },
    ventilation: {
      enabled: { type: Boolean, default: true },
      temperatureThreshold: { type: Number, default: 25 },
      manualOverride: { type: Boolean, default: false },
      status: { type: String, enum: ['ON', 'OFF', 'AUTO'], default: 'AUTO' }
    }
  },
  
  // Manual override settings
  manualOverride: {
    isActive: { type: Boolean, default: false },
    activatedBy: { type: String, default: '' }, // Staff member name
    reason: { type: String, default: '' },
    activatedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null } // Auto-disable override after this time
  },
  
  // Scheduling settings
  schedule: {
    wateringTimes: [{ 
      hour: { type: Number, required: true },
      minute: { type: Number, required: true },
      enabled: { type: Boolean, default: true }
    }],
    fertilizationDays: [{ type: Number }], // Days of week (0=Sunday, 6=Saturday)
    maintenanceMode: { type: Boolean, default: false }
  },
  
  // Metadata
  greenhouse: { 
    type: String, 
    required: true, 
    default: 'main' 
  },
  createdBy: { type: String, default: 'system' },
  updatedBy: { type: String, default: 'system' }
}, {
  timestamps: true
});

// Schema for logging automation events
const automationLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: ['watering', 'fertilization', 'ventilation', 'manual_override', 'threshold_change', 'schedule_change']
  },
  action: {
    type: String,
    required: true,
    enum: ['started', 'stopped', 'completed', 'failed', 'enabled', 'disabled', 'modified']
  },
  trigger: {
    type: String,
    required: true,
    enum: ['automated', 'manual', 'scheduled', 'override', 'emergency']
  },
  
  // Event details
  details: {
    duration: { type: Number }, // Duration in minutes
    sensorData: {
      temperature: { type: Number },
      humidity: { type: Number },
      soilMoisture: { type: Number }
    },
    thresholdValues: {
      min: { type: Number },
      max: { type: Number }
    },
    previousValue: mongoose.Mixed, // For tracking changes
    newValue: mongoose.Mixed
  },
  
  // Staff information (for manual actions)
  staff: {
    name: { type: String },
    role: { type: String },
    reason: { type: String }
  },
  
  // System information
  greenhouse: { type: String, required: true, default: 'main' },
  success: { type: Boolean, required: true, default: true },
  errorMessage: { type: String },
  
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Schema for automation schedules
const automationScheduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['watering', 'fertilization', 'maintenance', 'custom']
  },
  
  // Schedule configuration
  schedule: {
    frequency: {
      type: String,
      required: true,
      enum: ['once', 'daily', 'weekly', 'monthly', 'interval']
    },
    time: {
      hour: { type: Number, required: true, min: 0, max: 23 },
      minute: { type: Number, required: true, min: 0, max: 59 }
    },
    days: [{ type: Number, min: 0, max: 6 }], // Days of week for weekly schedules
    interval: { type: Number }, // Interval in minutes for interval-based schedules
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date }
  },
  
  // Action configuration
  action: {
    operation: { type: String, required: true },
    duration: { type: Number }, // Duration in minutes
    parameters: mongoose.Mixed // Additional parameters for the operation
  },
  
  // Status
  enabled: { type: Boolean, default: true },
  lastRun: { type: Date },
  nextRun: { type: Date },
  runCount: { type: Number, default: 0 },
  
  // Metadata
  greenhouse: { type: String, required: true, default: 'main' },
  createdBy: { type: String, required: true },
  description: { type: String }
}, {
  timestamps: true
});

// Add schema methods for better functionality
automationSettingsSchema.methods.isOperationEnabled = function(operation) {
  return this.operations[operation]?.enabled && 
         this.operations[operation]?.status !== 'OFF' &&
         !this.manualOverride.isActive;
};

automationSettingsSchema.methods.needsWatering = function(currentSoilMoisture) {
  return currentSoilMoisture < this.thresholds.soilMoisture.min;
};

automationSettingsSchema.methods.shouldStopWatering = function(currentSoilMoisture) {
  return currentSoilMoisture >= this.thresholds.soilMoisture.max;
};

// Add static methods
automationSettingsSchema.statics.getActiveSettings = function(greenhouse = 'main') {
  return this.findOne({ 
    greenhouse,
    'operations.watering.enabled': true 
  });
};

// Add pre-save middleware
automationSettingsSchema.pre('save', function(next) {
  // Auto-disable manual override if expired
  if (this.manualOverride.isActive && 
      this.manualOverride.expiresAt && 
      new Date() > this.manualOverride.expiresAt) {
    this.manualOverride.isActive = false;
    this.operations.watering.manualOverride = false;
    this.operations.fertilization.manualOverride = false;
    this.operations.ventilation.manualOverride = false;
  }
  next();
});

// Indexes for better performance
automationSettingsSchema.index({ greenhouse: 1 });
automationLogSchema.index({ eventType: 1, timestamp: -1 });
automationLogSchema.index({ greenhouse: 1, timestamp: -1 });
automationLogSchema.index({ trigger: 1, timestamp: -1 });
automationScheduleSchema.index({ enabled: 1, nextRun: 1 });
automationScheduleSchema.index({ greenhouse: 1, enabled: 1 });

// Export all models
module.exports = {
  AutomationSettings: mongoose.model('AutomationSettings', automationSettingsSchema),
  AutomationLog: mongoose.model('AutomationLog', automationLogSchema),
  AutomationSchedule: mongoose.model('AutomationSchedule', automationScheduleSchema)
};