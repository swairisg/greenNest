const Inventory = require("../../Model/inventory/InventoryModel")
//require("../../models/InventoryAndSupplychain/InventoryModel");
const Supplier = require("../../Model/inventory/SupplierModel"); 

//read all items
const getAllItems = async (req, res, next) => {
  const { category, lowStock, search } = req.query;
  let filter = { isActive: true };

  try {
    if (category) filter.category = category;
    
    if (lowStock === 'true') {
      filter.$expr = { $lte: ["$currentStock", "$minStockLevel"] };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Improved population to handle both name and companyName
    const items = await Inventory.find(filter)
      .populate('supplierId', 'name companyName contactInfo email phone')
      .lean(); // Using lean() for better performance

    if (!items || items.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No items found" 
      });
    }
    
    // Debug log to check populated data
    console.log("Items with suppliers:", items.map(item => ({
      name: item.name,
      supplier: item.supplierId
    })));
    
    return res.status(200).json({ 
      success: true, 
      items,
      count: items.length
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server Error",
      error: error.message 
    });
  }
};

//create item
const createItem = async (req, res, next) => {
  try {
    console.log("CREATE ITEM REQUEST BODY:", JSON.stringify(req.body, null, 2));
    
    const {
      name,
      category,
      description,
      unitOfMeasure,
      minStockLevel,
      maxStockLevel,
      supplierId,
      currentStock
    } = req.body;

    // detailed error messages
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!category) missingFields.push('category');
    if (!supplierId) missingFields.push('supplierId');
    if (currentStock === undefined) missingFields.push('currentStock');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    //sheck if supplier exists
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID provided"
      });
    }

    //generate SKU
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const sku = `SKU-${timestamp}-${randomSuffix}`;

    //create item with all fields
    const itemData = {
      name: name.trim(),
      category: category.trim(),
      description: description?.trim() || '',
      unitOfMeasure: unitOfMeasure || "units",
      minStockLevel: parseInt(minStockLevel) || 0,
      maxStockLevel: parseInt(maxStockLevel) || 100,
      currentStock: parseInt(currentStock) || 0,
      supplierId: supplierId,
      sku: sku,
      isActive: true
    };

    console.log("Saving item data:", itemData);

    const item = new Inventory(itemData);
    await item.save();
    
    //populate supplier info in response
    const populatedItem = await Inventory.findById(item._id)
      .populate('supplierId', 'name companyName contactPerson email phone');
    
    console.log("Item created successfully:", populatedItem._id);
    
    return res.status(201).json({ 
      success: true, 
      message: "Item created successfully",
      item: populatedItem
    });
  } catch (error) {
    console.error("Error creating item:", error);
    
    // validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors
      });
    }
    
    //duplicatr  SKU error 
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists. Please try again."
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Failed to create item",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


const getItemById = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id).populate('supplierId', 'name contactInfo');
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: "Item not found" 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      item 
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server Error",
      error: error.message 
    });
  }
};

//update item
const updateItem = async (req, res, next) => {
  try {
    const {
      name,
      category,
      description,
      unitOfMeasure,
      minStockLevel,
      maxStockLevel,
      supplierId,
    } = req.body;

    const updateData = {
      ...(name && { name }),
      ...(category && { category }),
      ...(description !== undefined && { description }),
      ...(unitOfMeasure && { unitOfMeasure }),
      ...(minStockLevel !== undefined && { minStockLevel }),
      ...(maxStockLevel !== undefined && { maxStockLevel }),
      ...(supplierId && { supplierId }),
    };

    //check if item exists before updating
    const existingItem = await Inventory.findById(req.params.id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    //validate supplier if provided
    if (supplierId) {
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
        return res.status(400).json({
          success: false,
          message: "Invalid supplier ID"
        });
      }
    }

    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('supplierId', 'name contactInfo');

    return res.status(200).json({ 
      success: true, 
      message: "Item updated successfully",
      item 
    });
  } catch (error) {
    console.error("Error updating item:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server Error",
      error: error.message 
    });
  }
};

//soft delete
const softDeleteItem = async (req, res, next) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: "Item not found" 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: "Item deleted successfully",
      item 
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server Error",
      error: error.message 
    });
  }
};

//low stock items
const getLowStockItems = async (req, res, next) => {
  try {
    const lowStockItems = await Inventory.find({
      isActive: true,
      $expr: { $lte: ["$currentStock", "$minStockLevel"] }
    }).populate('supplierId', 'name contactInfo');

    return res.status(200).json({
      success: true,
      items: lowStockItems,
      count: lowStockItems.length
    });
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};


 exports.getAllItems = getAllItems;
  exports.createItem=createItem;
  exports.getItemById=getItemById;
  exports.updateItem =updateItem;
  exports.softDeleteItem=softDeleteItem;
  exports.getLowStockItems=getLowStockItems;
