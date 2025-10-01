const mongoose = require("mongoose");
const { climateConnection } = require('../../config/database');

const operationSchema = new mongoose.Schema(
  {
    type: { 
      type: String, 
      enum: ["watering", "fertilization", "manualOverride"], 
      required: true 
    },
    status: { type: String, enum: ["ON", "OFF"], required: true },
    performedBy: { type: String, default: "system" }, // staff or system
    notes: { type: String }, // optional notes about the event
    location: { type: String }, // e.g., N_St01, S_St02
  },
  { timestamps: true }
);

module.exports = climateConnection.model("OperationEvent", operationSchema);