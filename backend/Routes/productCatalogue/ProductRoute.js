const express = require("express");
const router = express.Router();

const ProductController = require("../../Controllers/productCatalogue/ProductControllers");
// Public routes
router.get("/", ProductController.getAllProducts);
router.get("/filters", ProductController.getFilterOptions);
router.get("/:id", ProductController.getProductById);

// Admin routes 
router.post("/", ProductController.addProduct);
router.put("/:id", ProductController.updateProduct);
router.delete("/:id", ProductController.deleteProduct);
router.get("/admin/all", ProductController.getAllProductsAdmin);

module.exports = router;