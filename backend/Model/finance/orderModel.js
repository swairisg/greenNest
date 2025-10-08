const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
  productId: { type: String, required: true },  // link to catalogue
  name: { type: String, required: true },       // snapshot product name
  qty: { type: Number, required: true },
  unitPrice: { type: Number, required: true }
}, { _id: false });

const orderSchema = new Schema({
  orderNo: { type: String, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  items: [orderItemSchema],
  amounts: {
    subtotal: Number,
    shipping: Number,
    grandTotal: Number,
    currency: { type: String, default: "LKR" }
  },
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "REJECTED", "FULFILLING", "SHIPPED", "DELIVERED", "CLOSED", "CANCELLED"],
    default: "PENDING"
  },
  paymentStatus: {
    type: String,
    enum: ["UNPAID", "PAID", "REFUNDED"],
    default: "UNPAID"
  },
  createdBy: String,
  timeline: [{ at: { type: Date, default: Date.now }, action: String, note: String }]
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);