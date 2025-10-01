const express = require("express");
const router = express.Router();
const controller = require("../../controllers/InventoryAndSupplychain/DeliveryController");

router.post("/", controller.createDelivery);
router.get("/", controller.getAllDeliveries);
router.get("/driver/:driverId", controller.getDeliveriesByDriver);
router.get("/:id", controller.getDeliveryById);
router.put("/:id/status", controller.updateDeliveryStatus);
router.put("/:id/assign-driver", controller.assignDriverToDelivery);
router.delete("/:id", controller.softDeleteDelivery);

module.exports = router;