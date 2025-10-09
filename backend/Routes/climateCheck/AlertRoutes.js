const express = require("express");
const router = express.Router();
const controller = require("../../Controllers/climateCheck/AlertController");

router.post("/configs", controller.createAlertConfig);
router.get("/configs", controller.getAllAlertConfigs);
router.put("/configs/:id", controller.updateAlertConfig);
router.delete("/configs/:id", controller.deleteAlertConfig);

router.get("/history", controller.getAlertHistory);
router.put("/history/:id/resolve", controller.resolveAlert);
router.get("/summary", controller.getAlertSummary);
router.post("/test", controller.testAlertTrigger);

module.exports = router;