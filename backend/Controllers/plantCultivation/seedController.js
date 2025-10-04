const SeedBatch = require("../../Model/plantCultivation/SeedBatchModel");

exports.list = async (req, res) => {
  const { q } = req.query;
  const where = q
    ? {
        $or: [
          { seedCode: new RegExp(q, "i") },
          { cropType: new RegExp(q, "i") },
          { supplier: new RegExp(q, "i") },
        ],
      }
    : {};
  const rows = await SeedBatch.find(where).sort({ createdAt: -1 });
  res.json({ data: rows });
};

exports.create = async (req, res) => {
  const row = await SeedBatch.create(req.body);
  res.status(201).json({ data: row });
};

exports.get = async (req, res) => {
  const row = await SeedBatch.findById(req.params.id);
  if (!row) return res.status(404).json({ message: "Not found" });
  res.json({ data: row });
};

exports.update = async (req, res) => {
  const row = await SeedBatch.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!row) return res.status(404).json({ message: "Not found" });
  res.json({ data: row });
};

exports.remove = async (_req, res) => {
  await SeedBatch.findByIdAndDelete(_req.params.id);
  res.json({ ok: true });
};
