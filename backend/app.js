//326aa1fVyyBcs4Cx

// server.jsconst express = require("express");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
const climateRoutes = require("./routes/ClimateRoutes");
const operationRoutes = require("./routes/operationRoutes");
const automationRoutes = require("./routes/automationRoutes");

// Apply routes
app.use("/api/climate", climateRoutes);
app.use("/api/operations", operationRoutes);
app.use("/api/automation", automationRoutes);

// Basic test route
app.get("/", (req, res) => {
  res.json({ message: "Climate Monitoring API is running!" });
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/climate_monitoring");
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

connectDB();

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.use("/", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
