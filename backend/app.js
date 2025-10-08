require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
//const harvestRouter = require("./Routes/harvestManagement/harvest");
const orderRoutes = require("./Routes/finance/orderRoute");

const cors = require("cors");

// temporary minimal users router to prevent crash
const { Router } = require("express");
const router = Router();
router.get("/", (_req, res) => {
  res.json({ message: "Users route healthy" });
});

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

//harvest
const harvestRouter = require("./Routes/harvestManagement/harvest");
app.use("/HarvestSchedules", harvestRouter);

const YieldRouter = require("./Routes/harvestManagement/Yield");
app.use("/yieldRecords", YieldRouter);

const hrRoutes = require("./Routes/tasksHR");
app.use("/hr", hrRoutes);

const plantCultRoutes = require("./Routes/plantCultivation");
app.use("/plant-cultivation", plantCultRoutes);

//customer
const publicVisitRoutes = require("./Routes/customers/visitBooking");
const authRouter = require("./Routes/auth");
app.use("/public", publicVisitRoutes);

app.use("/public", publicVisitRoutes);
app.use(express.json());
app.use("/api/auth", authRouter);

const visitBookingRoutes = require("./Routes/customers/visitBooking");
app.use("/api", visitBookingRoutes);

const contactRoutes = require("./Routes/customers/contactUs/contactus");
app.use(contactRoutes);

// routes
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

const qualityRoutes = require("./Routes/qualityControl/qualityControlRoute");
app.use("/api/quality", qualityRoutes);

app.use("/api/finance/orders", orderRoutes);

// ---------- Connect to MongoDB and Start Server ----------
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

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
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Mongo connection error:", err);
    process.exit(1);
  });
