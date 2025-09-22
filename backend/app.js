//Fz8NZ82Eqjp1V6hd
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");//enable CORS
const bodyParser = require("body-parser");//parse JSON request bodies
require("dotenv").config();//load env variables

require("dotenv").config();

// Debug environment variables
console.log('🔍 Environment Debug:');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')));


//import routes
const climateRoutes = require("./routes/ClimateRoutes");
const operationRoutes = require("./routes/operationRoutes");
const automationRoutes = require("./routes/automationRoutes");

const app = express();

//abcf79bc-863f-11f0-a59f-0242ac130006-abcf7a2a-863f-11f0-a59f-0242ac130006

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://admin:Fz8NZ82Eqjp1V6hd@cluster0.u7lnqrz.mongodb.net/climateDB";

// Middleware
app.use(cors()); // Enable CORS first
app.use(express.json()); // Parse JSON bodies
app.use(bodyParser.json());

// Routes
app.use("/api/climate", climateRoutes);
app.use("/api/operations", operationRoutes);
app.use("/api/automation", automationRoutes);
app.use("/records", climateRoutes);

// Basic check route
app.get("/", (req, res) => {
  res.json({ message: "Climate Monitoring API Server is running!",
    endpoints:{
      climate:"/api/climate",
      operations:"/api/operations",
      automation:"/api/automation",
      records: "/records",
      health: "/"
    },
    status: "OK",
    timestamp: new Date().toISOString()
   });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: "Something went wrong!", 
    error: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: "Route not found",
    availableEndpoints: ["/api/climate", "/records", "/"]
  });
});

//db conn and server start
const startServer = async () => {

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
  catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
}
startServer();
module.exports = app;