// backend/Controllers/qualityControl/qualityControllers.js
const Quality = require("../../Model/qualityControl/qualityControlmodel");

// GET /api/quality
const getAll = async (_req, res) => {
  try {
    const items = await Quality.find().lean();
    return res.status(200).json({ items });
  } catch (err) {
    console.error("getAll error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// POST /api/quality
const addQuality = async (req, res) => {
  try {
    const {
      batchId, productName, variety, size, color, freshness, weight, notes, grade,
    } = req.body || {};

    if (!batchId || !productName || !variety || !grade) {
      return res.status(400).json({ error: "batchId, productName, variety, and grade are required" });
    }

    const item = await Quality.create({
      batchId,
      productName,
      variety,
      size,
      color,
      freshness,
      weight,
      notes,
      grade,
    });

    return res.status(201).json({ item });
  } catch (err) {
    console.error("addQuality error:", err);
    if (err?.code === 11000) {
      return res.status(409).json({ error: "batchId already exists" });
    }
    if (err?.name === "ValidationError") {
      return res.status(400).json({ error: "Validation failed", details: err.errors });
    }
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /api/quality/:itemId
const getById = async (req, res) => {
  try {
    const item = await Quality.findById(req.params.itemId).lean();
    if (!item) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ item });
  } catch (err) {
    console.error("getById error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/quality/:itemId
const updateItem = async (req, res) => {
  try {
    const item = await Quality.findByIdAndUpdate(
      req.params.itemId,
      req.body || {},
      { new: true, runValidators: true }
    ).lean();
    if (!item) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ item });
  } catch (err) {
    console.error("updateItem error:", err);
    if (err?.name === "ValidationError") {
      return res.status(400).json({ error: "Validation failed", details: err.errors });
    }
    return res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/quality/:itemId
const deleteItem = async (req, res) => {
  try {
    const item = await Quality.findByIdAndDelete(req.params.itemId).lean();
    if (!item) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ item });
  } catch (err) {
    console.error("deleteItem error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getAll, addQuality, getById, updateItem, deleteItem };