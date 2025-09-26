const express = require("express");
const router = express.Router();
const automationController = require("../../controllers/ClimateMonitoring/automationController");

// Test route
router.get("/test", (req, res) =>
  res.json({ success: true, message: "Automation API is working!" })
);

// CRUD routes
router.post("/", automationController.addThreshold);
router.get("/", automationController.getThresholds);
router.put("/:id", automationController.updateThreshold);
router.delete("/", automationController.deleteThreshold);

module.exports = router;
