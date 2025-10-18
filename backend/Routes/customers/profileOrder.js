const express = require("express");
const router = express.Router();
const orders = require("../../Controllers/customers/profileOrderController");

router.get("/user/:userId", orders.getOrdersByUserId);
router.get("/", orders.getAllOrders);

// Create
router.post("/", orders.createOrder);

router.get("/:id", orders.getOrderById);

// Status updates
router.patch("/:id/confirm", orders.confirmOrder);
router.patch("/:id/paid", orders.markPaid);

// Delete
router.delete("/:id", orders.deleteOrder);

module.exports = router;
