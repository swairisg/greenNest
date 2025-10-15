const mongoose = require("mongoose"); //for orders
//const { inventoryConnection } = require("../../config/database"); //import inventory DB connection

const orderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, unique: true }, // auto-generate e.g., PO-2025-001
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    items: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
        quantity: Number,
        unitPrice: Number,
      },
    ],
    totalAmount: Number,
    expectedDeliveryDate: Date,
    status: {
      type: String,
      enum: [
        "Draft",
        "Sent",
        "Confirmed",
        "In Transit",
        "Delivered",
        "Cancelled",
      ],
      default: "Draft",
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
