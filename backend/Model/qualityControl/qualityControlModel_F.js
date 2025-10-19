// backend/Model/qualityControl/qualityControlModel_F.js
const mongoose = require("mongoose");
const QualitySchema = require("./qualityControlmodel");

module.exports = mongoose.models.FarmerQuality
  || mongoose.model("FarmerQuality", QualitySchema, "qualities");