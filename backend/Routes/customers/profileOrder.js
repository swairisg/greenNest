const express = require("express");
const router = express.Router();
const orders = require("../../Controllers/customers/profileOrderController");

// sanity check
router.get("/__ping", (req, res) => res.json({ ok: true, where: "profileOrders" }));

// base64 upload 
router.post("/:id/payment-slip-b64", orders.uploadPaymentSlipBase64);

// standard order routes
router.get("/user/:userId", orders.getOrdersByUserId);
router.get("/", orders.getAllOrders);
router.post("/", orders.createOrder);
router.get("/:id", orders.getOrderById);
router.patch("/:id/confirm", orders.confirmOrder);
router.patch("/:id/paid", orders.markPaid);
router.delete("/:id", orders.deleteOrder);

// helpful 404 for wrong paths
router.use((req, res) => {
  res.status(404).json({ error: "profileOrders route not found", path: req.originalUrl });
});

module.exports = router;
