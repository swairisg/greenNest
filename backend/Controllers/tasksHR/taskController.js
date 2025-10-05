const svc = require("../../services/tasksHR/tasks.service");
const { writeAudit } = require("../../utils/audit");

exports.list = async (req, res) =>
  res.json({ rows: await svc.list(req.query) });

exports.create = async (req, res) => {
  const doc = await svc.create(req.body);
  await writeAudit({
    actorId: req.user.id,
    action: "task.create",
    entityType: "task",
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
    action: "task.update.status",
    entityType: "task",
    entityId: req.params.id,
    before,
    after,
  });
  res.json(after);
};

exports.comment = async (req, res) => {
  await svc.comment(req.params.id, {
    authorId: req.user.id,
    text: req.body.text,
  });
  res.json({ ok: true });
};
