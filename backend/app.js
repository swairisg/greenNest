// backend/app.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
//const harvestRouter = require("./Routes/harvestManagement/harvest");
const orderRoutes = require("./Routes/finance/orderRoute");

//quality
const { ensureAuth, requireRoles } = require("./middleware/auth");

const cors = require("cors");
const cron = require("node-cron");
const phenology = require("./Controllers/plantCultivation/phenologyController");

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
//app.use("/api/quality", require("./Routes/qualityControl/qualityControlRoute"));

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
//const { fetchAndStoreExternalData } = require("./Controllers/climateCheck/ClimateController");
//chatbot
const customerChatRoutes = require("./Routes/customers/chatbot/customerChat");
app.use("/api/customer-chat", customerChatRoutes);

//harvest
const harvestRouter = require("./Routes/harvestManagement/harvest");
app.use("/HarvestSchedules", harvestRouter);

const YieldRouter = require("./Routes/harvestManagement/Yield");
app.use("/yieldRecords", YieldRouter);

const ForecastRouter = require("./Routes/harvestManagement/forecastRoutes");
app.use("/api", ForecastRouter);

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

// Customers API
const customersRouter = require("./Routes/customers/customerRoute");
app.use("/api/customers", customersRouter);

// routes
const pestRoutes = require("./Routes/pestControl/PestDetectRoute");
app.use("/users", pestRoutes);

const productRoutes = require("./Routes/productCatalogue/ProductRoute");
app.use("/products", productRoutes);

app.get("/", (_req, res) => res.send("Hello from backend"));

/* ---------- routes ---------- */
app.use("/auth", require("./Routes/auth"));

//qualitycontrol farmer (snippet)
const adminQualityRoutes = require("./Routes/qualityControl/qualityControlAdminroutes");
app.use("/api/admin", ensureAuth, requireRoles(["admin"]), adminQualityRoutes);

const farmerQualityRoutes = require("./Routes/qualityControl/qualityControlFarmerroutes");
app.use(
  "/api/farmer",
  ensureAuth,
  requireRoles(["farmer", "admin"]), // allow admin to view if you want
  farmerQualityRoutes
);

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

// Climate routes
const climateRoutes = require("./Routes/climateCheck/ClimateRoutes");
app.use("/api/climate", climateRoutes);
//const operationRoutes = require("./Routes/climateCheck/operationRoutes");
const automationRoutes = require("./Routes/climateCheck/automationRoutes");
app.use("/api/automation", automationRoutes);
const climateAlerts = require("./Routes/climateCheck/AlertRoutes");
const climateAlertService = require("./utils/climateAlertService");
app.use("/api/climate-alerts", climateAlerts);
const whatsappService = require("./utils/WhatsAppService");
// External data
const {
  fetchAndStoreExternalData,
} = require("./Controllers/climateCheck/ClimateController");
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

    // ---- Phenology (GDD) nightly recompute ----
    // Tiny wrapper because the controller method is an Express handler (req,res)
    const runPhenologyRecompute = async (reason = "manual/boot") => {
      try {
        console.log(`[Phenology] Recompute start (${reason})`);
        // call controller with dummy req/res to reuse its logic
        await phenology.recomputeAll(
          {}, // req
          {
            json: (payload) =>
              console.log(
                "[Phenology] Recompute OK:",
                payload?.at || new Date().toISOString()
              ),
          }
        );
        console.log("[Phenology] Recompute done");
      } catch (e) {
        console.error("[Phenology] Recompute failed:", e?.message || e);
      }
    };

    cron.schedule("15 2 * * *", () => runPhenologyRecompute("cron"), {
      timezone: "Asia/Colombo",
    });
    console.log("Phenology cron scheduled: 02:15 Asia/Colombo daily");

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connection error:", err);
    process.exit(1);
  });
