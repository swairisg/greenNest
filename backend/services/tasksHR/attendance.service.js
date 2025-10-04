// backend/services/tasksHR/attendance.service.js
const { Attendance, ShiftTemplate } = require("../../Model/tasksHR");
const { EmployeeProfile } = require("../../Model/tasksHR");

function ymd(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

module.exports = {
  async checkIn(user, payload = {}) {
    // Resolve employeeId from user if needed (you may store it in JWT later)
    const emp = await EmployeeProfile.findOne({ userId: user.id }).lean();
    if (!emp) throw new Error("Employee profile not found");

    const today = ymd(new Date());
    const open = await Attendance.findOne({
      employeeId: emp._id,
      date: today,
      checkOutAt: { $exists: false },
    });
    if (open) throw new Error("Already checked in");

    // TODO: resolve shift by template or policy; for now, store raw checkInAt
    const doc = await Attendance.create({
      employeeId: emp._id,
      date: today,
      checkInAt: new Date(),
    });

    return doc.toObject();
  },

  async checkOut(user, payload = {}) {
    const emp = await EmployeeProfile.findOne({ userId: user.id }).lean();
    if (!emp) throw new Error("Employee profile not found");

    const today = ymd(new Date());
    const rec = await Attendance.findOne({
      employeeId: emp._id,
      date: today,
      checkOutAt: { $exists: false },
    });
    if (!rec) throw new Error("No open check-in for today");

    const checkOutAt = new Date();

    // Compute minutes (basic; refine with shifts/OT later)
    const minutes = Math.max(
      0,
      Math.round((checkOutAt - rec.checkInAt) / 60000)
    );

    const updated = await Attendance.findByIdAndUpdate(
      rec._id,
      { $set: { checkOutAt, workDurationMinutes: minutes } },
      { new: true }
    ).lean();

    return updated;
  },

  async list(q = {}) {
    const filter = {};
    if (q.employeeId) filter.employeeId = q.employeeId;
    if (q.from || q.to) {
      filter.date = {};
      if (q.from) filter.date.$gte = ymd(q.from);
      if (q.to) filter.date.$lte = ymd(q.to);
    }

    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Attendance.countDocuments(filter),
    ]);

    return { rows, page, limit, total, pages: Math.ceil(total / limit) || 1 };
  },

  async monthlyReport(q = {}) {
    // Very light stub; you’ll replace with aggregation
    const month = q.month || new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const [year, m] = month.split("-").map(Number);

    const from = new Date(Date.UTC(year, m - 1, 1));
    const to = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));

    const rows = await Attendance.find({
      date: { $gte: from, $lte: to },
    }).lean();
    return { month, count: rows.length, rows };
  },
};
