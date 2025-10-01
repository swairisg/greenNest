const Inventory = require("../../models/InventoryAndSupplychain/InventoryModel");
const Transaction = require("../../models/InventoryAndSupplychain/TransactionModel");
const whatsappService = require('../../utils/WhatsAppService');
const { inventoryConnection } = require("../../config/database");
console.log('inventoryConnection.readyState =', inventoryConnection && inventoryConnection.readyState);
// 1 = connected


// Record Inward
const recordStockInward = async (req, res, next) => {
  try {
    const {
      itemId,
      quantity,
      supplierId,
      relatedOrderId,
      reason,
      batchNumber,
    } = req.body;

    // Validation
    if (!itemId || !quantity) {
      return res.status(400).json({
        message: "Item ID and quantity are required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }
    // Check if item exists
    const item = await Inventory.findById(itemId);
    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    const tx = new Transaction({
      itemId,
      quantity,
      supplierId,
      relatedOrderId,
      reason,
      batchNumber,
      transactionType: "IN",
    });

    await tx.save();

    // Update stock
    await Inventory.findByIdAndUpdate(
      itemId,
      { $inc: { currentStock: quantity } },
      { new: true }
    );

    return res.status(201).json({
      success: true,
      message: "Stock inward recorded successfully",
      transaction: tx,
    });
  } catch (error) {
    console.error("Error recording stock inward:", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const recordStockOutward = async (req, res, next) => {
  try {
    const { itemId, quantity, relatedOrderId, reason, batchNumber } = req.body;

    if (!itemId || !quantity) {
      return res.status(400).json({ message: "Item ID and quantity are required" });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0" });
    }
const item = await Inventory.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.currentStock < quantity) {
      return res.status(400).json({ 
        message: "Insufficient stock available",
        availableStock: item.currentStock,
        requestedQuantity: quantity
      });
    }

    // Create transaction
    const tx = new Transaction({
      itemId,
      quantity,
      relatedOrderId,
      reason,
      batchNumber,
      transactionType: "OUT",
    });

    await tx.save();

    // Update stock
    const updatedItem = await Inventory.findByIdAndUpdate(
      itemId,
      { $inc: { currentStock: -quantity } },
      { new: true }
    );

    // ✅ REAL WhatsApp Integration - Trigger low stock alert
    if (updatedItem.currentStock <= updatedItem.minStockLevel) {
      console.log(`🔴 LOW STOCK ALERT: ${updatedItem.name} is low on stock!`);
      
      // Send real WhatsApp alert
      await whatsappService.sendLowStockAlert(
        updatedItem, 
        updatedItem.currentStock, 
        updatedItem.minStockLevel
      );
    }

    return res.status(201).json({
      success: true,
      message: "Stock outward recorded successfully",
      transaction: tx,
      remainingStock: updatedItem.currentStock,
    });
  } catch (error) {
    console.error("Error recording stock outward:", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

/// Get Movement Logs
const getInventoryMovementLogs = async (req, res, next) => {
  try {
    const { itemId, dateFrom, dateTo, transactionType } = req.query;
    let filter = {};

    if (itemId) filter.itemId = itemId;
    if (transactionType) filter.transactionType = transactionType;
    if (dateFrom && dateTo) {
      filter.date = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo),
      };
    }

    const logs = await Transaction.find(filter)
      .populate("itemId", "name sku category")
      .populate("supplierId", "companyName")
      .sort({ date: -1 });

    if (!logs || logs.length === 0) {
      return res.status(404).json({
        message: "No transaction logs found",
      });
    }

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Error fetching inventory movement logs:", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.recordStockInward = recordStockInward;
exports.recordStockOutward = recordStockOutward;
exports.getInventoryMovementLogs = getInventoryMovementLogs;
