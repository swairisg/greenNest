const Product = require("../../Model/productCatalogue/ProductModel");

// Get all products (with filtering, sorting, and search)
const getAllProducts = async (req, res, next) => {
  try {
    const {
      category,
      tags,
      minPrice,
      maxPrice,
      search,
      type,
      inStock,
      sortBy = "basePrice",
      sortOrder = "asc",
      page = 1,
      limit = 12
    } = req.query;

    // Build filter object (visible-only for customers)
    const filter = { isVisible: true }; // ⬅️ removed isArchived

    if (category) filter.category = category;
    if (type) filter.type = type;

    if (tags) {
      filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }

    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.basePrice.$lte = parseFloat(maxPrice);
    }

    if (inStock === "true") filter.stockQuantity = { $gt: 0 };

    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const pageNum = parseInt(page);
    const lim = parseInt(limit);
    const skip = (pageNum - 1) * lim;

    const [products, totalProducts] = await Promise.all([
      Product.find(filter).sort(sortOptions).skip(skip).limit(lim),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalProducts / lim),
        totalProducts,
        hasNext: skip + products.length < totalProducts,
        hasPrev: pageNum > 1,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get product by ID
const getProductById = async (req, res, next) => {
  try {
    // ⬅️ no archived check — hard-deleted docs simply won't exist
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ product });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Invalid product ID", error: err.message });
  }
};

// Add new product (Admin only)
const addProduct = async (req, res) => {
  try {
    const payload = {
      productName: req.body.productName,
      type: req.body.type,
      images: req.body.images, // Array of URLs
      description: req.body.description,
      category: req.body.category,
      basePrice: req.body.basePrice,
      tags: req.body.tags || [],
      isVisible: req.body.isVisible !== undefined ? req.body.isVisible : true,
      stockQuantity: req.body.stockQuantity || 0,
    };

    const product = await Product.create(payload);
    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Validation error", error: err.message });
  }
};

// Update product (Admin only)
const updateProduct = async (req, res) => {
  try {
    const allowedFields = [
      "productName",
      "type",
      "images",
      "description",
      "category",
      "basePrice",
      "tags",
      "isVisible",
      "stockQuantity",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Update failed", error: err.message });
  }
};

// HARD delete product (Admin only) — permanent
const deleteProduct = async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    // No body for 204 per HTTP spec
    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Delete failed", error: err.message });
  }
};

// Get all products for admin (no archive concept in hard delete)
const getAllProductsAdmin = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json({ products });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get filter options (for frontend filters)
const getFilterOptions = async (req, res) => {
  try {
    const baseMatch = { isVisible: true }; // ⬅️ removed isArchived
    const [categories, tags, types, priceRange] = await Promise.all([
      Product.distinct("category", baseMatch),
      Product.distinct("tags", baseMatch),
      Product.distinct("type", baseMatch),
      Product.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$basePrice" },
            maxPrice: { $max: "$basePrice" },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      categories,
      tags: [...new Set((tags || []).flat())],
      types,
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAllProducts = getAllProducts;
exports.getProductById = getProductById;
exports.addProduct = addProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.getAllProductsAdmin = getAllProductsAdmin;
exports.getFilterOptions = getFilterOptions;
