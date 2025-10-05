const LandPrep = require("../../Model/plantCultivation/LandPrepModel");

const toYMD = (d) =>
  d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;

/* LIST: ?q=&section=&type=&from=&to= (date range uses 'date') */
exports.list = async (req, res) => {
  try {
    const { q, section, type, from, to } = req.query || {};
    const where = {};
    if (q)
      where.$or = [
        { section: new RegExp(q, "i") },
        { activityType: new RegExp(q, "i") },
        { details: new RegExp(q, "i") },
        { performedBy: new RegExp(q, "i") },
      ];
    if (section) where.section = new RegExp(section, "i");
    if (type) where.activityType = type;
    if (from || to) {
      where.date = {};
      if (from) where.date.$gte = new Date(from);
      if (to) {
        const t = new Date(to);
        t.setHours(23, 59, 59, 999);
        where.date.$lte = t;
      }
    }

    const rows = await LandPrep.find(where).sort({ date: -1, createdAt: -1 });
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch land preparation records" });
  }
};

exports.create = async (req, res) => {
  try {
    const b = req.body || {};
    const errs = [];
    if (!b.section) errs.push("section is required");
    if (!b.activityType) errs.push("activityType is required");
    if (!b.date) errs.push("date is required");
    if (b.cost != null && Number(b.cost) < 0)
      errs.push("cost cannot be negative");

    const d = b.date ? new Date(b.date) : null;
    const today = toYMD(new Date());
    const dOnly = d ? toYMD(d) : null;
    if (dOnly && dOnly > today) errs.push("date cannot be in the future");

    if (errs.length) return res.status(400).json({ message: errs.join(", ") });

    const row = await LandPrep.create(b);
    res.status(201).json({ data: row });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to create land preparation record" });
  }
};

exports.get = async (req, res) => {
  const row = await LandPrep.findById(req.params.id);
  if (!row) return res.status(404).json({ message: "Not found" });
  res.json({ data: row });
};

exports.update = async (req, res) => {
  try {
    const b = req.body || {};
    if (b.cost != null && Number(b.cost) < 0)
      return res.status(400).json({ message: "cost cannot be negative" });
    const d = b.date ? new Date(b.date) : null;
    const today = toYMD(new Date());
    const dOnly = d ? toYMD(d) : null;
    if (dOnly && dOnly > today)
      return res.status(400).json({ message: "date cannot be in the future" });

    const row = await LandPrep.findByIdAndUpdate(req.params.id, b, {
      new: true,
      runValidators: true,
    });
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json({ data: row });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to update land preparation record" });
  }
};

exports.remove = async (req, res) => {
  await LandPrep.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};
