const mongoose = require("mongoose"); //for items in inventory
const { inventoryConnection } = require('../../config/database');

const InventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      unique: true,
    }, // auto-generated
    category: {
      type: String,
      enum: ["Seed", "Fertilizer", "Tool","Equipment", "Pesticide","Other"],
    },
    description: String,
    unitOfMeasure: String, // kg/packet/ltr/piece/idk
    currentStock: {
      type: Number,
      default: 0,//auto update
    },
    minStockLevel: {
      type: Number,
      default: 0,
    },
    maxStockLevel: Number,

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    }, //ref to supp modle
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = inventoryConnection.model("Inventory", InventorySchema);
