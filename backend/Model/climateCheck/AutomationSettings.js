require('dotenv').config(); 
const mongoose = require('mongoose');
//const { climateConnection } = require('../../config/database');

const automationSchema = new mongoose.Schema(
  {
    parameter: { type: String, required: true },
    minValue: { type: Number, required: true },
    maxValue: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Automation", automationSchema);