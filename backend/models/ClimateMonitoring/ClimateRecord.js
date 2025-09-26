const mongoose = require('mongoose');
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
  sensorId: {// Unique identifier for the sensor
    type: String,
    required: true,
  },
  timestamp: {// Time when the record was created
    type: Date,
    default: Date.now,
  },
  location: {// Location of the sensor in the greenhouse
    type: String,
    required: true,
  }
}, {
  timestamps: true// Automatically manage createdAt and updatedAt fields
});

module.exports = mongoose.model('ClimateRecord', climateRecordSchema);//file name and function name