const Sensor = require("../model/SensorModel");

// Display all sensor data
const getAllSensorData = async (req, res, next) => {
  try {
    const sensors = await Sensor.find();
    
    if (!sensors || sensors.length === 0) {
      return res.status(404).json({ message: "No sensor data found" });
    }
    
    return res.status(200).json({ sensors });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Insert new climate data
const addClimateData = async (req, res, next) => {
  const { temperature, humidity, soilMoisture } = req.body;
  
  try {const ClimateRecord = require('../models/ClimateRecord');
const axios = require('axios');

// CREATE - Add new climate record from API
exports.createClimateRecord = async (req, res) => {
  try {
    // Fetch from Sensoterra API
    const sensorResponse = await axios.get('https://monitor.sensoterra.com/api/v3/', {
      headers: {
        'Authorization': `Bearer ${process.env.SENSOTERRA_API_KEY}`
      }
    });

    const { temperature, humidity, soilMoisture, sensorId, location } = sensorResponse.data;
    
    const newRecord = new ClimateRecord({
      temperature,
      humidity,
      soilMoisture,
      sensorId,
      location
    });

    const savedRecord = await newRecord.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// CREATE - Manual climate record entry
exports.createManualRecord = async (req, res) => {
  try {
    const newRecord = new ClimateRecord(req.body);
    const savedRecord = await newRecord.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ - Get all climate records with pagination and filters
exports.getAllClimateRecords = async (req, res) => {
  try {
    const { page = 1, limit = 50, location, startDate, endDate } = req.query;
    
    let filter = {};
    if (location) filter.location = location;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const records = await ClimateRecord.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ClimateRecord.countDocuments(filter);
    
    res.json({
      records,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ - Get real-time dashboard data
exports.getDashboardData = async (req, res) => {
  try {
    const { location } = req.query;
    
    // Get latest records for each location or specific location
    const pipeline = [
      ...(location ? [{ $match: { location } }] : []),
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$location',
          latestRecord: { $first: '$$ROOT' },
          avgTemperature: { $avg: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          avgSoilMoisture: { $avg: '$soilMoisture' }
        }
      }
    ];

    const dashboardData = await ClimateRecord.aggregate(pipeline);
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE - Remove outdated climate logs
exports.deleteOldRecords = async (req, res) => {
  try {
    const { daysOld = 90 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await ClimateRecord.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.json({ 
      message: `Deleted ${result.deletedCount} old climate records`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE - Remove specific incorrect records
exports.deleteIncorrectRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRecord = await ClimateRecord.findByIdAndDelete(id);
    
    if (!deletedRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({ message: 'Record deleted successfully', deletedRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
    // Thresholds
    const wateringThres = 30;
    const fertilizationThres = 20;
    
    // Automation Logic
    let watering = false;
    let fertilization = false;
    
    if (soilMoisture < wateringThres) watering = true;
    if (soilMoisture < fertilizationThres) fertilization = true;
    
    const sensorData = await Sensor.create({
      temperature,
      humidity,
      soilMoisture,
      watering,
      fertilization,
      createdAt: new Date()
    });
    
    res.status(201).json(sensorData);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error creating sensor data", error: err.message });
  }
};

// Get latest data
const getLatestData = async (req, res) => {
  try {
    const data = await Sensor.findOne().sort({ createdAt: -1 });
    
    if (!data) {
      return res.status(404).json({ message: "No sensor data found" });
    }
    
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Manual override toggle
const toggleManualOverride = async (req, res) => {
  try {
    const { manualOverride } = req.body;
    const data = await Sensor.findOne().sort({ createdAt: -1 });
    
    if (data) {
      data.manualOverride = manualOverride;
      await data.save();
      res.status(200).json(data);
    } else {
      res.status(404).json({
        message: "No sensor data found"
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// External weather API integration
const getExternalWeatherData = async (req, res) => {
  const lat = 6.9607; // Colombo, Sri Lanka coordinates
  const lng = 80.7693;
  const params = 'airTemperature,humidity'; // Note: soilMoisture might not be available
  
  try {
    const response = await fetch(
      `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${params}`,
      {
        headers: {
          'Authorization': 'abcf79bc-863f-11f0-a59f-0242ac130006-abcf7a2a-863f-11f0-a59f-0242ac130006'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const jsonData = await response.json();
    res.status(200).json(jsonData);
  } catch (err) {
    console.error('Error fetching external weather data:', err);
    res.status(500).json({ message: "Error fetching external weather data", error: err.message });
  }
};

module.exports = {
  getAllSensorData,
  addClimateData,
  getLatestData,
  toggleManualOverride,
  getExternalWeatherData
};
