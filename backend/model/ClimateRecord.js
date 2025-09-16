const mongoose = require('mongoose');

const climateRecordSchema = new mongoose.Schema({
  temperature: {
    type: Number,
    required: true,
  },
  humidity: {
    type: Number,
    required: true,
  },
  soilMoisture: {
    type: Number,
    required: true,
  },
  sensorId: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: String,
    required: true,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ClimateRecord', climateRecordSchema);