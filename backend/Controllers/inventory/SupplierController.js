const Supplier = require("../../Model/inventory/SupplierModel");

const createSupplier = async (req, res, next) => {
  try {
    console.log("✅ Supplier model loaded successfully");
    console.log("📦 Request body:", req.body);
    
    const supplier = new Supplier(req.body);
    console.log("🔧 Supplier instance created");
    
    await supplier.save();
    console.log("💾 Supplier saved to database");
    
    return res.status(201).json({ supplier });
  } catch (error) {
    console.error("❌ Error creating supplier:", error);
    console.error("🔍 Error details:", {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    return res.status(500).json({ 
      message: "Failed to create supplier",
      error: error.message
    });
  }
};

const getAllSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ isActive: true });
    if (!suppliers || suppliers.length === 0) {
      return res.status(404).json({ message: "No suppliers found" });
    }
    return res.status(200).json({ success : true, suppliers, });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return res.status(500).json({ success: false, message: "Server Error", });
  }
};

const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, isActive: true });
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    return res.status(200).json({ supplier });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ message: "Unable to update supplier" });
    return res.status(200).json({ supplier });
  } catch (error) {
    console.error("Error updating supplier:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const softDeleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!supplier) return res.status(404).json({ message: "Unable to delete supplier" });
    return res.status(200).json({ message: "Supplier deleted successfully", supplier });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

exports.createSupplier = createSupplier;
exports.getAllSuppliers = getAllSuppliers;
exports.getSupplierById = getSupplierById;
exports.updateSupplier = updateSupplier;
exports.softDeleteSupplier = softDeleteSupplier;
