const PlantingPlan = require("../../Model/plantCultivation/PlantingPlanModel");
const SeedBatch = require("../../Model/plantCultivation/SeedBatchModel");

const toYMD = (d) =>
  d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;

/* LIST: ?q=&crop=&status=&section=&from=&to=  (date range uses startDate) */
exports.list = async (req, res) => {
  try {
    const { q, crop, status, section, from, to } = req.query || {};
    const where = {};
    if (q)
      where.$or = [
        { planCode: new RegExp(q, "i") },
        { cropType: new RegExp(q, "i") },
        { section: new RegExp(q, "i") },
        { instructions: new RegExp(q, "i") },
      ];
    if (crop) where.cropType = new RegExp(crop, "i");
    if (status) where.status = status;
    if (section) where.section = new RegExp(section, "i");
    if (from || to) {
      where.startDate = {};
      if (from) where.startDate.$gte = new Date(from);
      if (to) {
        const t = new Date(to);
        t.setHours(23, 59, 59, 999);
        where.startDate.$lte = t;
      }
    }

    const rows = await PlantingPlan.find(where)
      .populate({ path: "seedBatchId", select: "seedCode cropType supplier" })
      .sort({ startDate: -1, createdAt: -1 });

    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch plans" });
  }
};

exports.create = async (req, res) => {
  try {
    const b = req.body || {};
    const errs = [];
    if (!b.planCode) errs.push("planCode is required");
    if (!b.cropType) errs.push("cropType is required");
    if (!b.seedBatchId) errs.push("seedBatchId is required");
    if (!b.section) errs.push("section is required");
    if (!b.startDate) errs.push("startDate is required");
    if (b.quantityPlanned == null || Number(b.quantityPlanned) <= 0)
      errs.push("quantityPlanned must be > 0");

    // sanity on dates (allow future planning; only enforce harvest >= start)
    const sd = b.startDate ? new Date(b.startDate) : null;
    const hs = b.expectedHarvestStart ? new Date(b.expectedHarvestStart) : null;
    const he = b.expectedHarvestEnd ? new Date(b.expectedHarvestEnd) : null;
    const sdOnly = sd ? toYMD(sd) : null;
    const hsOnly = hs ? toYMD(hs) : null;
    const heOnly = he ? toYMD(he) : null;

    if (hsOnly && sdOnly && hsOnly < sdOnly)
      errs.push("expectedHarvestStart cannot be before startDate");
    if (heOnly && sdOnly && heOnly < sdOnly)
      errs.push("expectedHarvestEnd cannot be before startDate");
    if (heOnly && hsOnly && heOnly < hsOnly)
      errs.push("expectedHarvestEnd cannot be before expectedHarvestStart");

    // quick check seed batch exists
    if (b.seedBatchId) {
      const batch = await SeedBatch.findById(b.seedBatchId);
      if (!batch) errs.push("seedBatchId not found");
      // Default cropType to batch cropType if not provided
      if (!b.cropType && batch) b.cropType = batch.cropType;
    }

    if (errs.length) return res.status(400).json({ message: errs.join(", ") });

    const row = await PlantingPlan.create(b);
    res.status(201).json({ data: row });
  } catch (err) {
    console.error(err);
    if (err?.code === 11000) {
      return res.status(409).json({ message: "planCode must be unique" });
    }
    res.status(500).json({ message: "Failed to create plan" });
  }
};

exports.get = async (req, res) => {
  const row = await PlantingPlan.findById(req.params.id).populate({
    path: "seedBatchId",
    select: "seedCode cropType supplier",
  });
  if (!row) return res.status(404).json({ message: "Not found" });
  res.json({ data: row });
};

exports.update = async (req, res) => {
  try {
    const b = req.body || {};
    if (b.quantityPlanned != null && Number(b.quantityPlanned) <= 0) {
      return res.status(400).json({ message: "quantityPlanned must be > 0" });
    }
    const sd = b.startDate ? new Date(b.startDate) : null;
    const hs = b.expectedHarvestStart ? new Date(b.expectedHarvestStart) : null;
    const he = b.expectedHarvestEnd ? new Date(b.expectedHarvestEnd) : null;
    const sdOnly = sd ? toYMD(sd) : null;
    const hsOnly = hs ? toYMD(hs) : null;
    const heOnly = he ? toYMD(he) : null;

    if (hsOnly && sdOnly && hsOnly < sdOnly)
      return res
        .status(400)
        .json({ message: "expectedHarvestStart cannot be before startDate" });
    if (heOnly && sdOnly && heOnly < sdOnly)
      return res
        .status(400)
        .json({ message: "expectedHarvestEnd cannot be before startDate" });
    if (heOnly && hsOnly && heOnly < hsOnly)
      return res
        .status(400)
        .json({
          message: "expectedHarvestEnd cannot be before expectedHarvestStart",
        });

    const row = await PlantingPlan.findByIdAndUpdate(req.params.id, b, {
      new: true,
      runValidators: true,
    });
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json({ data: row });
  } catch (err) {
    console.error(err);
    if (err?.code === 11000) {
      return res.status(409).json({ message: "planCode must be unique" });
    }
    res.status(500).json({ message: "Failed to update plan" });
  }
};

exports.remove = async (req, res) => {
  await PlantingPlan.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};
