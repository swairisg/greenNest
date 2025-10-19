// backend/Model/qualityControl/qualityControlModel_A.js
const mongoose = require("mongoose");
const QualitySchema = require("./qualityControlmodel");

module.exports = mongoose.models.AdminQuality
  || mongoose.model("AdminQuality", QualitySchema, "qualities");