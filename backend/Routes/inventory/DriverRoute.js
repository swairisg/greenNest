const express = require("express");
const router = express.Router();
const controller = require("../../controllers/InventoryAndSupplychain/DriverController");

router.post("/", controller.createDriver);
router.get("/", controller.getAllDrivers);
router.get("/:id", controller.getDriverById);
router.put("/:id", controller.updateDriver);
router.delete("/:id", controller.softDeleteDriver);

module.exports = router;