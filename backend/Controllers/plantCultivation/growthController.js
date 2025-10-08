const GrowthLog = require("../../Model/plantCultivation/GrowthLogModel");
const PlantingPlan = require("../../Model/plantCultivation/PlantingPlanModel");

const toYMD = (d) =>
  d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;

/* List logs for a plan: /plans/:planId/logs?stage=&from=&to= */
exports.list = async (req, res) => {
  try {
    const { planId } = req.params;
    const { stage, from, to } = req.query || {};
    const where = { planId };

    if (stage) where.stage = stage;
    if (from || to) {
      where.date = {};
      if (from) where.date.$gte = new Date(from);
      if (to) {
        const t = new Date(to);
        t.setHours(23, 59, 59, 999);
        where.date.$lte = t;
      }
    }

    const rows = await GrowthLog.find(where).sort({ date: -1, createdAt: -1 });
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch growth logs" });
  }
};

exports.create = async (req, res) => {
  try {
    const { planId } = req.params;
    const b = req.body || {};
    const errs = [];
    if (!planId) errs.push("planId is required");
    if (!b.date) errs.push("date is required");
    if (!b.stage) errs.push("stage is required");

    // ensure plan exists
    const plan = await PlantingPlan.findById(planId);
    if (!plan) errs.push("Plan not found");

    // date-only checks (allow future entries if you schedule ahead? usually no)
    const d = b.date ? new Date(b.date) : null;
    const today = toYMD(new Date());
    const dOnly = d ? toYMD(d) : null;
    if (dOnly && dOnly > today) errs.push("date cannot be in the future");

    if (b.heightCm != null && Number(b.heightCm) < 0)
      errs.push("height cannot be negative");

    if (errs.length) return res.status(400).json({ message: errs.join(", ") });

    const row = await GrowthLog.create({ ...b, planId });
    res.status(201).json({ data: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create growth log" });
  }
};

exports.get = async (req, res) => {
  const row = await GrowthLog.findOne({
    _id: req.params.logId,
    planId: req.params.planId,
  });
  if (!row) return res.status(404).json({ message: "Not found" });
  res.json({ data: row });
};

exports.update = async (req, res) => {
  try {
    const b = req.body || {};
    const d = b.date ? new Date(b.date) : null;
    const today = toYMD(new Date());
    const dOnly = d ? toYMD(d) : null;
    if (dOnly && dOnly > today)
      return res.status(400).json({ message: "date cannot be in the future" });
    if (b.heightCm != null && Number(b.heightCm) < 0)
      return res.status(400).json({ message: "height cannot be negative" });

    const row = await GrowthLog.findOneAndUpdate(
      { _id: req.params.logId, planId: req.params.planId },
      b,
      { new: true, runValidators: true }
    );
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json({ data: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update growth log" });
  }
};

exports.remove = async (req, res) => {
  await GrowthLog.findOneAndDelete({
    _id: req.params.logId,
    planId: req.params.planId,
  });
  res.json({ ok: true });
};
