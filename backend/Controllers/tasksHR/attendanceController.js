const svc = require("../../services/attendance.service");
const { writeAudit } = require("../../utils/audit");

exports.checkIn = async (req, res) => {
  const r = await svc.checkIn(req.user, req.body);
  await writeAudit({
    actorId: req.user.id,
    action: "attendance.checkin",
    entityType: "attendance",
    entityId: req.user.id,
    after: r,
  });
  res.status(201).json(r);
};

exports.checkOut = async (req, res) => {
  const r = await svc.checkOut(req.user, req.body);
  await writeAudit({
    actorId: req.user.id,
    action: "attendance.checkout",
    entityType: "attendance",
    entityId: req.user.id,
    after: r,
  });
  res.json(r);
};

exports.list = async (req, res) =>
  res.json({ rows: await svc.list(req.query) });
exports.monthly = async (req, res) =>
  res.json(await svc.monthlyReport(req.query));
