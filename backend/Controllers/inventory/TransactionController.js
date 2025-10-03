const Inventory = require("../../models/InventoryAndSupplychain/InventoryModel");
const Transaction = require("../../models/InventoryAndSupplychain/TransactionModel");
const whatsappService = require('../../utils/WhatsAppService');
const { inventoryConnection } = require("../../config/database");
console.log('inventoryConnection.readyState =', inventoryConnection && inventoryConnection.readyState);
// 1 = connected


//inward
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
        success: false,
        message: "Quantity must be greater than 0",
        error: "Validation_Error"
      });
    }
    //check if item exists
    const item = await Inventory.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    //new trans
    const tx = new Transaction({
      itemId,
      quantity: Number(quantity),
      supplier: supplierId || undefined,
      relatedOrderId: relatedOrderId || undefined,
      reason,
      batchNumber: batchNumber || undefined,
      transactionType: "IN",
    });

    await tx.save();

    //update stock
    const updateItem = await Inventory.findByIdAndUpdate(
      itemId,
      { $inc: { currentStock:Number(quantity) } },
      { new: true }
    );
    await tx.populate('itemId', 'name category unitOfmeasure currentStock');

    if(supplierId) {
      await tx.populate('supplierId', 'companyName contactPerson');
    }

    return res.status(201).json({
      success: true,
      message: "Stock inward recorded successfully",
      transaction: tx,
      updatedStock: updateItem.currentStock
    });
  } catch (error) {
    console.error("Error recording stock inward:", error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
        error: "VALIDATION_ERROR"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
//out
const recordStockOutward = async (req, res, next) => {
  try {
    const { 
      itemId, 
      quantity, 
      relatedOrderId, 
      reason, 
      batchNumber 
    } = req.body;

    if (!itemId || !quantity) {
      return res.status(400).json({ 
        success: false,
        message: "Item ID and quantity are required" });
    }

    if (quantity <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Quantity must be greater than 0" });
    }
    //if item exists
    const item = await Inventory.findById(itemId);
    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: "Item not found" });
    }
    //stock availability
    if (item.currentStock < quantity) {
      return res.status(400).json({ 
        success: false,
        message: "Insufficient stock available",
        availableStock: item.currentStock,
        requestedQuantity: quantity
      });
    }

    //create transaction
    const tx = new Transaction({
      itemId,
      quantity: Number(quantity),
      relatedOrderId: relatedOrderId || undefined,
      reason,
      batchNumber: batchNumber || undefined,
      transactionType: "OUT",
    });

    await tx.save();

    //update stock
    const updatedItem = await Inventory.findByIdAndUpdate(
      itemId,
      { $inc: { currentStock: -Number(quantity) } },
      { new: true }
    );

    console.log("Stock outward recorded successfully:", transaction._id);

    await transaction.populate('itemId', 'name category unitOfMeasure currentStock');


    // whatsapp Integration - Trigger low stock alert
    if (updatedItem.currentStock <= updatedItem.minStockLevel) {
      console.log(`🔴 LOW STOCK ALERT: ${updatedItem.name} is low on stock!`);
      
      //send real wtsapp alert
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
    return res.status(400).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  
     return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

///get movement logs
const getInventoryMovementLogs = async (req, res, next) => {
  try {
    const { 
      itemId, 
      dateFrom, 
      dateTo, 
      transactionType 
    } = req.query;
    let filter = {};

    if (itemId) filter.itemId = itemId;
    if (transactionType) filter.transactionType = transactionType;
    
    if (dateFrom && dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        //
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    const logs = await Transaction.find(filter)
      .populate("itemId", "name sku category unitOfMeasure currentStock")
      .populate("supplierId", "companyName contactPerson phone")
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Error fetching inventory movement logs:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.recordStockInward = recordStockInward;
exports.recordStockOutward = recordStockOutward;
exports.getInventoryMovementLogs = getInventoryMovementLogs;
