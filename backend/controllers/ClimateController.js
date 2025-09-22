const ClimateRecord = require('../models/ClimateRecord');// Corrected path
//const axios = require('axios');//for http requests


//display all sensor data
const getAllClimateRecords = async(req, res, next) => {
  let records;
  try{
    records = (await ClimateRecord.find()).sort({ timestamp: -1});//sort by timestamp descending order

    if(!records || records.lenth === 0 ) {
      return res.staus(404).json({message: "No climate data found"});//no data found
    }
    return res.status(200).json({success : true, records});//display data

  } catch (err) {
    console.log(err);//log error
    return res.status(500).json({message: "Server error"});//server error
  }
};

//get by id
const getClimateRecordById = async (req, res, next) => {
  const id = req.params.id;

  let record;

  try {
    record = await ClimateRecord.findById(id);
    
    if(!record) {
      return res.status(404).json({message: "No record found"});
    }
    return res.status(200).json({record});

  } catch (err) {

    console.log(err);
    return res.status(500).json({message: "Server error"});
  }
};




// Get dashboard data
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
      createdAt: { $gte: last24Hours }
    }).sort({ createdAt: -1 }).limit(10);
    
    const dashboardData = {
      latest,
      totalRecords,
      recentRecords,
      stats: {
        last24Hours: recentRecords.length
      }
    };
    return res.status(200).json({ success: true, data: dashboardData });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

//insert data
const addClimateData = async (req, res, next) => {

   try {
    const { temperature, humidity, soilMoisture, sensorId = "default", location = "greenhouse" } = req.body;// Destructure with default values
    
    // Validate required fields
    if (temperature === undefined || humidity === undefined || soilMoisture === undefined) {// Check for undefined to allow 0 values
      return res.status(400).json({ message: "Temperature, humidity, and soilMoisture are required" });// Bad request
    }
    
    const sensorData = new ClimateRecord({
      temperature,
      humidity,
      soilMoisture,
      sensorId,
      location,
      timestamp: new Date()
    });
    
    const savedData = await sensorData.save();// Save to database
    return res.status(201).json({ success: true, data: savedData });

  } catch (err) {

    console.error('Error adding data:', err);
    return res.status(500).json({ message: "Unable to add sensor data", error: err.message });
  }
};

//update data
const updateClimateData = async (req, res, next) => {
  const id = req.params.id;
  const { temperature, humidity, soilMoisture } = req.body;

  let updateData;

  try{

    updateData = await ClimateRecord.findByIdAndUpdate(
      id, 
      { temperature, humidity, soilMoisture },
      { new: true, runValidators: true }//options
    );//to return the updated document

    if(!updateData){
      return res.status(404).json({message: "Record not found"});//not found
    }
    return res.status(200).json({success: true, data: updateData});//display updated data

  } catch(err) {
    console.log(err);
    return res.status(500).json({message: "Server error"});//server error
  }
};

//delete data
const deleteClimateData = async (req, res, next) => {
  const id = req.params.id;
  let deletedData; 

  try {
    deletedData = await ClimateRecord.findByIdAndDelete(id);

    if(!deletedData) {
      return res.status(404).json({message: "Record not found"});//not found
    }
    return res.status(200).json({success: true, data: deletedData});//display deleted data

  }catch (err) {

    console.log(err);
    return res.status(500).json({message: "Unable to delete sensor data", error: err.message});//server error
  }
};

// Get latest climate data
const getLatestData = async (req, res, next) => {
  try {
    const latestRecord = await ClimateRecord.findOne()
      .sort({ createdAt: -1 }); // Get most recent record
    
    if (!latestRecord) {
      return res.status(404).json({ message: "No climate data found" });
    }
    
    return res.status(200).json({ success: true, data: latestRecord });
  } catch (err) {
    console.error('Error fetching latest data:', err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
// Fetch external weather data and save to DB
const fetchAndStoreExternalData = async (req, res, next) => {
  try {
    const lat = 6.9497;
    const lng = 80.7891;
    const params = 'airTemperature,humidity, soilMoisture, time';
    const URL = `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${params}`;
    
    const response = await axios.get(URL, {
      headers: {
        'Authorization': 'abcf79bc-863f-11f0-a59f-0242ac130006-abcf7a2a-863f-11f0-a59f-0242ac130006' //stormglass API key
      }
    });
    
    // Extract data from API response and save to DB
    const weatherData = response.data;
    const currentHour = weatherData.hours[0]; // Get current hour data
    
    const climateData = new ClimateRecord({

      temperature: currentHour.airTemperature?.noaa || 0,// Default to 0 if data is missing
      humidity: currentHour.humidity?.noaa || 0,// Default to 0 if data is missing
      soilMoisture: currentHour.soilMoisture?.noaa || 0,// Default to 0 if data is missing
      timestamp: new Date(currentHour.time) || new Date(),// Use current time if data is missing
      sensorId: 'external-api',
      location: 'external-weather-station'//sensor location 
    });
    
    const savedData = await climateData.save();
    return res.status(201).json({ success: true, data: savedData });

  } catch (err) {

    console.error('Error fetching external data:', err);
    return res.status(500).json({ message: "Unable to fetch external data", error: err.message });

  }
};
// Delete old records
const deleteOldRecords = async (req, res, next) => {
  try {
    const { daysOld = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await ClimateRecord.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} records older than ${daysOld} days`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Error deleting old records:', err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


//export functions
exports.getAllClimateRecords = getAllClimateRecords;
exports.addClimateData = addClimateData;
exports.getClimateRecordById = getClimateRecordById;
exports.updateClimateData = updateClimateData;
exports.deleteClimateData = deleteClimateData;
exports.getLatestData = getLatestData;
exports.getDashboardData = getDashboardData;
exports.deleteOldRecords = deleteOldRecords;
exports.fetchAndStoreExternalData = fetchAndStoreExternalData;

// Schema for operation logs