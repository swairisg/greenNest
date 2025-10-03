const svc = require("../../services/employees.service");
const { writeAudit } = require("../../utils/audit");

exports.list = async (req, res) => {
  const rows = await svc.list(req.query);
  res.json({ rows });
};

exports.create = async (req, res) => {
  const doc = await svc.create(req.body);
  await writeAudit({
    actorId: req.user.id,
    action: "employee.create",
    entityType: "employee",
    entityId: String(doc._id),
    after: doc,
  });
  res.status(201).json(doc);
};

exports.get = async (req, res) => {
  const doc = await svc.get(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
};

exports.update = async (req, res) => {
  const { before, after } = await svc.update(req.params.id, req.body);
  await writeAudit({
    actorId: req.user.id,
    action: "employee.update",
    entityType: "employee",
    entityId: req.params.id,
    before,
    after,
  });
  res.json(after);
};

exports.remove = async (req, res) => {
  await svc.softDelete(req.params.id);
  res.json({ ok: true });
};
