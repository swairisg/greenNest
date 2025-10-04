const express = require("express");
const router = express.Router();
const controller = require("../../Controllers/inventory/TransactionController");

router.post("/in", controller.recordStockInward);
router.post("/out", controller.recordStockOutward);
router.get("/logs", controller.getInventoryMovementLogs);

module.exports = router;
