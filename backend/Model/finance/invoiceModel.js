const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const invoiceSchema = new Schema({
  invoiceNo: { type: String, unique: true, index: true },  // e.g. INV-2025-000123
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  billingAddress: {
    name: String,
    email: String,
    phone: String,
    address: String,
  },
  amounts: {
    subtotal: Number,
    discountTotal: Number,
    taxTotal: Number,
    shipping: Number,
    grandTotal: Number,
    currency: { type: String, default: "LKR" },
  },
  status: {
    type: String,
    enum: ["DRAFT", "ISSUED", "VOID"],
    default: "ISSUED",
  },
  pdfUrl: { type: String }, // optional if you upload PDFs later
}, { timestamps: true });

module.exports = mongoose.model("Invoice", invoiceSchema);