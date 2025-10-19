// backend/app.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// CORS + JSON
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

/* ---------- YOUR OTHER ROUTES (keep, but avoid duplicates) ---------- */
// Harvest
app.use("/HarvestSchedules", require("./Routes/harvestManagement/harvest"));
app.use("/yieldRecords", require("./Routes/harvestManagement/Yield"));

// HR
app.use("/hr", require("./Routes/tasksHR"));

// Customer & auth
app.use("/public", require("./Routes/customers/visitBooking"));
app.use("/api", require("./Routes/customers/visitBooking")); // if you really need both prefixes
app.use("/api/auth", require("./Routes/auth"));
app.use("/auth", require("./Routes/auth")); // pick one prefix in future to avoid confusion
app.use(require("./Routes/customers/contactUs/contactus"));

// Pest module (DB CRUD etc.)
app.use("/users", require("./Routes/pestControl/PestDetectRoute"));

// Product Catalog
app.use("/products", require("./Routes/productCatalogue/ProductRoute"));

// Quality Control
app.use("/api/quality", require("./Routes/qualityControl/qualityControlRoute"));

// Finance
app.use("/api/finance/orders", require("./Routes/finance/orderRoute"));

// Inventory & Supply Chain
app.use("/api/items", require("./Routes/inventory/InventoryRoute"));
app.use("/api/suppliers", require("./Routes/inventory/SupplierRoute"));
app.use("/api/orders", require("./Routes/inventory/OrderRoute"));
app.use("/api/deliveries", require("./Routes/inventory/DeliveryRoute"));
app.use("/api/drivers", require("./Routes/inventory/DriverRoute"));
app.use("/api/inventory-alerts", require("./Routes/inventory/Alerts"));
app.use("/api/reports", require("./Routes/inventory/ReportRoute"));

// Climate
app.use("/api/climate", require("./Routes/climateCheck/ClimateRoutes"));
app.use("/api/automation", require("./Routes/climateCheck/automationRoutes"));
app.use("/api/climate-alerts", require("./Routes/climateCheck/AlertRoutes"));
const { fetchAndStoreExternalData } = require("./Controllers/climateCheck/ClimateController");
app.post("/api/fetch-external", fetchAndStoreExternalData);


// Root health
app.get("/", (_req, res) => {
  res.json({
    message: "GreenNest backend is running",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

/* ---------- DB + Server ---------- */
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
