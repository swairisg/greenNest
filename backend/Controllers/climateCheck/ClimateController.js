require('dotenv').config(); 
const ClimateRecord = require("../../Model/climateCheck/ClimateRecord"); // Corrected path
const axios = require("axios"); //for http requests
const moment = require("moment-timezone"); //for timezone handling, moment library
const climateAlertService = require('../../utils/climateAlertService');

const generateSection = () => {//location generator 
  const directions = ["N", "S", "E", "W"];
  const randomDirection = directions[Math.floor(Math.random() * directions.length)];
  const sectionNumber = String(Math.floor(Math.random() * 4) + 1).padStart(2, "0"); // 01-04
  return `${randomDirection}_St${sectionNumber}`;
};

const getCurrentTimestamp = (timezone = "UTC") => {
  return {
    utc: new Date(),
    timezone,
  };
};

//display all sensor data
const getAllClimateRecords = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10; //default to 10 if not specified
    const records = await ClimateRecord.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    if (!records || records.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No climate data found" 
      });
    }
    
    //return the exact format your React component expects
    return res.status(200).json({ 
      success: true, 
      records: records  //react looks for response.data.records
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

//get by id
const getClimateRecordById = async (req, res, next) => {
  try {
    const record = await ClimateRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        message: "No record found",
      });
    }
    return res.status(200).json({ success: true, record });
  } catch (err) {
    console.error("Error fetching record:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get dashboard data

//insert data
const addClimateData = async (req, res, next) => {
  try {
    const {
      temperature,
      humidity,
      soilMoisture,
      sensorId = "default",
      timezone = "UTC",
    } = req.body; // Destructure with default values

    // Validate required fields
    if (
      temperature === undefined ||
      humidity === undefined ||
      soilMoisture === undefined
    ) {
      // Check for undefined to allow 0 values
      return res
        .status(400)
        .json({
          message: "Temperature, humidity, and soilMoisture are required",
        }); // Bad request
    }
    const { utc, timezone: tz } = getCurrentTimestamp(timezone);
    
    const location = req.body.location || generateSection();

    const sensorData = new ClimateRecord({
      temperature,
      humidity,
      soilMoisture,
      sensorId,
      location,
      timestamp: utc,
      timezone: tz,
    });

    const savedData = await sensorData.save(); // Save to database
    
    // Check for climate alerts after saving data
    await climateAlertService.checkClimateAlerts(savedData);
    
    return res.status(201).json({ success: true, data: savedData });
  } catch (err) {
    console.error("Error adding data:", err);
    return res
      .status(500)
      .json({ message: "Unable to add sensor data", error: err.message });
  }
};

//update data
const updateClimateData = async (req, res, next) => {
  const id = req.params.id;
  const { temperature, humidity, soilMoisture } = req.body;

  try {
    const updateData = await ClimateRecord.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true } //options
    ); //to return the updated document

    if (!updateData) {
      return res.status(404).json({ message: "Record not found" }); //not found
    }
    
    // Check for climate alerts after updating data
    await climateAlertService.checkClimateAlerts(updateData);
    
    return res.status(200).json({ success: true, data: updateData }); //display updated data
  } catch (err) {
    console.error("Error updating record:", err);
    return res.status(500).json({ message: "Server error" }); //server error
  }
};

//delete data
const deleteClimateData = async (req, res, next) => {
  try {
    const deletedData = await ClimateRecord.findByIdAndDelete(req.params.id);

    if (!deletedData) {
      return res.status(404).json({ message: "Record not found" }); //not found
    }
    return res.status(200).json({ success: true, data: deletedData }); //display deleted data
  } catch (err) {
    console.error("Error deleting data:", err);
    return res
      .status(500)
      .json({ message: "Unable to delete sensor data", error: err.message }); //server error
  }
};

//get latest climate data
const getLatestData = async (req, res, next) => {
  try {
    const latestRecord = await ClimateRecord.findOne().sort({ createdAt: -1 });

    if (!latestRecord) {
      return res.status(404).json({ 
        success: false, 
        message: "No climate data found" 
      });
    }
    
    //return the exact format your React component expects
    return res.status(200).json({ 
      success: true, 
      data: latestRecord  //react looks for response.data.data
    });
  } catch (err) {
    console.error("Error fetching latest data:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: err.message 
    });
  }
};

const getDashboardData = async (req, res, next) => {
  try {
    // Get latest record
    const latest = await ClimateRecord.findOne().sort({ createdAt: -1 });

    // Get count of total records
    const totalRecords = await ClimateRecord.countDocuments();

    // Get records from last 24 hours
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const recentRecords = await ClimateRecord.find({
      createdAt: { $gte: last24Hours },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const dashboardData = {
      latest,
      totalRecords,
      recentRecords,
      stats: {
        last24Hours: recentRecords.length,
      },
    };
    return res.status(200).json({ success: true, data: dashboardData });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// Fetch external weather data and save to DB
const fetchAndStoreExternalData = async (req, res) => {
  try {
    const lat = process.env.DEFAULT_LAT || 6.9497;
    const lng = process.env.DEFAULT_LNG || 80.7891;
    const weatherParams = "airTemperature,humidity";
    const bioParams = "soilMoisture";

    const weatherURL = `${process.env.STORMGLASS_WEATHER_URL}?lat=${lat}&lng=${lng}&params=${weatherParams}`;
    const bioURL = `${process.env.STORMGLASS_BIO_URL}?lat=${lat}&lng=${lng}&params=${bioParams}`;
    const apiKey = process.env.STORMGLASS_API_KEY;


    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "API key not configured"
      });
    }


    const [weatherResponse, bioResponse] = await Promise.all([
      axios.get(weatherURL, {
        headers: {
          Authorization: apiKey,
        },
      }),
      axios.get(bioURL, {
        headers: {
          Authorization: apiKey,
        },
      }),
    ]);

    const climateRecords = weatherResponse.data.hours.map((weatherHour, index) => {
      const bioHour = bioResponse.data.hours[index];
      return {
        temperature: weatherHour.airTemperature?.noaa || 0,
        humidity: weatherHour.humidity?.noaa || 0,
        soilMoisture: bioHour?.soilMoisture?.noaa || 0,
        timestamp: new Date(weatherHour.time),
        location: "external-weather-station",
        timezone: "UTC",
      };
    });

    // Bulk insert
    const savedData = await ClimateRecord.insertMany(climateRecords);
    
    // Check for climate alerts for each saved record
    for (const record of savedData) {
      await climateAlertService.checkClimateAlerts(record);
    }
    
    return res.status(201).json({ success: true, data: savedData });
  } catch (err) {
    console.error("Error fetching external data:", err.response?.data || err.message);
    return res
      .status(500)
      .json({ message: "Unable to fetch external data", error: err.message });
  }
};

// Delete old records
const deleteOldRecords = async (req, res, next) => {
  try {
    const { daysOld = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await ClimateRecord.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} records older than ${daysOld} days`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("Error deleting old records:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

//export functions
module.exports = {
  getAllClimateRecords,
  addClimateData,
  getClimateRecordById,
  updateClimateData,
  deleteClimateData,
  getLatestData,
  getDashboardData,
  deleteOldRecords,
  fetchAndStoreExternalData,
};
// Schema for operation logs