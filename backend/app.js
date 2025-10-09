// app.js
require("dotenv").config(); // load .env exactly once

const express = require("express");
const mongoose = require("mongoose");
const harvestRouter = require("./Routes/harvestManagement/harvest");

const cors = require("cors");

const app = express();

// middleware
app.use(
  cors({
    origin: "http://localhost:3000", // your React dev server
    credentials: true, // allow cookies if you add them later
  })
);
app.use(express.json());


app.use("/HarvestSchedules",harvestRouter);

// routes
const pestRoutes = require("./Routes/pestControl/PestDetectRoute");
app.use("/users", pestRoutes);

const productRoutes = require("./Routes/productCatalogue/ProductRoute");
app.use("/products", productRoutes);

app.get("/", (_req, res) => res.send("Hello from backend"));

/* ---------- routes ---------- */
app.use("/auth", require("./Routes/auth"));

// connect DB then start server
const PORT = Number(process.env.PORT) || 5001;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

const User = require("./Model/auth/User");
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    console.log("DB:", mongoose.connection.name);

    // Ensure indexes are in place (safe to call on every boot)
    await User.syncIndexes();

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connection error:", err);
    process.exit(1);
  });


const { fetchAndStoreExternalData } = require("./Controllers/climateCheck/ClimateController");
const climateAlertService = require("./utils/climateAlertService");
const whatsappService = require("./utils/WhatsAppService");

//import routes
//climate routes
const climateRoutes = require("./Routes/climateCheck/ClimateRoutes");
const operationRoutes = require("./Routes/climateCheck/operationRoutes");
const automationRoutes = require("./Routes/climateCheck/automationRoutes");
const climateAlerts = require("./Routes/climateCheck/AlertRoutes");
//inventory and supplychain routes
const inventoryRoutes = require("./Routes/inventory/InventoryRoute");
const supplierRoutes = require("./Routes/inventory/SupplierRoute");
//const transactionRoutes = require("./Routes/inventory/TransactionRoute");
const orderRoutes = require("./Routes/inventory/OrderRoute");
const deliveryRoutes = require("./Routes/inventory/DeliveryRoute");
const driverRoutes = require("./Routes/inventory/DriverRoute");
const InventoryAlerts = require("./Routes/inventory/Alerts");
const reportRoutes = require("./Routes/inventory/ReportRoute");

//routes
app.use("/api/climate", climateRoutes);
app.use("/api/operations", operationRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/climate-alerts", climateAlerts);

app.use("/api/items", inventoryRoutes);
app.use("/api/suppliers", supplierRoutes);
//app.use("/api/transactions", transactionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/inventory-alerts", InventoryAlerts);
app.use("/api/reports", reportRoutes);

//fetch external data route- without router conflicts
app.post("/api/fetch-external", fetchAndStoreExternalData);

//basic check rt
app.get("/", (req, res) => {
  res.json({
    message: "Climate Monitoring API Server is running!",
    endpoints: {
      climate: "/api/climate",
      operations: "/api/operations",
      automation: "/api/automation",
      records: "/records",
      inventory: "/api/items",
      suppliers: "/api/suppliers",
      //transactions: "/api/transactions",
      orders: "/api/orders",
      fetchExternal: "/api/fetch-external",
    },
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

//error hdling middlware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    availableEndpoints: [
      "/api/climate",
      "/api/operations",
      "/api/automation",
      "/api/alerts",
      "/records",
      "/api/items",
      "/api/suppliers",
      //"/api/transactions",
      "/api/orders",
      "/api/deliveries",
      "/api/drivers",
      "/api/fetch-external",
      "/",
    ],
  });
});

