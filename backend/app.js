require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// ---------- Import Routes ----------
const harvestRouter = require("./Routes/harvestManagement/harvest");
const pestRoutes = require("./Routes/pestControl/PestDetectRoute");
const productRoutes = require("./Routes/productCatalogue/ProductRoute");
const authRoutes = require("./Routes/auth");

// Climate routes
const climateRoutes = require("./Routes/climateCheck/ClimateRoutes");
//const operationRoutes = require("./Routes/climateCheck/operationRoutes");
const automationRoutes = require("./Routes/climateCheck/automationRoutes");
const climateAlerts = require("./Routes/climateCheck/AlertRoutes");
const climateAlertService = require('./utils/climateAlertService');
const whatsappService = require('./utils/WhatsAppService');

// Inventory and supply chain routes
const inventoryRoutes = require("./Routes/inventory/InventoryRoute");
const supplierRoutes = require("./Routes/inventory/SupplierRoute");
const transactionRoutes = require("./Routes/inventory/TransactionRoute");
const orderRoutes = require("./Routes/inventory/OrderRoute");
const deliveryRoutes = require("./Routes/inventory/DeliveryRoute");
const driverRoutes = require("./Routes/inventory/DriverRoute");
const alerts = require("./Routes/inventory/Alerts");
const reportRoutes = require("./Routes/inventory/ReportRoute");

// Controllers
const { fetchAndStoreExternalData } = require("./Controllers/climateCheck/ClimateController");

// ---------- Register Routes ----------
app.use("/HarvestSchedules", harvestRouter);
app.use("/users", pestRoutes);
app.use("/products", productRoutes);
app.use("/auth", authRoutes);

// Climate
app.use("/api/climate", climateRoutes);
//app.use("/api/operations", operationRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/climate-alerts", climateAlerts);

// Inventory
app.use("/api/items", inventoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/alerts", alerts);
app.use("/api/reports", reportRoutes);

// External data
app.post("/api/fetch-external", fetchAndStoreExternalData);

// ---------- Root route ----------
app.get("/", (req, res) => {
  res.json({
    message: "Climate Monitoring API Server is running!",
    endpoints: {
      climate: "/api/climate",
      automation: "/api/automation",
      records: "/records",
      inventory: "/api/items",
      suppliers: "/api/suppliers",
      transactions: "/api/transactions",
      orders: "/api/orders",
      fetchExternal: "/api/fetch-external",
    },
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// ---------- Error handling middleware ----------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

// ---------- 404 handler ----------
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    availableEndpoints: [
      "/api/climate",
      "/api/automation",
      "/api/alerts",
      "/records",
      "/api/items",
      "/api/suppliers",
      "/api/transactions",
      "/api/orders",
      "/api/deliveries",
      "/api/drivers",
      "/api/fetch-external",
      "/",
    ],
  });
});

// ---------- Connect to MongoDB and Start Server ----------
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Mongo connection error:", err);
    process.exit(1);
  });
