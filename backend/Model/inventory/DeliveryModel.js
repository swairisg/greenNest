const mongoose = require("mongoose");
const { inventoryConnection } = require("../../config/database"); 
const drivers = require('../../models/InventoryAndSupplychain/DriverModel')

const DeliverySchema = new mongoose.Schema(
  {
    deliveryNumber: { 
      type: String, 
      unique: true,
      default: () => "DLV-" + Date.now()
    },
    associatedOrderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Order",
      required: true 
    },
    dropoffAddress: { 
      type: String, 
      required: true 
    },
    scheduledDeliveryTime: { 
      type: Date, 
      required: true 
    },
    actualDeliveryTime: Date,
    assignedDriverId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Driver",
      required: true 
    },
    status: { 
      type: String, 
      enum: ["Scheduled", "Picked Up", "In Transit", "Delayed", "Delivered", "Cancelled"],
      default: "Scheduled" 
    },
    geolocation: {
      lat: Number,
      lng: Number,
      lastUpdated: Date
    },
    notes: String,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = inventoryConnection.model("Delivery", DeliverySchema);