const Delivery = require("../../models/InventoryAndSupplychain/DeliveryModel");
const Driver = require("../../models/InventoryAndSupplychain/DriverModel");
const Order = require("../../models/InventoryAndSupplychain/OrderModel");

//create delivery
const createDelivery = async (req, res, next) => {
  try {
    console.log("Creating delivery with data:", req.body);
    
    const delivery = new Delivery(req.body);
    await delivery.save();
    
    
    await delivery.populate('assignedDriverId');
    await delivery.populate('associatedOrderId');

    console.log("Delivery created:", delivery.deliveryNumber);

    //whatsapp integration placeholder
    if (delivery.status === "Scheduled") {
      console.log(`WhatsApp: Delivery ${delivery.deliveryNumber} scheduled for driver ${delivery.assignedDriverId.name}`);
    }

    return res.status(201).json({ 
      success: true,
      message: "Delivery created successfully",
      delivery 
    });
  } catch (error) {
    console.error("Error creating delivery:", error);
    return res.status(500).json({ 
      message: "Failed to create delivery",
      error: error.message 
    });
  }
};

//get all deliveries
const getAllDeliveries = async (req, res, next) => {
  try {
    const { status, driverId } = req.query;
    let filter = { isActive: true };

    if (status) filter.status = status;
    if (driverId) filter.assignedDriverId = driverId;

    const deliveries = await Delivery.find(filter)
      .populate("assignedDriverId", "name phone vehicleInfo")
      .populate("associatedOrderId", "poNumber totalAmount")
      .sort({ scheduledPickupTime: -1 });

    if (!deliveries || deliveries.length === 0) {
      return res.status(404).json({ message: "No deliveries found" });
    }

    return res.status(200).json({ deliveries });
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

//get delivery by ID
const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate("assignedDriverId")
      .populate("associatedOrderId");

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    return res.status(200).json({ delivery });
  } catch (error) {
    console.error("Error fetching delivery:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

//update delivery status
const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status, geolocation, notes } = req.body;
    
    const updateData = { status };
    if (geolocation) {
      updateData.geolocation = {
        ...geolocation,
        lastUpdated: new Date()
      };
    }
    if (notes) updateData.notes = notes;

    // Set actual times based on status
    if (status === "Picked Up") updateData.actualPickupTime = new Date();
    if (status === "Delivered") updateData.actualDeliveryTime = new Date();

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("assignedDriverId").populate("associatedOrderId");

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    // WhatsApp integration placeholder
    if (status === "In Transit") {
      console.log(`WhatsApp: Delivery ${delivery.deliveryNumber} is now in transit. ETA: ${delivery.scheduledDeliveryTime}`);
    }

    return res.status(200).json({ 
      success: true,
      message: "Delivery status updated successfully",
      delivery 
    });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Assign driver to delivery
const assignDriverToDelivery = async (req, res, next) => {
  try {
    const { driverId } = req.body;

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { assignedDriverId: driverId },
      { new: true }
    ).populate("assignedDriverId").populate("associatedOrderId");

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    return res.status(200).json({ 
      success: true,
      message: "Driver assigned successfully",
      delivery 
    });
  } catch (error) {
    console.error("Error assigning driver:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Get deliveries by driver
const getDeliveriesByDriver = async (req, res, next) => {
  try {
    const deliveries = await Delivery.find({ 
      assignedDriverId: req.params.driverId,
      isActive: true 
    })
      .populate("associatedOrderId", "poNumber totalAmount")
      .sort({ scheduledPickupTime: -1 });

    return res.status(200).json({ deliveries });
  } catch (error) {
    console.error("Error fetching driver deliveries:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Soft delete delivery
const softDeleteDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { isActive: false, status: "Cancelled" },
      { new: true }
    );

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    return res.status(200).json({ 
      message: "Delivery cancelled successfully",
      delivery 
    });
  } catch (error) {
    console.error("Error deleting delivery:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

exports.createDelivery = createDelivery;
exports.getAllDeliveries = getAllDeliveries;
exports.getDeliveryById = getDeliveryById;
exports.updateDeliveryStatus = updateDeliveryStatus;
exports.assignDriverToDelivery = assignDriverToDelivery;
exports.getDeliveriesByDriver = getDeliveriesByDriver;
exports.softDeleteDelivery = softDeleteDelivery;