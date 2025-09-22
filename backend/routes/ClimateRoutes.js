const express = require("express");
const router = express.Router();

//insert model
const ClimateRecord = require('../models/ClimateRecord');// Corrected path
//insert controller
const climateController = require('../controllers/ClimateController');

// Basic test route for API
router.get("/test", (req, res) => {
  res.json({ 
    message: "Climate API is working!" 
  });
})

// CRUD routes for records
router.get("/", climateController.getAllClimateRecords);//read all
router.get("/latest", climateController.getLatestData);//read all
router.get("/:id", climateController.getClimateRecordById);//read
router.post("/", climateController.addClimateData);//create
router.put("/:id", climateController.updateClimateData);//update
router.delete("/:id", climateController.deleteClimateData);//delete

//router.post("/fetch-external", climateController.fetchExternalWeatherData);//fetch external data

module.exports = router;
//