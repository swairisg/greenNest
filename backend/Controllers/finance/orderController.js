const Order = require("../../Model/finance/orderModel");
const Counter = require("../../Model/finance/counterModel"); // optional for sequence IDs

// Generate orderNo like ORD-2025-000001
async function getNextOrderNo() {
  const doc = await Counter.findByIdAndUpdate(
    "order",
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  const seq = String(doc.seq).padStart(6, "0");
  return `ORD-${new Date().getFullYear()}-${seq}`;
}

// Compute totals
function computeAmounts(items, shipping = 0) {
  const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.qty, 0);
  const grandTotal = subtotal + shipping;
  return { subtotal, shipping, grandTotal, currency: "LKR" };
}

// Create
exports.createOrder = async (req, res) => {
  try {
    const { userId, items, shipping = 0 } = req.body;
    if (!userId || !items || !items.length) return res.status(400).json({ error: "userId & items required" });

    const orderNo = await getNextOrderNo();
    const amounts = computeAmounts(items, shipping);

    const order = new Order({ orderNo, userId, items, amounts });
    await order.save();

    res.status(201).json({ message: "Order created", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// List
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Not found" });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Update status
exports.confirmOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Not found" });
    order.status = "CONFIRMED";
    order.timeline.push({ action: "order.confirmed" });
    await order.save();
    res.json({ order });
  } catch (err) {
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
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted", order });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};