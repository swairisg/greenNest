// backend/Controllers/qualityControl/qualityControllersadmin.js
const mongoose = require("mongoose");
const Quality = require("../../Model/qualityControl/qualityControlModel_A");
const { gradeRecord } = require("../../services/grader/grade");
const { computeFinal } = require("../../services/grader/aggregate");

/* ---------------------------------- utils --------------------------------- */
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/* ----------------------------- ADMIN: LIST ALL ---------------------------- */
/**
 * GET /api/admin/quality (?q=&productName=&page=&limit=)
 * - Full text-ish search across batchId/productName/variety/notes
 * - Optional productName filter (normalized to lowercase)
 * - Optional pagination (page, limit)
 * - Populates owner (email, primaryRole) for context
 */
const listAll = async (req, res) => {
  try {
    const { q, productName } = req.query;
    const match = {};

    if (productName) {
      // normalize if your presets/graders expect lowercase
      match.productName = String(productName).toLowerCase();
    }

    if (q) {
      const rx = new RegExp(q, "i");
      match.$or = [
        { batchId: rx },
        { productName: rx },
        { variety: rx },
        { notes: rx },
      ];
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Quality.find(match)
        .populate("owner", "email primaryRole")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Quality.countDocuments(match),
    ]);

    return res.status(200).json({ items, page, limit, total });
  } catch (err) {
    console.error("admin.listAll error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ------------------------------ ADMIN: GET ONE ---------------------------- */
/** GET /api/admin/quality/:itemId */
const getById = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!isValidId(itemId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const item = await Quality.findById(itemId)
      .populate("owner", "email primaryRole")
      .lean();

    if (!item) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ item });
  } catch (err) {
    console.error("admin.getById error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* --------------------------- ADMIN: UPDATE DETAILS ------------------------ */
/**
 * PATCH /api/admin/quality/:itemId
 * - Whitelisted field updates
 * - Normalizes productName to lowercase (if provided)
 * - Recomputes system grade when product/readings change
 * - Recomputes final grade with current policy/weights
 * - Catches duplicate batchId (409) & validation errors (400)
 */
const updateDetails = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!isValidId(itemId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const doc = await Quality.findById(itemId);
    if (!doc) return res.status(404).json({ error: "Not found" });

    const beforeProduct = doc.productName;
    const beforeReadings = JSON.stringify(doc.readings || {});

    // whitelist to avoid accidental field injection
    const allowed = [
      "batchId",
      "productName",
      "variety",
      "size",
      "color",
      "freshness",
      "weight",
      "notes",
      "readings",
    ];

    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, k)) {
        let v = req.body[k];
        if (k === "productName" && v != null) v = String(v).toLowerCase();
        doc[k] = v;
      }
    }

    const productChanged = beforeProduct !== doc.productName;
    const readingsChanged =
      beforeReadings !== JSON.stringify(doc.readings || {});

    if (productChanged || readingsChanged) {
      // (Re)compute system grade
      const graded = gradeRecord(doc.toObject()); // pass POJO for safety
      if (graded?.grade) {
        doc.grade = { ...(doc.grade || {}), ...graded.grade };
      }

      // Ensure final grade using current policy/human/weights
      const { final, decidedBy } = computeFinal({
        system: doc.grade?.system,
        human: doc.grade?.human,
        policy: doc.grade?.policy ?? "human_overrides",
        weights: doc.grade?.weights ?? { system: 0.4, human: 0.6 },
      });
      doc.grade.final = final;
      doc.grade.decidedBy = decidedBy;
    }

    try {
      await doc.save();
      return res.status(200).json({ item: doc.toObject() });
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(409).json({ error: "batchId already exists" });
      }
      if (err?.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation failed",
          details: err.errors,
        });
      }
      throw err;
    }
  } catch (err) {
    console.error("admin.updateDetails error:", err);
    if (err.message?.startsWith?.("No grading rule")) {
      return res.status(422).json({ error: err.message });
    }
    return res.status(500).json({ error: "Server error" });
  }
};

/* ---------------------------- ADMIN: UPDATE GRADE ------------------------- */
/**
 * PATCH /api/admin/quality/:itemId/grade
 * - If acceptSystem=true → policy=system_only, weights={1,0}, human=null
 * - Else allow setting human grade, policy, weights
 * - Validates weights
 * - Ensures system grade exists (legacy safety)
 * - Recomputes final grade; marks decidedBy="admin" if admin acted
 */
const updateGrading = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!isValidId(itemId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const { acceptSystem, humanGrade, policy, weights, note } = req.body || {};
    const doc = await Quality.findById(itemId);
    if (!doc) return res.status(404).json({ error: "Not found" });

    if (!doc.grade) doc.grade = {};

    if (acceptSystem) {
      // Force to system-only
      doc.grade.human = null;
      doc.grade.policy = "system_only";
      doc.grade.weights = { system: 1, human: 0 };
    } else {
      // Allow human grade and policy/weights
      if (humanGrade !== undefined) doc.grade.human = humanGrade || null;
      if (policy) doc.grade.policy = policy;
      if (weights) {
        const s = Number(weights.system ?? 0);
        const h = Number(weights.human ?? 0);
        if (s < 0 || h < 0 || s + h <= 0) {
          return res.status(400).json({ error: "Invalid weights" });
        }
        doc.grade.weights = { system: s, human: h };
      }
    }

    if (typeof note === "string") doc.grade.note = note;

    // Ensure system grade exists
    if (!doc.grade?.system) {
      const graded = gradeRecord(doc.toObject());
      if (graded?.grade) {
        doc.grade = { ...(doc.grade || {}), ...graded.grade };
      }
    }

    const { final, decidedBy } = computeFinal({
      system: doc.grade?.system,
      human: doc.grade?.human,
      policy: doc.grade?.policy ?? "human_overrides",
      weights: doc.grade?.weights ?? { system: 0.4, human: 0.6 },
    });

    doc.grade.final = final;
    // If admin explicitly acted (acceptSystem or humanGrade supplied) → mark admin
    doc.grade.decidedBy =
      acceptSystem || humanGrade !== undefined ? "admin" : decidedBy;

    await doc.save();
    return res.status(200).json({ item: doc.toObject() });
  } catch (err) {
    console.error("admin.updateGrading error:", err);
    if (err?.name === "ValidationError") {
      return res
        .status(400)
        .json({ error: "Validation failed", details: err.errors });
    }
    if (err.message?.startsWith?.("No grading rule")) {
      return res.status(422).json({ error: err.message });
    }
    return res.status(500).json({ error: "Server error" });
  }
};

/* ----------------------------- ADMIN: DELETE ------------------------------ */
/** DELETE /api/admin/quality/:itemId */
const removeAny = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!isValidId(itemId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const doc = await Quality.findById(itemId);
    if (!doc) return res.status(404).json({ error: "Not found" });

    const deleted = await Quality.findByIdAndDelete(doc._id).lean();
    return res.status(200).json({ item: deleted });
  } catch (err) {
    console.error("admin.removeAny error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  listAll,
  getById,
  updateDetails,
  updateGrading,
  removeAny,
};