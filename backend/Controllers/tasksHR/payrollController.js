const svc = require("../../services/payroll.service");
const { writeAudit } = require("../../utils/audit");

exports.create = async (req, res) =>
  res.status(201).json(await svc.createPayrun(req.body));
exports.list = async (req, res) =>
  res.json({ rows: await svc.listPayruns(req.query) });
exports.get = async (req, res) => res.json(await svc.getPayrun(req.params.id));

exports.compute = async (req, res) => {
  await svc.compute(req.params.id);
  await writeAudit({
    actorId: req.user.id,
    action: "payrun.compute",
    entityType: "payrun",
    entityId: req.params.id,
  });
  res.json({ ok: true });
};

exports.approve = async (req, res) => {
  await svc.approve(req.params.id);
  await writeAudit({
    actorId: req.user.id,
    action: "payrun.approve",
    entityType: "payrun",
    entityId: req.params.id,
  });
  res.json({ ok: true });
};

exports.markPaid = async (req, res) => {
  await svc.markPaid(req.params.id);
  await writeAudit({
    actorId: req.user.id,
    action: "payrun.markPaid",
    entityType: "payrun",
    entityId: req.params.id,
  });
  res.json({ ok: true });
};

exports.payslip = async (req, res) =>
  res.json(await svc.payslipForEmployee(req.params.id, req.params.employeeId));
