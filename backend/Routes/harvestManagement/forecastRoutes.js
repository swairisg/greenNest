const router = require("express").Router();
const YieldRecords = require("../../Model/harvestManagement/YieldModel");
const { weeklyForecast } = require("../../Controllers/harvestManagement/weeklyForecastController");


// Weekly (NEW)
router.get("/harvest/ai/weekly-forecast", weeklyForecast);

// Optional: crops helper
router.get("/harvest/ai/crops", async (_req, res) => {
  try {
    const crops = await YieldRecords.distinct("cropType");
    res.json(crops.filter(Boolean).sort());
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch crops" });
  }
});

module.exports = router;
