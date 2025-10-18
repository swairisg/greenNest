// app.js
require("dotenv").config(); // load .env exactly once

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

// middleware
app.use(
  cors({
    origin: "http://localhost:3000", // your React dev server
    credentials: true, // allow cookies if you add them later
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


const profileOrders = require("./Routes/customers/profileOrder"); 
app.use("/api/profileorders", profileOrders); 



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

app.use("/api/finance/orders", orderRoutes);

//inventory and supplychain routes
const inventoryRoutes = require("./Routes/inventory/InventoryRoute");
app.use("/api/items", inventoryRoutes);

const supplierRoutes = require("./Routes/inventory/SupplierRoute");
app.use("/api/suppliers", supplierRoutes);

//const transactionRoutes = require("./Routes/inventory/TransactionRoute");
const orderRoute2 = require("./Routes/inventory/OrderRoute");
app.use("/api/orders", orderRoute2);

const deliveryRoutes = require("./Routes/inventory/DeliveryRoute");
app.use("/api/deliveries", deliveryRoutes);

const driverRoutes = require("./Routes/inventory/DriverRoute");
app.use("/api/drivers", driverRoutes);

const InventoryAlerts = require("./Routes/inventory/Alerts");
app.use("/api/inventory-alerts", InventoryAlerts);

const reportRoutes = require("./Routes/inventory/ReportRoute");
app.use("/api/reports", reportRoutes);

//==========climate routes============
// Climate routes
const climateRoutes = require("./Routes/climateCheck/ClimateRoutes");
app.use("/api/climate", climateRoutes);
//const operationRoutes = require("./Routes/climateCheck/operationRoutes");
const automationRoutes = require("./Routes/climateCheck/automationRoutes");
app.use("/api/automation", automationRoutes);
const climateAlerts = require("./Routes/climateCheck/AlertRoutes");
const climateAlertService = require('./utils/climateAlertService');
app.use("/api/climate-alerts", climateAlerts);
const whatsappService = require('./utils/WhatsAppService');
// External data
const { fetchAndStoreExternalData } = require("./Controllers/climateCheck/ClimateController");
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
