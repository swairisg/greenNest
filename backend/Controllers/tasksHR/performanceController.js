const svc = require("../../services/tasksHR/performance.service");
const { writeAudit } = require("../../utils/audit");

exports.list = async (req, res) =>
  res.json({ rows: await svc.list(req.query) });
exports.create = async (req, res) =>
  res.status(201).json(await svc.create(req.body));
exports.get = async (req, res) => res.json(await svc.get(req.params.id));
exports.update = async (req, res) =>
  res.json(await svc.update(req.params.id, req.body));
exports.finalize = async (req, res) => {
  await svc.finalize(req.params.id);
  await writeAudit({
    actorId: req.user.id,
    action: "performance.finalize",
    entityType: "performance",
    entityId: req.params.id,
  });
  res.json({ ok: true });
};
