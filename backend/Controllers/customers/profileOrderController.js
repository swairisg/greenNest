const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Order = require("../../Model/finance/orderModel");
const Counter = require("../../Model/finance/counterModel");

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

// All
exports.getAllOrders = async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (err) {
    console.error("getAllOrders error:", err);
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
    console.error("getOrderById error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// By userId (string)
exports.getOrdersByUserId = async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (err) {
    console.error("getOrdersByUserId error:", err);
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

/* ========= Base64 slip upload (no DB write) =========
   POST /api/profileorders/:id/payment-slip-b64
   body: { slipBase64: "data:application/pdf;base64,...", originalName?: "file.pdf" }
   Saves file under /uploads/slips and returns { url }.
*/
exports.uploadPaymentSlipBase64 = async (req, res) => {
  try {
    const { id } = req.params;
    const { slipBase64, originalName } = req.body || {};

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order id" });
    }
    const exists = await Order.exists({ _id: id });
    if (!exists) return res.status(404).json({ error: "Order not found" });

    if (!slipBase64) {
      return res.status(400).json({ error: "Missing slipBase64 in body" });
    }

    let base64 = slipBase64;
    let mime = "application/pdf";
    const m = /^data:(.+?);base64,(.*)$/i.exec(slipBase64);
    if (m) {
      mime = m[1] || mime;
      base64 = m[2] || "";
    }

    const ok = new Set([
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ]);
    if (!ok.has(mime)) {
      return res.status(415).json({ error: "Invalid file type (PDF/PNG/JPG/WEBP only)" });
    }

    const extFromMime = (mm) =>
      mm === "application/pdf" ? ".pdf" :
      mm === "image/png" ? ".png" :
      (mm === "image/jpeg" || mm === "image/jpg") ? ".jpg" :
      mm === "image/webp" ? ".webp" : ".bin";

    const ext = extFromMime(mime);
    const nameExt =
      (originalName && path.extname(originalName))
        ? path.extname(originalName).toLowerCase()
        : ext;

    const PROJECT_ROOT = path.resolve(__dirname, "../../..");
    const SLIPS_DIR = path.join(PROJECT_ROOT, "uploads", "slips");
    fs.mkdirSync(SLIPS_DIR, { recursive: true });

    const filename = `slip_${id}_${Date.now()}${nameExt}`;
    const diskPath = path.join(SLIPS_DIR, filename);
    fs.writeFileSync(diskPath, Buffer.from(base64, "base64"));

    const publicUrl = `/uploads/slips/${filename}`;
    return res.status(200).json({ message: "Slip saved", url: publicUrl });
  } catch (err) {
    console.error("uploadPaymentSlipBase64 error:", err);
    return res.status(500).json({ error: "Server error", detail: String(err.message || err) });
  }
};
