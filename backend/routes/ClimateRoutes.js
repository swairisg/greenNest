const express = require("express");
const router = express.Router();
const {
  getAllSensorData,
  addClimateData,
  getLatestData,
  toggleManualOverride,
  getExternalWeatherData
} = require("../controllers/ClimateController");
const climateController = require('./controllers/climateController');

// Routes for ClimateController
router.get("/", getAllSensorData);
router.post("/", addClimateData);
router.get("/latest", getLatestData);
router.put("/manual-override", toggleManualOverride);
router.get("/external-weather", getExternalWeatherData);

// CREATE routes for climateController
router.post('/records/api', climateController.createClimateRecord);
router.post('/records/manual', climateController.createManualRecord);

// READ routes for climateController
router.get('/records', climateController.getAllClimateRecords);
router.get('/dashboard', climateController.getDashboardData);

// DELETE routes for climateController
router.delete('/records/cleanup', climateController.deleteOldRecords);
router.delete('/records/:id', climateController.deleteIncorrectRecord);

module.exports = router;