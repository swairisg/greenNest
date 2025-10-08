// backend/services/tasksHR/payroll.service.js
const { Payrun, Attendance, EmployeeProfile } = require("../../Model/tasksHR");

module.exports = {
  async createPayrun(period) {
    // period: { periodStart, periodEnd, currency? }
    const doc = await Payrun.create({
      ...period,
      status: "draft",
    });
    return doc.toObject();
  },

  async listPayruns(q = {}) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (q.status) filter.status = q.status;

    const [rows, total] = await Promise.all([
      Payrun.find(filter)
        .sort({ periodStart: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payrun.countDocuments(filter),
    ]);

    return { rows, page, limit, total, pages: Math.ceil(total / limit) || 1 };
  },

  async getPayrun(id) {
    return Payrun.findById(id).lean();
  },

  async compute(id) {
    // TODO: aggregate attendance to build lines (salaried/hourly policy)
    await Payrun.findByIdAndUpdate(id, {
      $set: { computedAt: new Date(), status: "draft" },
    });
    return { ok: true };
  },

  async approve(id) {
    await Payrun.findByIdAndUpdate(id, {
      $set: { approvedAt: new Date(), status: "approved" },
    });
    return { ok: true };
  },

  async markPaid(id) {
    await Payrun.findByIdAndUpdate(id, {
      $set: { paidAt: new Date(), status: "paid" },
    });
    return { ok: true };
  },

  async payslipForEmployee(payrunId, employeeId) {
    // TODO: read payrun lines and return the employee’s payslip snapshot
    const pr = await Payrun.findById(payrunId).lean();
    if (!pr) return null;
    const line = (pr.lines || []).find(
      (l) => String(l.employeeId) === String(employeeId)
    );
    return { payrunId, employeeId, line: line || null };
  },
};
