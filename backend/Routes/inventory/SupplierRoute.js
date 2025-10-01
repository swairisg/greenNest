const express = require("express");
const router = express.Router();
const controller = require("../../controllers/InventoryAndSupplychain/SupplierController");

router.post("/", controller.createSupplier);
router.get("/", controller.getAllSuppliers);
router.get("/:id", controller.getSupplierById);
router.put("/:id", controller.updateSupplier);
router.delete("/:id", controller.softDeleteSupplier);

module.exports = router;
