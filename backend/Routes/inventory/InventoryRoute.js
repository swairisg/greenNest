const express = require("express");
const router = express.Router();

const Inventory = require("../../Model/inventory/InventoryModel");
const controller = require("../../Controllers/inventory/InventoryController");

router.get("/", controller.getAllItems);
router.get("/low-stock", controller.getLowStockItems);
router.post("/", controller.createItem);
router.get("/:id", controller.getItemById);
router.put("/:id", controller.updateItem);
router.delete("/:id", controller.softDeleteItem);

module.exports = router;
