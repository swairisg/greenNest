exports.list = async (_req, res) => res.json({ data: [] });
exports.create = async (_req, res) => res.status(201).json({ data: null });
exports.get = async (_req, res) =>
  res.status(404).json({ message: "Not found" });
exports.update = async (_req, res) =>
  res.status(404).json({ message: "Not found" });
exports.remove = async (_req, res) => res.json({ ok: true });
