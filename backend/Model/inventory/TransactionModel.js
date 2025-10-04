const mongoose = require("mongoose"); //for transactions
//const { inventoryConnection } = require('../../config/database')

const TransactionSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    transactionType: { type: String, enum: ["IN", "OUT"], required: true },
    quantity: Number,
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    relatedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    reason: String,
    batchNumber: String,
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
