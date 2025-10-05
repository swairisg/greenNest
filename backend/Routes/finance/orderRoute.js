const express = require("express");
const router = express.Router();
const orderCtrl = require("../../Controllers/finance/orderController");

router.post("/", orderCtrl.createOrder);
router.get("/", orderCtrl.getAllOrders);
router.get("/:id", orderCtrl.getOrderById);
router.post("/:id/confirm", orderCtrl.confirmOrder);
router.post("/:id/mark-paid", orderCtrl.markPaid);
router.delete("/:id", orderCtrl.deleteOrder);

module.exports = router;