// backend/Controllers/tasksHR/payrollController.js
const svc = require("../../services/tasksHR/payroll.service");
const { writeAudit } = require("../../utils/audit");

exports.create = async (req, res) => {
  const doc = await svc.createPayrun(req.body);
  res.status(201).json(doc);
};

exports.list = async (req, res) => {
  const out = await svc.listPayruns(req.query);
  res.json(out);
};

exports.get = async (req, res) => {
  const doc = await svc.getPayrun(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
};

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

exports.payslip = async (req, res) => {
  const out = await svc.payslipForEmployee(
    req.params.id,
    req.params.employeeId
  );
  if (!out) return res.status(404).json({ message: "Not found" });
  res.json(out);
};
