// app.js
require("dotenv").config(); // load .env exactly once

const express = require("express");
const mongoose = require("mongoose");
const harvestRouter = require("./Routes/harvestManagement/harvest");

const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());


app.use("/HarvestSchedules",harvestRouter);

// routes
app.get("/", (_req, res) => res.send("Hello from backend"));

// connect DB then start server
const PORT = Number(process.env.PORT) || 5001;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    console.log("DB:", mongoose.connection.name);
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connection error:", err);
    process.exit(1);
  });
