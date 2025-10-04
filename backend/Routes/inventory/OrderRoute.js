const express = require("express");
const router = express.Router();
const controller = require("../../Controllers/inventory/OrderController");

router.post("/", controller.createPurchaseOrder);
router.get("/", controller.getAllPOs);
router.get("/:id", controller.getPOById);
router.put("/:id", controller.updatePOStatus);
router.delete("/:id", controller.softDeletePO);

module.exports = router;
