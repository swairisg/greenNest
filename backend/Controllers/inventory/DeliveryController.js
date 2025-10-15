const Delivery = require("../../Model/inventory/DeliveryModel");
const Driver = require("../../Model/inventory/DriverModel");
const Order = require("../../Model/inventory/OrderModel");
const whatsappService = require ("../../utils/WhatsAppService");

//create delivery
const createDelivery = async (req, res, next) => {
  try {
    console.log("Creating delivery with data:", req.body);
    
    const { associatedOrderId, dropoffAddress, scheduledDeliveryTime, assignedDriverId } = req.body;

     if (!associatedOrderId || !dropoffAddress || !scheduledDeliveryTime || !assignedDriverId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: associatedOrderId, dropoffAddress, scheduledDeliveryTime, assignedDriverId"
      });
    }
    const delivery = new Delivery(req.body);
    const savedDelivery = await delivery.save();
    
    await savedDelivery.populate('assignedDriverId', 'name phone vehicleInfo');
    await savedDelivery.populate('associatedOrderId', 'poNumber totalAmount');

    console.log("Delivery created:", savedDelivery.deliveryNumber);

    //whatsapp integration 
    if (savedDelivery.status === "Scheduled") {
      try {
        const driverPhone = savedDelivery.assignedDriverId.phone;
        const message = `NEW DELIVERY ASSIGNED\n\nDelivery: ${savedDelivery.deliveryNumber}\nPickup: ${savedDelivery.scheduledPickupTime || 'ASAP'}\nDelivery: ${savedDelivery.scheduledDeliveryTime}\nAddress: ${savedDelivery.dropoffAddress}\n\nPlease confirm acceptance.`;
        
        await whatsappService.sendAlertNotification(driverPhone, message);
        console.log(`WhatsApp notification sent to driver: ${savedDelivery.assignedDriverId.name}`);
      } catch (whatsappError) {
        console.error("WhatsApp notification failed:", whatsappError);
    
      }
    }

    return res.status(201).json({ 
      success: true,
      message: "Delivery created successfully",
      delivery: savedDelivery
    });
  } catch (error) {
    console.error("Error creating delivery:", error);
    return res.status(500).json({ 
      success: false,
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

    // WhatsApp integration 
    try {
      let message = '';
      let recipientPhone = '';
      
      switch (status) {
        case "In Transit":
          message = `DELIVERY IN TRANSIT\n\nDelivery: ${delivery.deliveryNumber}\nStatus: In Transit\nETA: ${delivery.scheduledDeliveryTime}\nDriver: ${delivery.assignedDriverId.name}\n\nTrack your delivery in real-time.`;
          recipientPhone = process.env.CUSTOMER_PHONE_NUMBER; // Send to customer
          break;
          
        case "Delivered":
          message = `DELIVERY COMPLETED\n\nDelivery: ${delivery.deliveryNumber}\nStatus: Delivered Successfully\nTime: ${new Date().toLocaleString()}\nDriver: ${delivery.assignedDriverId.name}\n\nThank you for your business!`;
          recipientPhone = process.env.CUSTOMER_PHONE_NUMBER; // Send to customer
          break;
          
        case "Delayed":
          message = `DELIVERY DELAYED\n\nDelivery: ${delivery.deliveryNumber}\nStatus: Delayed\nReason: ${notes || 'Traffic conditions'}\nNew ETA: Will be updated shortly\n\nWe apologize for the inconvenience.`;
          recipientPhone = process.env.CUSTOMER_PHONE_NUMBER; // Send to customer
          break;
      }
      
      if (message && recipientPhone) {
        await whatsappService.sendAlertNotification(recipientPhone, message);
        console.log(`WhatsApp status update sent for delivery: ${delivery.deliveryNumber}`);
      }
    } catch (whatsappError) {
      console.error("WhatsApp status update failed:", whatsappError);
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

    try {
      const message = `NEW DELIVERY ASSIGNMENT\n\nDelivery: ${delivery.deliveryNumber}\nOrder: ${delivery.associatedOrderId.poNumber}\nDelivery Address: ${delivery.dropoffAddress}\nScheduled Time: ${delivery.scheduledDeliveryTime}\n\nPlease acknowledge receipt of this assignment.`;
      
      await whatsappService.sendAlertNotification(
        delivery.assignedDriverId.phone, 
        message
      );
      console.log(`WhatsApp assignment sent to driver: ${delivery.assignedDriverId.name}`);
    } catch (whatsappError) {
      console.error("WhatsApp assignment notification failed:", whatsappError);
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