const mongoose = require('mongoose');
//const { climateConnection } = require('../../config/database');
const Schema = mongoose.Schema;

const climateRecordSchema = new Schema({
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
  sensorId: {//id for the sensor
    type: String,
    required: true,
  },
  timestamp: {//when rec created
    type: Date,
    default: Date.now,
  },
  location: {//location of sensor
    type: String,
    required: true,
  },
  timezone: { 
    type: String, 
    default: "UTC" }
}, {
  timestamps: true// Automatically manage createdAt and updatedAt fields
});

module.exports = mongoose.model('ClimateRecord', climateRecordSchema);