const Invoice = require("../../Model/finance/invoiceModel");
const Order = require("../../Model/finance/orderModel");
const Counter = require("../../Model/finance/counterModel");

// generate invoice number (like INV-2025-000123)
async function getNextInvoiceNo() {
  const doc = await Counter.findByIdAndUpdate(
    "invoice",
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  const seq = String(doc.seq).padStart(6, "0");
  return `INV-${new Date().getFullYear()}-${seq}`;
}

// Create invoice from order
exports.createInvoice = async (req, res) => {
  try {
    const { orderId, billingAddress = {} } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const invoiceNo = await getNextInvoiceNo();

    const invoice = new Invoice({
      invoiceNo,
      orderId: order._id,
      billingAddress,
      amounts: order.amounts,
      status: "ISSUED",
    });

    await invoice.save();

    return res.status(201).json({ message: "Invoice created", invoice });
  } catch (err) {
    console.error("createInvoice error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate("orderId");
    if (!invoices.length) return res.status(404).json({ message: "No invoices found" });
    res.json({ invoices });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("orderId");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ invoice });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not deleted" });
    res.json({ message: "Invoice deleted", invoice });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};