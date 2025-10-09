
const Driver = require("../../Model/inventory/DriverModel")

//create driver
const createDriver = async (req, res, next) => {
  try {
    console.log(
      "Creating driver with data:",
      JSON.stringify(req.body, null, 2)
    );

    const requiredFields = [
      "name",
      "phone",
      "email",
      "vehicleInfo",
      "licenseNumber",
    ];
    const missingFields = requiredFields.filter(
      (field) => !req.body[field] || req.body[field].toString().trim() === ""
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
        error: "VALIDATION_ERROR",
        missingFields,
      });
    }

    const driverData = {
      ...req.body,
      isActive: true,
      licenseNumber: req.body.licenseNumber.trim().toUpperCase(),
      email: req.body.email.trim().toLowerCase(),
      name: req.body.name.trim(),
      phone: req.body.phone.trim(),
    };

    console.log("Processed driver data:", driverData);

    const driver = new Driver(driverData);
    await driver.save();

    console.log("Driver created successfully:", {
      id: driver._id,
      name: driver.name,
      license: driver.licenseNumber,
    });

    return res.status(201).json({
      success: true,
      message: "Driver created successfully",
      driver,
    });
  } catch (error) {
    console.error("Error creating driver:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${
          field === "licenseNumber" ? "License number" : field
        } already exists`,
        error: "DUPLICATE_ERROR",
        duplicateField: field,
      });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
        error: "VALIDATION_ERROR",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create driver",
      error: error.message,
    });
  }
};

//all drivers
const getAllDrivers = async (req, res, next) => {
  try {
    console.log("Fetching all active drivers");

    const drivers = await Driver.find({ isActive: true })
      .sort({ createdAt: -1 }) //by newest first
      .select("-__v"); //no ver key

    console.log(`Found ${drivers.length} drivers`);

    return res.status(200).json({
      success: true,
      count: drivers.length,
      drivers: drivers,
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch drivers",
      error: error.message,
    });
  }
};

//driver by ID
const getDriverById = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    return res.status(200).json({
      success: true,
      driver,
    });
  } catch (error) {
    console.error("Error fetching driver:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

//update driver
const updateDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Driver updated successfully",
      driver,
    });
  } catch (error) {
    console.error("Error updating driver:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "License number already exists",
        error: "DUPLICATE_LICENSE",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

//delete driver
const softDeleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Driver deleted successfully",
      driver,
    });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.createDriver = createDriver;
exports.getAllDrivers = getAllDrivers;
exports.getDriverById = getDriverById;
exports.updateDriver = updateDriver;
exports.softDeleteDriver = softDeleteDriver;
