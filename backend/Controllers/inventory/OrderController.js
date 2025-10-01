const Order = require("../../models/InventoryAndSupplychain/OrderModel");
const Transaction = require("../../models/InventoryAndSupplychain/TransactionModel");
const Inventory = require("../../models/InventoryAndSupplychain/InventoryModel");

//po = purchase order

//read/display orders
const getAllPOs = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { isDeleted: false };

    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter).populate("supplierId items.itemId");

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const createPurchaseOrder = async (req, res, next) => {
  try {
    console.log("📦 Creating purchase order with data:", req.body);
    
    // Validate required fields
    if (!req.body.supplierId || !req.body.items || req.body.items.length === 0) {
      return res.status(400).json({ 
        message: "Supplier ID and items are required" 
      });
    }

    req.body.poNumber = "PO-" + Date.now();
    const order = new Order(req.body);
    await order.save();

    console.log("✅ Purchase order created:", order.poNumber);

    // WhatsApp integration if status = Sent
    if (order.status === "Sent") {
      console.log(`WhatsApp: New PO ${order.poNumber} sent to supplier.`);
    }

    return res.status(201).json({ order });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return res.status(500).json({ message: "Failed to create purchase order",
      error: error.message
    });
  }
};

const getPOById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("supplierId items.itemId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const updatePOStatus = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "Sent") {
      console.log(`WhatsApp: PO ${order.poNumber} has been sent.`);
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Error updating PO status:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const softDeletePO = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found or unable to delete" });
    }

    return res.status(200).json({ message: "Order deleted successfully", order });
  } catch (error) {
    console.error("Error deleting PO:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

exports.getAllPOs = getAllPOs;
exports.createPurchaseOrder = createPurchaseOrder;
exports.getPOById = getPOById;
exports.updatePOStatus = updatePOStatus;
exports.softDeletePO = softDeletePO;
