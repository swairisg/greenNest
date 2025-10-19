// backend/Controllers/qualityControl/qualityControllersfarmer.js
const mongoose = require("mongoose");
const Quality = require("../../Model/qualityControl/qualityControlModel_F");
const { gradeRecord } = require("../../services/grader/grade");
const { computeFinal } = require("../../services/grader/aggregate");

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/** POST /api/farmer/quality
 * Body:
 *  - required: batchId, productName, variety
 *  - optional: size, color, freshness, weight, notes, readings (obj)
 *  - optional: humanGrade (farmer’s suggested manual grade), note (string)
 */

const getMineById = async (req, res) => {
  try {
    const doc = await Quality.findById(req.params.itemId).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (String(doc.owner) !== String(req.user?.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return res.status(200).json({ item: doc });
  } catch (err) {
    console.error("farmer.getMineById error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const createMine = async (req, res) => {
  try {
    const {
      batchId,
      productName,
      variety,
      size,
      color,
      freshness,
      weight,
      notes,
      readings = {},
      humanGrade,   // 👈 allow farmer to submit a suggested manual grade
      note,         // optional note about the grading
    } = req.body || {};

    if (!batchId || !productName || !variety) {
      return res
        .status(400)
        .json({ error: "batchId, productName, and variety are required" });
    }

    const doc = new Quality({
      owner: req.user?.id,
      batchId: String(batchId).trim(),
      productName: String(productName).toLowerCase(), // keep consistent with graders/presets
      variety,
      size,
      color,
      freshness,
      weight,
      notes,
      readings,
      grade: {}, // ensure object exists before merging
    });

    // 1) System grade (always compute)
    const graded = gradeRecord(doc.toObject()); // pass POJO for safety
    if (graded?.grade) {
      doc.grade = { ...(doc.grade || {}), ...graded.grade };
    }

    // 2) If farmer provides a human grade, include it (admin can override later)
    if (humanGrade !== undefined) {
      doc.grade.human = humanGrade || null;
    }
    if (typeof note === "string") {
      doc.grade.note = note;
    }

    // 3) Ensure final grade exists (system-only by default; if farmer provided humanGrade,
    //    use a default policy that favors human or your preferred policy)
    const policy = humanGrade !== undefined ? (doc.grade?.policy || "human_overrides") : "system_only";
    const weights =
      humanGrade !== undefined
        ? doc.grade?.weights || { system: 0.4, human: 0.6 }
        : { system: 1, human: 0 };

    const { final, decidedBy } = computeFinal({
      system: doc.grade?.system,
      human: doc.grade?.human ?? null,
      policy,
      weights,
    });

    doc.grade.final = final;
    doc.grade.policy = policy;
    doc.grade.weights = weights;
    doc.grade.decidedBy = decidedBy;

    try {
      await doc.save();
      return res.status(201).json({ item: doc.toObject() });
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(409).json({ error: "batchId already exists" });
      }
      if (err?.name === "ValidationError") {
        return res
          .status(400)
          .json({ error: "Validation failed", details: err.errors });
      }
      throw err;
    }
  } catch (err) {
    console.error("farmer.createMine error:", err);
    if (err.message?.startsWith?.("No grading rule"))
      return res.status(422).json({ error: err.message });
    return res.status(500).json({ error: "Server error" });
  }
};

/** GET /api/farmer/quality (only my docs)
 * Optional: pagination via ?page=&limit=
 */
const listMine = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Quality.find({ owner: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Quality.countDocuments({ owner: req.user.id }),
    ]);

    return res.status(200).json({ items, page, limit, total });
  } catch (err) {
    console.error("farmer.listMine error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/** DELETE /api/farmer/quality/:itemId (only if I own it) */
const removeMine = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!isValidId(itemId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    // Delete only if owned by the current user (one query)
    const deleted = await Quality.findOneAndDelete({
      _id: itemId,
      owner: req.user.id,
    }).lean();

    if (!deleted) {
      // Either not found or not owned
      // Check not found separately to give clearer error
      const exists = await Quality.findById(itemId).lean();
      if (!exists) return res.status(404).json({ error: "Not found" });
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.status(200).json({ item: deleted });
  } catch (err) {
    console.error("farmer.removeMine error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = { createMine, listMine, removeMine, getMineById };