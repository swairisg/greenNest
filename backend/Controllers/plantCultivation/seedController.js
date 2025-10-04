const SeedBatch = require("../../Model/plantCultivation/SeedBatchModel");

/* ====== LIST with filters ======
   ?q=...&crop=Strawberry&supplier=AgriSeeds%20Ltd&unit=seeds&from=2025-10-01&to=2025-12-31
*/
const toYMD = (d) => {
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()); // strips time/zone
};

exports.list = async (req, res) => {
  try {
    const { q, crop, supplier, unit, from, to } = req.query || {};
    const where = {};

    if (q) {
      where.$or = [
        { seedCode: new RegExp(q, "i") },
        { cropType: new RegExp(q, "i") },
        { supplier: new RegExp(q, "i") },
      ];
    }
    if (crop) where.cropType = new RegExp(crop, "i");
    if (supplier) where.supplier = new RegExp(supplier, "i");
    if (unit) where.unit = unit;

    // procured date range
    if (from || to) {
      where.procuredDate = {};
      if (from) where.procuredDate.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) {
          // include entire 'to' day
          toDate.setHours(23, 59, 59, 999);
          where.procuredDate.$lte = toDate;
        }
      }
    }

    const rows = await SeedBatch.find(where).sort({
      procuredDate: -1,
      createdAt: -1,
    });
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch seeds" });
  }
};

/* ====== CREATE with quick sanity guards ====== */
exports.create = async (req, res) => {
  try {
    const b = req.body || {};
    const errs = [];

    if (!b.seedCode) errs.push("seedCode is required");
    if (!b.cropType) errs.push("cropType is required");
    if (b.quantity == null || Number(b.quantity) <= 0)
      errs.push("quantity must be > 0");
    if (!b.procuredDate) errs.push("procuredDate is required");

    const pd = b.procuredDate ? new Date(b.procuredDate) : null;
    const ed = b.expiryDate ? new Date(b.expiryDate) : null;

    // compare as DATE-ONLY (strip time/zone)
    const today = toYMD(new Date());
    const pdOnly = pd ? toYMD(pd) : null;
    const edOnly = ed ? toYMD(ed) : null;

    if (pdOnly && pdOnly > today)
      errs.push("procuredDate cannot be in the future");
    if (pdOnly && edOnly && edOnly < pdOnly)
      errs.push("expiryDate cannot be before procuredDate");

    if (errs.length) return res.status(400).json({ message: errs.join(", ") });

    const row = await SeedBatch.create(b);
    res.status(201).json({ data: row });
  } catch (err) {
    console.error(err);
    // pretty duplicate key message
    if (err?.code === 11000) {
      return res.status(409).json({ message: "seedCode must be unique" });
    }
    res.status(500).json({ message: "Failed to create seed batch" });
  }
};

exports.get = async (req, res) => {
  const row = await SeedBatch.findById(req.params.id);
  if (!row) return res.status(404).json({ message: "Not found" });
  res.json({ data: row });
};

exports.update = async (req, res) => {
  try {
    const b = req.body || {};
    const pd = b.procuredDate ? new Date(b.procuredDate) : null;
    const ed = b.expiryDate ? new Date(b.expiryDate) : null;

    // compare as DATE-ONLY (strip time/zone)
    const today = toYMD(new Date());
    const pdOnly = pd ? toYMD(pd) : null;
    const edOnly = ed ? toYMD(ed) : null;

    if (pdOnly && pdOnly > today)
      return res
        .status(400)
        .json({ message: "procuredDate cannot be in the future" });
    if (pdOnly && edOnly && edOnly < pdOnly)
      return res
        .status(400)
        .json({ message: "expiryDate cannot be before procuredDate" });

    if (b.quantity != null && Number(b.quantity) <= 0)
      return res.status(400).json({ message: "quantity must be > 0" });

    const row = await SeedBatch.findByIdAndUpdate(req.params.id, b, {
      new: true,
      runValidators: true,
    });
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json({ data: row });
  } catch (err) {
    console.error(err);
    if (err?.code === 11000) {
      return res.status(409).json({ message: "seedCode must be unique" });
    }
    res.status(500).json({ message: "Failed to update seed batch" });
  }
};

exports.remove = async (req, res) => {
  await SeedBatch.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};
