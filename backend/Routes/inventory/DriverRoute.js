const express = require("express");
const router = express.Router();
const controller = require("../../Controllers/inventory/DriverController");

router.post("/", controller.createDriver);
router.get("/", controller.getAllDrivers);
router.get("/:id", controller.getDriverById);
router.put("/:id", controller.updateDriver);
router.delete("/:id", controller.softDeleteDriver);

module.exports = router;