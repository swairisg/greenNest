const Order = require("../../Model/inventory/OrderModel");
//const Transaction = require("../../Model/inventory/TransactionModel");
const Inventory = require("../../Model/inventory/InventoryModel");

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
    console.log("Creating purchase order with data:", req.body);
    
    const { supplierId, items } = req.body;

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({ 
        message: "Supplier and items are required" 
      });
    }

    req.body.supplierId = supplierId; // <-- corrected
    req.body.poNumber = "PO-" + Date.now();

    const order = new Order(req.body);
    await order.save();

    await order.populate("supplierId items.itemId"); // populate before returning

    console.log("Purchase order created:", order.poNumber);

    if (order.status === "Sent") {
      console.log(`WhatsApp: New PO ${order.poNumber} sent to supplier.`);
    }

    return res.status(201).json({ order });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return res.status(500).json({ 
      message: "Failed to create purchase order",
      error: error.message
    });
  }
};

const updatePO = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.poNumber === undefined) delete updateData.poNumber;

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate("supplierId items.itemId");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ order: updatedOrder });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.poNumber) {
      return res.status(400).json({ message: "poNumber must be unique" });
    }

    console.error("Error updating purchase order:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
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
exports.updatePO = updatePO;
exports.getPOById = getPOById;
exports.updatePOStatus = updatePOStatus;
exports.softDeletePO = softDeletePO;
