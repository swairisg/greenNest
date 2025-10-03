const svc = require("../../services/shifts.service");

exports.templates = async (req, res) =>
  res.json({ rows: await svc.listTemplates() });
exports.createTemplate = async (req, res) =>
  res.status(201).json(await svc.createTemplate(req.body));
exports.updateTemplate = async (req, res) =>
  res.json(await svc.updateTemplate(req.params.id, req.body));
exports.deleteTemplate = async (req, res) =>
  res.json(await svc.deleteTemplate(req.params.id));
exports.holidays = async (req, res) =>
  res.json({ rows: await svc.listHolidays() });
