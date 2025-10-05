// app.js
require("dotenv").config(); // load .env exactly once

const express = require("express");
const mongoose = require("mongoose");
const harvestRouter = require("./Routes/harvestManagement/harvest");
const orderRoutes = require("./Routes/finance/orderRoute");

const cors = require("cors");

// temporary minimal users router to prevent crash
const { Router } = require('express');
const router = Router();
router.get('/', (_req, res) => {
  res.json({ message: 'Users route healthy' });
});

const app = express();

// middleware
app.use(
  cors({
    origin: "http://localhost:3000", // your React dev server
    credentials: true, // allow cookies if you add them later
  })
);
app.use(express.json());

app.use("/HarvestSchedules", harvestRouter);

const hrRoutes = require("./Routes/tasksHR");
app.use("/hr", hrRoutes);

// Finance → Orders
app.use("/api/finance/orders", orderRoutes);


// routes
const pestRoutes = require("./Routes/pestControl/PestDetectRoute");
app.use("/users", pestRoutes);

const productRoutes = require("./Routes/productCatalogue/ProductRoute");
app.use("/products", productRoutes);

app.get("/", (_req, res) => res.send("Hello from backend"));

/* ---------- routes ---------- */
app.use("/auth", require("./Routes/auth"));


const qualityRoutes = require("./Routes/qualityControl/qualityControlRoute");
app.use("/api/quality", qualityRoutes);

// connect DB then start server
const PORT = Number(process.env.PORT) || 5001;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

const User = require("./Model/auth/User");
const EmployeeProfile = require("./Model/tasksHR/EmployeeProfile");
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    console.log("DB:", mongoose.connection.name);

    // Ensure indexes are in place (safe to call on every boot)
    await User.syncIndexes();
    await EmployeeProfile.syncIndexes();

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connection error:", err);
    process.exit(1);
  });
