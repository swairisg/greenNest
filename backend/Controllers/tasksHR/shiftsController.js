const Shift = require("../../Model/tasksHR/ShiftTemplate");
const { ampmToMinutes, minutesToAMPM } = require("../../lib/timefmt");

const bad = (res, msg, code = 400) => res.status(code).json({ message: msg });

exports.list = async (_req, res) => {
  const rows = await Shift.find().sort({ createdAt: -1 }).lean();
  res.json({ data: rows });
};

exports.create = async (req, res) => {
  try {
    const { name, start, end } = req.body || {}; // start/end like "08:00 AM"
    if (!name || !start || !end) return bad(res, "name, start, end are required");

    const s = ampmToMinutes(start);
    const e = ampmToMinutes(end);
    if (s == null || e == null) return bad(res, "Invalid time format (use HH:MM AM/PM)");

    const doc = await Shift.create({
      name: String(name).trim(),
      startMinutes: s,
      endMinutes: e,
      startLabel: minutesToAMPM(s),
      endLabel: minutesToAMPM(e),
    });
    res.status(201).json({ data: doc });
  } catch (e) {
    console.error(e);
    bad(res, "Create failed", 500);
  }
};

exports.update = async (req, res) => {
  try {
    const { name, start, end } = req.body || {};
    const patch = {};
    if (name != null) patch.name = String(name).trim();

    if (start != null) {
      const s = ampmToMinutes(start);
      if (s == null) return bad(res, "Invalid start time");
      patch.startMinutes = s;
      patch.startLabel = minutesToAMPM(s);
    }
    if (end != null) {
      const e = ampmToMinutes(end);
      if (e == null) return bad(res, "Invalid end time");
      patch.endMinutes = e;
      patch.endLabel = minutesToAMPM(e);
    }

    const row = await Shift.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!row) return bad(res, "Not found", 404);
    res.json({ data: row });
  } catch (e) {
    console.error(e);
    bad(res, "Update failed", 500);
  }
};

exports.remove = async (req, res) => {
  await Shift.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};
