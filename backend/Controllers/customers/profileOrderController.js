const mongoose = require("mongoose");
const Order = require("../../Model/finance/orderModel");
const Counter = require("../../Model/finance/counterModel");

async function getNextOrderNo() {
  const doc = await Counter.findByIdAndUpdate(
    "order",
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  const seq = String(doc.seq).padStart(6, "0");
  return `ORD-${new Date().getFullYear()}-${seq}`;
}

function computeAmounts(items, shipping = 0) {
  const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.qty, 0);
  const grandTotal = subtotal + shipping;
  return { subtotal, shipping, grandTotal, currency: "LKR" };
}

exports.createOrder = async (req, res) => {
  try {
    const { userId, items, shipping = 0 } = req.body;
    if (!userId || !items || !items.length) {
      return res.status(400).json({ error: "userId & items required" });
    }
    const orderNo = await getNextOrderNo();
    const amounts = computeAmounts(items, shipping);

    const order = new Order({ orderNo, userId, items, amounts });
    await order.save();
    res.status(201).json({ message: "Order created", order });
  } catch (err) {
    console.error("createOrder error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllOrders = async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (err) {
    console.error("getAllOrders error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Not found" });
    res.json({ order });
  } catch (err) {
    console.error("getOrderById error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getOrdersByUserId = async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (err) {
    console.error("getOrdersByUserId error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.confirmOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Not found" });
    order.status = "CONFIRMED";
    order.timeline.push({ action: "order.confirmed" });
    await order.save();
    res.json({ order });
  } catch (err) {
    console.error("confirmOrder error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.markPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Not found" });
    order.paymentStatus = "PAID";
    order.timeline.push({ action: "payment.paid" });
    await order.save();
    res.json({ order });
  } catch (err) {
    console.error("markPaid error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted", order });
  } catch (err) {
    console.error("deleteOrder error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
