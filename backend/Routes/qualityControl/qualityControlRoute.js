// backend/Routes/qualityControl/qualityControlRoute.js
const express = require("express");
const router = express.Router();

const qualityControl = require("../../Controllers/qualityControl/qualityControllers");

// Create
router.post("/", qualityControl.addQuality);

// List (FIX: use getAll, not getAllUsers)
router.get("/", qualityControl.getAll);

// Detail
router.get("/:itemId", qualityControl.getById);

// Update
router.put("/:itemId", qualityControl.updateItem);

// Delete
router.delete("/:itemId", qualityControl.deleteItem);

module.exports = router;